import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';

declare var YT: any;

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lesson-player.component.html',
  styleUrls: ['./lesson-player.component.css']
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
  videoId = '';
  youtubeWatchUrl = '';
  courseId = '';
  lessonId = '';
  player: any;
  lessonMarked = false;

  statusMessage = signal('');
  isSaving = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.videoId = this.route.snapshot.paramMap.get('videoId') || '';
    this.courseId = this.route.snapshot.queryParamMap.get('courseId') || '';
    this.lessonId = this.route.snapshot.queryParamMap.get('lessonId') || '';
    this.youtubeWatchUrl = `https://www.youtube.com/watch?v=${this.videoId}`;
    this.loadYoutubeApi();
  }

  ngOnDestroy(): void {
    if (this.player?.destroy) {
      this.player.destroy();
    }
  }

  loadYoutubeApi(): void {
    if ((window as any).YT && (window as any).YT.Player) {
      // API already loaded — create player immediately
      this.createPlayer();
      return;
    }

    // If another component already added the script tag, wait for callback
    if (document.getElementById('youtube-iframe-api')) {
      const existingCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (existingCallback) existingCallback();
        this.createPlayer();
      };
      return;
    }

    // First load: inject the script
    (window as any).onYouTubeIframeAPIReady = () => {
      this.createPlayer();
    };

    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  createPlayer(): void {
    if (this.player) return;

    this.player = new YT.Player('youtube-player', {
      videoId: this.videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1
      },
      events: {
        onStateChange: (event: any) => this.onPlayerStateChange(event)
      }
    });
  }

  onPlayerStateChange(event: any): void {
    // YT.PlayerState.ENDED === 0
    if (event.data === 0) {
      this.markLessonComplete();
    }
  }

  markLessonComplete(): void {
    if (this.lessonMarked) return;

    const user = this.authService.getCurrentUser();
    if (!user?.userId || !this.courseId || !this.lessonId) {
      return;
    }

    this.lessonMarked = true;
    this.isSaving.set(true);
    this.statusMessage.set('Saving your lesson progress...');

    this.dashboardService.completeLesson({
      studentId: user.userId,
      courseId: this.courseId,
      lessonId: this.lessonId
    }).subscribe({
      next: () => {
        // Persist locally so the course page reflects completion immediately
        const key = `completed_${user.userId}_${this.courseId}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(this.lessonId)) {
          existing.push(this.lessonId);
          localStorage.setItem(key, JSON.stringify(existing));
        }

        this.isSaving.set(false);
        this.statusMessage.set('✔ Lesson marked as complete! Progress saved.');
      },
      error: (err) => {
        this.lessonMarked = false;
        this.isSaving.set(false);
        this.statusMessage.set(
          err?.error?.message || err?.message || 'Could not save progress. Try again.'
        );
      }
    });
  }

  openOnYoutubeAndComplete(): void {
    // Mark the lesson complete when explicitly opening on YouTube
    // (since we can't detect playback end there)
    this.markLessonComplete();
    window.open(this.youtubeWatchUrl, '_blank');
  }

  goBack(): void {
    if (this.courseId) {
      this.router.navigateByUrl(`/student/course/${this.courseId}`);
      return;
    }
    this.router.navigateByUrl('/dashboard');
  }
}