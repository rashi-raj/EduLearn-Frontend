import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LessonItem, CreateLessonPayload } from '../models/lesson.models';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/lessons`;

  getLessonsByCourse(courseId: string): Observable<LessonItem[]> {
    return this.http.get<LessonItem[]>(`${this.baseUrl}/course/${courseId}`);
  }

  createLesson(payload: CreateLessonPayload): Observable<LessonItem> {
    return this.http.post<LessonItem>(this.baseUrl, payload);
  }
}
