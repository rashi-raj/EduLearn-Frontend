import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-instructor-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-analytics.component.html',
  styleUrl: './instructor-analytics.component.css'
})
export class InstructorAnalyticsComponent {
  stats = signal([
    { title: 'Published Courses', value: '12' },
    { title: 'Active Learners', value: '1284' },
    { title: 'Completion Rate', value: '74%' },
    { title: 'Quiz Avg', value: '81%' }
  ]);

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}