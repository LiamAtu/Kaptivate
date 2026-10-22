import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from '@angular/fire/storage';
import { DataService } from './data';
import { IFile } from '../models';

/** Uploads files to Firebase Storage and records them in the `files` collection. */
@Injectable({ providedIn: 'root' })
export class StorageService {

  private storage = inject(Storage);
  private data = inject(DataService);
  private injector = inject(EnvironmentInjector);

  /**
   * Uploads one file. Files live under clients/{clientId}/..., which the
   * storage.rules lock down so only that client and the owner can reach them.
   * `onProgress` receives 0–100 while the upload runs.
   */
  async upload(file: File, clientId: string, projectId: string | null,
               uploadedBy: 'admin' | 'client', onProgress?: (pct: number) => void) {
    const safeName = file.name.replace(/[^\w.\- ]+/g, '_');
    const path = `clients/${clientId}/${projectId ?? 'general'}/${Date.now()}-${safeName}`;
    const fileRef = runInInjectionContext(this.injector, () => ref(this.storage, path));
    const task = uploadBytesResumable(fileRef, file, { contentType: file.type });

    await new Promise<void>((resolve, reject) => {
      task.on('state_changed',
        snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        () => resolve());
    });

    const downloadUrl = await getDownloadURL(fileRef);
    const record: Omit<IFile, 'fileId'> = {
      clientId,
      projectId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      storagePath: path,
      downloadUrl,
      uploadedBy,
      uploadedAt: new Date()
    };
    return this.data.add('files', record);
  }

  async remove(file: IFile) {
    await deleteObject(runInInjectionContext(this.injector, () => ref(this.storage, file.storagePath)))
      .catch(() => { /* already gone */ });
    await this.data.remove('files', file.fileId);
  }
}
