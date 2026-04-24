import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DashboardService, LessonItem, CourseItem } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-course',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-course.component.html',
  styleUrls: ['./student-course.component.css']
})
export class StudentCourseComponent implements OnInit, OnDestroy {
  courseId = '';
  private routerSub?: Subscription;

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  completedLessons = signal<string[]>([]);

  course = signal<CourseItem | null>(null);
  lessons = signal<LessonItem[]>([]);
  isEnrolled = signal(false);
  isPaid = signal(false);
  hasActiveAccess = signal(false);

  previewLessons = computed(() =>
    this.lessons()
      .filter(lesson => lesson.isPreview)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  );

  premiumLessons = computed(() =>
    this.lessons()
      .filter(lesson => !lesson.isPreview)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  );

  totalLessons = computed(() => this.lessons().length);

  totalCompletedCount = computed(() =>
    this.lessons().filter(l => l.lessonId && this.completedLessons().includes(l.lessonId)).length
  );

  progressPercent = computed(() => {
    const total = this.totalLessons();
    if (total === 0) return 0;
    return Math.round((this.totalCompletedCount() / total) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('courseId') || '';
    this.loadPage();
    this.loadCompletedLessons();

    // Refresh completed lessons every time we navigate back to this page
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadCompletedLessons();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  loadPage(): void {
    const user = this.authService.getCurrentUser();

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardService.getAllCourses().subscribe({
      next: (courses) => {
        const matchedCourse =
          (courses || []).find(c => String(c.courseId) === String(this.courseId)) || null;

        this.course.set(matchedCourse);

        this.dashboardService.getLessonsByCourse(this.courseId).subscribe({
          next: (lessonRes) => {
            this.lessons.set(lessonRes || []);

            if (!user?.userId) {
              this.isLoading.set(false);
              this.isEnrolled.set(false);
              this.isPaid.set(false);
              return;
            }

            this.dashboardService.getStudentEnrollments(user.userId).subscribe({
              next: (enrollments) => {
                const found = (enrollments || []).find(
                  e => String(e.courseId) === String(this.courseId)
                );

                this.isEnrolled.set(!!found);

                if (!found) {
                  this.isPaid.set(false);
                  this.hasActiveAccess.set(false);
                  this.isLoading.set(false);
                  return;
                }

                this.dashboardService.hasPaid(user.userId!, this.courseId).subscribe({
                  next: (paymentRes) => {
                    this.isPaid.set(paymentRes?.paid === true);

                    this.dashboardService.hasActiveAccess(user.userId!, this.courseId).subscribe({
                      next: (accessRes) => {
                        this.hasActiveAccess.set(accessRes === true);
                        this.isLoading.set(false);

                        if (!accessRes) {
                          this.errorMessage.set('Your access to this course has expired.');
                        }
                      },
                      error: () => {
                        this.hasActiveAccess.set(false);
                        this.isLoading.set(false);
                      }
                    });
                  },
                  error: () => {
                    this.isPaid.set(false);
                    this.hasActiveAccess.set(false);
                    this.isLoading.set(false);
                  }
                });
              },
              error: () => {
                this.isLoading.set(false);
              }
            });
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load lessons.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load course details.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  enroll(): void {
    const user = this.authService.getCurrentUser();

    if (!user || !user.userId) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.dashboardService.enrollCourse({
      courseId: this.courseId,
      studentId: user.userId,
      studentName: user.fullName,
      studentEmail: user.email
    }).subscribe({
      next: () => {
        this.isEnrolled.set(true);
        this.isPaid.set(false);
        this.successMessage.set('Enrollment successful. Purchase the course to unlock premium lessons.');
        this.errorMessage.set('');
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Failed to enroll.'
        );
      }
    });
  }

  purchaseCourse(): void {
    if (!this.isEnrolled()) {
      this.errorMessage.set('Please enroll first before purchasing the course.');
      return;
    }

    this.router.navigateByUrl(`/student/course/${this.courseId}/payment`);
  }

  openLesson(lesson: LessonItem): void {
    this.errorMessage.set('');

    if (lesson.isPreview) {
      this.play(lesson);
      return;
    }

    if (!this.isEnrolled()) {
      this.errorMessage.set('Please enroll first to access premium lessons.');
      return;
    }

    if (!this.isPaid()) {
      this.errorMessage.set('Please purchase the course to unlock premium lessons.');
      return;
    }

    if (!this.hasActiveAccess()) {
      this.errorMessage.set('Your course access has expired.');
      return;
    }

    this.play(lesson);
  }

  openQuizzes(): void {
    if (!this.isEnrolled()) {
      this.errorMessage.set('Please enroll first to access quizzes.');
      return;
    }

    if (!this.isPaid()) {
      this.errorMessage.set('Please purchase the course to access quizzes.');
      return;
    }

    if (!this.hasActiveAccess()) {
      this.errorMessage.set('Your course access has expired.');
      return;
    }

    this.router.navigateByUrl('/student/quizzes');
  }

  play(lesson: LessonItem): void {
    const url = (lesson.contentUrl || '').trim();

    if (!url) {
      this.errorMessage.set('No video content available for this lesson yet.');
      return;
    }

    const youtubeId = this.extractYoutubeId(url);
    if (youtubeId) {
      this.router.navigate(
        [`/lesson-player/${youtubeId}`],
        {
          queryParams: {
            courseId: this.courseId,
            lessonId: lesson.lessonId
          }
        }
      );
      return;
    }

    // For direct video URLs (non-YouTube), open in the player with the full URL
    this.router.navigate(
      [`/lesson-player/direct`],
      {
        queryParams: {
          courseId: this.courseId,
          lessonId: lesson.lessonId,
          videoUrl: url
        }
      }
    );
  }

  extractVideoId(url: string): string | null {
    if (!url) return null;
    return this.extractYoutubeId(url) || 'direct';
  }

  private extractYoutubeId(url: string): string | null {
    if (!url) return null;

    const regExp =
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regExp);

    return match ? match[1] : null;
  }

  getThumbnail(url?: string): string {
    const id = this.extractYoutubeId(url || '');
    return id ? `https://img.youtube.com/vi/${id}/0.jpg` : '';
  }

  loadCompletedLessons() {
    const user = this.authService.getCurrentUser();
    if (!user?.userId || !this.courseId) return;

    const key = `completed_${user.userId}_${this.courseId}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      this.completedLessons.set(JSON.parse(stored));
    }
  }

  isCompleted(lessonId?: string): boolean {
    if (!lessonId) return false;
    return this.completedLessons().includes(lessonId);
  }
}