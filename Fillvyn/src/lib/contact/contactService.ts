import {
  ContactPayload,
  ContactCategory,
  ValidationResult,
  ContactSubmissionResult,
  IContactValidator,
  IContactSanitizer,
  IContactNotifier,
  IContactService,
} from './types';
import { defaultContactRepository } from '../storage/store';
import { IContactRepository } from '../storage/types';

const VALID_CATEGORIES: ContactCategory[] = [
  'technical_support',
  'feature_request',
  'ollama_integration',
  'bug_report',
  'general_inquiry',
];

/**
 * SRP: ContactValidator is solely responsible for verifying input integrity.
 */
export class ContactValidator implements IContactValidator {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(payload: Partial<ContactPayload>): ValidationResult {
    const errors: Record<string, string> = {};

    if (!payload.name || payload.name.trim().length < 2) {
      errors.name = 'Please provide your name (at least 2 characters).';
    } else if (payload.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters.';
    }

    if (!payload.email || !this.emailRegex.test(payload.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!payload.category || !VALID_CATEGORIES.includes(payload.category as ContactCategory)) {
      errors.category = 'Please select a valid inquiry category.';
    }

    if (!payload.subject || payload.subject.trim().length < 3) {
      errors.subject = 'Subject must be at least 3 characters.';
    } else if (payload.subject.trim().length > 150) {
      errors.subject = 'Subject must not exceed 150 characters.';
    }

    if (!payload.message || payload.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters long.';
    } else if (payload.message.trim().length > 5000) {
      errors.message = 'Message must not exceed 5000 characters.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

/**
 * SRP: ContactSanitizer is solely responsible for sanitizing input strings.
 */
export class ContactSanitizer implements IContactSanitizer {
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>?/gm, '').trim();
  }

  sanitize(payload: ContactPayload): ContactPayload {
    return {
      name: this.stripHtml(payload.name),
      email: payload.email.trim().toLowerCase(),
      category: payload.category,
      subject: this.stripHtml(payload.subject),
      message: this.stripHtml(payload.message),
    };
  }
}

/**
 * OCP / LSP: StoreContactNotifier persists the contact entry in repository and logs to console.
 */
export class StoreContactNotifier implements IContactNotifier {
  constructor(private repo: IContactRepository = defaultContactRepository) {}

  async send(payload: ContactPayload, referenceId: string): Promise<boolean> {
    try {
      await this.repo.save({
        ...payload,
        id: referenceId,
      });
      console.log(
        `[ContactSubmission:${referenceId}] New inquiry from ${payload.name} (${payload.email}) [${payload.category}]: ${payload.subject}`
      );
      return true;
    } catch (err) {
      console.error(`Failed to save contact inquiry ${referenceId}:`, err);
      return false;
    }
  }
}

/**
 * DIP: ContactService depends only on abstractions (interfaces), not concrete classes.
 */
export class ContactService implements IContactService {
  constructor(
    private validator: IContactValidator = new ContactValidator(),
    private sanitizer: IContactSanitizer = new ContactSanitizer(),
    private notifier: IContactNotifier = new StoreContactNotifier()
  ) {}

  async processInquiry(payload: Partial<ContactPayload>): Promise<ContactSubmissionResult> {
    // 1. Validation
    const validation = this.validator.validate(payload);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed. Please check the provided fields.',
        errors: validation.errors,
      };
    }

    // 2. Sanitization
    const sanitizedPayload = this.sanitizer.sanitize(payload as ContactPayload);

    // 3. Generate Reference ID & Timestamp
    const referenceId = `FLV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // 4. Dispatch notification
    try {
      const dispatched = await this.notifier.send(sanitizedPayload, referenceId);
      if (!dispatched) {
        throw new Error('Notification dispatch failed');
      }

      return {
        success: true,
        message: 'Your message has been received. Our team will get back to you within 24 hours.',
        referenceId,
        timestamp,
      };
    } catch (err) {
      console.error('Failed to dispatch contact inquiry:', err);
      return {
        success: false,
        message: 'An internal error occurred while processing your message. Please reach out to fillvyn.support@gmail.com directly.',
      };
    }
  }
}

// Default singleton instance using standard dependencies
export const defaultContactService = new ContactService();
