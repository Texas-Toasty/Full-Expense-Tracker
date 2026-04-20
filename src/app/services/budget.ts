import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Budget {
  id?: string;
  uid: string;
  category: string;
  amount: number;
  month: number; // 0-11
  year: number;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'budgets');

  getBudgets(uid: string): Observable<Budget[]> {
    const q = query(this.col, where('uid', '==', uid));
    return collectionData(q, { idField: 'id' }) as Observable<Budget[]>;
  }

  getBudgetsForMonth(uid: string, month: number, year: number): Observable<Budget[]> {
    const q = query(
      this.col,
      where('uid', '==', uid),
      where('month', '==', month),
      where('year', '==', year),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Budget[]>;
  }

  addBudget(budget: Omit<Budget, 'id'>) {
    return addDoc(this.col, budget);
  }

  updateBudget(id: string, data: Partial<Budget>) {
    return updateDoc(doc(this.firestore, 'budgets', id), data as any);
  }

  deleteBudget(id: string) {
    return deleteDoc(doc(this.firestore, 'budgets', id));
  }
}
