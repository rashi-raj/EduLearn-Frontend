import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
  DashboardService,
  QuizItem,
  QuestionItem,
  AttemptItem
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-student-quiz-attempt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-quiz-attempt.component.html',
  styleUrls: ['./student-quiz-attempt.component.css']
})
export class StudentQuizAttemptComponent implements OnInit {
  quizId = '';
  quiz = signal<QuizItem | null>(null);
  answers = signal<Record<string, string>>({});
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorMessage = signal('');
  submitResult = signal<AttemptItem | null>(null);

  orderedQuestions = computed(() => {
    const questions = this.quiz()?.questions || [];
    return [...questions].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.quizId = this.route.snapshot.paramMap.get('quizId') || '';
    if (!this.quizId) {
      this.errorMessage.set('Quiz not found.');
      return;
    }

    this.loadQuiz();
  }

  loadQuiz(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getQuizById(this.quizId).subscribe({
      next: (quiz) => {
        this.quiz.set(quiz);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Unable to load quiz.');
        this.isLoading.set(false);
      }
    });
  }

  setAnswer(questionId?: string, value?: string): void {
    if (!questionId || !value) return;
    this.answers.update(current => ({
      ...current,
      [questionId]: value
    }));
  }

  submitQuiz(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.errorMessage.set('Student not found.');
      return;
    }

    const questions = this.orderedQuestions();
    const answersMap = this.answers();

    const payloadAnswers = questions
      .filter(q => q.questionId && answersMap[q.questionId])
      .map(q => ({
        questionId: q.questionId as string,
        answer: answersMap[q.questionId as string]
      }));

    if (payloadAnswers.length !== questions.length) {
      this.errorMessage.set('Please answer all questions before submitting.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.dashboardService.submitQuizAttempt(this.quizId, {
      studentId: user.userId,
      answers: payloadAnswers
    }).subscribe({
      next: (result) => {
        this.submitResult.set(result);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        const raw = err?.error;
        const message =
            (typeof raw === 'object' && raw !== null)
              ? (raw.message || raw.error || JSON.stringify(raw))
              : (typeof raw === 'string' ? raw : 'Failed to submit quiz. Please try again.');

        if (String(message).toLowerCase().includes('maximum attempts exceeded')) {
            this.maxAttemptsPopupMessage.set('You have reached the maximum number of attempts for this quiz.');
            this.showMaxAttemptsPopup.set(true);
        } else if (String(message).toLowerCase().includes('type definition error')) {
            this.errorMessage.set('Server encountered a data processing error. Please try again later.');
        } else {
            this.errorMessage.set(message);
        }

        this.isSubmitting.set(false);
        }
    });
  }

  closeMaxAttemptsPopup(): void {
  this.showMaxAttemptsPopup.set(false);
  this.router.navigateByUrl('/student/quizzes');
}

  goBack(): void {
    this.router.navigateByUrl('/student/quizzes');
  }

  showMaxAttemptsPopup = signal(false);
maxAttemptsPopupMessage = signal('You have reached the maximum number of attempts for this quiz.');
}