import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-add-question',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-question.component.html',
  styleUrls: ['./add-question.component.css']
})
export class AddQuestionComponent {
  form: FormGroup;
  quizId = '';

  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  questionError = computed(() => {
    const control = this.form.get('text');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Question text is required';
    return '';
  });

  correctOptionError = computed(() => {
    const control = this.form.get('correctOption');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Please select the correct option';
    return '';
  });

  marksError = computed(() => {
    const control = this.form.get('marks');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Marks is required';
    if (control.errors['min']) return 'Marks must be at least 1';
    return '';
  });

  orderIndexError = computed(() => {
    const control = this.form.get('orderIndex');
    if (!control || !(control.touched || control.dirty) || !control.errors) return '';
    if (control.errors['required']) return 'Question order is required';
    if (control.errors['min']) return 'Question order cannot be negative';
    return '';
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService
  ) {
    this.quizId = this.route.snapshot.paramMap.get('quizId') || '';

    this.form = this.fb.group({
      text: ['', [Validators.required, Validators.maxLength(2000)]],
      type: ['MCQ', [Validators.required, Validators.maxLength(50)]],
      optionA: ['', [Validators.maxLength(500)]],
      optionB: ['', [Validators.maxLength(500)]],
      optionC: ['', [Validators.maxLength(500)]],
      optionD: ['', [Validators.maxLength(500)]],
      correctOption: ['', Validators.required],
      marks: [1, [Validators.required, Validators.min(1)]],
      orderIndex: [0, [Validators.required, Validators.min(0)]]
    });
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.quizId) {
      this.errorMessage.set('Quiz ID not found.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const correctAnswer =
      formValue.correctOption === 'A' ? formValue.optionA :
      formValue.correctOption === 'B' ? formValue.optionB :
      formValue.correctOption === 'C' ? formValue.optionC :
      formValue.correctOption === 'D' ? formValue.optionD :
      '';

    const payload = {
      text: formValue.text,
      type: formValue.type,
      optionA: formValue.optionA || '',
      optionB: formValue.optionB || '',
      optionC: formValue.optionC || '',
      optionD: formValue.optionD || '',
      correctAnswer,
      marks: formValue.marks,
      orderIndex: formValue.orderIndex
    };

    this.isSubmitting.set(true);

    this.dashboardService.addQuestion(this.quizId, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Question added successfully.');

        setTimeout(() => {
          this.router.navigateByUrl('/instructor/quizzes');
        }, 800);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.error?.error ||
          'Failed to add question.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/instructor/quizzes');
  }
}