import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import {
  IBooking, IEnquiry, IInvoice, IProject, IProposal, IThread, IContract
} from '../../../models';
import { EuroPipe, WhenPipe, toDate } from '../../../shared/format';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/** Overview: what needs attention right now, for a client or for the owner. */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink, PortalHeaderComponent, EuroPipe, WhenPipe]
})
export class DashboardPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  projects = toSignal(this.data.mine<IProject>('projects', 'projectId'), { initialValue: [] });
  threads = toSignal(this.data.mine<IThread>('threads', 'threadId'), { initialValue: [] });
  proposals = toSignal(this.data.mine<IProposal>('proposals', 'proposalId'), { initialValue: [] });
  contracts = toSignal(this.data.mine<IContract>('contracts', 'contractId'), { initialValue: [] });
  invoices = toSignal(this.data.mine<IInvoice>('invoices', 'invoiceId'), { initialValue: [] });
  bookings = toSignal(this.data.mine<IBooking>('bookings', 'bookingId'), { initialValue: [] });

  /** Enquiries are only readable by the owner, so clients never ask for them. */
  enquiries = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.watch<IEnquiry>('enquiries', 'enquiryId') : of([] as IEnquiry[]))
  ), { initialValue: [] });

  firstName = computed(() => (this.profile()?.displayName ?? '').split(' ')[0]);

  activeProjects = computed(() =>
    this.projects()
      .filter(p => p.status !== 'completed')
      .sort((a, b) => (toDate(a.dueDate)?.getTime() ?? Infinity) - (toDate(b.dueDate)?.getTime() ?? Infinity)));

  unread = computed(() => this.threads().filter(t => this.isAdmin() ? t.unreadByAdmin : t.unreadByClient).length);

  /** Quotes waiting for the client's answer. */
  openQuotes = computed(() => this.proposals().filter(p => p.status === 'sent').length);

  /** Contracts still to be signed. */
  unsigned = computed(() => this.contracts().filter(c => c.status === 'sent').length);

  unpaid = computed(() => this.invoices().filter(i => i.status === 'unpaid'));
  unpaidTotal = computed(() => this.unpaid().reduce((sum, i) => sum + i.total, 0));
  overdue = computed(() => this.unpaid().filter(i => (toDate(i.dueDate)?.getTime() ?? 0) < Date.now()).length);

  newEnquiries = computed(() => this.enquiries().filter(e => !e.handled).length);
  pendingBookings = computed(() => this.bookings().filter(b => b.status === 'pending').length);

  statusLabel(p: IProject) {
    return { not_started: 'Not started', in_progress: 'In progress', review: 'In review', completed: 'Completed' }[p.status];
  }

  nextStage(p: IProject) {
    return p.stages.find(s => !s.completed)?.label ?? 'All stages complete';
  }
}
