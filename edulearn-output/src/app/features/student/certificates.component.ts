import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  CertificateItem,
  CourseItem,
  DashboardService,
  EnrollmentItem
} from '../../core/services/dashboard.service';

interface CertificateCard {
  title: string;
  category: string;
  issuedAt: string;
  certificateUrl: string;
  isAvailable: boolean;
}

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.css'
})
export class StudentCertificatesComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');

  enrollments = signal<EnrollmentItem[]>([]);
  courses = signal<CourseItem[]>([]);
  certificates = signal<CertificateItem[]>([]);

  certificateCards = computed<CertificateCard[]>(() => {
    return this.certificates()
      .filter(cert => !!cert.courseId)
      .map(cert => {
        const course = this.courses().find(
          c => String(c.courseId) === String(cert.courseId)
        );

        return {
          title: course?.title || 'Course Certificate',
          category: course?.category || 'Learning',
          issuedAt: cert.issuedAt || 'Not issued yet',
          certificateUrl: cert.certificateUrl || '',
          isAvailable: !!cert.certificateUrl
        };
      })
      .filter(item => item.isAvailable);
  });

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    const studentId = currentUser?.userId || '';

    if (!studentId) {
      this.errorMessage.set('Student ID not found. Please login again.');
      return;
    }

    this.loadCertificates(studentId);
  }

  loadCertificates(studentId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getStudentCertificatesPageData(studentId).subscribe({
      next: (res) => {
        this.enrollments.set(res.enrollments || []);
        this.courses.set(res.courses || []);

        this.dashboardService.getCertificatesForEnrollments(studentId, res.enrollments || []).subscribe({
          next: (certRes) => {
            this.certificates.set(certRes || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load certificates right now.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load certificate page data.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  goToCourses(): void {
    this.router.navigateByUrl('/my-courses');
  }

  openCertificate(url: string): void {
    if (!url) return;
    this.router.navigateByUrl(url);
  }
}