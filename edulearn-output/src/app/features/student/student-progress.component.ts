import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService
} from '../../core/services/dashboard.service';

type ProgressCardItem = {
  courseId: string;
  courseTitle: string;
  category: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
};

@Component({
  selector: 'app-student-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-progress.component.html',
  styleUrls: ['./student-progress.component.css']
})
export class StudentProgressComponent implements OnInit {
  progressList = signal<ProgressCardItem[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();

    if (!user?.userId) {
      this.errorMessage.set('Student not found.');
      return;
    }

    this.loadProgress(user.userId);
  }

  exploreCourses(): void {
    this.router.navigateByUrl('/student/explore-courses');
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  loadProgress(studentId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      enrollments: this.dashboardService.getStudentEnrollments(studentId),
      courses: this.dashboardService.getAllCourses()
    }).subscribe({
      next: ({ enrollments, courses }) => {
        const validEnrollments = (enrollments || []).filter(e => !!e.courseId);

        if (!validEnrollments.length) {
          this.progressList.set([]);
          this.isLoading.set(false);
          return;
        }

        const lessonRequests = validEnrollments.map(e =>
          this.dashboardService.getLessonsByCourse(e.courseId as string)
        );

        const progressRequests = validEnrollments.map(e =>
          this.dashboardService.getProgress(studentId, e.courseId as string)
        );

        forkJoin({
          lessonGroups: forkJoin(lessonRequests),
          progressItems: forkJoin(progressRequests)
        }).subscribe({
          next: ({ lessonGroups, progressItems }) => {
            const finalData: ProgressCardItem[] = validEnrollments.map((e, i) => {
              const courseId = e.courseId as string;
              const course = (courses || []).find(
                c => String(c.courseId) === String(courseId)
              );

              const totalLessons = (lessonGroups[i] || []).length;
              const backendCompleted = progressItems[i]?.completedLessons ?? 0;

              const localKey = `completed_${studentId}_${courseId}`;
              let localCompleted = 0;

              try {
                const stored = localStorage.getItem(localKey);
                if (stored) {
                  localCompleted = (JSON.parse(stored) as string[]).length;
                }
              } catch {
                localCompleted = 0;
              }

              const completedLessons = Math.max(backendCompleted, localCompleted);
              const progressPercent = totalLessons > 0
                ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
                : 0;

              return {
                courseId,
                courseTitle: course?.title || 'Course',
                category: course?.category || 'General',
                completedLessons,
                totalLessons,
                progressPercent
              };
            });

            this.progressList.set(finalData);
            this.isLoading.set(false);
          },
          error: () => {
            this.errorMessage.set('Failed to load progress data.');
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.errorMessage.set('Failed to load dashboard data.');
        this.isLoading.set(false);
      }
    });
  }
}