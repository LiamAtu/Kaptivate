import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

/** Website navigation bar. Shows "Client portal" once you're signed in. */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, IonHeader, IonToolbar]
})
export class HeaderComponent {
  user$ = inject(AuthService).currentUser$;
  open = false;

  links = [
    { label: 'Home', url: '/home' },
    { label: 'Services', url: '/services' },
    { label: 'About', url: '/about' },
    { label: 'Book', url: '/booking' },
    { label: 'Contact', url: '/contact' },
  ];
}
