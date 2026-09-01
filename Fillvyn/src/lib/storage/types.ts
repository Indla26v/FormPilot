/**
 * Storage Domain Types & Repository Interfaces
 * Adheres to Interface Segregation Principle (ISP) and Repository Pattern.
 */

import { FeedbackPayload } from '../feedback/types';
import { ContactPayload } from '../contact/types';

export interface StoredFeedback extends FeedbackPayload {
  id: string;
  timestamp: string;
  status: 'new' | 'reviewed' | 'starred' | 'archived';
  notes?: string;
}

export interface StoredContact extends ContactPayload {
  id: string;
  timestamp: string;
  status: 'new' | 'in_progress' | 'resolved' | 'archived';
  notes?: string;
}

export interface FeedbackFilterOptions {
  rating?: number;
  category?: string;
  persona?: string;
  status?: string;
  search?: string;
}

export interface ContactFilterOptions {
  category?: string;
  status?: string;
  search?: string;
}

export interface FeedbackSummaryKPIs {
  total: number;
  averageRating: number;
  npsScore: number;
  ratingDistribution: Record<number, number>;
  categoryDistribution: Record<string, number>;
  personaDistribution: Record<string, number>;
}

/**
 * Interface Segregation: Feedback Repository
 */
export interface IFeedbackRepository {
  save(feedback: Omit<StoredFeedback, 'id' | 'timestamp' | 'status'> & { id?: string }): Promise<StoredFeedback>;
  findAll(options?: FeedbackFilterOptions): Promise<StoredFeedback[]>;
  findById(id: string): Promise<StoredFeedback | null>;
  updateStatus(id: string, status: StoredFeedback['status']): Promise<StoredFeedback | null>;
  delete(id: string): Promise<boolean>;
  getSummaryKPIs(): Promise<FeedbackSummaryKPIs>;
}

/**
 * Interface Segregation: Contact Repository
 */
export interface IContactRepository {
  save(contact: Omit<StoredContact, 'id' | 'timestamp' | 'status'> & { id?: string }): Promise<StoredContact>;
  findAll(options?: ContactFilterOptions): Promise<StoredContact[]>;
  findById(id: string): Promise<StoredContact | null>;
  updateStatus(id: string, status: StoredContact['status']): Promise<StoredContact | null>;
  delete(id: string): Promise<boolean>;
}
