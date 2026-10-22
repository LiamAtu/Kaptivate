import { When } from './common';

export interface IMessage {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  content: string;
  sentAt: When;
}
