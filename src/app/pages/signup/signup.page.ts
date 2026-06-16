import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent
  ]
})
export class SignupPage {

  private authService = inject(AuthService);

  displayName = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';

  async signUp() {
    if (!this.displayName || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.signUp(this.email, this.password, this.displayName);
    } catch (error: any) {
      this.loading = false;
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'Password must be at least 6 characters.';
          break;
        default:
          this.errorMessage = 'Something went wrong. Please try again.';
      }
    }
  }
}