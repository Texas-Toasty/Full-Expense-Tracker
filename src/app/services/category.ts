import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from '@angular/fire/firestore';
import { Observable, of, combineLatest, map } from 'rxjs';
import { Category } from '../models/category.model';

export const PREDEFINED_CATEGORIES: Category[] = [
  { uid: null, name: 'Food', icon: 'restaurant', color: '#FF7043' },
  { uid: null, name: 'Rent', icon: 'home', color: '#42A5F5' },
  { uid: null, name: 'Travel', icon: 'flight', color: '#AB47BC' },
  { uid: null, name: 'Shopping', icon: 'shopping_bag', color: '#26A69A' },
  { uid: null, name: 'Health', icon: 'favorite', color: '#EF5350' },
  { uid: null, name: 'Utilities', icon: 'bolt', color: '#FFA726' },
  { uid: null, name: 'Salary', icon: 'attach_money', color: '#66BB6A' },
  { uid: null, name: 'Other', icon: 'category', color: '#BDBDBD' },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firestore = inject(Firestore);
  private col = collection(this.firestore, 'categories');

  getAllCategories(uid: string): Observable<Category[]> {
    const custom$ = collectionData(query(this.col, where('uid', '==', uid)), {
      idField: 'id',
    }) as Observable<Category[]>;

    return combineLatest([of(PREDEFINED_CATEGORIES), custom$]).pipe(
      map(([predefined, custom]) => [...predefined, ...custom]),
    );
  }

  addCategory(category: Omit<Category, 'id'>) {
    return addDoc(this.col, category);
  }

  deleteCategory(id: string) {
    return deleteDoc(doc(this.firestore, 'categories', id));
  }
}
