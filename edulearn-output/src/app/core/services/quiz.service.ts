import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  QuizItem,
  AttemptItem,
  CreateQuizPayload,
  AddQuestionPayload,
} from '../models/quiz.models';
import { CourseItem } from '../models/course.models';
import { EnrollmentItem } from '../models/enrollment.models';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);
  private readonly quizUrl = `${environment.apiBaseUrl}/api/v1/quizzes`;
  private readonly attemptUrl = `${environment.apiBaseUrl}/api/v1/attempts`;

  // ── Quizzes ───────────────────────────────────────────────────────────────

  getQuizzesByCourse(courseId: string): Observable<QuizItem[]> {
    return this.http.get<QuizItem[]>(`${this.quizUrl}/course/${courseId}`);
  }

  getQuizById(quizId: string): Observable<QuizItem> {
    return this.http.get<QuizItem>(`${this.quizUrl}/${quizId}`);
  }

  getQuizzesForEnrollments(enrollments: EnrollmentItem[]): Observable<QuizItem[]> {
    const courseIds = enrollments
      .map((e) => e.courseId)
      .filter((id): id is string => !!id);

    if (!courseIds.length) return of([]);

    return forkJoin(courseIds.map((id) => this.getQuizzesByCourse(id))).pipe(
      map((groups) => groups.flat())
    );
  }

  getQuizzesForCourses(courses: CourseItem[]): Observable<QuizItem[]> {
    const courseIds = courses
      .map((c) => c.courseId)
      .filter((id): id is string => !!id);

    if (!courseIds.length) return of([]);

    return forkJoin(courseIds.map((id) => this.getQuizzesByCourse(id))).pipe(
      map((groups) => groups.flat())
    );
  }

  createQuiz(payload: CreateQuizPayload): Observable<QuizItem> {
    return this.http.post<QuizItem>(this.quizUrl, payload);
  }

  publishQuiz(quizId: string, published: boolean): Observable<QuizItem> {
    return this.http.patch<QuizItem>(`${this.quizUrl}/${quizId}/publish`, { published });
  }

  addQuestion(quizId: string, payload: AddQuestionPayload): Observable<unknown> {
    return this.http.post(`${this.quizUrl}/${quizId}/questions`, payload);
  }

  // ── Attempts ──────────────────────────────────────────────────────────────

  getStudentAttempts(studentId: string): Observable<AttemptItem[]> {
    return this.http.get<AttemptItem[]>(`${this.attemptUrl}/student/${studentId}`);
  }

  submitQuizAttempt(quizId: string, payload: unknown): Observable<AttemptItem> {
    return this.http.post<AttemptItem>(`${this.attemptUrl}/${quizId}/submit`, payload);
  }
}
