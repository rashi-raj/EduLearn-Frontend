import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  CourseItem,
  DashboardService,
  QuizItem
} from '../../core/services/dashboard.service';

interface InstructorQuizCard {
  quizId: string;
  title: string;
  description: string;
  courseTitle: string;
  passingScore: string;
  timeLimit: string;
  status: string;
}

@Component({
  selector: 'app-instructor-quizzes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-quizzes.component.html',
  styleUrls: ['./instructor-quizzes.component.css']
})
export class InstructorQuizzesComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');
  userName = signal('Instructor');
  instructorId = signal('');

  courses = signal<CourseItem[]>([]);
  quizzes = signal<QuizItem[]>([]);

  quizCards = computed<InstructorQuizCard[]>(() => {
    return this.quizzes().map(quiz => {
      const matchedCourse = this.courses().find(
        course => String(course.courseId) === String(quiz.courseId)
      );

      return {
        quizId: String(quiz.quizId || ''),
        title: quiz.title || 'Untitled Quiz',
        description: quiz.description || 'No description available.',
        courseTitle: matchedCourse?.title || 'Course',
        passingScore: quiz.passingScore !== undefined ? `${quiz.passingScore}%` : '--',
        timeLimit: quiz.timeLimitMinutes !== undefined ? `${quiz.timeLimitMinutes} mins` : '--',
        status: quiz.isPublished ? 'Published' : 'Draft'
      };
    });
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.fullName) {
      this.userName.set(currentUser.fullName);
    }

    const instructorId = currentUser?.userId || '';
    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.instructorId.set(instructorId);
    this.loadQuizzes(instructorId);
  }

  loadQuizzes(instructorId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getInstructorQuizzesPageData(instructorId).subscribe({
      next: (res) => {
        const courses = res.courses || [];
        this.courses.set(courses);

        this.dashboardService.getQuizzesForCourses(courses).subscribe({
          next: (quizRes) => {
            this.quizzes.set(quizRes || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load quizzes right now.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load instructor quizzes page.'
        );
      }
    });
  }

  addQuestion(quizId: string): void {
    this.router.navigateByUrl(`/instructor/quizzes/${quizId}/questions/add`);
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  createQuiz(): void {
    this.router.navigateByUrl('/instructor/create-quiz');
  }

  publishQuiz(quizId: string): void {
    if (!quizId) return;

    this.dashboardService.publishQuiz(quizId, true).subscribe({
      next: () => {
        const instructorId = this.instructorId();
        if (instructorId) {
          this.loadQuizzes(instructorId);
        }
      },
      error: (err) => {
        console.error('Failed to publish quiz', err);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to publish quiz.'
        );
      }
    });
  }
}