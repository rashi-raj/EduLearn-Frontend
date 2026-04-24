export interface PaymentItem {
  paymentId?: string;
  courseId?: string;
  studentId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  receipt?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt?: string;
  paidAt?: string;
}

export interface CreatePaymentOrderPayload {
  courseId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseTitle?: string;
  amount: number;
  paymentMethod: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
