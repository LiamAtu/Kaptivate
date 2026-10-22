import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  user
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, of, firstValueFrom } from 'rxjs';
import { filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
import { IUser } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private injector = inject(EnvironmentInjector);

  /** The signed-in Firebase user, or null. */
  currentUser$ = user(this.auth);

  /** The signed-in user's profile document (name, role…), or null. */
  profile$: Observable<IUser | null> = this.currentUser$.pipe(
    switchMap(u => u
      ? runInInjectionContext(this.injector, () =>
          docData(doc(this.firestore, 'users', u.uid)) as Observable<IUser | undefined>
        ).pipe(map(p => p ?? null))
      : of(null)),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  isAdmin$ = this.profile$.pipe(map(p => p?.role === 'admin'));

  async signUp(email: string, password: string, displayName: string,
               extra: { companyName?: string; phone?: string } = {}) {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);

    await runInInjectionContext(this.injector, () =>
      setDoc(doc(this.firestore, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email,
        displayName,
        role: 'client',              // only the owner can make someone an admin
        companyName: extra.companyName ?? '',
        phone: extra.phone ?? '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true
      })
    );

    this.router.navigate(['/portal/dashboard']);
  }

  async login(email: string, password: string, returnUrl = '/portal/dashboard') {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, 'users', credential.user.uid), { lastLoginAt: new Date() })
    ).catch(() => { /* profile not created yet – not fatal */ });
    // Only follow links inside this site
    this.router.navigateByUrl(returnUrl.startsWith('/') ? returnUrl : '/portal/dashboard');
  }

  resetPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  /** Waits for Firebase to finish restoring the session, then returns the profile. */
  async getProfile(): Promise<IUser | null> {
    await firstValueFrom(this.currentUser$.pipe(take(1)));
    return firstValueFrom(this.profile$.pipe(filter(p => p !== undefined), take(1)));
  }

  async getUserRole(): Promise<string | null> {
    return (await this.getProfile())?.role ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }
}
