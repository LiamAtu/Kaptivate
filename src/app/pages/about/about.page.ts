import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SITE } from '../../site-content';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [IonContent, RouterLink, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <ion-content>
      <div class="kap-page narrow">
        <p class="kap-eyebrow">About</p>
        <h1 class="title">About Kaptivate</h1>
        @for (p of site.about; track $index) { <p class="lead">{{ p }}</p> }

        <div class="kap-card values">
          <div><h3>Planned properly</h3><p class="kap-muted">Every project starts with a clear brief, quote and contract.</p></div>
          <div><h3>Always in the loop</h3><p class="kap-muted">Follow each stage of production in your client portal.</p></div>
          <div><h3>Delivered simply</h3><p class="kap-muted">Download your finished files from one secure place.</p></div>
        </div>

        <div class="cta">
          <a class="kap-btn" routerLink="/contact">Get in touch</a>
          <a class="kap-btn ghost" routerLink="/services">See our services</a>
        </div>
      </div>
      <app-footer></app-footer>
    </ion-content>
  `,
  styles: [`
    .narrow { max-width: 780px; }
    .title { font-family: var(--app-font-MainHeading); font-size: 2.2rem; margin: 8px 0 20px; }
    .lead { font-size: 1.08rem; line-height: 1.7; color: var(--kap-muted); }
    .values { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin: 32px 0; }
    .cta { display: flex; gap: 12px; flex-wrap: wrap; }
  `]
})
export class AboutPage {
  site = SITE;
}
