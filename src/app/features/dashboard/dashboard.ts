import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { TransactionService } from '../../services/transaction';
import { BudgetService, Budget } from '../../services/budget';
import { AuthService } from '../../services/auth';
import { Transaction } from '../../models/transaction.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressBarModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private authService = inject(AuthService);

  transactions = signal<Transaction[]>([]);
  budgets = signal<Budget[]>([]);

  selectedMonth = new Date().getMonth();
  selectedYear = new Date().getFullYear();

  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Summary signals
  totalIncome = signal(0);
  totalExpenses = signal(0);
  netBalance = signal(0);

  // Pie chart — category spending
  pieChartData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  // Bar chart — income vs expense
  barChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' } },
  };

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (!uid) return;

    this.transactionService.getTransactions(uid).subscribe((data) => {
      this.transactions.set(data);
      this.computeStats();
    });

    this.budgetService.getBudgets(uid).subscribe((data) => {
      this.budgets.set(data);
    });
  }

  onMonthChange() {
    this.computeStats();
  }

  private computeStats() {
    const filtered = this.transactions().filter((t) => {
      const date = t.date instanceof Date ? t.date : (t.date as any).toDate();
      return date.getMonth() === this.selectedMonth && date.getFullYear() === this.selectedYear;
    });

    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    this.totalIncome.set(income);
    this.totalExpenses.set(expenses);
    this.netBalance.set(income - expenses);

    this.buildPieChart(filtered.filter((t) => t.type === 'expense'));
    this.buildBarChart();
  }

  private buildPieChart(expenses: Transaction[]) {
    const categoryMap: Record<string, number> = {};
    expenses.forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
    });

    this.pieChartData.set({
      labels: Object.keys(categoryMap),
      datasets: [
        {
          data: Object.values(categoryMap),
          backgroundColor: [
            '#FF7043',
            '#42A5F5',
            '#AB47BC',
            '#26A69A',
            '#EF5350',
            '#FFA726',
            '#66BB6A',
            '#BDBDBD',
          ],
        },
      ],
    });
  }

  private buildBarChart() {
    // Last 6 months
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(this.selectedYear, this.selectedMonth - i, 1);
      labels.push(this.months[date.getMonth()].slice(0, 3));

      const monthTx = this.transactions().filter((t) => {
        const d = t.date instanceof Date ? t.date : (t.date as any).toDate();
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });

      incomeData.push(monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0));
      expenseData.push(
        monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      );
    }

    this.barChartData.set({
      labels,
      datasets: [
        { label: 'Income', data: incomeData, backgroundColor: '#66BB6A' },
        { label: 'Expenses', data: expenseData, backgroundColor: '#EF5350' },
      ],
    });
  }

  getBudgetProgress(budget: any): number {
    const spent = this.transactions()
      .filter((t) => {
        const date = t.date instanceof Date ? t.date : (t.date as any).toDate();
        return (
          t.category === budget.category &&
          t.type === 'expense' &&
          date.getMonth() === this.selectedMonth &&
          date.getFullYear() === this.selectedYear
        );
      })
      .reduce((s, t) => s + t.amount, 0);
    return Math.min((spent / budget.amount) * 100, 100);
  }

  getSpentAmount(budget: any): number {
    return this.transactions()
      .filter((t) => {
        const date = t.date instanceof Date ? t.date : (t.date as any).toDate();
        return (
          t.category === budget.category &&
          t.type === 'expense' &&
          date.getMonth() === this.selectedMonth &&
          date.getFullYear() === this.selectedYear
        );
      })
      .reduce((s, t) => s + t.amount, 0);
  }

  getProgressColor(budget: any): string {
    const pct = this.getBudgetProgress(budget);
    if (pct >= 100) return 'warn';
    if (pct >= 80) return 'accent';
    return 'primary';
  }
}
