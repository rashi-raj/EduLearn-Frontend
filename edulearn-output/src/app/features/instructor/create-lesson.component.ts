import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CourseItem, DashboardService } from '../../core/services/dashboard.service';
import { LessonService } from '../../core/services/lesson.service';

@Component({
  selector: 'app-create-lesson',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-lesson.component.html',
  styleUrls: ['./create-lesson.component.css']
})
export class CreateLessonComponent implements OnInit {
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
    if (control.errors['required']) return 'Lesson title is required';
    return '';
  });

  contentUrlError = computed(() => {
    const control = this.form?.get('contentUrl');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'YouTube video URL is required';
    return '';
  });

  durationError = computed(() => {
    const control = this.form?.get('durationMinutes');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Duration is required';
    if (control.errors['min']) return 'Duration cannot be negative';
    return '';
  });

  orderError = computed(() => {
    const control = this.form?.get('orderIndex');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Lesson order is required';
    if (control.errors['min']) return 'Lesson order must be 0 or greater';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private lessonService: LessonService
  ) {
    this.form = this.fb.group({
      courseId: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      contentType: ['VIDEO', Validators.required],
      contentUrl: ['', [Validators.required, Validators.maxLength(1000)]],
      durationMinutes: [0, [Validators.required, Validators.min(0)]],
      orderIndex: [0, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.maxLength(2000)]],
      isPreview: [false, Validators.required]
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const instructorId = user?.userId || '';

    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.loadInstructorCourses(instructorId);
  }

  loadInstructorCourses(instructorId: string): void {
    this.isLoadingCourses.set(true);

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
          'Unable to load instructor courses.'
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

  console.log('Create lesson payload:', payload);

  this.isSubmitting.set(true);

  this.lessonService.createLesson(payload).subscribe({
    next: () => {
      this.isSubmitting.set(false);
      this.successMessage.set('Lesson created successfully.');

      setTimeout(() => {
        this.router.navigateByUrl('/instructor/lessons');
      }, 800);
    },
    error: (err) => {
      this.isSubmitting.set(false);
      this.errorMessage.set(
        err?.error?.message ||
        err?.message ||
        'Failed to create lesson.'
      );
    }
  });
}

  goBack(): void {
    this.router.navigateByUrl('/instructor/lessons');
  }

  fillSampleVideo(): void {
    this.form.patchValue({
      contentUrl: 'https://www.youtube.com/watch?v=Hq3m4i58f6k'
    });
  }
}