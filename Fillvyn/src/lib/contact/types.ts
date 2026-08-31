/**
 * Contact Domain Types & Interfaces
 * Adheres to Interface Segregation Principle (ISP) and Single Responsibility Principle (SRP).
 */

export type ContactCategory = 
  | 'technical_support'
  | 'feature_request'
  | 'ollama_integration'
  | 'bug_report'
  | 'general_inquiry';

export interface ContactPayload {
  name: string;
  email: string;
  category: ContactCategory;
  subject: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ContactSubmissionResult {
  success: boolean;
  message: string;
  referenceId?: string;
  timestamp?: string;
  errors?: Record<string, string>;
}

/**
 * Interface Segregation: Validator only validates
 */
export interface IContactValidator {
  validate(payload: Partial<ContactPayload>): ValidationResult;
}

/**
 * Interface Segregation: Sanitizer only sanitizes
 */
export interface IContactSanitizer {
  sanitize(payload: ContactPayload): ContactPayload;
}

/**
 * Interface Segregation: Notifier/Dispatcher handles dispatching
 */
export interface IContactNotifier {
  send(payload: ContactPayload, referenceId: string): Promise<boolean>;
}

/**
 * Dependency Inversion: Service depends on abstractions
 */
export interface IContactService {
  processInquiry(payload: Partial<ContactPayload>): Promise<ContactSubmissionResult>;
}
