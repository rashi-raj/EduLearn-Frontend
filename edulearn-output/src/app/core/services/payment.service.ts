import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentItem,
  CreatePaymentOrderPayload,
  VerifyPaymentPayload,
} from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/payments`;

  getStudentPayments(studentId: string): Observable<PaymentItem[]> {
    return this.http.get<PaymentItem[]>(`${this.baseUrl}/student/${studentId}`);
  }

  createPaymentOrder(payload: CreatePaymentOrderPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/create-order`, payload);
  }

  verifyPayment(payload: VerifyPaymentPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/verify`, payload);
  }

  hasPaid(studentId: string, courseId: string): Observable<{ paid: boolean }> {
    return this.http.get<{ paid: boolean }>(`${this.baseUrl}/status`, {
      params: { studentId, courseId },
    });
  }
}
