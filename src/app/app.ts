import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { user } from '@angular/fire/auth';
import { AuthService } from './services/auth';
import { UserProfile } from './models/user.model';
import { Navbar } from './components/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    @if (showNavbar()) {
      <app-navbar />
    }
    <main class="app-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .app-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px 16px;
    }
  `]
})
export class AppComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  showNavbar() {
    // Hide navbar on login/register pages
    return !!this.authService.currentUser();
  }

  ngOnInit() {
    // Restore user session on page refresh
    user(this.auth).subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
        if (snap.exists()) {
          this.authService.currentUser.set(snap.data() as UserProfile);
        }
      }
    });
  }
}