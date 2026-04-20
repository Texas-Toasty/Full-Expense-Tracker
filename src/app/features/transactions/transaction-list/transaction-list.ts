import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../../../services/transaction';
import { AuthService } from '../../../services/auth';
import { Transaction } from '../../../models/transaction.model';
import { TransactionFormComponent } from '../transaction-form/transaction-form';
import { TransactionFilter, FilterCriteria } from '../transaction-filter/transaction-filter';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatCardModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    TransactionFilter,
  ],
  templateUrl: './transaction-list.html',
  styleUrl: './transaction-list.css',
})
export class TransactionList implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  transactions = signal<Transaction[]>([]);
  activeFilters = signal<FilterCriteria>({
    search: '',
    category: '',
    type: '',
    dateFrom: null,
    dateTo: null,
    amountMin: null,
    amountMax: null,
  });

  // Computed signal — auto-updates whenever transactions or filters change
  filteredTransactions = computed(() => {
    const filters = this.activeFilters();
    return this.transactions().filter((t) => {
      const date = t.date instanceof Date ? t.date : (t.date as any).toDate();

      // Search filter (notes)
      if (filters.search && !t.notes.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category && t.category !== filters.category) return false;

      // Type filter
      if (filters.type && t.type !== filters.type) return false;

      // Date from
      if (filters.dateFrom && date < filters.dateFrom) return false;

      // Date to
      if (filters.dateTo && date > filters.dateTo) return false;

      // Amount min
      if (filters.amountMin !== null && t.amount < filters.amountMin) return false;

      // Amount max
      if (filters.amountMax !== null && t.amount > filters.amountMax) return false;

      return true;
    });
  });

  displayedColumns = ['date', 'category', 'notes', 'type', 'amount', 'actions'];

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      this.transactionService.getTransactions(uid).subscribe((data) => {
        this.transactions.set(data);
      });
    }
  }

  onFilterChanged(filters: FilterCriteria) {
    this.activeFilters.set(filters);
  }

  openAddDialog() {
    const ref = this.dialog.open(TransactionFormComponent, {
      width: '480px',
      data: {},
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.showSnack('Transaction added!');
    });
  }

  openEditDialog(transaction: Transaction) {
    const ref = this.dialog.open(TransactionFormComponent, {
      width: '480px',
      data: { transaction },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.showSnack('Transaction updated!');
    });
  }

  confirmDelete(transaction: Transaction) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Delete this ${transaction.type} of $${transaction.amount}?` },
    });
    ref.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && transaction.id) {
        await this.transactionService.deleteTransaction(transaction.id);
        this.showSnack('Transaction deleted.');
      }
    });
  }

  private showSnack(message: string) {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
