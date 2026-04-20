import { Component, inject, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { CategoryService } from '../../../services/category';
import { AuthService } from '../../../services/auth';
import { Category } from '../../../models/category.model';

export interface FilterCriteria {
  search: string;
  category: string;
  type: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  amountMin: number | null;
  amountMax: number | null;
}

@Component({
  selector: 'app-transaction-filter',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
  ],
  templateUrl: './transaction-filter.html',
  styleUrl: './transaction-filter.css',
})
export class TransactionFilter implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  // Output event emitter using the new signals-based output()
  filterChanged = output<FilterCriteria>();

  categories: Category[] = [];
  showAdvanced = false;

  form = this.fb.group({
    search: [''],
    category: [''],
    type: [''],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
    amountMin: [null as number | null],
    amountMax: [null as number | null],
  });

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      this.categoryService.getAllCategories(uid).subscribe((cats) => {
        this.categories = cats;
      });
    }

    // Emit filter changes as user types/selects
    this.form.valueChanges.subscribe(() => {
      this.emitFilter();
    });
  }

  emitFilter() {
    const v = this.form.value;
    this.filterChanged.emit({
      search: v.search ?? '',
      category: v.category ?? '',
      type: v.type ?? '',
      dateFrom: v.dateFrom ?? null,
      dateTo: v.dateTo ?? null,
      amountMin: v.amountMin ?? null,
      amountMax: v.amountMax ?? null,
    });
  }

  clearFilters() {
    this.form.reset();
  }

  get activeFilterCount(): number {
    const v = this.form.value;
    return [v.search, v.category, v.type, v.dateFrom, v.dateTo, v.amountMin, v.amountMax].filter(
      Boolean,
    ).length;
  }
}
