export interface IBooking {
    bookingId: string;
    clientId: string;
    serviceName: string;
    date: Date;
    duration: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    paymentId?: string;
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    createdAt: Date;
  }