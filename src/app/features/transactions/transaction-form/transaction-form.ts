import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TransactionService } from '../../../services/transaction';
import { CategoryService } from '../../../services/category';
import { AuthService } from '../../../services/auth';
import { Transaction } from '../../../models/transaction.model';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.css',
})
export class TransactionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  // Existing transaction passed in when editing
  data: { transaction?: Transaction } = inject(MAT_DIALOG_DATA) ?? {};

  categories: Category[] = [];
  loading = false;
  isEditMode = false;

  form = this.fb.group({
    type: ['expense', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    category: ['', Validators.required],
    date: [new Date(), Validators.required],
    notes: [''],
  });

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      this.categoryService.getAllCategories(uid).subscribe((cats) => {
        this.categories = cats;
      });
    }

    // Populate form if editing
    if (this.data?.transaction) {
      this.isEditMode = true;
      const t = this.data.transaction;
      this.form.patchValue({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date instanceof Date ? t.date : (t.date as any).toDate(),
        notes: t.notes,
      });
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    const uid = this.authService.currentUser()!.uid;
    const formValue = this.form.value;

    const transactionData = {
      uid,
      type: formValue.type as 'income' | 'expense',
      amount: formValue.amount!,
      category: formValue.category!,
      date: formValue.date!,
      notes: formValue.notes ?? '',
    };

    try {
      if (this.isEditMode && this.data.transaction?.id) {
        await this.transactionService.updateTransaction(this.data.transaction.id, transactionData);
      } else {
        // Ensure correct typing for the service call
        await this.transactionService.addTransaction(transactionData as Transaction);
      }
      this.dialogRef.close(true);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
