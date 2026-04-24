import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CourseItem, DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-create-quiz',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css']
})
export class CreateQuizComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = signal(false);
  isLoadingCourses = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  courses = signal<CourseItem[]>([]);

  courseError = computed(() => {
    const control = this.form?.get('courseId');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Please select a course';
    return '';
  });

  titleError = computed(() => {
    const control = this.form?.get('title');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Quiz title is required';
    return '';
  });

  descriptionError = computed(() => {
    const control = this.form?.get('description');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Description is required';
    return '';
  });

  passingScoreError = computed(() => {
    const control = this.form?.get('passingScore');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Passing score is required';
    if (control.errors['min']) return 'Passing score cannot be negative';
    if (control.errors['max']) return 'Passing score cannot exceed 100';
    return '';
  });

  timeLimitError = computed(() => {
    const control = this.form?.get('timeLimitMinutes');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Time limit is required';
    if (control.errors['min']) return 'Time limit cannot be less than 1 minute';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      courseId: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      passingScore: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      timeLimitMinutes: [20, [Validators.required, Validators.min(1)]],
      maxAttempts: [3, [Validators.required, Validators.min(1)]]
    });
  }

  maxAttemptsError = computed(() => {
    const control = this.form?.get('maxAttempts');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Maximum attempts is required';
    if (control.errors['min']) return 'Maximum attempts must be at least 1';
    return '';
  });

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    const instructorId = currentUser?.userId || '';

    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.loadInstructorCourses(instructorId);
  }

  loadInstructorCourses(instructorId: string): void {
    this.isLoadingCourses.set(true);
    this.errorMessage.set('');

    this.dashboardService.getInstructorCourses(instructorId).subscribe({
      next: (res) => {
        this.courses.set(res || []);
        this.isLoadingCourses.set(false);
      },
      error: (err) => {
        this.isLoadingCourses.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load your courses.'
        );
      }
    });
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.dashboardService.createQuiz(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Quiz created successfully.');

        setTimeout(() => {
          this.router.navigateByUrl('/instructor/quizzes');
        }, 800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.error?.error ||
          'Failed to create quiz.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/instructor/quizzes');
  }
}