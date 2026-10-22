import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SITE } from '../../site-content';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <ion-content>
      <section class="hero">
        <p class="kap-eyebrow">Video production · Photography</p>
        <h1>KAPTIVATE</h1>
        <p class="tagline">{{ site.tagline }}</p>
        <p class="kap-muted">{{ site.intro }}</p>
        <div class="cta">
          <a class="kap-btn" routerLink="/booking">Book a shoot</a>
          <a class="kap-btn ghost" routerLink="/services">Our services</a>
        </div>
      </section>

      <section class="kap-page">
        <div class="section-head">
          <p class="kap-eyebrow">What we do</p>
          <h2>Services</h2>
        </div>
        <div class="kap-grid">
          @for (s of site.services.slice(0, 3); track s.name) {
            <div class="kap-card">
              <h3>{{ s.name }}</h3>
              <p class="kap-muted">{{ s.blurb }}</p>
            </div>
          }
        </div>
        <a class="kap-link" routerLink="/services">See all services →</a>
      </section>

      <section class="kap-page">
        <div class="section-head">
          <p class="kap-eyebrow">How it works</p>
          <h2>From idea to final cut</h2>
        </div>
        <div class="steps">
          @for (p of site.process; track p.step; let i = $index) {
            <div class="kap-card step">
              <span class="num">{{ i + 1 }}</span>
              <h3>{{ p.step }}</h3>
              <p class="kap-muted">{{ p.text }}</p>
            </div>
          }
        </div>
      </section>

      <section class="kap-page">
        <div class="kap-card portal">
          <div>
            <h2>Your own client portal</h2>
            <p class="kap-muted">Follow every stage of your project, share files, review quotes and contracts,
              pay invoices and message us — all in one place.</p>
          </div>
          <a class="kap-btn" routerLink="/signup">Create an account</a>
        </div>
      </section>

      <app-footer></app-footer>
    </ion-content>
  `,
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  site = SITE;
}
