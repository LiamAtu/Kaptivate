import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { DataService } from '../../../services/data';
import { BookingStatus, IBooking, IEnquiry } from '../../../models';
import { WhenPipe, toDate } from '../../../shared/format';

/** Owner only: messages from the Contact page and booking requests from clients. */
@Component({
  selector: 'app-enquiries',
  standalone: true,
  imports: [IonContent, PortalHeaderComponent, WhenPipe],
  template: `
    <app-portal-header title="Enquiries & bookings"></app-portal-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Owner</p>
            <h1>Enquiries &amp; bookings</h1>
          </div>
        </div>

        <div class="kap-card">
          <div class="kap-row">
            <h2>Booking requests</h2>
            <span class="kap-faint">{{ pendingBookings() }} waiting</span>
          </div>
          <div class="kap-scroll">
            <table class="kap-table">
              <thead><tr><th>Client</th><th>Service</th><th>Date</th><th>Details</th><th>Status</th><th></th></tr></thead>
              <tbody>
                @for (b of bookings(); track b.bookingId) {
                  <tr>
                    <td>{{ b.clientName }}</td>
                    <td>{{ b.serviceName }}</td>
                    <td>{{ b.date | when }}</td>
                    <td class="kap-faint">{{ b.duration }} h{{ b.location ? ' · ' + b.location : '' }}{{ b.notes ? ' · ' + b.notes : '' }}</td>
                    <td><span [class]="'kap-chip ' + colour(b.status)">{{ b.status }}</span></td>
                    <td class="num actions">
                      @if (b.status === 'pending') {
                        <button class="kap-btn small" (click)="setStatus(b, 'confirmed')">Confirm</button>
                        <button class="kap-btn small danger" (click)="setStatus(b, 'cancelled')">Decline</button>
                      }
                      @if (b.status === 'confirmed') {
                        <button class="kap-btn small ghost" (click)="setStatus(b, 'completed')">Mark done</button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="kap-empty">No booking requests.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="kap-card">
          <div class="kap-row">
            <h2>Contact form enquiries</h2>
            <span class="kap-faint">{{ newEnquiries() }} new</span>
          </div>
          @for (e of enquiries(); track e.enquiryId) {
            <div class="enquiry" [class.handled]="e.handled">
              <div class="kap-row">
                <div>
                  <strong>{{ e.name }}</strong>
                  <span class="kap-faint"> · {{ e.createdAt | when:'short' }}</span>
                  <div>
                    <a class="kap-link" [href]="'mailto:' + e.email">{{ e.email }}</a>
                    @if (e.phone) { <span class="kap-faint"> · {{ e.phone }}</span> }
                  </div>
                </div>
                <button class="kap-btn small ghost" (click)="toggle(e)">{{ e.handled ? 'Mark as new' : 'Mark handled' }}</button>
              </div>
              <p>{{ e.message }}</p>
            </div>
          } @empty {
            <p class="kap-empty">No enquiries yet.</p>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .actions { display: flex; gap: 6px; justify-content: flex-end; }
    .enquiry { padding: 16px 0; border-bottom: 1px solid var(--kap-line); }
    .enquiry:last-child { border-bottom: none; }
    .enquiry p { white-space: pre-wrap; margin: 10px 0 0; color: var(--kap-muted); }
    .enquiry.handled { opacity: 0.55; }
  `]
})
export class EnquiriesPage {
  private data = inject(DataService);

  private allEnquiries = toSignal(this.data.watch<IEnquiry>('enquiries', 'enquiryId'), { initialValue: [] });
  private allBookings = toSignal(this.data.watch<IBooking>('bookings', 'bookingId'), { initialValue: [] });

  enquiries = computed(() => [...this.allEnquiries()].sort((a, b) =>
    Number(a.handled) - Number(b.handled) ||
    (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)));

  bookings = computed(() => [...this.allBookings()].sort((a, b) =>
    (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
    (toDate(a.date)?.getTime() ?? 0) - (toDate(b.date)?.getTime() ?? 0)));

  newEnquiries = computed(() => this.allEnquiries().filter(e => !e.handled).length);
  pendingBookings = computed(() => this.allBookings().filter(b => b.status === 'pending').length);

  toggle(e: IEnquiry) {
    return this.data.update('enquiries', e.enquiryId, { handled: !e.handled });
  }

  setStatus(b: IBooking, status: BookingStatus) {
    return this.data.update('bookings', b.bookingId, { status });
  }

  colour(status: BookingStatus) {
    return { pending: 'amber', confirmed: 'green', cancelled: 'red', completed: 'grey' }[status];
  }
}
