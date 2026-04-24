import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminPaymentItem, AdminService } from '../../core/services/admin.service';

interface PaymentCard {
  paymentId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  amount: string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  paidAt: string;
  receipt: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
}

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-payments.component.html',
  styleUrl: './admin-payments.component.css'
})
export class AdminPaymentsComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');
  payments = signal<AdminPaymentItem[]>([]);

  totalRevenue = computed(() => {
    return this.payments()
      .filter(payment => payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  });

  paidCount = computed(() =>
    this.payments().filter(payment => payment.paymentStatus === 'SUCCESS' || payment.paymentStatus === 'PAID').length
  );

  pendingCount = computed(() =>
    this.payments().filter(payment => payment.paymentStatus === 'PENDING').length
  );

  paymentCards = computed<PaymentCard[]>(() => {
    return this.payments().map((payment) => ({
      paymentId: String(payment.paymentId || ''),
      studentName: payment.studentName || 'Student',
      studentEmail: payment.studentEmail || 'Not available',
      courseTitle: payment.courseTitle || 'Course',
      amount: payment.amount !== undefined ? `${payment.amount}` : '0',
      currency: payment.currency || 'INR',
      paymentMethod: payment.paymentMethod || 'RAZORPAY',
      paymentStatus: payment.paymentStatus || 'UNKNOWN',
      createdAt: payment.createdAt
        ? new Date(payment.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '--',
      paidAt: payment.paidAt
        ? new Date(payment.paidAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '--',
      receipt: payment.receipt || '--',
      razorpayPaymentId: payment.razorpayPaymentId || '--',
      razorpayOrderId: payment.razorpayOrderId || '--'
    }));
  });

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getAllPayments().subscribe({
      next: (res) => {
        this.payments.set(res || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || err?.message || 'Failed to load admin payment records.'
        );
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}