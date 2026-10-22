import { ILineItem, When } from './common';

export type InvoiceStatus = 'unpaid' | 'paid';

export interface IInvoice {
  invoiceId: string;
  number: string;              // e.g. INV-2026-001
  clientId: string;
  clientName: string;
  projectId: string | null;
  items: ILineItem[];
  total: number;
  dueDate: When;
  status: InvoiceStatus;
  paidAt?: When | null;
  createdAt: When;
}
