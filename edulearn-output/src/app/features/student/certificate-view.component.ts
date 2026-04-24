import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EnrollmentService } from '../../core/services/enrollment.service';

@Component({
  selector: 'app-certificate-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-view.component.html',
  styleUrl: './certificate-view.component.css'
})
export class CertificateViewComponent implements OnInit {
  isLoading = signal(true);
  errorMessage = signal('');

  studentName = signal('');
  studentEmail = signal('');
  courseTitle = signal('');
  courseCategory = signal('');
  completionDate = signal('');
  certificateId = signal('');

  private studentId = '';
  private courseId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';

    if (!this.studentId || !this.courseId) {
      this.errorMessage.set('Invalid certificate link.');
      this.isLoading.set(false);
      return;
    }

    this.loadCertificateData();
  }

  loadCertificateData(): void {
    const user = this.authService.getCurrentUser();

    if (user?.fullName) {
      this.studentName.set(user.fullName);
    }
    if (user?.email) {
      this.studentEmail.set(user.email);
    }

    // Load course details
    this.dashboardService.getAllCourses().subscribe({
      next: (courses) => {
        const course = (courses || []).find(
          c => String(c.courseId) === String(this.courseId)
        );

        if (course) {
          this.courseTitle.set(course.title || 'Course');
          this.courseCategory.set(course.category || 'Learning');
        }

        // Load certificate from progress service
        this.enrollmentService.getCourseCertificate(this.studentId, this.courseId).subscribe({
          next: (cert) => {
            if (cert && cert.issuedAt) {
              const d = new Date(cert.issuedAt);
              this.completionDate.set(d.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              }));
              this.certificateId.set(
                cert.certificateId ||
                ('EDU-' + this.courseId.substring(0, 8).toUpperCase() +
                '-' + this.studentId.substring(0, 8).toUpperCase())
              );
              this.isLoading.set(false);
            } else {
              this.errorMessage.set('This course has not been completed yet. Complete all lessons to earn your certificate.');
              this.isLoading.set(false);
            }
          },
          error: () => {
            this.errorMessage.set('Certificate not available. Please complete all lessons in this course first.');
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.errorMessage.set('Unable to load certificate data.');
        this.isLoading.set(false);
      }
    });
  }

  printCertificate(): void {
    window.print();
  }

  goBack(): void {
    this.router.navigateByUrl('/student/certificates');
  }
}
