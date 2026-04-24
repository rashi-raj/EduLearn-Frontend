import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, AdminUserItem } from '../../core/services/admin.service';

type ApprovalTab = 'PENDING' | 'APPROVED' | 'REJECTED';

@Component({
  selector: 'app-admin-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-approvals.component.html',
  styleUrl: './admin-approvals.component.css',
})
export class AdminApprovalsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  activeTab = signal<ApprovalTab>('PENDING');

  pendingInstructors = signal<AdminUserItem[]>([]);
  approvedInstructors = signal<AdminUserItem[]>([]);
  rejectedInstructors = signal<AdminUserItem[]>([]);

  isLoading = signal(false);
  actionLoadingUserId = signal<string | null>(null);
  errorMessage = signal('');
  successMessage = signal('');

  displayedUsers = computed(() => {
    switch (this.activeTab()) {
      case 'APPROVED':
        return this.approvedInstructors();
      case 'REJECTED':
        return this.rejectedInstructors();
      default:
        return this.pendingInstructors();
    }
  });

  ngOnInit(): void {
    this.loadAllInstructorBuckets();
  }

  setTab(tab: ApprovalTab): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  loadAllInstructorBuckets(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    let pendingLoaded = false;
    let approvedLoaded = false;
    let rejectedLoaded = false;

    const finish = () => {
      if (pendingLoaded && approvedLoaded && rejectedLoaded) {
        this.isLoading.set(false);
      }
    };

    this.adminService.getPendingInstructors().subscribe({
      next: (res) => {
        this.pendingInstructors.set(res || []);
        pendingLoaded = true;
        finish();
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'Failed to load instructor approvals.'
        );
        pendingLoaded = true;
        approvedLoaded = true;
        rejectedLoaded = true;
        this.isLoading.set(false);
      },
    });

    this.adminService.getApprovedInstructors().subscribe({
      next: (res) => {
        this.approvedInstructors.set(res || []);
        approvedLoaded = true;
        finish();
      },
      error: () => {
        approvedLoaded = true;
        finish();
      },
    });

    this.adminService.getRejectedInstructors().subscribe({
      next: (res) => {
        this.rejectedInstructors.set(res || []);
        rejectedLoaded = true;
        finish();
      },
      error: () => {
        rejectedLoaded = true;
        finish();
      },
    });
  }

  approve(userId: string): void {
    this.actionLoadingUserId.set(userId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService.approveInstructor(userId).subscribe({
      next: () => {
        this.successMessage.set('Instructor approved successfully.');
        this.actionLoadingUserId.set(null);
        this.loadAllInstructorBuckets();
        this.activeTab.set('APPROVED');
      },
      error: (err) => {
        this.actionLoadingUserId.set(null);
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'Failed to approve instructor.'
        );
      },
    });
  }

  reject(userId: string): void {
    this.actionLoadingUserId.set(userId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService.rejectInstructor(userId).subscribe({
      next: () => {
        this.successMessage.set('Instructor rejected successfully.');
        this.actionLoadingUserId.set(null);
        this.loadAllInstructorBuckets();
        this.activeTab.set('REJECTED');
      },
      error: (err) => {
        this.actionLoadingUserId.set(null);
        this.errorMessage.set(
          err?.error?.message ?? err?.message ?? 'Failed to reject instructor.'
        );
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}