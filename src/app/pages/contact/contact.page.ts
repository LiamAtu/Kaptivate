import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { DataService } from '../../services/data';
import { IEnquiry } from '../../models';
import { SITE } from '../../site-content';

/** Public contact form. Anyone can send one; only the owner can read them (see firestore.rules). */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [IonContent, FormsModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <ion-content>
      <div class="kap-page layout">
        <div>
          <p class="kap-eyebrow">Contact</p>
          <h1 class="title">Let's talk about your project</h1>
          <p class="kap-muted">Send us a message and we'll get back to you, usually within one working day.</p>
          <ul class="details">
            @if (site.email) { <li><a [href]="'mailto:' + site.email">{{ site.email }}</a></li> }
            @if (site.phone) { <li><a [href]="'tel:' + site.phone">{{ site.phone }}</a></li> }
            <li>{{ site.location }}</li>
          </ul>
        </div>

        <div class="kap-card">
          @if (sent) {
            <h2>Thanks, {{ sentName }}!</h2>
            <p class="kap-muted">Your message has been sent. We'll be in touch soon.</p>
            <button class="kap-btn ghost" (click)="sent = false">Send another message</button>
          } @else {
            <div class="kap-field">
              <label>Name</label>
              <input class="kap-control" [(ngModel)]="form.name" maxlength="100" />
            </div>
            <div class="kap-field">
              <label>Email</label>
              <input class="kap-control" type="email" [(ngModel)]="form.email" maxlength="200" />
            </div>
            <div class="kap-field">
              <label>Phone (optional)</label>
              <input class="kap-control" type="tel" [(ngModel)]="form.phone" maxlength="40" />
            </div>
            <div class="kap-field">
              <label>Message</label>
              <textarea class="kap-control" [(ngModel)]="form.message" maxlength="3000"
                        placeholder="What are you planning, and when?"></textarea>
            </div>
            @if (error) { <p class="kap-alert">{{ error }}</p> }
            <button class="kap-btn" (click)="send()" [disabled]="sending">{{ sending ? 'Sending…' : 'Send message' }}</button>
          }
        </div>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: start; }
    .title { font-family: var(--app-font-MainHeading); font-size: 2rem; margin: 8px 0 14px; }
    .details { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 8px; }
    .details a { color: #fff; }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class ContactPage {
  private data = inject(DataService);

  site = SITE;
  form = { name: '', email: '', phone: '', message: '' };
  sending = false;
  sent = false;
  sentName = '';
  error = '';

  async send() {
    const { name, email, phone, message } = this.form;
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim()) || !message.trim()) {
      this.error = 'Please add your name, a valid email address and a message.';
      return;
    }
    this.sending = true;
    this.error = '';
    try {
      const enquiry: Omit<IEnquiry, 'enquiryId'> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
        handled: false,
        createdAt: new Date()
      };
      await this.data.add('enquiries', enquiry);
      this.sentName = name.trim().split(' ')[0];
      this.form = { name: '', email: '', phone: '', message: '' };
      this.sent = true;
    } catch {
      this.error = 'Sorry, your message could not be sent. Please try again.';
    } finally {
      this.sending = false;
    }
  }
}
