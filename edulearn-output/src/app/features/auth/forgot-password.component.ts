import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  isSubmitting = signal(false);
  apiError = signal('');
  successMessage = signal('');
  form!: FormGroup;

  emailError = computed(() => {
    const control = this.form?.get('email');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Email is required';
    if (control.errors['email']) return 'Enter a valid email address';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(): void {
    this.apiError.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.successMessage.set(res.message || 'Password reset link sent to your email');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.apiError.set(
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Failed to send reset email'
        );
      }
    });
  }
}