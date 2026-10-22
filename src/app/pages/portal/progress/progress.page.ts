import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { DEFAULT_STAGES, IProject, IProjectStage, IUser, ProjectStatus } from '../../../models';
import { WhenPipe, toDate } from '../../../shared/format';

/**
 * Projects and their stages.
 * Clients see how far along each project is; the owner creates projects
 * and ticks off stages, which updates the progress bar and status.
 */
@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, WhenPipe]
})
export class ProgressPage {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private route = inject(ActivatedRoute);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  filter = signal<'active' | 'completed' | 'all'>('active');

  shown = computed(() => {
    const f = this.filter();
    return this.projects()
      .filter(p => f === 'all' || (f === 'completed' ? p.status === 'completed' : p.status !== 'completed'))
      .sort((a, b) => (toDate(a.dueDate)?.getTime() ?? Infinity) - (toDate(b.dueDate)?.getTime() ?? Infinity));
  });

  // ---- New project form (owner) ----
  showForm = false;
  saving = false;
  error = '';
  form = this.blankForm();

  constructor() {
    // /portal/progress?client=<uid> opens the form for that client (used by the Clients page)
    const client = this.route.snapshot.queryParamMap.get('client');
    if (client) {
      this.form.clientId = client;
      this.showForm = true;
    }
  }

  private blankForm() {
    return { clientId: '', title: '', description: '', dueDate: '', stages: DEFAULT_STAGES.join('\n') };
  }

  async createProject() {
    const client = this.clients().find(c => c.uid === this.form.clientId);
    const stages: IProjectStage[] = this.form.stages
      .split('\n').map(s => s.trim()).filter(Boolean)
      .map(label => ({ label, completed: false, completedAt: null }));

    if (!client || !this.form.title.trim() || stages.length === 0) {
      this.error = 'Choose a client, add a title and at least one stage.';
      return;
    }

    this.saving = true;
    this.error = '';
    try {
      const project: Omit<IProject, 'projectId'> = {
        clientId: client.uid,
        clientName: client.displayName,
        title: this.form.title.trim(),
        description: this.form.description.trim(),
        status: 'not_started',
        progress: 0,
        stages,
        startDate: new Date(),
        dueDate: this.form.dueDate ? new Date(this.form.dueDate) : null,
        completedAt: null,
        createdAt: new Date()
      };
      await this.data.add('projects', project);
      this.form = this.blankForm();
      this.showForm = false;
    } catch {
      this.error = 'Could not save the project. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  /** Owner ticks a stage on or off; progress and status are recalculated from the stages. */
  async toggleStage(p: IProject, index: number) {
    const stages = p.stages.map((s, i) => i !== index ? s : {
      ...s,
      completed: !s.completed,
      completedAt: !s.completed ? new Date() : null
    });
    const done = stages.filter(s => s.completed).length;
    const progress = Math.round((done / stages.length) * 100);

    // The second-last stage is the client review; once it's reached the project is "in review"
    let status: ProjectStatus = 'in_progress';
    if (done === 0) status = 'not_started';
    else if (done === stages.length) status = 'completed';
    else if (done >= stages.length - 1) status = 'review';

    await this.data.update('projects', p.projectId, {
      stages, progress, status,
      completedAt: status === 'completed' ? new Date() : null
    });
  }

  async remove(p: IProject) {
    if (confirm(`Delete "${p.title}"? This can't be undone.`)) {
      await this.data.remove('projects', p.projectId);
    }
  }

  statusLabel(status: ProjectStatus) {
    return { not_started: 'Not started', in_progress: 'In progress', review: 'In review', completed: 'Completed' }[status];
  }

  statusColour(status: ProjectStatus) {
    return { not_started: 'grey', in_progress: 'blue', review: 'amber', completed: 'green' }[status];
  }
}
