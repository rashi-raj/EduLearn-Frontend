import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CourseItem, CreateCoursePayload } from '../models/course.models';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/courses`;

  getAllCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(this.baseUrl);
  }

  getPublishedCourses(): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/published`);
  }

  getCourseById(courseId: string): Observable<CourseItem> {
    return this.http.get<CourseItem>(`${this.baseUrl}/${courseId}`);
  }

  getInstructorCourses(instructorId: string): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/instructor/${instructorId}`);
  }

  getCoursesByStatus(
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED'
  ): Observable<CourseItem[]> {
    return this.http.get<CourseItem[]>(`${this.baseUrl}/status/${status}`);
  }

  createCourse(payload: CreateCoursePayload): Observable<CourseItem> {
    return this.http.post<CourseItem>(this.baseUrl, payload);
  }

  updateCourse(courseId: string, payload: CreateCoursePayload): Observable<CourseItem> {
    return this.http.put<CourseItem>(`${this.baseUrl}/${courseId}`, payload);
  }

  submitCourseForApproval(courseId: string): Observable<CourseItem> {
    return this.http.patch<CourseItem>(
      `${this.baseUrl}/${courseId}/submit-for-approval`,
      {}
    );
  }

  reviewCourse(courseId: string, action: 'APPROVE' | 'REJECT'): Observable<CourseItem> {
    return this.http.patch<CourseItem>(
      `${this.baseUrl}/${courseId}/review`,
      { action }
    );
  }
}
