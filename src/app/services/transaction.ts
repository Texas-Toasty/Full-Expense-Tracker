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
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'transactions');

  getTransactions(uid: string): Observable<Transaction[]> {
    const q = query(this.col, where('uid', '==', uid), orderBy('date', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Transaction[]>;
  }

  addTransaction(transaction: Omit<Transaction, 'id'>) {
    return addDoc(this.col, { ...transaction, createdAt: new Date() });
  }

  updateTransaction(id: string, data: Partial<Transaction>) {
    return updateDoc(doc(this.firestore, 'transactions', id), data as any);
  }

  deleteTransaction(id: string) {
    return deleteDoc(doc(this.firestore, 'transactions', id));
  }
}
