import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, Budget } from '../../services/budget';
import { CategoryService } from '../../services/category';
import { TransactionService } from '../../services/transaction';
import { AuthService } from '../../services/auth';
import { Category } from '../../models/category.model';
import { Transaction } from '../../models/transaction.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    ReactiveFormsModule, FormsModule, CurrencyPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatProgressBarModule,
    MatSnackBarModule, MatTooltipModule, MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './budget.html',
  styleUrl: './budget.css'
})
export class BudgetComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  budgets = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  transactions = signal<Transaction[]>([]);

  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();
  showForm = false;
  loading = false;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  form = this.fb.group({
    category: ['', Validators.required],
    amount:   [null as number | null, [Validators.required, Validators.min(1)]]
  });

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.budgetService.getBudgets(uid).subscribe(data => {
      this.budgets.set(data);
    });

    this.categoryService.getAllCategories(uid).subscribe(data => {
      this.categories.set(data);
    });

    this.transactionService.getTransactions(uid).subscribe(data => {
      this.transactions.set(data);
    });
  }

  // Filter budgets for selected month/year
  get filteredBudgets(): Budget[] {
    return this.budgets().filter(
      b => b.month === this.selectedMonth && b.year === this.selectedYear
    );
  }

  getSpent(category: string): number {
    return this.transactions()
      .filter(t => {
        const date = t.date instanceof Date ? t.date : (t.date as any).toDate();
        return t.category === category &&
               t.type === 'expense' &&
               date.getMonth() === this.selectedMonth &&
               date.getFullYear() === this.selectedYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getProgress(budget: Budget): number {
    const spent = this.getSpent(budget.category);
    return Math.min((spent / budget.amount) * 100, 100);
  }

  getProgressColor(budget: Budget): 'primary' | 'accent' | 'warn' {
    const pct = this.getProgress(budget);
    if (pct >= 100) return 'warn';
    if (pct >= 80)  return 'accent';
    return 'primary';
  }

  getStatusLabel(budget: Budget): string {
    const pct = this.getProgress(budget);
    if (pct >= 100) return 'Exceeded!';
    if (pct >= 80)  return 'Nearing limit';
    return 'On track';
  }

  getRemaining(budget: Budget): number {
    return Math.max(budget.amount - this.getSpent(budget.category), 0);
  }

  // Total summary for the month
  get totalBudgeted(): number {
    return this.filteredBudgets.reduce((s, b) => s + b.amount, 0);
  }

  get totalSpent(): number {
    return this.filteredBudgets.reduce((s, b) => s + this.getSpent(b.category), 0);
  }

  get totalRemaining(): number {
    return Math.max(this.totalBudgeted - this.totalSpent, 0);
  }

  async onSubmit() {
  console.log('Form valid:', this.form.valid);
  console.log('Form values:', this.form.value);
  
  if (this.form.invalid) return;
  
  const uid = this.authService.currentUser()?.uid;
  console.log('UID:', uid);
  if (!uid) {
    console.log('No UID found - user not loaded');
    return;
  }

  const exists = this.filteredBudgets.find(
    b => b.category === this.form.value.category
  );
  console.log('Existing budget found:', exists);
  if (exists) {
    this.snackBar.open(
      'A budget for this category already exists this month. Delete it first to reset.',
      'OK', { duration: 4000 }
    );
    return;
  }

  this.loading = true;
  try {
    const budgetData = {
      uid,
      category: this.form.value.category!,
      amount:   this.form.value.amount!,
      month:    this.selectedMonth,
      year:     this.selectedYear
    };
    console.log('Saving budget:', budgetData);
    await this.budgetService.addBudget(budgetData);
    console.log('Budget saved successfully!');
    this.form.reset();
    this.showForm = false;
    this.snackBar.open('Budget set!', 'OK', { duration: 3000 });
  } catch (e) {
    console.error('Budget save error:', e);
  } finally {
    this.loading = false;
  }
}

  confirmDelete(budget: Budget) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Remove budget for "${budget.category}"?` }
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed && budget.id) {
        await this.budgetService.deleteBudget(budget.id);
        this.snackBar.open('Budget removed.', 'OK', { duration: 3000 });
      }
    });
  }
}