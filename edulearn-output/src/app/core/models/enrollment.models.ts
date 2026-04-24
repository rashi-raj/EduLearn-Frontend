export interface EnrollmentItem {
  enrollmentId?: string;
  courseId?: string;
  studentId?: string;

  studentName?: string;
  studentEmail?: string;

  progressPercent?: number;
  status?: string;
  certificateIssued?: boolean;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  enrolledAt?: string;
  completedAt?: string;
  expiresAt?: string;
  accessExpired?: boolean;
}

export interface ProgressItem {
  courseId?: string;
  studentId?: string;
  completedLessons?: number;
  totalLessons?: number;
  progressPercent?: number;
  certificateEligible?: boolean;
}

export interface CertificateItem {
  certificateId?: string;
  studentId?: string;
  courseId?: string;
  certificateUrl?: string;
  issuedAt?: string;
  eligible?: boolean;
}

export interface EnrollCoursePayload {
  courseId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
}

export interface CompleteLessonPayload {
  studentId: string;
  courseId: string;
  lessonId: string;
}