export interface IThread {
    threadId: string;
    clientId: string;
    subject: string;
    lastMessage: string;
    lastMessageAt: Date;
    unreadByAdmin: boolean;
    unreadByClient: boolean;
    createdAt: Date;
  }