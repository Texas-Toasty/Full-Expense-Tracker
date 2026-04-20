import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { UserProfile } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  currentUser = signal<UserProfile | null>(null);
  user$ = user(this.auth);

  async register(email: string, password: string, displayName: string) {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, password);
      console.log('Firebase user created:', cred.user.uid);

      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        monthlyBudgetGoal: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(this.firestore, 'users', cred.user.uid), profile);
      console.log('Firestore profile saved!');

      this.currentUser.set(profile);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      console.error('Registration error:', e.code, e.message);
      throw e;
    }
  }

  async login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    const snap = await getDoc(doc(this.firestore, 'users', cred.user.uid));
    this.currentUser.set(snap.data() as UserProfile);
    this.router.navigate(['/dashboard']);
  }

  async logout() {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  constructor() {
    user(this.auth).subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
        if (snap.exists()) {
          this.currentUser.set(snap.data() as UserProfile);
        }
      } else {
        this.currentUser.set(null);
      }
    });
  }
}
