export interface CourseItem {
  courseId?: string;
  title?: string;
  description?: string;
  category?: string;
  level?: string;
  price?: number;
  instructorId?: string;
  instructorName?: string;
  thumbnailUrl?: string;
  totalDuration?: number;
  isPublished?: boolean;
  createdAt?: string;
  language?: string;
  validityInMonths?: number;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED';
}

export interface CreateCoursePayload {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  instructorId: string;
  thumbnailUrl?: string;
  totalDuration?: number;
  language: string;
  validityInMonths: number;
}
