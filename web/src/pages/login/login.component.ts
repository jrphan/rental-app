import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@/services/auth.service';
import { ButtonComponent } from '@/components/button/button.component';
import { InputComponent } from '@/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loginForm: FormGroup;
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  getEmailError(): string {
    const control = this.loginForm.get('email');
    if (!control) return '';
    if (control.touched && control.invalid) {
      return 'Email không hợp lệ';
    }
    return '';
  }
  getPasswordError(): string {
    const control = this.loginForm.get('password');
    if (!control) return '';
    if (control.touched && control.invalid) {
      return 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    return '';
  }

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    // no extra signals needed for errors; we'll compute errors via methods on CD
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        console.error('Login error:', err);
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((prev) => !prev);
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
