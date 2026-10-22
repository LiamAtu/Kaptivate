import { When } from './common';

/** A message sent from the public Contact page (no account needed). */
export interface IEnquiry {
  enquiryId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  handled: boolean;
  createdAt: When;
}
