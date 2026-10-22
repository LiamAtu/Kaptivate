import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent
  ]
})
export class LoginPage {

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  infoMessage = '';

  async login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password,
        this.route.snapshot.queryParamMap.get('returnUrl') ?? undefined);
    } catch (error: any) {
      this.loading = false;
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          this.errorMessage = 'Incorrect email or password.';
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Too many attempts. Please try again later.';
          break;
        default:
          this.errorMessage = 'Something went wrong. Please try again.';
      }
    }
  }

  async forgotPassword() {
    this.errorMessage = '';
    this.infoMessage = '';
    if (!this.email) {
      this.errorMessage = 'Enter your email above, then click "Forgot password?" again.';
      return;
    }
    try {
      await this.authService.resetPassword(this.email);
    } catch {
      // Ignored: the same message is shown either way, so the form doesn't reveal which emails have accounts
    }
    this.infoMessage = 'If that email has an account, a password reset link is on its way.';
  }
}
