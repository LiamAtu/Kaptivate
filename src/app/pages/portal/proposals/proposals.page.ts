import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { LineItemsComponent } from '../../../components/line-items/line-items.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { ILineItem, IProject, IProposal, IUser, ProposalStatus } from '../../../models';
import { EuroPipe, WhenPipe, sumItems, toDate } from '../../../shared/format';

/** Quotes: the owner sends a priced quote, the client accepts or declines it. */
@Component({
  selector: 'app-proposals',
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, LineItemsComponent, EuroPipe, WhenPipe],
  template: `
    <app-portal-header title="Quotes"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Quotes</p>
            <h1>Quotes</h1>
            <p>{{ isAdmin() ? 'Send a priced quote to a client.' : 'Review the quotes we have sent you.' }}</p>
          </div>
          @if (isAdmin()) {
            <button class="kap-btn" (click)="showForm = !showForm">{{ showForm ? 'Close' : 'New quote' }}</button>
          }
        </div>

        @if (isAdmin() && showForm) {
          <div class="kap-card">
            <h2>New quote</h2>
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
                <input class="kap-control" [(ngModel)]="form.title" placeholder="e.g. Wedding film – full day" />
              </div>
              <div class="kap-field">
                <label>Valid until</label>
                <input class="kap-control" type="date" [(ngModel)]="form.validUntil" />
              </div>
            </div>
            <app-line-items [items]="form.items"></app-line-items>
            <div class="kap-field">
              <label>Notes</label>
              <textarea class="kap-control" [(ngModel)]="form.notes" placeholder="What's included, deposit, timings…"></textarea>
            </div>
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="send()" [disabled]="saving">{{ saving ? 'Sending…' : 'Send quote' }}</button>
          </div>
        }

        @for (q of sorted(); track q.proposalId) {
          <div class="kap-card">
            <div class="kap-row">
              <div>
                <h3>{{ q.title }}</h3>
                <div class="kap-faint">
                  @if (isAdmin()) { {{ q.clientName }} · }
                  Sent {{ q.createdAt | when }}@if (q.validUntil) { · Valid until {{ q.validUntil | when }} }
                </div>
              </div>
              <span [class]="'kap-chip ' + colour(q.status)">{{ label(q.status) }}</span>
            </div>

            <table class="kap-table items">
              <tbody>
                @for (i of q.items; track $index) {
                  <tr><td>{{ i.description }}</td><td class="num">{{ i.amount | euro }}</td></tr>
                }
                <tr class="total"><td>Total</td><td class="num">{{ q.total | euro }}</td></tr>
              </tbody>
            </table>
            @if (q.notes) { <p class="kap-muted notes">{{ q.notes }}</p> }

            @if (!isAdmin() && q.status === 'sent') {
              <div class="buttons">
                <button class="kap-btn" (click)="respond(q, 'accepted')">Accept quote</button>
                <button class="kap-btn ghost" (click)="respond(q, 'declined')">Decline</button>
              </div>
            }
            @if (q.respondedAt) {
              <p class="kap-faint">{{ label(q.status) }} on {{ q.respondedAt | when }}</p>
            }
            @if (isAdmin()) {
              <button class="kap-btn small danger" (click)="remove(q)">Delete</button>
            }
          </div>
        } @empty {
          <div class="kap-card kap-empty">No quotes yet.</div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .items { margin: 14px 0 8px; }
    .items .total td { font-weight: 700; border-bottom: none; }
    .notes { white-space: pre-wrap; }
    .buttons { display: flex; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
  `]
})
export class ProposalsPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  proposals = toSignal(this.data.mine<IProposal>('proposals', 'proposalId'), { initialValue: [] });
  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  sorted = computed(() => [...this.proposals()].sort((a, b) =>
    (a.status === 'sent' ? 0 : 1) - (b.status === 'sent' ? 0 : 1) ||
    (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)));

  showForm = false;
  saving = false;
  error = '';
  form = this.blank();

  private blank() {
    return { clientId: '', projectId: '', title: '', validUntil: '', notes: '',
             items: [{ description: '', amount: 0 }] as ILineItem[] };
  }

  projectsFor(clientId: string) {
    return this.projects().filter(p => p.clientId === clientId);
  }

  async send() {
    const client = this.clients().find(c => c.uid === this.form.clientId);
    const items = this.form.items
      .filter(i => i.description.trim())
      .map(i => ({ description: i.description.trim(), amount: Number(i.amount) || 0 }));
    if (!client || !this.form.title.trim() || items.length === 0) {
      this.error = 'Choose a client, add a title and at least one item.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const proposal: Omit<IProposal, 'proposalId'> = {
        clientId: client.uid,
        clientName: client.displayName,
        projectId: this.form.projectId || null,
        title: this.form.title.trim(),
        items,
        total: sumItems(items),
        notes: this.form.notes.trim(),
        validUntil: this.form.validUntil ? new Date(this.form.validUntil) : null,
        status: 'sent',
        respondedAt: null,
        createdAt: new Date()
      };
      await this.data.add('proposals', proposal);
      this.form = this.blank();
      this.showForm = false;
    } catch {
      this.error = 'Could not send the quote. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  async respond(q: IProposal, status: 'accepted' | 'declined') {
    const verb = status === 'accepted' ? 'Accept' : 'Decline';
    if (confirm(`${verb} "${q.title}" for ${q.total.toFixed(2)} euro?`)) {
      await this.data.update('proposals', q.proposalId, { status, respondedAt: new Date() });
    }
  }

  async remove(q: IProposal) {
    if (confirm(`Delete the quote "${q.title}"?`)) await this.data.remove('proposals', q.proposalId);
  }

  label(s: ProposalStatus) {
    return { sent: 'Awaiting reply', accepted: 'Accepted', declined: 'Declined' }[s];
  }
  colour(s: ProposalStatus) {
    return { sent: 'amber', accepted: 'green', declined: 'red' }[s];
  }
}
