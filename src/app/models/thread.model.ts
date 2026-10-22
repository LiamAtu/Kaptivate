import { When } from './common';

export interface IThread {
  threadId: string;
  clientId: string;
  clientName: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: When;
  unreadByAdmin: boolean;
  unreadByClient: boolean;
  createdAt: When;
}
