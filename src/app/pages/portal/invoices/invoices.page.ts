import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { LineItemsComponent } from '../../../components/line-items/line-items.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { IInvoice, ILineItem, IProject, IUser } from '../../../models';
import { EuroPipe, WhenPipe, sumItems, toDate } from '../../../shared/format';

/** Invoices: the owner raises them and marks them paid; clients view and print them. */
@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, LineItemsComponent, EuroPipe, WhenPipe],
  template: `
    <app-portal-header title="Invoices"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head no-print">
          <div>
            <p class="kap-eyebrow">Invoices</p>
            <h1>Invoices</h1>
            <p>Outstanding: <strong>{{ outstanding() | euro }}</strong>
              @if (overdueCount()) { <span class="overdue"> · {{ overdueCount() }} overdue</span> }</p>
          </div>
          @if (isAdmin()) {
            <button class="kap-btn" (click)="showForm = !showForm">{{ showForm ? 'Close' : 'New invoice' }}</button>
          }
        </div>

        @if (isAdmin() && showForm) {
          <div class="kap-card no-print">
            <h2>New invoice <span class="kap-faint">{{ nextNumber() }}</span></h2>
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
                <label>Due date</label>
                <input class="kap-control" type="date" [(ngModel)]="form.dueDate" />
              </div>
            </div>
            <app-line-items [items]="form.items"></app-line-items>
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="create()" [disabled]="saving">{{ saving ? 'Saving…' : 'Create invoice' }}</button>
          </div>
        }

        @for (inv of sorted(); track inv.invoiceId) {
          <div class="kap-card invoice" [class.no-print]="printing() && printing() !== inv.invoiceId">
            <div class="kap-row">
              <div>
                <p class="kap-eyebrow">Invoice</p>
                <h3>{{ inv.number }}</h3>
                <div class="kap-faint">
                  @if (isAdmin()) { {{ inv.clientName }} · }
                  Issued {{ inv.createdAt | when }} · Due {{ inv.dueDate | when }}
                </div>
              </div>
              <span [class]="'kap-chip ' + colour(inv)">{{ label(inv) }}</span>
            </div>

            <table class="kap-table items">
              <tbody>
                @for (i of inv.items; track $index) {
                  <tr><td>{{ i.description }}</td><td class="num">{{ i.amount | euro }}</td></tr>
                }
                <tr class="total"><td>Total</td><td class="num">{{ inv.total | euro }}</td></tr>
              </tbody>
            </table>
            @if (inv.status === 'paid') { <p class="kap-faint">Paid on {{ inv.paidAt | when }}</p> }

            <div class="buttons no-print">
              <button class="kap-btn small ghost" (click)="print(inv)">Print / save PDF</button>
              @if (isAdmin()) {
                @if (inv.status === 'unpaid') {
                  <button class="kap-btn small" (click)="setPaid(inv, true)">Mark as paid</button>
                } @else {
                  <button class="kap-btn small ghost" (click)="setPaid(inv, false)">Mark as unpaid</button>
                }
                <button class="kap-btn small danger" (click)="remove(inv)">Delete</button>
              }
            </div>
          </div>
        } @empty {
          <div class="kap-card kap-empty">No invoices yet.</div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .overdue { color: var(--kap-red); }
    .items { margin: 14px 0 8px; }
    .items .total td { font-weight: 700; border-bottom: none; }
    .buttons { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    @media print {
      .invoice { background: #fff !important; color: #000 !important; border: none !important; }
      .invoice * { color: #000 !important; }
    }
  `]
})
export class InvoicesPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  invoices = toSignal(this.data.mine<IInvoice>('invoices', 'invoiceId'), { initialValue: [] });
  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  sorted = computed(() => [...this.invoices()].sort((a, b) =>
    (a.status === 'unpaid' ? 0 : 1) - (b.status === 'unpaid' ? 0 : 1) ||
    (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)));

  outstanding = computed(() => this.invoices().filter(i => i.status === 'unpaid').reduce((s, i) => s + i.total, 0));
  overdueCount = computed(() => this.invoices().filter(i => this.isOverdue(i)).length);

  /** INV-<year>-<number>, counting this year's invoices. */
  nextNumber = computed(() => {
    const year = new Date().getFullYear();
    const thisYear = this.invoices().filter(i => i.number.startsWith(`INV-${year}-`));
    const highest = Math.max(0, ...thisYear.map(i => Number(i.number.split('-')[2]) || 0));
    return `INV-${year}-${String(highest + 1).padStart(3, '0')}`;
  });

  printing = signal<string | null>(null);

  showForm = false;
  saving = false;
  error = '';
  form = this.blank();

  private blank() {
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);   // 14 days by default
    return { clientId: '', projectId: '', dueDate: due.toISOString().slice(0, 10),
             items: [{ description: '', amount: 0 }] as ILineItem[] };
  }

  projectsFor(clientId: string) {
    return this.projects().filter(p => p.clientId === clientId);
  }

  isOverdue(i: IInvoice) {
    return i.status === 'unpaid' && (toDate(i.dueDate)?.getTime() ?? Infinity) < Date.now();
  }

  label(i: IInvoice) { return i.status === 'paid' ? 'Paid' : this.isOverdue(i) ? 'Overdue' : 'Unpaid'; }
  colour(i: IInvoice) { return i.status === 'paid' ? 'green' : this.isOverdue(i) ? 'red' : 'amber'; }

  async create() {
    const client = this.clients().find(c => c.uid === this.form.clientId);
    const items = this.form.items
      .filter(i => i.description.trim())
      .map(i => ({ description: i.description.trim(), amount: Number(i.amount) || 0 }));
    if (!client || items.length === 0 || !this.form.dueDate) {
      this.error = 'Choose a client, a due date and add at least one item.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const invoice: Omit<IInvoice, 'invoiceId'> = {
        number: this.nextNumber(),
        clientId: client.uid,
        clientName: client.displayName,
        projectId: this.form.projectId || null,
        items,
        total: sumItems(items),
        dueDate: new Date(this.form.dueDate),
        status: 'unpaid',
        paidAt: null,
        createdAt: new Date()
      };
      await this.data.add('invoices', invoice);
      this.form = this.blank();
      this.showForm = false;
    } catch {
      this.error = 'Could not create the invoice. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  setPaid(i: IInvoice, paid: boolean) {
    return this.data.update('invoices', i.invoiceId,
      { status: paid ? 'paid' : 'unpaid', paidAt: paid ? new Date() : null });
  }

  async remove(i: IInvoice) {
    if (confirm(`Delete invoice ${i.number}?`)) await this.data.remove('invoices', i.invoiceId);
  }

  /** Prints just this invoice (the browser's print dialog can save it as a PDF). */
  print(i: IInvoice) {
    this.printing.set(i.invoiceId);
    setTimeout(() => {
      window.print();
      this.printing.set(null);
    }, 50);
  }
}
