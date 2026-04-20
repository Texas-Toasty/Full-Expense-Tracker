import { Component, inject, OnInit, signal, Inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TransactionService } from '../../../services/transaction';
import { AuthService } from '../../../services/auth';
import { Transaction } from '../../../models/transaction.model';
import { TransactionFormComponent } from '../transaction-form/transaction-form';
// Local confirm dialog component (original external import was not exported from the module)
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <h2 mat-dialog-title>Confirm</h2>
    <mat-dialog-content>{{ data?.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-button color="primary" (click)="onConfirm()">OK</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  onConfirm() {
    this.dialogRef.close(true);
  }
  onCancel() {
    this.dialogRef.close(false);
  }
}

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
  displayedColumns = ['date', 'category', 'notes', 'type', 'amount', 'actions'];

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      this.transactionService.getTransactions(uid).subscribe((data) => {
        this.transactions.set(data);
      });
    }
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
