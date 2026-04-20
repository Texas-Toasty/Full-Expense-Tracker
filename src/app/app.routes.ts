import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs';
import { user } from '@angular/fire/auth';

const authGuard = () => {
  const auth = inject(Auth);
  return user(auth).pipe(map((u) => (u ? true : ['login'])));
};

const guestGuard = () => {
  const auth = inject(Auth);
  return user(auth).pipe(map((u) => (u ? ['dashboard'] : true)));
};

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transaction-list/transaction-list').then(
        (m) => m.TransactionList,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/categories').then((m) => m.Categories),
    canActivate: [authGuard],
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budget/budget').then((m) => m.BudgetComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
