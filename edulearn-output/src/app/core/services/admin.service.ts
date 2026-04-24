import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  provider?: string;
  mobile?: string;
  createdAt?: string;
}

export interface AdminPaymentItem {
  paymentId?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  courseId?: string;
  courseTitle?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  receipt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt?: string;
  paidAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/admin`;

  getPendingInstructors(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.baseUrl}/users/pending-instructors`);
  }

  getApprovedInstructors(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.baseUrl}/users/approved-instructors`);
  }

  getRejectedInstructors(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.baseUrl}/users/rejected-instructors`);
  }

  getAllUsers(): Observable<AdminUserItem[]> {
    return this.http.get<AdminUserItem[]>(`${this.baseUrl}/users/all`);
  }

  getAllPayments(): Observable<AdminPaymentItem[]> {
    return this.http.get<AdminPaymentItem[]>(`${this.baseUrl}/payments/all`);
  }

  approveInstructor(userId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/users/${userId}/approve`, {});
  }

  rejectInstructor(userId: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/users/${userId}/reject`, {});
  }
}