import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

type SignupRole = 'STUDENT' | 'INSTRUCTOR' | '';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isSubmitting = signal(false);
  apiError = signal('');
  successMessage = signal('');

  form!: FormGroup;

  fullNameError = computed(() => {
    const control = this.form?.get('fullName');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Full name is required';
    if (control.errors['minlength']) return 'Full name must be at least 3 characters';
    return '';
  });

  emailError = computed(() => {
    const control = this.form?.get('email');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Email is required';
    if (control.errors['email']) return 'Enter a valid email address';
    return '';
  });

  roleError = computed(() => {
    const control = this.form?.get('role');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Please select a role';
    return '';
  });

  mobileError = computed(() => {
    const control = this.form?.get('mobile');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Mobile number is required';
    if (control.errors['pattern']) return 'Mobile number must be exactly 10 digits';
    return '';
  });

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
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        role: ['', [Validators.required]],
        mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, role, mobile, password } = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.authService.register({
      fullName,
      email,
      role,
      mobile,
      password
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);

        this.successMessage.set(
          role === 'INSTRUCTOR'
            ? 'Registration successful. Your instructor account is pending admin approval.'
            : 'Registration successful. Please login to continue.'
        );

        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.apiError.set(
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Registration failed'
        );
      }
    });
  }

  googleLogin(): void {
    this.apiError.set('');

    const role = this.form.get('role')?.value as SignupRole;

    if (!role) {
      this.form.get('role')?.markAsTouched();
      this.apiError.set('Please select a role before continuing with Google.');
      return;
    }

    this.authService.googleSignup(role as 'STUDENT' | 'INSTRUCTOR');
  }
}