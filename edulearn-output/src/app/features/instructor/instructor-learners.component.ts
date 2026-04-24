import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService, CourseItem } from '../../core/services/dashboard.service';

interface LearnerCard {
  studentId: string;
  name: string;
  progress: string;
  courseTitle: string;
  courseCategory: string;
}

@Component({
  selector: 'app-instructor-learners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-learners.component.html',
  styleUrl: './instructor-learners.component.css'
})
export class InstructorLearnersComponent implements OnInit {
  learners = signal<LearnerCard[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const instructorId = user?.userId || '';

    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.loadLearners(instructorId);
  }

  loadLearners(instructorId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getInstructorCourses(instructorId).subscribe({
      next: (courses) => {
        const instructorCourses = courses || [];

        const courseMap = new Map<string, CourseItem>();
        instructorCourses.forEach((course) => {
          if (course.courseId) {
            courseMap.set(String(course.courseId), course);
          }
        });

        const courseIds = instructorCourses
          .map(course => String(course.courseId || ''))
          .filter(Boolean);

        if (!courseIds.length) {
          this.learners.set([]);
          this.isLoading.set(false);
          return;
        }

        this.dashboardService.getEnrollmentsForInstructorCourses(courseIds).subscribe({
          next: (enrollments) => {
            const learnerList: LearnerCard[] = (enrollments || []).map((enrollment: any, index: number) => {
              const courseId = String(enrollment.courseId || '');
              const matchedCourse = courseMap.get(courseId);

              return {
                studentId: String(enrollment.studentId || `NA-${index + 1}`),
                name:
                  enrollment.studentName ||
                  enrollment.fullName ||
                  enrollment.studentFullName ||
                  enrollment.studentEmail?.split('@')[0] ||
                  'Learner',
                progress: `${Number(enrollment.progressPercent ?? 0)}%`,
                courseTitle: matchedCourse?.title || 'Untitled Course',
                courseCategory: matchedCourse?.category || 'General'
              };
            });

            this.learners.set(learnerList);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Failed to load learners.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Failed to load instructor courses.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}