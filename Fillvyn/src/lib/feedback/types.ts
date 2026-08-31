/**
 * Feedback Domain Types & SOLID Interfaces
 * Adheres to Interface Segregation Principle (ISP) and Single Responsibility Principle (SRP).
 */

export type FeedbackCategory =
  | 'feature_request'
  | 'accuracy_quality'
  | 'ui_ux_design'
  | 'ollama_speed'
  | 'general_experience';

export type UserPersona =
  | 'job_seeker'
  | 'software_engineer'
  | 'recruiter'
  | 'student'
  | 'other';

export interface FeedbackPayload {
  rating: number; // 1 to 5
  category: FeedbackCategory;
  persona: UserPersona;
  feedbackText: string;
  npsScore?: number; // 0 to 10
  email?: string;
}

export interface FeedbackValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FeedbackSubmissionResult {
  success: boolean;
  message: string;
  feedbackId?: string;
  timestamp?: string;
  errors?: Record<string, string>;
}

/**
 * ISP: Validator is solely responsible for validating feedback data
 */
export interface IFeedbackValidator {
  validate(payload: Partial<FeedbackPayload>): FeedbackValidationResult;
}

/**
 * ISP: Sanitizer is solely responsible for sanitizing input strings
 */
export interface IFeedbackSanitizer {
  sanitize(payload: FeedbackPayload): FeedbackPayload;
}

/**
 * ISP / OCP: Extensible notifier interface
 */
export interface IFeedbackNotifier {
  record(payload: FeedbackPayload, feedbackId: string): Promise<boolean>;
}

/**
 * DIP: Feedback service orchestrator depending on abstractions
 */
export interface IFeedbackService {
  submitFeedback(payload: Partial<FeedbackPayload>): Promise<FeedbackSubmissionResult>;
}
