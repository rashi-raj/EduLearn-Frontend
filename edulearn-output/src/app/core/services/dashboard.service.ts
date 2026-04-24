/**
 * @file dashboard.service.ts
 *
 * Facade service retained for backward compatibility.
 * All domain logic now lives in focused services:
 *   - CourseService      → course.service.ts
 *   - LessonService      → lesson.service.ts
 *   - EnrollmentService  → enrollment.service.ts
 *   - QuizService        → quiz.service.ts
 *   - PaymentService     → payment.service.ts
 */

// ── Model re-exports ────────────────────────────────────────────────────────
export type { CourseItem, CreateCoursePayload } from '../models/course.models';
export type { LessonItem, CreateLessonPayload } from '../models/lesson.models';
export type {
  EnrollmentItem,
  ProgressItem,
  CertificateItem,
  EnrollCoursePayload,
  CompleteLessonPayload,
} from '../models/enrollment.models';
export type {
  QuizItem,
  QuestionItem,
  AttemptItem,
  AnswerPayload,
  SubmitAttemptPayload,
  CreateQuizPayload,
  AddQuestionPayload,
} from '../models/quiz.models';
export type {
  PaymentItem,
  CreatePaymentOrderPayload,
  VerifyPaymentPayload,
} from '../models/payment.models';

import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { CourseService } from './course.service';
import { LessonService } from './lesson.service';
import { EnrollmentService } from './enrollment.service';
import { QuizService } from './quiz.service';
import { PaymentService } from './payment.service';

import { CourseItem, CreateCoursePayload } from '../models/course.models';
import { LessonItem, CreateLessonPayload } from '../models/lesson.models';
import {
  EnrollmentItem,
  ProgressItem,
  CertificateItem,
  EnrollCoursePayload,
  CompleteLessonPayload,
} from '../models/enrollment.models';
import {
  QuizItem,
  QuestionItem,
  AttemptItem,
  AddQuestionPayload,
  CreateQuizPayload,
} from '../models/quiz.models';
import {
  PaymentItem,
  CreatePaymentOrderPayload,
  VerifyPaymentPayload,
} from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly courseService = inject(CourseService);
  private readonly lessonService = inject(LessonService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly quizService = inject(QuizService);
  private readonly paymentService = inject(PaymentService);

  // ── Courses ───────────────────────────────────────────────────────────────

  getAllCourses(): Observable<CourseItem[]> {
    return this.courseService.getAllCourses();
  }

  getPublishedCourses(): Observable<CourseItem[]> {
    return this.courseService.getPublishedCourses();
  }

  getCourseById(courseId: string): Observable<CourseItem> {
    return this.courseService.getCourseById(courseId);
  }

  getInstructorCourses(instructorId: string): Observable<CourseItem[]> {
    return this.courseService.getInstructorCourses(instructorId);
  }

  getCoursesByStatus(
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED'
  ): Observable<CourseItem[]> {
    return this.courseService.getCoursesByStatus(status);
  }

  createCourse(payload: CreateCoursePayload): Observable<CourseItem> {
    return this.courseService.createCourse(payload);
  }

  updateCourse(courseId: string, payload: CreateCoursePayload): Observable<CourseItem> {
    return this.courseService.updateCourse(courseId, payload);
  }

  submitCourseForApproval(courseId: string): Observable<CourseItem> {
    return this.courseService.submitCourseForApproval(courseId);
  }

  reviewCourse(courseId: string, action: 'APPROVE' | 'REJECT'): Observable<CourseItem> {
    return this.courseService.reviewCourse(courseId, action);
  }

  // ── Lessons ───────────────────────────────────────────────────────────────

  getLessonsByCourse(courseId: string): Observable<LessonItem[]> {
    return this.lessonService.getLessonsByCourse(courseId);
  }

  createLesson(payload: CreateLessonPayload): Observable<LessonItem> {
    return this.lessonService.createLesson(payload);
  }

  getLessonsForCourses(courses: CourseItem[]): Observable<LessonItem[]> {
    const ids = courses
      .map((c) => c.courseId)
      .filter((id): id is string => !!id);

    if (!ids.length) return of([]);

    return forkJoin(ids.map((id) => this.lessonService.getLessonsByCourse(id))).pipe(
      map((groups) => groups.flat())
    );
  }

  // ── Enrollments ───────────────────────────────────────────────────────────

  getStudentEnrollments(studentId?: string): Observable<EnrollmentItem[]> {
    return this.enrollmentService.getStudentEnrollments(studentId ?? '').pipe(
      catchError(() => of([]))
    );
  }

  getEnrollmentsForInstructorCourses(courseIds: string[]): Observable<EnrollmentItem[]> {
    if (!courseIds.length) {
      return of([]);
    }

    return forkJoin(
      courseIds.map((courseId) =>
        this.enrollmentService.getEnrollmentsByCourse(courseId).pipe(
          catchError(() => of([]))
        )
      )
    ).pipe(
      map((groups) => groups.flat()),
      catchError(() => of([]))
    );
  }

  enrollCourse(payload: EnrollCoursePayload): Observable<EnrollmentItem> {
    return this.enrollmentService.enrollCourse(payload);
  }

  hasActiveAccess(studentId: string, courseId: string): Observable<boolean> {
    return this.enrollmentService.hasActiveAccess(studentId, courseId);
  }

  // ── Progress & Certificates ───────────────────────────────────────────────

  getCourseProgress(studentId: string, courseId: string): Observable<ProgressItem> {
    return this.enrollmentService.getCourseProgress(studentId, courseId);
  }

  getStudentProgressByEnrollments(
    studentId: string,
    enrollments: EnrollmentItem[]
  ): Observable<ProgressItem[]> {
    return this.enrollmentService.getStudentProgressByEnrollments(studentId, enrollments);
  }

  completeLesson(payload: CompleteLessonPayload): Observable<void> {
    return this.enrollmentService.completeLesson(payload);
  }

  getProgress(studentId: string, courseId: string): Observable<ProgressItem> {
    return this.enrollmentService.getProgress(studentId, courseId);
  }

  getCourseCertificate(studentId: string, courseId: string): Observable<CertificateItem> {
    return this.enrollmentService.getCourseCertificate(studentId, courseId);
  }

  getCertificatesForEnrollments(
    studentId: string,
    enrollments: EnrollmentItem[]
  ): Observable<CertificateItem[]> {
    return this.enrollmentService.getCertificatesForEnrollments(studentId, enrollments);
  }

  // ── Quizzes & Attempts ────────────────────────────────────────────────────

  getQuizzesByCourse(courseId: string): Observable<QuizItem[]> {
    return this.quizService.getQuizzesByCourse(courseId);
  }

  getQuizById(quizId: string): Observable<QuizItem> {
    return this.quizService.getQuizById(quizId);
  }

  getQuizzesForEnrollments(enrollments: EnrollmentItem[]): Observable<QuizItem[]> {
    return this.quizService.getQuizzesForEnrollments(enrollments);
  }

  getQuizzesForCourses(courses: CourseItem[]): Observable<QuizItem[]> {
    return this.quizService.getQuizzesForCourses(courses);
  }

  createQuiz(payload: CreateQuizPayload): Observable<QuizItem> {
    return this.quizService.createQuiz(payload);
  }

  publishQuiz(quizId: string, published: boolean): Observable<QuizItem> {
    return this.quizService.publishQuiz(quizId, published);
  }

  addQuestion(quizId: string, payload: AddQuestionPayload): Observable<unknown> {
    return this.quizService.addQuestion(quizId, payload);
  }

  getStudentAttempts(studentId?: string): Observable<AttemptItem[]> {
    return this.quizService.getStudentAttempts(studentId ?? '');
  }

  submitQuizAttempt(quizId: string, payload: unknown): Observable<AttemptItem> {
    return this.quizService.submitQuizAttempt(quizId, payload);
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  getStudentPayments(studentId: string): Observable<PaymentItem[]> {
    return this.paymentService.getStudentPayments(studentId);
  }

  createPaymentOrder(payload: CreatePaymentOrderPayload): Observable<unknown> {
    return this.paymentService.createPaymentOrder(payload);
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<unknown> {
    return this.paymentService.verifyPayment(payload);
  }

  hasPaid(studentId: string, courseId: string): Observable<{ paid: boolean }> {
    return this.paymentService.hasPaid(studentId, courseId);
  }

  // ── Composed page-data helpers ────────────────────────────────────────────

  getStudentDashboardData(studentId?: string) {
    if (!studentId) {
      return forkJoin({
        enrollments: of<EnrollmentItem[]>([]),
        courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
        attempts: of<AttemptItem[]>([]),
      });
    }
    return forkJoin({
      enrollments: this.enrollmentService.getStudentEnrollments(studentId).pipe(
        catchError(() => of<EnrollmentItem[]>([]))
      ),
      courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
      attempts: this.quizService.getStudentAttempts(studentId).pipe(
        catchError(() => of<AttemptItem[]>([]))
      ),
    });
  }

  getStudentQuizPageData(studentId: string) {
    return forkJoin({
      enrollments: this.enrollmentService.getStudentEnrollments(studentId).pipe(
        catchError(() => of<EnrollmentItem[]>([]))
      ),
      courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
      attempts: this.quizService.getStudentAttempts(studentId).pipe(
        catchError(() => of<AttemptItem[]>([]))
      ),
    });
  }

  getMyCoursesData(studentId?: string) {
    return forkJoin({
      enrollments: this.enrollmentService.getStudentEnrollments(studentId ?? '').pipe(
        catchError(() => of<EnrollmentItem[]>([]))
      ),
      courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
    });
  }

  getStudentCertificatesPageData(studentId: string) {
    return forkJoin({
      enrollments: this.enrollmentService.getStudentEnrollments(studentId).pipe(
        catchError(() => of<EnrollmentItem[]>([]))
      ),
      courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
    });
  }

  getStudentProgressPageData(studentId: string) {
    return forkJoin({
      enrollments: this.enrollmentService.getStudentEnrollments(studentId).pipe(
        catchError(() => of<EnrollmentItem[]>([]))
      ),
      courses: this.courseService.getAllCourses().pipe(catchError(() => of([]))),
    });
  }

  getInstructorLessonsPageData(instructorId: string) {
    return forkJoin({
      courses: this.courseService.getInstructorCourses(instructorId),
    });
  }

  getInstructorQuizzesPageData(instructorId: string) {
    return forkJoin({
      courses: this.courseService.getInstructorCourses(instructorId),
    });
  }
}