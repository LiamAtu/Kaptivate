import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonContent, IonIcon, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline, filmOutline, folderOpenOutline, chatbubblesOutline, documentTextOutline,
  createOutline, receiptOutline, clipboardOutline, peopleOutline, mailUnreadOutline,
  logOutOutline, globeOutline
} from 'ionicons/icons';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { IThread } from '../../../models';

interface NavItem { label: string; url: string; icon: string; }

/** The portal frame: side menu (always open on wide screens) + the current page. */
@Component({
  selector: 'app-portal-layout',
  templateUrl: './portal-layout.page.html',
  styleUrls: ['./portal-layout.page.scss'],
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, IonSplitPane, IonMenu, IonContent,
            IonMenuToggle, IonIcon, IonRouterOutlet]
})
export class PortalLayoutPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  profile$ = this.auth.profile$;

  /** Conversations with a message the signed-in person hasn't read yet. */
  unread$ = combineLatest([this.profile$, this.data.mine<IThread>('threads', 'threadId')]).pipe(
    map(([p, threads]) => threads.filter(t =>
      p?.role === 'admin' ? t.unreadByAdmin : t.unreadByClient).length)
  );

  items: NavItem[] = [
    { label: 'Dashboard', url: '/portal/dashboard', icon: 'grid-outline' },
    { label: 'Projects', url: '/portal/progress', icon: 'film-outline' },
    { label: 'Files', url: '/portal/files', icon: 'folder-open-outline' },
    { label: 'Messages', url: '/portal/comms', icon: 'chatbubbles-outline' },
    { label: 'Quotes', url: '/portal/proposals', icon: 'document-text-outline' },
    { label: 'Contracts', url: '/portal/contract', icon: 'create-outline' },
    { label: 'Invoices', url: '/portal/invoices', icon: 'receipt-outline' },
    { label: 'Project brief', url: '/portal/forms', icon: 'clipboard-outline' },
  ];

  adminItems: NavItem[] = [
    { label: 'Clients', url: '/portal/clients', icon: 'people-outline' },
    { label: 'Enquiries & bookings', url: '/portal/enquiries', icon: 'mail-unread-outline' },
  ];

  constructor() {
    addIcons({
      gridOutline, filmOutline, folderOpenOutline, chatbubblesOutline, documentTextOutline,
      createOutline, receiptOutline, clipboardOutline, peopleOutline, mailUnreadOutline,
      logOutOutline, globeOutline
    });
  }

  logout() {
    this.auth.logout();
  }
}
