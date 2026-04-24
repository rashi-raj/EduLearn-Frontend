import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService,
  CourseItem
} from '../../core/services/dashboard.service';

interface PaymentItem {
  paymentId?: string;
  courseId?: string;
  studentId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  receipt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt?: string;
  paidAt?: string;
}

interface PaymentCard {
  paymentId: string;
  courseTitle: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string;
  receipt: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}

@Component({
  selector: 'app-student-payments-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-payments-history.component.html',
  styleUrls: ['./student-payments-history.component.css']
})
export class StudentPaymentsHistoryComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');

  payments = signal<PaymentItem[]>([]);
  courses = signal<CourseItem[]>([]);

  paymentCards = computed<PaymentCard[]>(() => {
    const payments = this.payments();
    const courses = this.courses();

    return payments.map((payment) => {
      const matchedCourse = courses.find(
        c => String(c.courseId) === String(payment.courseId)
      );

      return {
        paymentId: String(payment.paymentId || ''),
        courseTitle: matchedCourse?.title || 'Course',
        amount: payment.amount !== undefined ? `${payment.amount}` : '0',
        currency: payment.currency || 'INR',
        paymentMethod: payment.paymentMethod || 'RAZORPAY',
        paymentStatus: payment.paymentStatus || 'UNKNOWN',
        createdAt: payment.createdAt
          ? new Date(payment.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '--',
        paidAt: payment.paidAt
          ? new Date(payment.paidAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '--',
        receipt: payment.receipt || '--',
        razorpayPaymentId: payment.razorpayPaymentId || '--',
        razorpayOrderId: payment.razorpayOrderId || '--'
      };
    });
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.userId) {
      this.errorMessage.set('Student not found.');
      return;
    }

    this.loadPaymentHistory(user.userId);
  }

  loadPaymentHistory(studentId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses || []);

        this.dashboardService.getStudentPayments(studentId).subscribe({
          next: (payments) => {
            this.payments.set(payments || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load payment history.'
            );
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load courses.'
        );
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}