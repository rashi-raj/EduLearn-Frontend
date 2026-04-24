import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardService, CourseItem } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-course-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-course-payment.component.html',
  styleUrls: ['./student-course-payment.component.css']
})
export class StudentCoursePaymentComponent implements OnInit {
  courseId = '';
  course = signal<CourseItem | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.loadCourse();
  }

  loadCourse(): void {
    this.isLoading.set(true);

    this.dashboardService.getAllCourses().subscribe({
      next: (courses) => {
        const matched = (courses || []).find(
          c => String(c.courseId) === String(this.courseId)
        ) || null;

        this.course.set(matched);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load payment page.'
        );
      }
    });
  }

  getValidityText(months?: number): string {
    const validity = Number(months ?? 0);

    if (!validity || validity <= 0) {
      return 'Validity details not available';
    }

    if (validity === 1) {
      return '1 month access from purchase date';
    }

    return `${validity} months access from purchase date`;
  }

  payNow(): void {
    const user = this.authService.getCurrentUser();
    const selectedCourse = this.course();

    if (!user?.userId || !selectedCourse?.price) {
      this.errorMessage.set('Unable to start payment.');
      return;
    }

    this.dashboardService.createPaymentOrder({
      courseId: this.courseId,
      studentId: user.userId,
      studentName: user.fullName,
      studentEmail: user.email,
      courseTitle: selectedCourse.title,
      amount: Number(selectedCourse.price),
      paymentMethod: 'RAZORPAY'
    }).subscribe({
      next: (order: any) => {
        const options: any = {
          key: order.razorpayKeyId,
          amount: Math.round(Number(selectedCourse.price) * 100),
          currency: order.currency,
          name: 'EduLearn',
          description: selectedCourse.title,
          order_id: order.razorpayOrderId,
          handler: (response: any) => {
            this.dashboardService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            }).subscribe({
              next: () => {
                this.router.navigateByUrl(`/student/course/${this.courseId}`);
              },
              error: () => {
                this.errorMessage.set('Payment verification failed.');
              }
            });
          },
          prefill: {
            email: user.email || '',
            name: user.fullName || ''
          },
          theme: {
            color: '#7b3ff2'
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Failed to create payment order.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl(`/student/course/${this.courseId}`);
  }
}