import { When } from './common';

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'client';
  companyName?: string;
  phone?: string;
  createdAt: When;
  lastLoginAt: When;
  isActive: boolean;
}
