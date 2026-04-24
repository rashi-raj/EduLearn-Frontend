import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, AdminUserItem } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');
  users = signal<AdminUserItem[]>([]);

  totalStudents = computed(() => this.users().filter(u => u.role === 'STUDENT').length);
  totalInstructors = computed(() => this.users().filter(u => u.role === 'INSTRUCTOR').length);
  approvedInstructors = computed(() =>
    this.users().filter(u => u.role === 'INSTRUCTOR' && u.approvalStatus === 'APPROVED').length
  );
  pendingInstructors = computed(() =>
    this.users().filter(u => u.role === 'INSTRUCTOR' && u.approvalStatus === 'PENDING').length
  );

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.users.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to load users.'
        );
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}