import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { IBrief } from '../../../models';
import { WhenPipe, toDate } from '../../../shared/format';

/** Project brief: clients describe what they need; the owner reads every brief. */
@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, WhenPipe],
  template: `
    <app-portal-header title="Project brief"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Project brief</p>
            <h1>{{ isAdmin() ? 'Client briefs' : 'Tell us about your project' }}</h1>
            <p>{{ isAdmin() ? 'Briefs submitted by clients.' : 'The more detail you give, the more accurate your quote will be.' }}</p>
          </div>
        </div>

        @if (!isAdmin()) {
          <div class="kap-card">
            <div class="kap-form-grid">
              <div class="kap-field">
                <label>Type of project</label>
                <select class="kap-control" [(ngModel)]="form.projectType">
                  @for (t of types; track t) { <option [value]="t">{{ t }}</option> }
                </select>
              </div>
              <div class="kap-field">
                <label>Shoot date (if known)</label>
                <input class="kap-control" type="date" [(ngModel)]="form.shootDate" />
              </div>
              <div class="kap-field">
                <label>Location</label>
                <input class="kap-control" [(ngModel)]="form.location" placeholder="Town or venue" />
              </div>
              <div class="kap-field">
                <label>Budget</label>
                <select class="kap-control" [(ngModel)]="form.budget">
                  @for (b of budgets; track b) { <option [value]="b">{{ b }}</option> }
                </select>
              </div>
              <div class="kap-field">
                <label>Final video length</label>
                <select class="kap-control" [(ngModel)]="form.videoLength">
                  @for (l of lengths; track l) { <option [value]="l">{{ l }}</option> }
                </select>
              </div>
            </div>
            <div class="kap-field">
              <label>What do you need?</label>
              <textarea class="kap-control" [(ngModel)]="form.description"
                        placeholder="The story, who it's for, where it will be shown…"></textarea>
            </div>
            <div class="kap-field">
              <label>Examples you like (links)</label>
              <textarea class="kap-control" [(ngModel)]="form.references" placeholder="YouTube, Vimeo or Instagram links"></textarea>
            </div>
            @if (message) { <p class="kap-alert ok">{{ message }}</p> }
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="submit()" [disabled]="saving">{{ saving ? 'Sending…' : 'Send brief' }}</button>
          </div>
        }

        @if (briefs().length) {
          <h2 class="list-title">{{ isAdmin() ? 'All briefs' : 'Briefs you have sent' }}</h2>
        }
        @for (b of briefs(); track b.briefId) {
          <div class="kap-card">
            <div class="kap-row">
              <h3>{{ b.projectType }}@if (isAdmin()) { <span class="kap-faint"> · {{ b.clientName }}</span> }</h3>
              <span class="kap-faint">Sent {{ b.submittedAt | when }}</span>
            </div>
            <dl>
              <dt>Shoot date</dt><dd>{{ b.shootDate || 'Not decided' }}</dd>
              <dt>Location</dt><dd>{{ b.location || '—' }}</dd>
              <dt>Budget</dt><dd>{{ b.budget }}</dd>
              <dt>Length</dt><dd>{{ b.videoLength }}</dd>
            </dl>
            <p class="text">{{ b.description }}</p>
            @if (b.references) { <p class="text kap-faint">{{ b.references }}</p> }
          </div>
        } @empty {
          @if (isAdmin()) { <div class="kap-card kap-empty">No briefs yet.</div> }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .list-title { font-family: var(--app-font-MainHeading); font-size: 1.1rem; margin: 28px 0 14px; }
    dl { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 4px 16px; margin: 12px 0; }
    dt { font-family: var(--app-font-smallPrint); font-size: 0.7rem; letter-spacing: 2px; text-transform: uppercase; color: var(--kap-faint); }
    dd { margin: 0 0 10px; }
    .text { white-space: pre-wrap; word-break: break-word; }
  `]
})
export class FormsPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  private all = toSignal(this.data.mine<IBrief>('briefs', 'briefId'), { initialValue: [] });
  briefs = computed(() => [...this.all()].sort((a, b) =>
    (toDate(b.submittedAt)?.getTime() ?? 0) - (toDate(a.submittedAt)?.getTime() ?? 0)));

  types = ['Wedding', 'Corporate / brand video', 'Event', 'Music video', 'Social media content', 'Photography', 'Other'];
  budgets = ['Not sure yet', 'Under €1,000', '€1,000 – €2,500', '€2,500 – €5,000', 'Over €5,000'];
  lengths = ['Under 1 minute', '1–3 minutes', '3–10 minutes', 'Over 10 minutes', 'Not sure'];

  saving = false;
  message = '';
  error = '';
  form = this.blank();

  private blank() {
    return { projectType: this.types[0], shootDate: '', location: '', budget: this.budgets[0],
             videoLength: this.lengths[1], description: '', references: '' };
  }

  async submit() {
    const profile = this.profile();
    if (!profile) return;
    if (!this.form.description.trim()) {
      this.error = 'Please describe what you need.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.message = '';
    try {
      const brief: Omit<IBrief, 'briefId'> = {
        ...this.form,
        description: this.form.description.trim(),
        references: this.form.references.trim(),
        clientId: profile.uid,
        clientName: profile.displayName,
        submittedAt: new Date()
      };
      await this.data.add('briefs', brief);
      this.form = this.blank();
      this.message = 'Thanks! Your brief has been sent. We will be in touch with a quote.';
    } catch {
      this.error = 'Could not send your brief. Please try again.';
    } finally {
      this.saving = false;
    }
  }
}
