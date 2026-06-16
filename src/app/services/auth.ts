import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private injector = inject(EnvironmentInjector);

  currentUser$ = user(this.auth);

  async signUp(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(
      this.auth, email, password
    );

    await runInInjectionContext(this.injector, () =>
      setDoc(doc(this.firestore, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email,
        displayName,
        role: 'client',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      })
    );

    this.router.navigate(['/portal/dashboard']);
  }

  async login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      const role = await this.getUserRole();
      if (role === 'admin') {
        this.router.navigate(['/portal/dashboard']);
      } else {
        this.router.navigate(['/portal/dashboard']);
      }
    } catch (error: any) {
      console.log('Login error code:', error.code);
      console.log('Login error message:', error.message);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  async getUserRole(): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) return null;

    return runInInjectionContext(this.injector, async () => {
      const userDoc = await getDoc(
        doc(this.firestore, 'users', currentUser.uid)
      );
      return userDoc.exists() ? userDoc.data()['role'] : null;
    });
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}