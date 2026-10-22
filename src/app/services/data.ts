import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Firestore,
  QueryConstraint,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  where
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth';
import { IUser } from '../models';

/**
 * One place for all Firestore reads and writes.
 *
 * Clients only ever query their own documents (`clientId == uid`), which is
 * also what the security rules in firestore.rules allow. The owner (admin)
 * sees every client's documents.
 */
@Injectable({ providedIn: 'root' })
export class DataService {

  private firestore = inject(Firestore);
  private injector = inject(EnvironmentInjector);
  private auth = inject(AuthService);

  private run<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  /** Live list of a collection. `idField` is the model property that holds the document id. */
  watch<T>(path: string, idField: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    return this.run(() =>
      collectionData(query(collection(this.firestore, path), ...constraints), { idField }) as Observable<T[]>
    );
  }

  /**
   * Live list of the documents the signed-in user may see:
   * everything for the owner, only their own for a client.
   */
  mine<T>(path: string, idField: string): Observable<T[]> {
    return this.auth.profile$.pipe(
      switchMap(profile => {
        if (!profile) return of([] as T[]);
        return profile.role === 'admin'
          ? this.watch<T>(path, idField)
          : this.watch<T>(path, idField, where('clientId', '==', profile.uid));
      })
    );
  }

  /** All client accounts (owner only). */
  clients(): Observable<IUser[]> {
    return this.watch<IUser>('users', 'uid', where('role', '==', 'client'));
  }

  /** Messages in a conversation, oldest first. */
  messages<T>(threadId: string): Observable<T[]> {
    return this.watch<T>(`threads/${threadId}/messages`, 'messageId', orderBy('sentAt', 'asc'));
  }

  add(path: string, data: object) {
    return this.run(() => addDoc(collection(this.firestore, path), data));
  }

  update(path: string, id: string, changes: object) {
    return this.run(() => updateDoc(doc(this.firestore, path, id), changes as any));
  }

  remove(path: string, id: string) {
    return this.run(() => deleteDoc(doc(this.firestore, path, id)));
  }
}
