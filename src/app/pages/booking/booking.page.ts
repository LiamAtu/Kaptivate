import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';
import { BookingStatus, IBooking } from '../../models';
import { WhenPipe, toDate } from '../../shared/format';
import { SITE } from '../../site-content';

/**
 * Booking requests. You need an account so the booking can be linked
 * to your client portal; the owner confirms or declines each request.
 */
@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [IonContent, FormsModule, RouterLink, HeaderComponent, FooterComponent, WhenPipe],
  template: `
    <app-header></app-header>
    <ion-content>
      <div class="kap-page narrow">
        <p class="kap-eyebrow">Booking</p>
        <h1 class="title">Book a shoot</h1>
        <p class="kap-muted">Choose a service and a date. We'll confirm availability and send you a quote.</p>

        @if (profile(); as p) {
          <div class="kap-card">
            <div class="kap-form-grid">
              <div class="kap-field">
                <label>Service</label>
                <select class="kap-control" [(ngModel)]="form.serviceName">
                  @for (s of site.services; track s.name) { <option [value]="s.name">{{ s.name }}</option> }
                </select>
              </div>
              <div class="kap-field">
                <label>Preferred date</label>
                <input class="kap-control" type="date" [min]="today" [(ngModel)]="form.date" />
              </div>
              <div class="kap-field">
                <label>Hours needed</label>
                <input class="kap-control" type="number" min="1" max="24" [(ngModel)]="form.duration" />
              </div>
              <div class="kap-field">
                <label>Location</label>
                <input class="kap-control" [(ngModel)]="form.location" placeholder="Town or venue" />
              </div>
            </div>
            <div class="kap-field">
              <label>Anything else?</label>
              <textarea class="kap-control" [(ngModel)]="form.notes"></textarea>
            </div>
            @if (message) { <p class="kap-alert ok">{{ message }}</p> }
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="book(p.uid, p.displayName)" [disabled]="saving">
              {{ saving ? 'Sending…' : 'Request booking' }}
            </button>
          </div>

          @if (myBookings().length) {
            <h2 class="sub">Your bookings</h2>
            @for (b of myBookings(); track b.bookingId) {
              <div class="kap-card kap-row">
                <div>
                  <strong>{{ b.serviceName }}</strong>
                  <div class="kap-faint">{{ b.date | when }} · {{ b.duration }} h{{ b.location ? ' · ' + b.location : '' }}</div>
                </div>
                <div class="kap-row">
                  <span [class]="'kap-chip ' + colour(b.status)">{{ b.status }}</span>
                  @if (b.status === 'pending' || b.status === 'confirmed') {
                    <button class="kap-btn small danger" (click)="cancel(b)">Cancel</button>
                  }
                </div>
              </div>
            }
          }
        } @else {
          <div class="kap-card signin">
            <h2>Sign in to book</h2>
            <p class="kap-muted">Bookings are linked to your client portal, where you'll also get your quote and contract.</p>
            <div class="cta">
              <a class="kap-btn" routerLink="/signup">Create an account</a>
              <a class="kap-btn ghost" routerLink="/login" [queryParams]="{ returnUrl: '/booking' }">Sign in</a>
            </div>
            <p class="kap-faint">Just have a question? <a class="kap-link" routerLink="/contact">Send us a message</a> instead.</p>
          </div>
        }
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .narrow { max-width: 820px; }
    .title { font-family: var(--app-font-MainHeading); font-size: 2rem; margin: 8px 0 10px; }
    .sub { font-family: var(--app-font-MainHeading); font-size: 1.1rem; margin: 30px 0 14px; }
    .cta { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
  `]
})
export class BookingPage {
  private auth = inject(AuthService);
  private data = inject(DataService);
  private route = inject(ActivatedRoute);

  site = SITE;
  today = new Date().toISOString().slice(0, 10);

  profile = toSignal(this.auth.profile$);
  private bookings = toSignal(this.data.mine<IBooking>('bookings', 'bookingId'), { initialValue: [] });

  /** Only your own bookings (the owner manages all of them in the portal). */
  myBookings = computed(() => this.bookings()
    .filter(b => b.clientId === this.profile()?.uid)
    .sort((a, b) => (toDate(a.date)?.getTime() ?? 0) - (toDate(b.date)?.getTime() ?? 0)));

  form = {
    serviceName: this.route.snapshot.queryParamMap.get('service') ?? SITE.services[0].name,
    date: '',
    duration: 4,
    location: '',
    notes: ''
  };
  saving = false;
  message = '';
  error = '';

  async book(uid: string, name: string) {
    if (!this.form.date) {
      this.error = 'Please choose a date.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.message = '';
    try {
      const booking: Omit<IBooking, 'bookingId'> = {
        clientId: uid,
        clientName: name,
        serviceName: this.form.serviceName,
        date: new Date(this.form.date),
        duration: Number(this.form.duration) || 1,
        location: this.form.location.trim(),
        notes: this.form.notes.trim(),
        status: 'pending',
        createdAt: new Date()
      };
      await this.data.add('bookings', booking);
      this.message = 'Booking requested! We will confirm it shortly.';
      this.form = { ...this.form, date: '', location: '', notes: '' };
    } catch {
      this.error = 'Could not send your booking. Please try again.';
    } finally {
      this.saving = false;
    }
  }

  async cancel(b: IBooking) {
    if (confirm('Cancel this booking?')) {
      await this.data.update('bookings', b.bookingId, { status: 'cancelled' });
    }
  }

  colour(status: BookingStatus) {
    return { pending: 'amber', confirmed: 'green', cancelled: 'red', completed: 'grey' }[status];
  }
}
