import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  EnrollmentItem,
  ProgressItem,
  CertificateItem,
  EnrollCoursePayload,
  CompleteLessonPayload,
} from '../models/enrollment.models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly enrollmentUrl = `${environment.apiBaseUrl}/api/v1/enrollments`;
  private readonly progressUrl = `${environment.apiBaseUrl}/api/v1/progress`;

  // ── Enrollments ──────────────────────────────────────────────────────────

  getStudentEnrollments(studentId: string): Observable<EnrollmentItem[]> {
    return this.http.get<EnrollmentItem[]>(
      `${this.enrollmentUrl}/student/${studentId}`
    );
  }

  getEnrollmentsByCourse(courseId: string): Observable<EnrollmentItem[]> {
  return this.http.get<EnrollmentItem[]>(`${this.enrollmentUrl}/course/${courseId}`);
}

  enrollCourse(payload: EnrollCoursePayload): Observable<EnrollmentItem> {
    return this.http.post<EnrollmentItem>(this.enrollmentUrl, payload);
  }

  hasActiveAccess(studentId: string, courseId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.enrollmentUrl}/has-access`, {
      params: { studentId, courseId },
    });
  }

  // ── Progress ─────────────────────────────────────────────────────────────

  getCourseProgress(studentId: string, courseId: string): Observable<ProgressItem> {
    return this.http.get<ProgressItem>(this.progressUrl, {
      params: { studentId, courseId },
    });
  }

  getStudentProgressByEnrollments(
    studentId: string,
    enrollments: EnrollmentItem[]
  ): Observable<ProgressItem[]> {
    const validEnrollments = enrollments.filter((e) => !!e.courseId);
    if (!validEnrollments.length) return of([]);

    return forkJoin(
      validEnrollments.map((e) =>
        this.getCourseProgress(studentId, e.courseId!)
      )
    );
  }

  completeLesson(payload: CompleteLessonPayload): Observable<void> {
    return this.http.post<void>(`${this.progressUrl}/complete-lesson`, payload);
  }

  getProgress(studentId: string, courseId: string): Observable<ProgressItem> {
    return this.http.get<ProgressItem>(
      `${this.progressUrl}?studentId=${studentId}&courseId=${courseId}`
    );
  }

  // ── Certificates ─────────────────────────────────────────────────────────

  getCourseCertificate(
    studentId: string,
    courseId: string
  ): Observable<CertificateItem> {
    if (environment.useMockAuth) {
      return of({ studentId, courseId, certificateUrl: '', issuedAt: '', eligible: false });
    }
    return this.http.get<CertificateItem>(`${this.progressUrl}/certificate`, {
      params: { studentId, courseId },
    }).pipe(
      catchError(() => of({ studentId, courseId, certificateUrl: '', issuedAt: '', eligible: false }))
    );
  }

  getCertificatesForEnrollments(
    studentId: string,
    enrollments: EnrollmentItem[]
  ): Observable<CertificateItem[]> {
    const courseIds = enrollments
      .map((e) => e.courseId)
      .filter((id): id is string => !!id);

    if (!courseIds.length) return of([]);

    return forkJoin(
      courseIds.map((courseId) => this.getCourseCertificate(studentId, courseId))
    );
  }
}