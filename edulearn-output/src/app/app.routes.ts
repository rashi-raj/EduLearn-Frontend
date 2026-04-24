import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { GoogleCallbackComponent } from './features/auth/google-callback.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'auth/google/callback', component: GoogleCallbackComponent },

  // Shared protected routes
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'discussions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/common/discussions.component').then(
        (m) => m.DiscussionsComponent
      ),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/common/settings.component').then(
        (m) => m.SettingsComponent
      ),
  },

  // Admin routes
  {
    path: 'admin/approvals',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-approvals.component').then(
        (m) => m.AdminApprovalsComponent
      ),
  },
  {
    path: 'admin/course-approvals',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-course-approvals.component').then(
        (m) => m.AdminCourseApprovalsComponent
      ),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
  },
  {
    path: 'admin/payments',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-payments.component').then(
        (m) => m.AdminPaymentsComponent
      ),
  },
  {
    path: 'admin/notifications',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-notifications.component').then(
        (m) => m.AdminNotificationsComponent
      ),
  },
  {
    path: 'admin/analytics',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/admin-analytics.component').then(
        (m) => m.AdminAnalyticsComponent
      ),
  },

  // Instructor routes
  {
    path: 'instructor/courses',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/instructor-courses.component').then(
        (m) => m.InstructorCoursesComponent
      ),
  },
  {
    path: 'instructor/create-course',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/create-course.component').then(
        (m) => m.CreateCourseComponent
      ),
  },
  {
    path: 'instructor/edit-course/:courseId',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/create-course.component').then(
        (m) => m.CreateCourseComponent
      ),
  },
  {
    path: 'instructor/lessons',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/instructor-lessons.component').then(
        (m) => m.InstructorLessonsComponent
      ),
  },
  {
    path: 'instructor/create-lesson',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/create-lesson.component').then(
        (m) => m.CreateLessonComponent
      ),
  },
  {
    path: 'instructor/quizzes',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/instructor-quizzes.component').then(
        (m) => m.InstructorQuizzesComponent
      ),
  },
  {
    path: 'instructor/create-quiz',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/create-quiz.component').then(
        (m) => m.CreateQuizComponent
      ),
  },
  {
    path: 'instructor/quizzes/:quizId/questions/add',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/add-question.component').then(
        (m) => m.AddQuestionComponent
      ),
  },
  {
    path: 'instructor/learners',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/instructor-learners.component').then(
        (m) => m.InstructorLearnersComponent
      ),
  },
  {
    path: 'instructor/analytics',
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
    loadComponent: () =>
      import('./features/instructor/instructor-analytics.component').then(
        (m) => m.InstructorAnalyticsComponent
      ),
  },

  // Student routes
  {
    path: 'my-courses',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/my-courses.component').then(
        (m) => m.MyCoursesComponent
      ),
  },
  {
    path: 'student/explore-courses',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/explore-courses.component').then(
        (m) => m.ExploreCoursesComponent
      ),
  },
  {
    path: 'student/course/:courseId',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-course.component').then(
        (m) => m.StudentCourseComponent
      ),
  },
  {
    path: 'student/course/:courseId/payment',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-course-payment.component').then(
        (m) => m.StudentCoursePaymentComponent
      ),
  },
  {
    path: 'student/payments',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-payments-history.component').then(
        (m) => m.StudentPaymentsHistoryComponent
      ),
  },
  {
    path: 'student/payments/:courseId',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-course-payment.component').then(
        (m) => m.StudentCoursePaymentComponent
      ),
  },
  {
    path: 'student/progress',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-progress.component').then(
        (m) => m.StudentProgressComponent
      ),
  },
  {
    path: 'student/quizzes',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-quizzes.component').then(
        (m) => m.StudentQuizzesComponent
      ),
  },
  {
    path: 'student/quiz/:quizId',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/student-quiz-attempt.component').then(
        (m) => m.StudentQuizAttemptComponent
      ),
  },
  {
    path: 'student/certificates',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/certificates.component').then(
        (m) => m.StudentCertificatesComponent
      ),
  },

  // Misc protected routes
  {
    path: 'lesson-player/:videoId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/instructor/lesson-player.component').then(
        (m) => m.LessonPlayerComponent
      ),
  },

  {
    path: 'certificate/view/:studentId/:courseId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/student/certificate-view.component').then(
        (m) => m.CertificateViewComponent
      ),
  },

  { path: '**', redirectTo: 'login' },
];