import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(expectedRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getCurrentUser();

    if (!user || user.role !== expectedRole) {
      return router.createUrlTree(['/dashboard']);
    }

    return true;
  };
}