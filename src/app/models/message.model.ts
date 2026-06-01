export interface IMessage {
    messageId: string;
    senderId: string;
    senderRole: 'admin' | 'client';
    content: string;
    sentAt: Date;
    readAt?: Date;
  }