import { ILineItem, When } from './common';

export type ProposalStatus = 'sent' | 'accepted' | 'declined';

/** A quote the owner sends a client, which the client accepts or declines. */
export interface IProposal {
  proposalId: string;
  clientId: string;
  clientName: string;
  projectId: string | null;
  title: string;
  items: ILineItem[];
  total: number;
  notes: string;
  validUntil: When | null;
  status: ProposalStatus;
  respondedAt?: When | null;
  createdAt: When;
}
