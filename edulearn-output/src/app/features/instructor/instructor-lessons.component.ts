import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  CourseItem,
  DashboardService,
  LessonItem
} from '../../core/services/dashboard.service';

interface CourseLessonsCard {
  courseTitle: string;
  category: string;
  lessons: {
    title: string;
    description: string;
    duration: string;
    order: number;
    isPreview: boolean;
    contentUrl: string;
  }[];
}

@Component({
  selector: 'app-instructor-lessons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-lessons.component.html',
  styleUrls: ['./instructor-lessons.component.css']
})
export class InstructorLessonsComponent implements OnInit {
  isLoading = signal(false);
  errorMessage = signal('');
  userName = signal('Instructor');

  courses = signal<CourseItem[]>([]);
  lessons = signal<LessonItem[]>([]);

  courseLessonCards = computed<CourseLessonsCard[]>(() => {
    return this.courses().map(course => {
      const courseLessons = this.lessons()
        .filter(lesson => String(lesson.courseId) === String(course.courseId))
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      return {
        courseTitle: course.title || 'Untitled Course',
        category: course.category || 'General',
        lessons: courseLessons.map(lesson => ({
          title: lesson.title || 'Untitled Lesson',
          description: lesson.description || 'No description available.',
          duration: lesson.durationMinutes ? `${lesson.durationMinutes} mins` : '--',
          order: lesson.orderIndex ?? 0,
          isPreview: lesson.isPreview ?? false,
          contentUrl: lesson.contentUrl || ''
        }))
      };
    });
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.fullName) {
      this.userName.set(currentUser.fullName);
    }

    const instructorId = currentUser?.userId || '';
    if (!instructorId) {
      this.errorMessage.set('Instructor ID not found. Please login again.');
      return;
    }

    this.loadLessons(instructorId);
  }

  loadLessons(instructorId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardService.getInstructorLessonsPageData(instructorId).subscribe({
      next: (res) => {
        this.courses.set(res.courses || []);

        this.dashboardService.getLessonsForCourses(res.courses || []).subscribe({
          next: (lessonRes) => {
            this.lessons.set(lessonRes || []);
            this.isLoading.set(false);
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              err?.error?.message ||
              err?.message ||
              'Unable to load lessons right now.'
            );
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ||
          err?.message ||
          'Unable to load instructor lessons page.'
        );
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  addLesson(): void {
    this.router.navigateByUrl('/instructor/create-lesson');
  }

  getThumbnail(url: string): string {
    if (!url) return '';

    const match = url.match(/[?&]v=([^&]+)/);
    const videoId = match ? match[1] : '';

    return videoId
      ? `https://img.youtube.com/vi/${videoId}/0.jpg`
      : '';
  }

  openLessonVideo(url: string): void {
    if (!url) return;

    const videoId = this.extractVideoId(url);
    if (!videoId) return;

    this.router.navigateByUrl(`/lesson-player/${videoId}`);
  }

  extractVideoId(url: string): string {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : '';
  }
}