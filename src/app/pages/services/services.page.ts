import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SITE } from '../../site-content';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [IonContent, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <ion-content>
      <div class="kap-page">
        <div class="kap-page-head">
          <div>
            <p class="kap-eyebrow">Services</p>
            <h1>What we do</h1>
            <p>Every project is priced to your brief. Tell us what you need and we'll send you a quote.</p>
          </div>
        </div>

        <div class="kap-grid">
          @for (s of site.services; track s.name) {
            <div class="kap-card service">
              <h3>{{ s.name }}</h3>
              <p class="kap-muted">{{ s.blurb }}</p>
              <a class="kap-link" routerLink="/booking" [queryParams]="{ service: s.name }">Book this →</a>
            </div>
          }
        </div>

        <div class="kap-card quote">
          <div>
            <h2>Not sure what you need?</h2>
            <p class="kap-muted">Send us a message and we'll help you plan it.</p>
          </div>
          <a class="kap-btn" routerLink="/contact">Ask for a quote</a>
        </div>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .service { display: flex; flex-direction: column; }
    .service p { flex: 1; }
    .quote { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-top: 18px; }
  `]
})
export class ServicesPage {
  site = SITE;
}
