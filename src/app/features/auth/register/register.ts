import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth';

// Custom validator to confirm passwords match
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
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
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirm = true;

  form = this.fb.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    try {
      const { email, password, displayName } = this.form.value;
      await this.authService.register(email!, password!, displayName!);
    } catch (e: any) {
      this.errorMessage = 'Registration failed. This email may already be in use.';
    } finally {
      this.loading = false;
    }
  }
}
