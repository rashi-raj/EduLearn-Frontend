import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  userName = signal('User');
  userEmail = signal('');
  userRole = signal<UserRole>('STUDENT');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const user = this.authService.getCurrentUser();

    if (user?.fullName) this.userName.set(user.fullName);
    if (user?.email) this.userEmail.set(user.email);
    if (user?.role) this.userRole.set(user.role as UserRole);
  }

  initials = computed(() => {
    const name = this.userName().trim();
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  });

  roleLabel = computed(() => {
    if (this.userRole() === 'ADMIN') return 'Admin';
    if (this.userRole() === 'INSTRUCTOR') return 'Instructor';
    return 'Student';
  });

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}