import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { DashboardService } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css'
})
export class AdminAnalyticsComponent implements OnInit {
  stats = signal([
    { title: 'Active Learners', value: '0' },
    { title: 'Published Courses', value: '0' },
    { title: 'Pending Instructors', value: '0' },
    { title: 'Pending Courses', value: '0' }
  ]);

  constructor(
    private router: Router,
    private adminService: AdminService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    forkJoin({
      users: this.adminService.getAllUsers(),
      pendingInstructors: this.adminService.getPendingInstructors(),
      publishedCourses: this.dashboardService.getCoursesByStatus('PUBLISHED'),
      pendingCourses: this.dashboardService.getCoursesByStatus('PENDING_APPROVAL')
    }).subscribe({
      next: ({ users, pendingInstructors, publishedCourses, pendingCourses }) => {
        const activeLearners = (users || []).filter(user => user.role === 'STUDENT').length;

        this.stats.set([
          { title: 'Active Learners', value: String(activeLearners) },
          { title: 'Published Courses', value: String((publishedCourses || []).length) },
          { title: 'Pending Instructors', value: String((pendingInstructors || []).length) },
          { title: 'Pending Courses', value: String((pendingCourses || []).length) }
        ]);
      },
      error: () => {
        this.stats.set([
          { title: 'Active Learners', value: '0' },
          { title: 'Published Courses', value: '0' },
          { title: 'Pending Instructors', value: '0' },
          { title: 'Pending Courses', value: '0' }
        ]);
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}