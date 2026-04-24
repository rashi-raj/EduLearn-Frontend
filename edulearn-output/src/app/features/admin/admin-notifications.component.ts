import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.css'
})
export class AdminNotificationsComponent {
  notifications = signal([
    { title: 'Instructor approval pending', detail: '1 instructor is waiting for approval.' },
    { title: 'Refund request created', detail: 'A learner refund request needs review.' },
    { title: 'Course draft submitted', detail: 'A new instructor course is ready for review.' }
  ]);

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}