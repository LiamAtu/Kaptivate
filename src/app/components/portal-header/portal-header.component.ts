import { Component, Input } from '@angular/core';
import { IonButtons, IonHeader, IonMenuButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';

/** Top bar used on every portal page (menu button on phones + page title). */
@Component({
  selector: 'app-portal-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonButtons, IonMenuButton, IonTitle],
  template: `
    <ion-header class="ion-no-border no-print">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    ion-toolbar {
      --background: rgba(12, 28, 77, 0.92);
      --color: #fff;
      --border-color: rgba(255,255,255,0.1);
    }
    ion-title { font-family: var(--app-font-MainHeading); letter-spacing: 2px; font-size: 1rem; }
  `]
})
export class PortalHeaderComponent {
  @Input() title = '';
}
