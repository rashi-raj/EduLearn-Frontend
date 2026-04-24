import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService, CourseItem } from '../../core/services/dashboard.service';

type CourseApprovalTab = 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';

interface CourseCardView {
  courseId: string;
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  price: number;
  instructorId: string;
  totalDuration: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-course-approvals',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-course-approvals.component.html',
  styleUrl: './admin-course-approvals.component.css'
})
export class AdminCourseApprovalsComponent implements OnInit {
  isLoading = signal(false);
  actionLoadingCourseId = signal<string | null>(null);
  errorMessage = signal('');
  successMessage = signal('');
  activeTab = signal<CourseApprovalTab>('PENDING_APPROVAL');

  pendingCourses = signal<CourseItem[]>([]);
  approvedCourses = signal<CourseItem[]>([]);
  rejectedCourses = signal<CourseItem[]>([]);

  displayedCourses = computed<CourseItem[]>(() => {
    switch (this.activeTab()) {
      case 'PUBLISHED':
        return this.approvedCourses();
      case 'REJECTED':
        return this.rejectedCourses();
      default:
        return this.pendingCourses();
    }
  });

  displayedCourseCards = computed<CourseCardView[]>(() => {
    return this.displayedCourses().map(course => ({
      courseId: course.courseId || '',
      title: course.title || 'Untitled Course',
      description: course.description || 'No description available.',
      category: course.category || 'General',
      level: course.level || 'Not specified',
      language: course.language || 'Not specified',
      price: Number(course.price ?? 0),
      instructorId: course.instructorId || '',
      totalDuration: Number(course.totalDuration ?? 0),
      status: this.resolveStatus(course),
      createdAt: course.createdAt || ''
    }));
  });

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllCourseBuckets();
  }

  setTab(tab: CourseApprovalTab): void {
    this.activeTab.set(tab);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  resolveStatus(course: CourseItem): string {
    if (course.status === 'PENDING_APPROVAL') return 'Pending Approval';
    if (course.status === 'PUBLISHED') return 'Approved';
    if (course.status === 'REJECTED') return 'Rejected';
    return course.isPublished ? 'Approved' : 'Draft';
  }

  loadAllCourseBuckets(): void {
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

    this.dashboardService.getCoursesByStatus('PENDING_APPROVAL').subscribe({
      next: (res) => {
        this.pendingCourses.set(res || []);
        pendingLoaded = true;
        finish();
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to load course approvals.'
        );
        this.isLoading.set(false);
      }
    });

    this.dashboardService.getCoursesByStatus('PUBLISHED').subscribe({
      next: (res) => {
        this.approvedCourses.set(res || []);
        approvedLoaded = true;
        finish();
      },
      error: () => {
        approvedLoaded = true;
        finish();
      }
    });

    this.dashboardService.getCoursesByStatus('REJECTED').subscribe({
      next: (res) => {
        this.rejectedCourses.set(res || []);
        rejectedLoaded = true;
        finish();
      },
      error: () => {
        rejectedLoaded = true;
        finish();
      }
    });
  }

  approveCourse(courseId: string): void {
    if (!courseId) return;

    this.actionLoadingCourseId.set(courseId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardService.reviewCourse(courseId, 'APPROVE').subscribe({
      next: () => {
        this.actionLoadingCourseId.set(null);
        this.successMessage.set('Course approved and published successfully.');
        this.loadAllCourseBuckets();
        this.activeTab.set('PUBLISHED');
      },
      error: (err) => {
        this.actionLoadingCourseId.set(null);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to approve course.'
        );
      }
    });
  }

  rejectCourse(courseId: string): void {
    if (!courseId) return;

    this.actionLoadingCourseId.set(courseId);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.dashboardService.reviewCourse(courseId, 'REJECT').subscribe({
      next: () => {
        this.actionLoadingCourseId.set(null);
        this.successMessage.set('Course rejected successfully.');
        this.loadAllCourseBuckets();
        this.activeTab.set('REJECTED');
      },
      error: (err) => {
        this.actionLoadingCourseId.set(null);
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to reject course.'
        );
      }
    });
  }

  formatDuration(totalMinutes: number): string {
    if (!totalMinutes || totalMinutes <= 0) return 'Not specified';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  }

  formatDate(dateValue: string): string {
    if (!dateValue) return 'Not available';

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Not available';

    return date.toLocaleDateString();
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}