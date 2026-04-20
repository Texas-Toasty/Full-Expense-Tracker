import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import {
  Auth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from '@angular/fire/auth';
import { AuthService } from '../../services/auth';
import { TransactionService } from '../../services/transaction';
import { Transaction } from '../../models/transaction.model';
import { UserProfile } from '../../models/user.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  passwordLoading = signal(false);
  transactions = signal<Transaction[]>([]);
  hideCurrentPassword = true;
  hideNewPassword = true;

  // Profile form
  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    monthlyBudgetGoal: [0, [Validators.required, Validators.min(0)]],
  });

  // Password form
  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Computed stats
  get totalIncome(): number {
    return this.transactions()
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
  }

  get totalExpenses(): number {
    return this.transactions()
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
  }

  get totalTransactions(): number {
    return this.transactions().length;
  }

  get netSavings(): number {
    return this.totalIncome - this.totalExpenses;
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        displayName: user.displayName,
        monthlyBudgetGoal: user.monthlyBudgetGoal,
      });

      this.transactionService.getTransactions(user.uid).subscribe((data) => {
        this.transactions.set(data);
      });
    }
  }

  async saveProfile() {
    if (this.profileForm.invalid) return;
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.loading.set(true);
    try {
      const updated: Partial<UserProfile> = {
        displayName: this.profileForm.value.displayName!,
        monthlyBudgetGoal: this.profileForm.value.monthlyBudgetGoal!,
      };
      await updateDoc(doc(this.firestore, 'users', uid), updated as any);

      // Update the signal so navbar name updates instantly
      const current = this.authService.currentUser()!;
      this.authService.currentUser.set({ ...current, ...updated });

      this.snackBar.open('Profile updated!', 'OK', { duration: 3000 });
    } catch (e) {
      console.error(e);
      this.snackBar.open('Failed to update profile.', 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async changePassword() {
    if (this.passwordForm.invalid) return;
    const user = this.auth.currentUser;
    if (!user || !user.email) return;

    this.passwordLoading.set(true);
    try {
      // Re-authenticate first for security
      const credential = EmailAuthProvider.credential(
        user.email,
        this.passwordForm.value.currentPassword!,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, this.passwordForm.value.newPassword!);

      this.passwordForm.reset();
      this.snackBar.open('Password changed successfully!', 'OK', { duration: 3000 });
    } catch (e: any) {
      if (e.code === 'auth/wrong-password') {
        this.snackBar.open('Current password is incorrect.', 'OK', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to change password.', 'OK', { duration: 3000 });
      }
    } finally {
      this.passwordLoading.set(false);
    }
  }

  confirmLogout() {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Are you sure you want to sign out?' },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.authService.logout();
    });
  }
}
