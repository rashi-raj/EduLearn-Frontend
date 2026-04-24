import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  CourseItem,
  DashboardService,
  EnrollmentItem
} from '../../core/services/dashboard.service';

interface ExploreCourseCard {
  courseId: string;
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  price: number;
  thumbnailUrl: string;
  isPublished: boolean;
  isEnrolled: boolean;
}

@Component({
  selector: 'app-explore-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explore-courses.component.html',
  styleUrls: ['./explore-courses.component.css']
})
export class ExploreCoursesComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');

  allCourses = signal<CourseItem[]>([]);
  enrollments = signal<EnrollmentItem[]>([]);

  courseCards = computed<ExploreCourseCard[]>(() => {
    return this.allCourses().map(course => {
        const isEnrolled = this.enrollments().some(
          enrollment => String(enrollment.courseId) === String(course.courseId)
        );

        return {
          courseId: String(course.courseId ?? ''),
          title: course.title || 'Untitled Course',
          description: course.description || 'No description available.',
          category: course.category || 'General',
          level: course.level || 'Not specified',
          language: course.language || 'Not specified',
          price: Number(course.price ?? 0),
          thumbnailUrl: course.thumbnailUrl || '',
          isPublished: course.isPublished ?? false,
          isEnrolled
        };
      });
  });

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    const user = this.authService.getCurrentUser();

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (!user?.userId) {
      this.isLoading.set(false);
      this.errorMessage.set('Student ID not found. Please login again.');
      return;
    }

    this.dashboardService.getPublishedCourses().subscribe({
      next: (coursesRes) => {
        this.allCourses.set(coursesRes || []);

        this.dashboardService.getStudentEnrollments(user.userId!).subscribe({
          next: (enrollmentsRes) => {
            this.enrollments.set(enrollmentsRes || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load enrollments right now.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load courses right now.'
        );
      }
    });
  }

  enroll(courseId: string): void {
    const user = this.authService.getCurrentUser();

    if (!user?.userId) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.dashboardService.enrollCourse({
      courseId,
      studentId: user.userId,
      studentName: user.fullName,
      studentEmail: user.email
    }).subscribe({
      next: () => {
        this.enrollments.update(prev => [
          ...prev,
          {
            courseId,
            studentId: user.userId,
            progressPercent: 0,
            status: 'ACTIVE',
            certificateIssued: false
          }
        ]);
        alert('Enrolled successfully!');
      },
      error: (err) => {
        alert(
          err?.error?.message ||
          err?.message ||
          'Failed to enroll in course.'
        );
      }
    });
  }

  openCourse(courseId: string): void {
    this.router.navigateByUrl(`/student/course/${courseId}`);
  }

  goBack(): void {
    this.router.navigateByUrl('/my-courses');
  }
}