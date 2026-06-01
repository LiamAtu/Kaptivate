export interface IUser {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'client';
    companyName?: string;
    phone?: string;
    createdAt: Date;
    lastLoginAt: Date;
    isActive: boolean;
  }