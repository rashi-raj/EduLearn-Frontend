import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, CourseItem, EnrollmentItem } from '../../core/services/dashboard.service';

interface MyCourseCard {
  courseId: string;
  title: string;
  category: string;
  progress: number;
  status: string;
  certificateIssued: boolean;
  description?: string;
  level?: string;
  language?: string;
  expiresAt?: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.component.html',
  styleUrl: './my-courses.component.css'
})
export class MyCoursesComponent implements OnInit {
  isLoading = signal(false);
  loadError = signal('');
  userName = signal('Learner');

  enrollments = signal<EnrollmentItem[]>([]);
  courses = signal<CourseItem[]>([]);

  myCourses = computed<MyCourseCard[]>(() => {
    return this.enrollments().map((enrollment) => {
      const matchedCourse = this.courses().find(
        (course) => String(course.courseId) === String(enrollment.courseId)
      );

      const progress = enrollment.progressPercent ?? 0;

      return {
        courseId: String(enrollment.courseId ?? ''),
        title: matchedCourse?.title || 'Untitled Course',
        category: matchedCourse?.category || 'General',
        progress,
       status: enrollment.accessExpired
  ? 'Expired'
  : progress >= 100
    ? 'Completed'
    : (enrollment.status || 'Active'),
        certificateIssued: enrollment.certificateIssued ?? false,
        description: matchedCourse?.description || '',
        level: matchedCourse?.level || '',
        language: matchedCourse?.language || '',
        expiresAt: enrollment.expiresAt || '',
      };
    });
  });

  hasCourses = computed(() => this.myCourses().length > 0);

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.fullName) {
      this.userName.set(currentUser.fullName);
    } else if (currentUser?.email) {
      this.userName.set(currentUser.email.split('@')[0]);
    }

    this.loadMyCourses(currentUser?.userId || '');
  }

  loadMyCourses(studentId: string): void {
  this.isLoading.set(true);
  this.loadError.set('');

  if (!studentId) {
    this.isLoading.set(false);
    this.loadError.set('Student ID not found. Please login again.');
    return;
  }

  this.dashboardService.getMyCoursesData(studentId).subscribe({
    next: (res) => {
      this.enrollments.set(res.enrollments || []);
      this.courses.set(res.courses || []);
      this.isLoading.set(false);
    },
    error: (err) => {
      this.isLoading.set(false);
      this.loadError.set(
        err?.error?.message ||
        err?.message ||
        'Unable to load enrolled courses right now.'
      );
    }
  });
}

  goBackToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  browseCourses(): void {
  this.router.navigateByUrl('/student/explore-courses');
}

  openCourse(courseId: string) {
  this.router.navigateByUrl(`/student/course/${courseId}`);
}
}