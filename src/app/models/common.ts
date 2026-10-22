import { Timestamp } from '@angular/fire/firestore';

/** Firestore gives dates back as Timestamps; the app writes plain Dates. */
export type When = Date | Timestamp;

/** A priced line on a proposal or invoice. */
export interface ILineItem {
  description: string;
  amount: number;
}
