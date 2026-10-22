import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { DataService } from '../../../services/data';
import { IInvoice, IProject, IUser } from '../../../models';
import { EuroPipe, WhenPipe, toDate } from '../../../shared/format';

/** Owner only: every client account with their projects and money owed. */
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [IonContent, FormsModule, RouterLink, PortalHeaderComponent, EuroPipe, WhenPipe],
  template: `
    <app-portal-header title="Clients"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Owner</p>
            <h1>Clients</h1>
            <p>Clients appear here once they create an account on the website.</p>
          </div>
          <input class="kap-control search" placeholder="Search clients…"
                 [ngModel]="search()" (ngModelChange)="search.set($event)" />
        </div>

        <div class="kap-card kap-scroll">
          <table class="kap-table">
            <thead>
              <tr>
                <th>Client</th><th>Contact</th><th>Projects</th>
                <th class="num">Unpaid</th><th>Joined</th><th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of shown(); track c.uid) {
                <tr>
                  <td><strong>{{ c.displayName }}</strong><div class="kap-faint">{{ c.companyName }}</div></td>
                  <td>
                    <a class="kap-link" [href]="'mailto:' + c.email">{{ c.email }}</a>
                    @if (c.phone) { <div class="kap-faint">{{ c.phone }}</div> }
                  </td>
                  <td>{{ activeCount(c.uid) }} active · {{ projectCount(c.uid) }} total</td>
                  <td class="num">{{ unpaid(c.uid) | euro }}</td>
                  <td class="kap-faint">{{ c.createdAt | when }}</td>
                  <td class="num">
                    <a class="kap-btn small ghost" routerLink="/portal/progress" [queryParams]="{ client: c.uid }">New project</a>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="kap-empty">No clients yet.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`.search { width: 260px; }`]
})
export class ClientsPage {
  private data = inject(DataService);

  clients = toSignal(this.data.clients(), { initialValue: [] });
  projects = toSignal(this.data.watch<IProject>('projects', 'projectId'), { initialValue: [] });
  invoices = toSignal(this.data.watch<IInvoice>('invoices', 'invoiceId'), { initialValue: [] });

  search = signal('');

  shown = computed(() => {
    const q = this.search().toLowerCase();
    return this.clients()
      .filter(c => !q || `${c.displayName} ${c.email} ${c.companyName ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0));
  });

  projectCount(uid: string) { return this.projects().filter(p => p.clientId === uid).length; }
  activeCount(uid: string) { return this.projects().filter(p => p.clientId === uid && p.status !== 'completed').length; }
  unpaid(uid: string) {
    return this.invoices().filter(i => i.clientId === uid && i.status === 'unpaid').reduce((s, i) => s + i.total, 0);
  }
}
