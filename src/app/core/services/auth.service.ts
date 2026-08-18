import { Injectable, signal } from '@angular/core';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = getAuth();

  // Signál s přesným typem User | null
  currentUser = signal<User | null>(null);

  constructor() {
    // Sledování stavu přihlášení s explicitním typem (u: User | null)
    onAuthStateChanged(this.auth, (u: User | null) => {
      this.currentUser.set(u);
    });
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(this.auth, provider);
  }

  async logout() {
    return await signOut(this.auth);
  }

  getUserId(): string | null {
    return this.currentUser()?.uid ?? null;
  }
}
