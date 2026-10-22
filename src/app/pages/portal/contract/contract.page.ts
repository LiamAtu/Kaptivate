import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { IContract, IProject, IUser } from '../../../models';
import { WhenPipe, toDate } from '../../../shared/format';

/** A starting point for the owner to edit – not legal advice. */
const TERMS_TEMPLATE = `1. Services – Kaptivate will provide the video services described in the accepted quote.
2. Payment – A deposit is due to confirm the booking; the balance is due on delivery of the final video.
3. Revisions – The price includes the number of revision rounds stated in the quote. Further changes are charged separately.
4. Delivery – Final files are delivered through the client portal.
5. Usage – The client may use the final video for the purposes agreed. Kaptivate may show it in its portfolio unless the client asks otherwise in writing.
6. Cancellation – The deposit is non-refundable if the client cancels within 14 days of the shoot.`;

/** Contracts: the owner sends terms, the client signs by typing their full name. */
@Component({
  selector: 'app-contract',
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, WhenPipe],
  template: `
    <app-portal-header title="Contracts"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Contracts</p>
            <h1>Contracts</h1>
            <p>{{ isAdmin() ? 'Send terms for a client to sign.' : 'Read and sign your contract here.' }}</p>
          </div>
          @if (isAdmin()) {
            <button class="kap-btn" (click)="showForm = !showForm">{{ showForm ? 'Close' : 'New contract' }}</button>
          }
        </div>

        @if (isAdmin() && showForm) {
          <div class="kap-card">
            <h2>New contract</h2>
            <div class="kap-form-grid">
              <div class="kap-field">
                <label>Client</label>
                <select class="kap-control" [(ngModel)]="form.clientId" (ngModelChange)="form.projectId = ''">
                  <option value="">Choose a client…</option>
                  @for (c of clients(); track c.uid) { <option [value]="c.uid">{{ c.displayName }}</option> }
                </select>
              </div>
              <div class="kap-field">
                <label>Project (optional)</label>
                <select class="kap-control" [(ngModel)]="form.projectId">
                  <option value="">None</option>
                  @for (p of projectsFor(form.clientId); track p.projectId) { <option [value]="p.projectId">{{ p.title }}</option> }
                </select>
              </div>
              <div class="kap-field">
                <label>Title</label>
                <input class="kap-control" [(ngModel)]="form.title" placeholder="e.g. Video production agreement" />
              </div>
            </div>
            <div class="kap-field">
              <label>Terms</label>
              <textarea class="kap-control terms-input" [(ngModel)]="form.terms"></textarea>
              <p class="kap-faint">This is a starting template – edit it to match your own terms.</p>
            </div>
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="send()" [disabled]="saving">{{ saving ? 'Sending…' : 'Send contract' }}</button>
          </div>
        }

        @for (c of sorted(); track c.contractId) {
          <div class="kap-card">
            <div class="kap-row">
              <div>
                <h3>{{ c.title }}</h3>
                <div class="kap-faint">@if (isAdmin()) { {{ c.clientName }} · } Sent {{ c.createdAt | when }}</div>
              </div>
              <span [class]="'kap-chip ' + (c.status === 'signed' ? 'green' : 'amber')">
                {{ c.status === 'signed' ? 'Signed' : 'Awaiting signature' }}
              </span>
            </div>

            <div class="terms">{{ c.terms }}</div>

            @if (c.status === 'signed') {
              <p class="signed">Signed by <strong>{{ c.signedName }}</strong> on {{ c.signedAt | when:'short' }}</p>
            } @else if (!isAdmin()) {
              <div class="sign">
                <div class="kap-field">
                  <label>Type your full name to sign</label>
                  <input class="kap-control" [(ngModel)]="signature[c.contractId]" placeholder="Full name" />
                </div>
                <label class="agree">
                  <input type="checkbox" [(ngModel)]="agreed[c.contractId]" />
                  I have read and agree to these terms.
                </label>
                <button class="kap-btn" (click)="sign(c)"
                        [disabled]="!agreed[c.contractId] || (signature[c.contractId] || '').trim().length < 2">
                  Sign contract
                </button>
              </div>
            }

            @if (isAdmin()) {
              <button class="kap-btn small danger" (click)="remove(c)">Delete</button>
            }
          </div>
        } @empty {
          <div class="kap-card kap-empty">No contracts yet.</div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .terms-input { min-height: 220px; }
    .terms {
      white-space: pre-wrap; margin: 16px 0; padding: 16px; line-height: 1.6;
      background: rgba(0,0,0,0.25); border-radius: 6px; color: var(--kap-muted);
    }
    .signed { color: var(--kap-green); }
    .sign { border-top: 1px solid var(--kap-line); padding-top: 16px; max-width: 420px; }
    .agree { display: flex; gap: 10px; align-items: center; margin-bottom: 4px; cursor: pointer; }
    .agree input { accent-color: var(--kap-green); width: 16px; height: 16px; }
  `]
})
export class ContractPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  contracts = toSignal(this.data.mine<IContract>('contracts', 'contractId'), { initialValue: [] });
  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  sorted = computed(() => [...this.contracts()].sort((a, b) =>
    (a.status === 'sent' ? 0 : 1) - (b.status === 'sent' ? 0 : 1) ||
    (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)));

  signature: Record<string, string> = {};
  agreed: Record<string, boolean> = {};

  showForm = false;
  saving = false;
  error = '';
  form = this.blank();

  private blank() {
    return { clientId: '', projectId: '', title: 'Video production agreement', terms: TERMS_TEMPLATE };
  }

  projectsFor(clientId: string) {
    return this.projects().filter(p => p.clientId === clientId);
  }

  async send() {
    const client = this.clients().find(c => c.uid === this.form.clientId);
    if (!client || !this.form.title.trim() || !this.form.terms.trim()) {
      this.error = 'Choose a client and fill in the title and terms.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const contract: Omit<IContract, 'contractId'> = {
        clientId: client.uid,
        clientName: client.displayName,
        projectId: this.form.projectId || null,
        title: this.form.title.trim(),
        terms: this.form.terms.trim(),
        status: 'sent',
        signedName: null,
        signedAt: null,
        createdAt: new Date()
      };
      await this.data.add('contracts', contract);
      this.form = this.blank();
      this.showForm = false;
    } catch {
      this.error = 'Could not send the contract. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  async sign(c: IContract) {
    const name = (this.signature[c.contractId] ?? '').trim();
    if (name.length < 2 || !this.agreed[c.contractId]) return;
    await this.data.update('contracts', c.contractId, { status: 'signed', signedName: name, signedAt: new Date() });
  }

  async remove(c: IContract) {
    if (confirm(`Delete the contract "${c.title}"?`)) await this.data.remove('contracts', c.contractId);
  }
}
