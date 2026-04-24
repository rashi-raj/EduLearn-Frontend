import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('edulearn_token');
  const user = authService.getCurrentUser();

  if (!token || !user) {
    localStorage.removeItem('edulearn_token');
    localStorage.removeItem('edulearn_user');
    return router.createUrlTree(['/login']);
  }

  return true;
};