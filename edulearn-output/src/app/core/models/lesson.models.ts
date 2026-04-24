export interface LessonItem {
  lessonId?: string;
  courseId?: string;
  title?: string;
  contentType?: string;
  contentUrl?: string;
  durationMinutes?: number;
  orderIndex?: number;
  description?: string;
  isPreview?: boolean;
}

export interface CreateLessonPayload {
  courseId: string;
  title: string;
  contentType: string;
  contentUrl: string;
  durationMinutes: number;
  orderIndex: number;
  description?: string;
  isPreview: boolean;
}
