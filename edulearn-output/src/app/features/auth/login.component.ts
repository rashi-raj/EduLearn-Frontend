import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type GoogleRole = 'STUDENT' | 'INSTRUCTOR';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  hidePassword = signal(true);
  isSubmitting = signal(false);
  apiError = signal('');
  successMessage = signal('');
  showGoogleRolePopup = signal(false);

  form!: FormGroup;

  emailError = computed(() => {
    const control = this.form?.get('email');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Email is required';
    if (control.errors['email']) return 'Enter a valid email address';
    return '';
  });

  passwordError = computed(() => {
    const control = this.form?.get('password');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Password is required';
    if (control.errors['minlength']) return 'Password must be at least 6 characters';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    const currentUser = this.authService.getCurrentUser();
    const currentToken = localStorage.getItem('edulearn_token');

    if (
      currentToken &&
      currentUser &&
      !this.isBlockedInstructor(currentUser.role, currentUser.approvalStatus)
    ) {
      this.router.navigateByUrl('/dashboard');
      return;
    }

    const error = this.route.snapshot.queryParamMap.get('error');
    if (error) {
      this.apiError.set(error);
    }
  }

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  openGoogleRolePopup(): void {
    this.apiError.set('');
    this.showGoogleRolePopup.set(true);
  }

  closeGoogleRolePopup(): void {
    this.showGoogleRolePopup.set(false);
  }

  continueGoogleLogin(role: GoogleRole): void {
    this.apiError.set('');
    this.showGoogleRolePopup.set(false);
    this.authService.googleLogin(role, 'login');
  }

  submit(): void {
    this.apiError.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);

        const role = res?.user?.role ?? res?.role;
        const approvalStatus: ApprovalStatus =
          res?.user?.approvalStatus ?? res?.approvalStatus ?? 'APPROVED';

        if (this.isBlockedInstructor(role, approvalStatus)) {
          localStorage.removeItem('edulearn_token');
          localStorage.removeItem('edulearn_user');

          this.apiError.set(
            approvalStatus === 'REJECTED'
              ? 'Your instructor account has been rejected by admin.'
              : 'Your instructor account is pending admin approval.'
          );
          return;
        }

        this.successMessage.set('Login successful');

        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
        setTimeout(() => this.router.navigateByUrl(redirectTo || '/dashboard'), 500);
      },
      error: (err) => {
        this.isSubmitting.set(false);

        const role = err?.error?.role;
        const approvalStatus: ApprovalStatus | undefined = err?.error?.approvalStatus;

        if (this.isBlockedInstructor(role, approvalStatus)) {
          this.apiError.set(
            approvalStatus === 'REJECTED'
              ? 'Your instructor account has been rejected by admin.'
              : 'Your instructor account is pending admin approval.'
          );
          return;
        }

        this.apiError.set(
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Login failed'
        );
      }
    });
  }

  private isBlockedInstructor(role?: string, approvalStatus?: string): boolean {
    return role === 'INSTRUCTOR' && approvalStatus !== 'APPROVED';
  }
}