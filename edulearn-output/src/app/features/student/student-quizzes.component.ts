import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService,
  QuizItem,
  AttemptItem,
  EnrollmentItem,
  CourseItem
} from '../../core/services/dashboard.service';

interface StudentQuizCard {
  quizId: string;
  title: string;
  description: string;
  courseTitle: string;
  instructorName: string;
  passingScore: string;
  timeLimit: string;
  maxAttempts: string;
  bestScore: string;
  status: string;
  isAttempted: boolean;
}

@Component({
  selector: 'app-student-quizzes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-quizzes.component.html',
  styleUrls: ['./student-quizzes.component.css']
})
export class StudentQuizzesComponent implements OnInit {
  quizzes = signal<QuizItem[]>([]);
  attempts = signal<AttemptItem[]>([]);
  enrollments = signal<EnrollmentItem[]>([]);
  courses = signal<CourseItem[]>([]);

  isLoading = signal(false);
  errorMessage = signal('');

  quizCards = computed<StudentQuizCard[]>(() => {
  const quizzes = this.quizzes();
  const attempts = this.attempts();
  const courses = this.courses();

  return quizzes.map((quiz) => {
    const matchedCourse = courses.find(
      course => String(course.courseId) === String(quiz.courseId)
    );

    const quizAttempts = attempts.filter(
      attempt => String(attempt.quizId) === String(quiz.quizId)
    );

    const bestScore = quizAttempts.length
      ? Math.max(...quizAttempts.map(a => Number(a.score ?? 0)))
      : null;

    const latestAttempt = quizAttempts.length
      ? [...quizAttempts].sort((a, b) =>
          new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
        )[0]
      : null;

    return {
      quizId: String(quiz.quizId || ''),
      title: quiz.title || 'Untitled Quiz',
      description: quiz.description || 'No description available.',
      courseTitle: matchedCourse?.title || 'Course',
      instructorName: matchedCourse?.instructorName || 'Instructor unavailable',
      passingScore: quiz.passingScore !== undefined ? `${quiz.passingScore}%` : '--',
      timeLimit: quiz.timeLimitMinutes !== undefined ? `${quiz.timeLimitMinutes} mins` : '--',
      maxAttempts: quiz.maxAttempts !== undefined ? String(quiz.maxAttempts) : '--',
      bestScore: bestScore !== null ? `${bestScore}` : 'Not attempted',
      status: latestAttempt
        ? (latestAttempt.passed ? 'Passed' : 'Retry Available')
        : 'Ready',
      isAttempted: quizAttempts.length > 0
    };
  });
});

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

    this.loadQuizzes(user.userId);
  }

  loadQuizzes(studentId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getStudentQuizPageData(studentId).subscribe({
      next: (res) => {
        const activeEnrollments = (res.enrollments || []).filter(
          e => !e.accessExpired
        );

        this.enrollments.set(activeEnrollments);
        this.courses.set(res.courses || []);
        this.attempts.set(res.attempts || []);

        this.dashboardService.getQuizzesForEnrollments(activeEnrollments).subscribe({
          next: (quizRes) => {
            const publishedQuizzes = (quizRes || []).filter(
              quiz => quiz.isPublished === true
            );

            this.quizzes.set(publishedQuizzes);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.errorMessage.set(
              err?.error?.message || 'Unable to load quizzes.'
            );
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'Failed to load quiz page data.'
        );
        this.isLoading.set(false);
      }
    });
  }

  startQuiz(quizId: string): void {
    if (!quizId) return;
    this.router.navigateByUrl(`/student/quiz/${quizId}`);
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}