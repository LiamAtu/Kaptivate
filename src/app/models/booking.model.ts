import { When } from './common';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface IBooking {
  bookingId: string;
  clientId: string;
  clientName: string;
  serviceName: string;
  date: When;
  duration: number;            // hours
  location?: string;
  notes?: string;
  status: BookingStatus;
  createdAt: When;
}
