import { When } from './common';

export type ContractStatus = 'sent' | 'signed';

/** A contract the client signs by typing their full name. */
export interface IContract {
  contractId: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  title: string;
  terms: string;
  status: ContractStatus;
  signedName?: string | null;
  signedAt?: When | null;
  createdAt: When;
}
