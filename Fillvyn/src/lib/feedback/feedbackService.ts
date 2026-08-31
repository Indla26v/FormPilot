import {
  FeedbackPayload,
  FeedbackCategory,
  UserPersona,
  FeedbackValidationResult,
  FeedbackSubmissionResult,
  IFeedbackValidator,
  IFeedbackSanitizer,
  IFeedbackNotifier,
  IFeedbackService,
} from './types';

const VALID_CATEGORIES: FeedbackCategory[] = [
  'feature_request',
  'accuracy_quality',
  'ui_ux_design',
  'ollama_speed',
  'general_experience',
];

const VALID_PERSONAS: UserPersona[] = [
  'job_seeker',
  'software_engineer',
  'recruiter',
  'student',
  'other',
];

/**
 * SRP: FeedbackValidator verifies input structure and range constraints.
 */
export class FeedbackValidator implements IFeedbackValidator {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(payload: Partial<FeedbackPayload>): FeedbackValidationResult {
    const errors: Record<string, string> = {};

    if (payload.rating === undefined || payload.rating < 1 || payload.rating > 5) {
      errors.rating = 'Please provide a rating between 1 and 5.';
    }

    if (!payload.category || !VALID_CATEGORIES.includes(payload.category as FeedbackCategory)) {
      errors.category = 'Please select a valid feedback category.';
    }

    if (!payload.persona || !VALID_PERSONAS.includes(payload.persona as UserPersona)) {
      errors.persona = 'Please select your role or persona.';
    }

    if (!payload.feedbackText || payload.feedbackText.trim().length < 5) {
      errors.feedbackText = 'Feedback must be at least 5 characters long.';
    } else if (payload.feedbackText.trim().length > 4000) {
      errors.feedbackText = 'Feedback must not exceed 4000 characters.';
    }

    if (payload.npsScore !== undefined && (payload.npsScore < 0 || payload.npsScore > 10)) {
      errors.npsScore = 'Recommendation score must be between 0 and 10.';
    }

    if (payload.email && payload.email.trim().length > 0 && !this.emailRegex.test(payload.email.trim())) {
      errors.email = 'Please provide a valid email address or leave it empty.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * SRP: FeedbackSanitizer removes malicious script/HTML injections.
 */
export class FeedbackSanitizer implements IFeedbackSanitizer {
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>?/gm, '').trim();
  }

  sanitize(payload: FeedbackPayload): FeedbackPayload {
    return {
      rating: Math.min(5, Math.max(1, Math.round(payload.rating))),
      category: payload.category,
      persona: payload.persona,
      feedbackText: this.stripHtml(payload.feedbackText),
      npsScore: payload.npsScore !== undefined ? Math.min(10, Math.max(0, Math.round(payload.npsScore))) : undefined,
      email: payload.email ? this.stripHtml(payload.email).toLowerCase() : undefined,
    };
  }
}

/**
 * OCP / LSP: ConsoleFeedbackNotifier records the feedback entry.
 * Can be swapped with a DatabaseNotifier, AnalyticsNotifier, or SlackWebhookNotifier.
 */
export class ConsoleFeedbackNotifier implements IFeedbackNotifier {
  async record(payload: FeedbackPayload, feedbackId: string): Promise<boolean> {
    console.log(
      `[FeedbackSubmission:${feedbackId}] Rating: ${payload.rating}/5 | Category: ${payload.category} | Persona: ${payload.persona} | NPS: ${payload.npsScore ?? 'N/A'}`
    );
    return true;
  }
}

/**
 * DIP: FeedbackService orchestrates validation, sanitization, and recording via injected interfaces.
 */
export class FeedbackService implements IFeedbackService {
  constructor(
    private validator: IFeedbackValidator = new FeedbackValidator(),
    private sanitizer: IFeedbackSanitizer = new FeedbackSanitizer(),
    private notifier: IFeedbackNotifier = new ConsoleFeedbackNotifier()
  ) {}

  async submitFeedback(payload: Partial<FeedbackPayload>): Promise<FeedbackSubmissionResult> {
    const validation = this.validator.validate(payload);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed. Please verify the required feedback fields.',
        errors: validation.errors,
      };
    }

    const sanitizedPayload = this.sanitizer.sanitize(payload as FeedbackPayload);
    const feedbackId = `FDB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    try {
      const recorded = await this.notifier.record(sanitizedPayload, feedbackId);
      if (!recorded) {
        throw new Error('Failed to record feedback entry');
      }

      return {
        success: true,
        message: 'Thank you for your valuable feedback! It directly shapes the future of Fillvyn.',
        feedbackId,
        timestamp,
      };
    } catch (err) {
      console.error('Feedback submission error:', err);
      return {
        success: false,
        message: 'An error occurred while saving your feedback. Please try again.',
      };
    }
  }
}

export const defaultFeedbackService = new FeedbackService();
