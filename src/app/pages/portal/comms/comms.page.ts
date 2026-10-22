import { Component, ElementRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { IonContent } from '@ionic/angular/standalone';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PortalHeaderComponent } from '../../../components/portal-header/portal-header.component';
import { AuthService } from '../../../services/auth';
import { DataService } from '../../../services/data';
import { IMessage, IThread, IUser } from '../../../models';
import { WhenPipe, toDate } from '../../../shared/format';

/**
 * Conversations between a client and the owner.
 * Each conversation (thread) keeps its messages in a sub-collection,
 * and remembers whether the other side has unread messages.
 */
@Component({
  selector: 'app-comms',
  templateUrl: './comms.page.html',
  styleUrls: ['./comms.page.scss'],
  standalone: true,
  imports: [IonContent, FormsModule, PortalHeaderComponent, WhenPipe]
})
export class CommsPage {
  private auth = inject(AuthService);
  private data = inject(DataService);

  @ViewChild('bottom') bottom?: ElementRef<HTMLElement>;

  profile = toSignal(this.auth.profile$);
  isAdmin = computed(() => this.profile()?.role === 'admin');

  threads = toSignal(this.data.mine<IThread>('threads', 'threadId'), { initialValue: [] });
  clients = toSignal(this.auth.isAdmin$.pipe(
    switchMap(admin => admin ? this.data.clients() : of([] as IUser[]))
  ), { initialValue: [] });

  sorted = computed(() => [...this.threads()].sort((a, b) =>
    (toDate(b.lastMessageAt)?.getTime() ?? 0) - (toDate(a.lastMessageAt)?.getTime() ?? 0)));

  selectedId = signal<string | null>(null);
  selected = computed(() => this.threads().find(t => t.threadId === this.selectedId()) ?? null);

  messages = toSignal(toObservable(this.selectedId).pipe(
    switchMap(id => id ? this.data.messages<IMessage>(id) : of([] as IMessage[]))
  ), { initialValue: [] });

  draft = '';
  sending = false;

  // New conversation
  starting = false;
  newSubject = '';
  newClient = '';
  newMessage = '';
  error = '';

  constructor() {
    // Open the newest conversation once, when the page first loads on a wide screen
    let autoOpened = false;
    effect(() => {
      const newest = this.sorted()[0];
      if (!autoOpened && newest) {
        autoOpened = true;
        if (window.innerWidth > 900) untracked(() => this.open(newest));
      }
    });
    // Keep the newest message in view
    effect(() => {
      this.messages();
      setTimeout(() => this.bottom?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 50);
    });
  }

  isUnread(t: IThread) {
    return this.isAdmin() ? t.unreadByAdmin : t.unreadByClient;
  }

  open(t: IThread) {
    this.selectedId.set(t.threadId);
    this.starting = false;
    if (this.isUnread(t)) {
      this.data.update('threads', t.threadId, this.isAdmin() ? { unreadByAdmin: false } : { unreadByClient: false });
    }
  }

  isMine(m: IMessage) {
    return m.senderId === this.profile()?.uid;
  }

  async send() {
    const thread = this.selected();
    const profile = this.profile();
    const content = this.draft.trim();
    if (!thread || !profile || !content) return;

    this.sending = true;
    try {
      await this.post(thread.threadId, content);
      this.draft = '';
    } finally {
      this.sending = false;
    }
  }

  /** Adds a message and flags the thread as unread for the other side. */
  private async post(threadId: string, content: string) {
    const profile = this.profile()!;
    const message: Omit<IMessage, 'messageId'> = {
      senderId: profile.uid,
      senderName: profile.displayName,
      senderRole: profile.role,
      content,
      sentAt: new Date()
    };
    await this.data.add(`threads/${threadId}/messages`, message);
    await this.data.update('threads', threadId, {
      lastMessage: content.slice(0, 140),
      lastMessageAt: new Date(),
      unreadByAdmin: profile.role === 'client',
      unreadByClient: profile.role === 'admin'
    });
  }

  async startThread() {
    const profile = this.profile();
    if (!profile) return;
    const client = this.isAdmin() ? this.clients().find(c => c.uid === this.newClient) : profile;
    if (!client || !this.newSubject.trim() || !this.newMessage.trim()) {
      this.error = this.isAdmin() ? 'Choose a client and fill in both boxes.' : 'Add a subject and a message.';
      return;
    }

    this.error = '';
    this.sending = true;
    try {
      const thread: Omit<IThread, 'threadId'> = {
        clientId: client.uid,
        clientName: client.displayName,
        subject: this.newSubject.trim(),
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadByAdmin: false,
        unreadByClient: false,
        createdAt: new Date()
      };
      const ref = await this.data.add('threads', thread);
      await this.post(ref.id, this.newMessage.trim());
      this.newSubject = this.newMessage = this.newClient = '';
      this.starting = false;
      this.selectedId.set(ref.id);
    } catch {
      this.error = 'Could not start the conversation. Please try again.';
    } finally {
      this.sending = false;
    }
  }

  onKey(event: KeyboardEvent) {
    // Enter sends, Shift+Enter adds a new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
