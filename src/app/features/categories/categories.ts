import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryService, PREDEFINED_CATEGORIES } from '../../services/category';
import { AuthService } from '../../services/auth';
import { Category } from '../../models/category.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

const AVAILABLE_ICONS = [
  'restaurant',
  'home',
  'flight',
  'shopping_bag',
  'favorite',
  'bolt',
  'attach_money',
  'category',
  'directions_car',
  'school',
  'sports_esports',
  'local_cafe',
  'fitness_center',
  'movie',
  'pets',
];

const AVAILABLE_COLORS = [
  '#FF7043',
  '#42A5F5',
  '#AB47BC',
  '#26A69A',
  '#EF5350',
  '#FFA726',
  '#66BB6A',
  '#BDBDBD',
  '#EC407A',
  '#7E57C2',
];

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  predefinedCategories = PREDEFINED_CATEGORIES;
  customCategories = signal<Category[]>([]);
  showForm = false;
  loading = false;

  availableIcons = AVAILABLE_ICONS;
  availableColors = AVAILABLE_COLORS;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    icon: ['category', Validators.required],
    color: ['#42A5F5', Validators.required],
  });

  ngOnInit() {
    const uid = this.authService.currentUser()?.uid;
    if (uid) {
      this.categoryService.getAllCategories(uid).subscribe((all) => {
        // Only show user-defined (non-null uid) ones in custom list
        this.customCategories.set(all.filter((c) => c.uid !== null));
      });
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const uid = this.authService.currentUser()?.uid;
    if (!uid) {
      this.snackBar.open('You must be logged in to add a category.', 'OK', { duration: 3000 });
      return;
    }

    this.loading = true;
    try {
      await this.categoryService.addCategory({
        uid,
        name: this.form.value.name!,
        icon: this.form.value.icon!,
        color: this.form.value.color!,
      });
      this.form.reset({ icon: 'category', color: '#42A5F5' });
      this.showForm = false;
      this.snackBar.open('Category added!', 'OK', { duration: 3000 });
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(category: Category) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Delete the "${category.name}" category?` },
    });
    ref.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && category.id) {
        await this.categoryService.deleteCategory(category.id);
        this.snackBar.open('Category deleted.', 'OK', { duration: 3000 });
      }
    });
  }
}
