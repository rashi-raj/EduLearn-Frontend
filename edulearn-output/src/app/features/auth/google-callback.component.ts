import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-google-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8f5f0;">
      <div style="background:white;padding:24px 32px;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.08);max-width:460px;text-align:center;">
        <h2 style="margin:0 0 10px;">Signing you in...</h2>
        <p style="margin:0;color:#666;">Please wait while we complete Google login.</p>
      </div>
    </div>
  `
})
export class GoogleCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const email = this.route.snapshot.queryParamMap.get('email');
    const fullName = this.route.snapshot.queryParamMap.get('fullName');
    const role = this.route.snapshot.queryParamMap.get('role') as UserRole | null;
    const approvalStatus =
      (this.route.snapshot.queryParamMap.get('approvalStatus') as ApprovalStatus | null) ?? 'APPROVED';
    const error = this.route.snapshot.queryParamMap.get('error');

    if (error) {
      this.clearAuth();
      this.router.navigate(['/login'], {
        queryParams: { error }
      });
      return;
    }

    if (!email || !userId || !role) {
      this.clearAuth();
      this.router.navigate(['/login'], {
        queryParams: { error: 'Google authentication failed. Please try again.' }
      });
      return;
    }

    if (role === 'INSTRUCTOR' && approvalStatus !== 'APPROVED') {
      this.clearAuth();
      this.router.navigate(['/login'], {
        queryParams: {
          error:
            approvalStatus === 'REJECTED'
              ? 'Your instructor account has been rejected by admin.'
              : 'Your instructor account is pending admin approval.'
        }
      });
      return;
    }

    if (!token) {
      this.clearAuth();
      this.router.navigate(['/login'], {
        queryParams: { error: 'Google authentication failed. Please try again.' }
      });
      return;
    }

    const user = {
      userId,
      email,
      fullName: fullName ?? email.split('@')[0],
      role,
      approvalStatus,
      message: 'Google login successful',
      token
    };

    localStorage.setItem('edulearn_token', token);
    localStorage.setItem('edulearn_user', JSON.stringify(user));

    this.router.navigate(['/dashboard']);
  }

  private clearAuth(): void {
    localStorage.removeItem('edulearn_token');
    localStorage.removeItem('edulearn_user');
  }
}