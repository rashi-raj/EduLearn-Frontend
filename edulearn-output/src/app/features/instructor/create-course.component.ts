import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  isEditMode = signal(false);
  courseId = signal('');

  validityOptions = [
    { label: '1 Month', value: 1 },
    { label: '3 Months', value: 3 },
    { label: '6 Months', value: 6 },
    { label: '12 Months', value: 12 },
    { label: '24 Months', value: 24 }
  ];

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      level: ['', [Validators.required, Validators.maxLength(50)]],
      price: [0, [Validators.required, Validators.min(0)]],
      language: ['', [Validators.required, Validators.maxLength(50)]],
      thumbnailUrl: ['', [Validators.maxLength(500)]],
      totalDuration: [0, [Validators.min(0)]],
      validityInMonths: [12, [Validators.required, Validators.min(1), Validators.max(60)]]
    });
  }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');

    if (courseId) {
      this.isEditMode.set(true);
      this.courseId.set(courseId);
      this.loadCourse(courseId);
    }
  }

  loadCourse(courseId: string): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.dashboardService.getCourseById(courseId).subscribe({
      next: (course) => {
        this.form.patchValue({
          title: course.title ?? '',
          description: course.description ?? '',
          category: course.category ?? '',
          level: course.level ?? '',
          price: course.price ?? 0,
          language: course.language ?? '',
          thumbnailUrl: course.thumbnailUrl ?? '',
          totalDuration: course.totalDuration ?? 0,
          validityInMonths: course.validityInMonths ?? 12
        });
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Failed to load course details.'
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

    const user = this.authService.getCurrentUser();
    const instructorId = user?.userId;

    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    const payload = {
      ...this.form.getRawValue(),
      instructorId
    };

    this.isSubmitting.set(true);

    if (this.isEditMode()) {
      this.dashboardService.updateCourse(this.courseId(), payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Course draft updated successfully.');

          setTimeout(() => {
            this.router.navigateByUrl('/instructor/courses');
          }, 800);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err?.error?.message ||
            err?.error?.error ||
            'Failed to update course.'
          );
        }
      });
      return;
    }

    this.dashboardService.createCourse(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Course saved as draft successfully.');

        setTimeout(() => {
          this.router.navigateByUrl('/instructor/courses');
        }, 800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.error?.error ||
          'Failed to create course.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/instructor/courses');
  }
}