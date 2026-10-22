import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { StorageService } from '../../../services/storage';
import { IFile, IProject, IUser } from '../../../models';
import { SizePipe, WhenPipe, toDate } from '../../../shared/format';

/**
 * Shared files. Clients upload footage and assets; the owner uploads
 * drafts and the final delivery. Files are grouped by project.
 */
@Component({
  selector: 'app-files',
  templateUrl: './files.page.html',
  styleUrls: ['./files.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, SizePipe, WhenPipe]
})
export class FilesPage {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private storage = inject(StorageService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  files = toSignal(this.data.mine<IFile>('files', 'fileId'), { initialValue: [] });
  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  // Filters
  clientFilter = signal('');
  projectFilter = signal('');

  shown = computed(() => this.files()
    .filter(f => !this.clientFilter() || f.clientId === this.clientFilter())
    .filter(f => !this.projectFilter() || (f.projectId ?? 'general') === this.projectFilter())
    .sort((a, b) => (toDate(b.uploadedAt)?.getTime() ?? 0) - (toDate(a.uploadedAt)?.getTime() ?? 0)));

  // Upload
  uploadClient = '';
  uploadProject = '';
  uploading = signal<{ name: string; pct: number }[]>([]);
  message = '';
  error = '';

  projectsFor(clientId: string) {
    return this.projects().filter(p => !clientId || p.clientId === clientId);
  }

  projectName(id: string | null) {
    return id ? (this.projects().find(p => p.projectId === id)?.title ?? 'Project') : 'General';
  }

  clientName(id: string) {
    return this.clients().find(c => c.uid === id)?.displayName ?? '';
  }

  icon(f: IFile) {
    if (f.mimeType.startsWith('video/')) return '🎬';
    if (f.mimeType.startsWith('image/')) return '🖼️';
    if (f.mimeType.startsWith('audio/')) return '🎵';
    if (f.mimeType === 'application/pdf') return '📄';
    return '📁';
  }

  async upload(input: HTMLInputElement) {
    const profile = this.profile();
    const chosen = Array.from(input.files ?? []);
    if (!profile || chosen.length === 0) return;

    const clientId = this.isAdmin() ? this.uploadClient : profile.uid;
    if (!clientId) {
      this.error = 'Choose which client these files are for.';
      input.value = '';
      return;
    }

    this.error = '';
    this.message = '';
    this.uploading.set(chosen.map(f => ({ name: f.name, pct: 0 })));

    let failed = 0;
    for (const [i, file] of chosen.entries()) {
      try {
        await this.storage.upload(file, clientId, this.uploadProject || null,
          this.isAdmin() ? 'admin' : 'client',
          pct => this.uploading.update(list => list.map((u, j) => j === i ? { ...u, pct } : u)));
      } catch {
        failed++;
      }
    }

    this.uploading.set([]);
    input.value = '';
    if (failed) this.error = `${failed} file${failed > 1 ? 's' : ''} could not be uploaded.`;
    else this.message = `${chosen.length} file${chosen.length > 1 ? 's' : ''} uploaded.`;
  }

  async remove(f: IFile) {
    if (confirm(`Delete ${f.fileName}?`)) {
      await this.storage.remove(f);
    }
  }
}
