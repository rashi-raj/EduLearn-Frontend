import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-discussions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './discussions.component.html',
  styleUrl: './discussions.component.css'
})
export class DiscussionsComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }
}