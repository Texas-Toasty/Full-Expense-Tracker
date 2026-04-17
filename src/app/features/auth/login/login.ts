import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = false;
  errorMessage = '';
  hidePassword = true;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    try {
      const { email, password } = this.form.value;
      await this.authService.login(email!, password!);
    } catch (e: any) {
      this.errorMessage = 'Invalid email or password. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
