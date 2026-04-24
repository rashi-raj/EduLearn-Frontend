import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService,
  CourseItem,
  EnrollmentItem,
  AttemptItem,
  ProgressItem
} from '../../core/services/dashboard.service';
import { NotificationService, NotificationItem } from '../../services/notification.service';

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

interface UserProfile {
  userId?: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface QuickStat {
  title: string;
  value: string;
  hint: string;
}

interface ActionCard {
  title: string;
  description: string;
  buttonLabel: string;
  route: string;
}

interface CourseCard {
  title: string;
  category: string;
  progress?: number;
  lessons: number;
  instructor: string;
  status: string;
}

interface QuizCard {
  title: string;
  score: number;
  status: string;
  attemptedAtText: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  sidebarOpen = signal(false);
  notificationsOpen = signal(false);
  searchTerm = signal('');
  isLoading = signal(false);
  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal(0);

  user = signal<UserProfile>({
    userId: '',
    fullName: '',
    email: '',
    role: 'STUDENT'
  });

  enrollments = signal<EnrollmentItem[]>([]);
  courses = signal<CourseItem[]>([]);
  attempts = signal<AttemptItem[]>([]);
  progressList = signal<ProgressItem[]>([]);

  instructorCourses = signal<CourseItem[]>([]);
  instructorEnrollments = signal<EnrollmentItem[]>([]);
  instructorCompletionRate = signal(0);
  instructorPendingReviews = signal(0);

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService
  ) {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      this.user.set({
        userId: currentUser.userId,
        fullName: currentUser.fullName || currentUser.email?.split('@')[0] || 'User',
        email: currentUser.email || '',
        role: (currentUser.role as UserRole) || 'STUDENT'
      });

      const uid = currentUser.userId || '';
      this.notificationService.getNotifications(uid).subscribe({
        next: (items) => this.notifications.set(items),
        error: () => this.notifications.set([])
      });

      this.notificationService.getUnreadCount(uid).subscribe({
        next: (res) => this.unreadCount.set(res.count),
        error: () => this.unreadCount.set(0)
      });
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const currentUser = this.authService.getCurrentUser();

    if (this.user().role === 'STUDENT') {
      this.loadStudentDashboard(currentUser?.userId || '');
      return;
    }

    if (this.user().role === 'INSTRUCTOR') {
      this.loadInstructorDashboard(currentUser?.userId || '');
      return;
    }

    if (this.user().role === 'ADMIN') {
      this.loadAdminDashboard();
      return;
    }
  }

  loadAdminDashboard(): void {
  this.isLoading.set(true);

  this.dashboardService.getAllCourses().subscribe({
    next: (courses) => {
      this.courses.set(courses || []);
      this.isLoading.set(false);
    },
    error: () => {
      this.courses.set([]);
      this.isLoading.set(false);
    }
  });
}

  loadStudentDashboard(studentId: string): void {
    if (!studentId) {
      this.enrollments.set([]);
      this.courses.set([]);
      this.attempts.set([]);
      this.progressList.set([]);
      return;
    }

    this.isLoading.set(true);

    this.dashboardService.getStudentDashboardData(studentId).subscribe({
      next: (res) => {
        const enrollments = res.enrollments || [];

        this.enrollments.set(enrollments);
        this.courses.set(res.courses || []);
        this.attempts.set(res.attempts || []);

        if (!enrollments.length) {
          this.progressList.set([]);
          this.isLoading.set(false);
          return;
        }

        const requests = enrollments
          .filter(e => !!e.courseId)
          .map((e) => this.dashboardService.getProgress(studentId, e.courseId!));

        if (!requests.length) {
          this.progressList.set([]);
          this.isLoading.set(false);
          return;
        }

        forkJoin(requests).subscribe({
          next: (progressRes) => {
            this.progressList.set(progressRes || []);
            this.isLoading.set(false);
          },
          error: () => {
            this.progressList.set([]);
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.enrollments.set([]);
        this.courses.set([]);
        this.attempts.set([]);
        this.progressList.set([]);
        this.isLoading.set(false);
      }
    });
  }

  loadInstructorDashboard(instructorId: string): void {
    if (!instructorId) {
      return;
    }

    this.isLoading.set(true);

    this.dashboardService.getInstructorCourses(instructorId).subscribe({
      next: (courses) => {
        const instructorCourses = courses || [];
        this.instructorCourses.set(instructorCourses);

        const courseIds = instructorCourses
          .map(course => String(course.courseId || ''))
          .filter(Boolean);

        if (!courseIds.length) {
          this.instructorEnrollments.set([]);
          this.instructorCompletionRate.set(0);
          this.instructorPendingReviews.set(
            instructorCourses.filter(course => course.status === 'PENDING_APPROVAL').length
          );
          this.isLoading.set(false);
          return;
        }

        this.dashboardService.getEnrollmentsForInstructorCourses(courseIds).subscribe({
          next: (enrollments) => {
            const allEnrollments = enrollments || [];
            this.instructorEnrollments.set(allEnrollments);

            const validProgressValues = allEnrollments
              .map(enrollment => Number(enrollment.progressPercent ?? 0))
              .filter(value => !Number.isNaN(value));

            const avgProgress = validProgressValues.length
              ? Math.round(
                  validProgressValues.reduce((sum, value) => sum + value, 0) / validProgressValues.length
                )
              : 0;

            this.instructorCompletionRate.set(avgProgress);

            const pendingCount = instructorCourses.filter(
              course => course.status === 'PENDING_APPROVAL'
            ).length;

            this.instructorPendingReviews.set(pendingCount);
            this.isLoading.set(false);
          },
          error: () => {
            this.instructorEnrollments.set([]);
            this.instructorCompletionRate.set(0);
            this.instructorPendingReviews.set(
              instructorCourses.filter(course => course.status === 'PENDING_APPROVAL').length
            );
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  roleLabel = computed(() => {
    const role = this.user().role;
    if (role === 'STUDENT') return 'Student';
    if (role === 'INSTRUCTOR') return 'Instructor';
    return 'Admin';
  });

  pageTitle = computed(() => {
    const role = this.user().role;
    if (role === 'STUDENT') return 'Welcome back to your learning space';
    if (role === 'INSTRUCTOR') return 'Manage your courses and learners';
    return 'Monitor and manage the EduLearn platform';
  });

  private getNearestActiveExpiryText(): string {
    const activeExpiries = this.enrollments()
      .filter(e => !e.accessExpired && !!e.expiresAt)
      .map(e => new Date(e.expiresAt as string))
      .filter(d => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!activeExpiries.length) {
      return 'No active subscription';
    }

    const now = new Date().getTime();
    const nearest = activeExpiries[0].getTime();
    const diffMs = nearest - now;
    const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return diffDays === 0 ? 'Expires today' : `Renews in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  private getSubscriptionLabel(): string {
    const hasActive = this.enrollments().some(e => !e.accessExpired);
    return hasActive ? 'Active' : 'Inactive';
  }

  stats = computed<QuickStat[]>(() => {
  if (this.user().role === 'STUDENT') {
    const enrolledCourses = this.enrollments().filter(
      e => e.status !== 'CANCELLED'
    ).length;

    const completed = this.progressList().filter(
      p =>
        Number(p.progressPercent ?? 0) >= 100 ||
        (
          Number(p.totalLessons ?? 0) > 0 &&
          Number(p.completedLessons ?? 0) >= Number(p.totalLessons ?? 0)
        )
    ).length;

    const attemptScores = this.attempts()
      .map(a => Number(a.score ?? 0))
      .filter(score => !Number.isNaN(score) && score >= 0);

    const avgScore = attemptScores.length
      ? Math.round(attemptScores.reduce((sum, s) => sum + s, 0) / attemptScores.length)
      : 0;

    return [
      {
        title: 'Enrolled Courses',
        value: String(enrolledCourses).padStart(2, '0'),
        hint: 'Courses currently active'
      },
      {
        title: 'Completed',
        value: String(completed).padStart(2, '0'),
        hint: 'Certificates earned so far'
      },
      {
        title: 'Quiz Average',
        value: `${avgScore}%`,
        hint: 'Across latest attempts'
      },
      {
        title: 'Subscription',
        value: this.getSubscriptionLabel(),
        hint: this.getNearestActiveExpiryText()
      }
    ];
  }

  if (this.user().role === 'INSTRUCTOR') {
    const publishedCourses = this.instructorCourses().filter(
      course => course.isPublished || course.status === 'PUBLISHED'
    ).length;

    const uniqueStudents = new Set(
      this.instructorEnrollments()
        .map(enrollment => String(enrollment.studentId || ''))
        .filter(Boolean)
    ).size;

    return [
      {
        title: 'Published Courses',
        value: String(publishedCourses).padStart(2, '0'),
        hint: 'Visible in catalog'
      },
      {
        title: 'Total Students',
        value: String(uniqueStudents),
        hint: 'Across all your courses'
      },
      {
        title: 'Completion Rate',
        value: `${this.instructorCompletionRate()}%`,
        hint: 'Average course completion'
      },
      {
        title: 'Pending Reviews',
        value: String(this.instructorPendingReviews()).padStart(2, '0'),
        hint: 'Requires your attention'
      }
    ];
  }

  const totalUsers = this.courses().length; // temporary fallback if admin data is not separately loaded
  const pendingApprovals = this.courses().filter(c => c.status === 'PENDING_APPROVAL').length;
  const publishedCourses = this.courses().filter(c => c.status === 'PUBLISHED' || c.isPublished).length;
  const rejectedCourses = this.courses().filter(c => c.status === 'REJECTED').length;

  return [
    { title: 'Published Courses', value: String(publishedCourses), hint: 'Currently live courses' },
    { title: 'Pending Approvals', value: String(pendingApprovals), hint: 'Waiting for admin review' },
    { title: 'Rejected Courses', value: String(rejectedCourses), hint: 'Need instructor revision' },
    { title: 'Catalog Size', value: String(totalUsers), hint: 'Total tracked course records' }
  ];
});

  primaryActions = computed<ActionCard[]>(() => {
    switch (this.user().role) {
      case 'STUDENT':
        return [
          {
            title: 'Continue Learning',
            description: 'Resume your in-progress lessons and keep your streak going.',
            buttonLabel: 'Go to My Courses',
            route: '/my-courses'
          },
          {
            title: 'Track Progress',
            description: 'View lesson completion, watch time, and course-wise progress.',
            buttonLabel: 'View Progress',
            route: '/student/progress'
          },
          {
            title: 'Certificates',
            description: 'Access and download earned certificates after completion.',
            buttonLabel: 'Open Certificates',
            route: '/student/certificates'
          },
          {
            title: 'Payments & Plans',
            description: 'Check purchase history, subscription status, and renew plans.',
            buttonLabel: 'View Payments',
            route: '/student/payments'
          }
        ];

      case 'INSTRUCTOR':
        return [
          {
            title: 'Create Course',
            description: 'Start a new course with title, category, pricing, and structure.',
            buttonLabel: 'Create Now',
            route: '/instructor/create-course'
          },
          {
            title: 'Manage Lessons',
            description: 'Add videos, articles, PDFs, and reorder lesson content.',
            buttonLabel: 'Manage Lessons',
            route: '/instructor/lessons'
          },
          {
            title: 'Quiz Builder',
            description: 'Create timed quizzes with passing score and attempt limits.',
            buttonLabel: 'Open Quiz Builder',
            route: '/instructor/quizzes'
          },
          {
            title: 'Learner Insights',
            description: 'Monitor enrollments, progress, and course completion trends.',
            buttonLabel: 'View Analytics',
            route: '/instructor/learners'
          }
        ];

      default:
        return [
          {
            title: 'Manage Users',
            description: 'Review student and instructor accounts, suspend or delete users.',
            buttonLabel: 'Open User Management',
            route: '/admin/users'
          },
          {
            title: 'Course Approval Queue',
            description: 'Approve or reject newly submitted courses before publishing.',
            buttonLabel: 'Review Courses',
            route: '/admin/course-approvals'
          },
          {
            title: 'Payments & Subscriptions',
            description: 'Monitor revenue, refunds, and active subscription plans.',
            buttonLabel: 'View Transactions',
            route: '/admin/payments'
          },
          {
            title: 'Platform Analytics',
            description: 'Track top courses, active learners, completions, and performance.',
            buttonLabel: 'Open Analytics',
            route: '/admin/analytics'
          }
        ];
    }
  });

  featuredCourses = computed<CourseCard[]>(() => {
    if (this.user().role === 'STUDENT') {
      return this.enrollments().map(enrollment => {
        const matchedCourse = this.courses().find(
          course => course.courseId === enrollment.courseId
        );

        const matchedProgress = this.progressList().find(
          progress => progress.courseId === enrollment.courseId
        );

        const progressPercent = matchedProgress?.progressPercent ?? 0;
        const totalLessons = matchedProgress?.totalLessons ?? 0;

        return {
          title: matchedCourse?.title || 'Course',
          category: matchedCourse?.category || 'Learning',
          progress: progressPercent,
          lessons: totalLessons,
          instructor: matchedCourse?.instructorName || 'Instructor',
          status: progressPercent >= 100 ? 'Completed' : 'In Progress'
        };
      });
    }

    if (this.user().role === 'INSTRUCTOR') {
      return this.instructorCourses().slice(0, 4).map(course => ({
        title: course.title || 'Course',
        category: course.category || 'General',
        lessons: Number(course.totalDuration ?? 0),
        instructor: this.user().fullName || 'Instructor',
        status:
          course.status === 'PUBLISHED'
            ? 'Published'
            : course.status === 'PENDING_APPROVAL'
            ? 'Pending Approval'
            : course.status === 'REJECTED'
            ? 'Rejected'
            : 'Draft'
      }));
    }

    if (this.user().role === 'ADMIN') {
    return this.courses().slice(0, 4).map(course => ({
      title: course.title || 'Course',
      category: course.category || 'General',
      lessons: Number(course.totalDuration ?? 0),
      instructor: course.instructorId || 'Instructor',
      status:
        course.status === 'PUBLISHED'
          ? 'Approved'
          : course.status === 'PENDING_APPROVAL'
          ? 'Pending Approval'
          : course.status === 'REJECTED'
          ? 'Rejected'
          : 'Draft'
    }));
  }

    return [];
  });

  recentQuizAttempts = computed<QuizCard[]>(() => {
    if (this.user().role !== 'STUDENT') {
      return [];
    }

    return [...this.attempts()]
      .sort((a, b) => {
        const dateA = new Date((a as any).attemptedAt || (a as any).submittedAt || 0).getTime();
        const dateB = new Date((b as any).attemptedAt || (b as any).submittedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 4)
      .map((attempt, index) => {
        const score = Number(attempt.score ?? 0);
        return {
          title: (attempt as any).quizTitle || `Quiz Attempt ${index + 1}`,
          score,
          status: score >= 40 ? 'Passed' : 'Needs Improvement',
          attemptedAtText: this.formatAttemptDate(
            (attempt as any).attemptedAt || (attempt as any).submittedAt
          )
        };
      });
  });

  quizSummary = computed(() => {
    const attempts = this.attempts();
    const totalAttempts = attempts.length;

    const passedCount = attempts.filter(a => Number(a.score ?? 0) >= 40).length;

    const bestScore = attempts.length
      ? Math.max(...attempts.map(a => Number(a.score ?? 0)))
      : 0;

    return {
      totalAttempts,
      passedCount,
      bestScore
    };
  });

  private formatAttemptDate(value?: string): string {
    if (!value) return 'Recently attempted';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Recently attempted';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
  }

  markAllNotificationsRead(): void {
    const userId = this.user().userId || '';
    if (userId) {
      this.notificationService.markAllAsRead(userId).subscribe(() => {
        this.notifications.update(items => items.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      });
    }
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}