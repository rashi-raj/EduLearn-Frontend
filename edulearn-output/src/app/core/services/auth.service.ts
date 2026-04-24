import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  StoredUser,
} from '../models/auth.models';

export type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  StoredUser,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/auth`;

  private readonly TOKEN_KEY = 'edulearn_token';
  private readonly USER_KEY = 'edulearn_user';

  login(payload: LoginRequest): Observable<AuthResponse> {
    if (environment.useMockAuth) {
      if (payload.email === 'demo@edulearn.com' && payload.password === '123456') {
        return of<AuthResponse>({
          token: 'mock-jwt-token',
          user: {
            userId: 'mock-user-id',
            email: payload.email,
            fullName: 'Demo User',
            role: 'STUDENT',
            approvalStatus: 'APPROVED',
          },
          email: payload.email,
          message: 'Login successful',
        }).pipe(
          delay(800),
          tap((res) => this.storeSession(res))
        );
      }
      return throwError(() => new Error('Invalid email or password'));
    }

    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(tap((res) => this.storeSession(res)));
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    if (environment.useMockAuth) {
      return of<AuthResponse>({
        token: '',
        user: {
          userId: 'mock-user-id',
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          approvalStatus: payload.role === 'INSTRUCTOR' ? 'PENDING' : 'APPROVED',
        },
        email: payload.email,
        message:
          payload.role === 'INSTRUCTOR'
            ? 'Registration successful. Your instructor account is pending admin approval.'
            : 'Registration successful',
      }).pipe(delay(1000));
    }

    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/reset-password`, payload);
  }

  googleLogin(role: 'STUDENT' | 'INSTRUCTOR', mode: 'login' | 'signup' = 'login'): void {
    const oauthBaseUrl =
      environment.apiBaseUrl?.startsWith('http')
        ? environment.apiBaseUrl
        : 'http://localhost:8081';

    const roleParam = encodeURIComponent(role);
    const modeParam = encodeURIComponent(mode);

    window.location.assign(
      `${oauthBaseUrl}/oauth2/authorization/google?mode=${modeParam}&role=${roleParam}`
    );
  }

  googleSignup(role: 'STUDENT' | 'INSTRUCTOR'): void {
    this.googleLogin(role, 'signup');
  }

  storeSession(response: AuthResponse): void {
    if (!response?.token || !response?.user) {
      return;
    }

    localStorage.setItem(this.TOKEN_KEY, response.token);

    const user = response.user;
    const storedUser: StoredUser = {
      userId: user?.userId ?? '',
      token: response.token ?? '',
      email: user?.email ?? response.email ?? '',
      fullName: user?.fullName ?? user?.email?.split('@')[0] ?? 'User',
      role: user?.role ?? 'STUDENT',
      approvalStatus: user?.approvalStatus ?? 'APPROVED',
    };

    localStorage.setItem(this.USER_KEY, JSON.stringify(storedUser));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return (
      !!localStorage.getItem(this.TOKEN_KEY) &&
      !!localStorage.getItem(this.USER_KEY)
    );
  }

  getCurrentUser(): StoredUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  }
}