import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CourseItem, DashboardService } from '../../core/services/dashboard.service';

interface InstructorCourseCard {
  courseId: string;
  title: string;
  category: string;
  description: string;
  level: string;
  language: string;
  status: string;
  canEdit: boolean;
  canRequestApproval: boolean;
}

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-courses.component.html',
  styleUrl: './instructor-courses.component.css'
})
export class InstructorCoursesComponent implements OnInit {
  userName = signal('Instructor');
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  actionLoadingCourseId = signal<string | null>(null);

  courses = signal<CourseItem[]>([]);

  courseCards = computed<InstructorCourseCard[]>(() => {
    return this.courses().map(course => {
      const status = this.resolveStatus(course);

      return {
        courseId: course.courseId || '',
        title: course.title || 'Untitled Course',
        category: course.category || 'General',
        description: course.description || 'No description available.',
        level: course.level || 'Not specified',
        language: course.language || 'Not specified',
        status,
        canEdit: status !== 'Published' && status !== 'Pending Approval',
        canRequestApproval: status === 'Draft' || status === 'Rejected'
      };
    });
  });

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (user?.fullName) {
      this.userName.set(user.fullName);
    }

    const instructorId = user?.userId || '';
    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.loadCourses(instructorId);
  }

  resolveStatus(course: CourseItem): string {
    if (course.status === 'PUBLISHED') return 'Published';
    if (course.status === 'PENDING_APPROVAL') return 'Pending Approval';
    if (course.status === 'REJECTED') return 'Rejected';
    return course.isPublished ? 'Published' : 'Draft';
  }

  loadCourses(instructorId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardService.getInstructorCourses(instructorId).subscribe({
      next: (res) => {
        this.courses.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load instructor courses right now.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  createCourse(): void {
    this.router.navigateByUrl('/instructor/create-course');
  }

  editCourse(courseId: string): void {
    if (!courseId) return;
    this.router.navigateByUrl(`/instructor/edit-course/${courseId}`);
  }

  requestApproval(courseId: string): void {
    if (!courseId) return;

    this.actionLoadingCourseId.set(courseId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardService.submitCourseForApproval(courseId).subscribe({
      next: () => {
        this.actionLoadingCourseId.set(null);
        this.successMessage.set('Course submitted for admin approval successfully.');

        const instructorId = this.authService.getCurrentUser()?.userId || '';
        if (instructorId) {
          this.loadCourses(instructorId);
        }
      },
      error: (err) => {
        this.actionLoadingCourseId.set(null);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Failed to submit course for approval.'
        );
      }
    });
  }
}