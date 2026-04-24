import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  isSubmitting = signal(false);
  apiError = signal('');
  successMessage = signal('');
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  token = '';
  form!: FormGroup;

  passwordError = computed(() => {
    const control = this.form?.get('password');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Password is required';
    if (control.errors['minlength']) return 'Password must be at least 8 characters';
    if (control.errors['pattern']) return 'Password must contain at least one letter and one number';
    return '';
  });

  confirmPasswordError = computed(() => {
    const control = this.form?.get('confirmPassword');
    if ((!control?.touched && !this.form?.touched) || (!control?.errors && !this.form?.errors)) return '';
    if (control?.errors?.['required']) return 'Please confirm your password';
    if (this.form?.errors?.['passwordMismatch']) return 'Passwords do not match';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    this.form = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
          ]
        ],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.hideConfirmPassword.update(v => !v);
  }

  submit(): void {
    this.apiError.set('');
    this.successMessage.set('');

    if (!this.token) {
      this.apiError.set('Invalid or missing reset token');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.resetPassword({
      token: this.token,
      newPassword: this.form.getRawValue().password
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.message || 'Password reset successful');
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.apiError.set(
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to reset password'
        );
      }
    });
  }
}