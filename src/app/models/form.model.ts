import { When } from './common';

/** The project brief a client fills in before a shoot. */
export interface IBrief {
  briefId: string;
  clientId: string;
  clientName: string;
  projectType: string;
  shootDate: string;
  location: string;
  budget: string;
  videoLength: string;
  description: string;
  references: string;
  submittedAt: When;
}
