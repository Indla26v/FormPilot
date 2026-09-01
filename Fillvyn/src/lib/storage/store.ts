import {
  StoredFeedback,
  StoredContact,
  FeedbackFilterOptions,
  ContactFilterOptions,
  FeedbackSummaryKPIs,
  IFeedbackRepository,
  IContactRepository,
} from './types';

// Global runtime memory stores across requests (singleton)
declare global {
  // eslint-disable-next-line no-var
  var __fillvyn_feedback_store__: StoredFeedback[] | undefined;
  // eslint-disable-next-line no-var
  var __fillvyn_contact_store__: StoredContact[] | undefined;
}

const INITIAL_FEEDBACK_SEED: StoredFeedback[] = [
  {
    id: 'FDB-M9K2L1-A7B8',
    rating: 5,
    category: 'ollama_speed',
    persona: 'software_engineer',
    feedbackText: 'Local Ollama autofill is blazingly fast. Running llama3.2:3b on my M2 Mac fills a 15-question Google Form in under 3 seconds without leaking any data.',
    npsScore: 10,
    email: 'alex.dev@gmail.com',
    status: 'starred',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'FDB-P4Q5R6-C1D2',
    rating: 5,
    category: 'accuracy_quality',
    persona: 'job_seeker',
    feedbackText: 'The RAG Resume embedding feature answered descriptive technical interview questions accurately using my exact past metrics and achievements.',
    npsScore: 10,
    email: 'priya.sharma@outlook.com',
    status: 'reviewed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'FDB-X7Y8Z9-E3F4',
    rating: 4,
    category: 'feature_request',
    persona: 'software_engineer',
    feedbackText: 'Would love support for Greenhouse and Lever job application portals in addition to Google Forms and Microsoft Forms. Great work on the local encryption!',
    npsScore: 9,
    email: 'david.miller@techcorp.io',
    status: 'new',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
  },
  {
    id: 'FDB-T1U2V3-G5H6',
    rating: 5,
    category: 'ui_ux_design',
    persona: 'student',
    feedbackText: 'Clean UI and the shortcut Alt + Shift + F is super convenient. Saves hours applying to campus hiring questionnaires.',
    npsScore: 10,
    status: 'reviewed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
  },
];

const INITIAL_CONTACT_SEED: StoredContact[] = [
  {
    id: 'FLV-C9D8E7-J1K2',
    name: 'Sarah Jenkins',
    email: 's.jenkins@enterprise-solutions.com',
    category: 'ollama_integration',
    subject: 'Enterprise deployment with custom Ollama models',
    message: 'We are looking to deploy Fillvyn across our engineering recruitment team with a private internal LLM endpoint. Does Fillvyn support custom reverse proxies?',
    status: 'in_progress',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'FLV-A1B2C3-L3M4',
    name: 'Karthik Raja',
    email: 'karthik.raja99@gmail.com',
    category: 'technical_support',
    subject: 'Assistance setting OLLAMA_ORIGINS on Windows 11',
    message: 'Need quick guidance on configuring CORS origin permissions for Ollama on Windows 11 PowerShell. Followed the guide and wanted to confirm verification.',
    status: 'resolved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
  },
];

function getFeedbackStore(): StoredFeedback[] {
  if (!global.__fillvyn_feedback_store__) {
    global.__fillvyn_feedback_store__ = [...INITIAL_FEEDBACK_SEED];
  }
  return global.__fillvyn_feedback_store__;
}

function getContactStore(): StoredContact[] {
  if (!global.__fillvyn_contact_store__) {
    global.__fillvyn_contact_store__ = [...INITIAL_CONTACT_SEED];
  }
  return global.__fillvyn_contact_store__;
}

/**
 * SRP: FeedbackRepository handles querying and storing feedback records.
 */
export class FeedbackRepository implements IFeedbackRepository {
  async save(
    feedback: Omit<StoredFeedback, 'id' | 'timestamp' | 'status'> & { id?: string }
  ): Promise<StoredFeedback> {
    const store = getFeedbackStore();
    const id = feedback.id || `FDB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newEntry: StoredFeedback = {
      ...feedback,
      id,
      timestamp: new Date().toISOString(),
      status: 'new',
    };
    store.unshift(newEntry);
    return newEntry;
  }

  async findAll(options?: FeedbackFilterOptions): Promise<StoredFeedback[]> {
    let list = [...getFeedbackStore()];

    if (options?.rating !== undefined && options.rating > 0) {
      list = list.filter((item) => item.rating === options.rating);
    }

    if (options?.category && options.category !== 'all') {
      list = list.filter((item) => item.category === options.category);
    }

    if (options?.persona && options.persona !== 'all') {
      list = list.filter((item) => item.persona === options.persona);
    }

    if (options?.status && options.status !== 'all') {
      list = list.filter((item) => item.status === options.status);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.feedbackText.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.email && item.email.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async findById(id: string): Promise<StoredFeedback | null> {
    const store = getFeedbackStore();
    return store.find((item) => item.id === id) || null;
  }

  async updateStatus(id: string, status: StoredFeedback['status']): Promise<StoredFeedback | null> {
    const store = getFeedbackStore();
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) return null;
    store[index].status = status;
    return store[index];
  }

  async delete(id: string): Promise<boolean> {
    const store = getFeedbackStore();
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) return false;
    store.splice(index, 1);
    return true;
  }

  async getSummaryKPIs(): Promise<FeedbackSummaryKPIs> {
    const store = getFeedbackStore();
    const total = store.length;
    if (total === 0) {
      return {
        total: 0,
        averageRating: 0,
        npsScore: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryDistribution: {},
        personaDistribution: {},
      };
    }

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const categoryDistribution: Record<string, number> = {};
    const personaDistribution: Record<string, number> = {};

    let totalRatingSum = 0;
    let promoters = 0;
    let detractors = 0;
    let npsCount = 0;

    for (const item of store) {
      totalRatingSum += item.rating;
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + 1;
      categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
      personaDistribution[item.persona] = (personaDistribution[item.persona] || 0) + 1;

      if (item.npsScore !== undefined) {
        npsCount++;
        if (item.npsScore >= 9) promoters++;
        else if (item.npsScore <= 6) detractors++;
      }
    }

    const averageRating = Number((totalRatingSum / total).toFixed(1));
    const npsScore = npsCount > 0 ? Math.round(((promoters - detractors) / npsCount) * 100) : 100;

    return {
      total,
      averageRating,
      npsScore,
      ratingDistribution,
      categoryDistribution,
      personaDistribution,
    };
  }
}

/**
 * SRP: ContactRepository handles querying and storing contact messages.
 */
export class ContactRepository implements IContactRepository {
  async save(
    contact: Omit<StoredContact, 'id' | 'timestamp' | 'status'> & { id?: string }
  ): Promise<StoredContact> {
    const store = getContactStore();
    const id = contact.id || `FLV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newEntry: StoredContact = {
      ...contact,
      id,
      timestamp: new Date().toISOString(),
      status: 'new',
    };
    store.unshift(newEntry);
    return newEntry;
  }

  async findAll(options?: ContactFilterOptions): Promise<StoredContact[]> {
    let list = [...getContactStore()];

    if (options?.category && options.category !== 'all') {
      list = list.filter((item) => item.category === options.category);
    }

    if (options?.status && options.status !== 'all') {
      list = list.filter((item) => item.status === options.status);
    }

    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.subject.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q)
      );
    }

    return list;
  }

  async findById(id: string): Promise<StoredContact | null> {
    const store = getContactStore();
    return store.find((item) => item.id === id) || null;
  }

  async updateStatus(id: string, status: StoredContact['status']): Promise<StoredContact | null> {
    const store = getContactStore();
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) return null;
    store[index].status = status;
    return store[index];
  }

  async delete(id: string): Promise<boolean> {
    const store = getContactStore();
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) return false;
    store.splice(index, 1);
    return true;
  }
}

import {
  PostgresFeedbackRepository,
  PostgresContactRepository,
  isPostgresConfigured,
} from './postgresStore';

export class HybridFeedbackRepository implements IFeedbackRepository {
  private memoryRepo = new FeedbackRepository();
  private postgresRepo = new PostgresFeedbackRepository();

  private getActiveRepo(): IFeedbackRepository {
    return isPostgresConfigured() ? this.postgresRepo : this.memoryRepo;
  }

  save(feedback: Omit<StoredFeedback, 'id' | 'timestamp' | 'status'> & { id?: string }) {
    return this.getActiveRepo().save(feedback);
  }
  findAll(options?: FeedbackFilterOptions) {
    return this.getActiveRepo().findAll(options);
  }
  findById(id: string) {
    return this.getActiveRepo().findById(id);
  }
  updateStatus(id: string, status: StoredFeedback['status']) {
    return this.getActiveRepo().updateStatus(id, status);
  }
  delete(id: string) {
    return this.getActiveRepo().delete(id);
  }
  getSummaryKPIs() {
    return this.getActiveRepo().getSummaryKPIs();
  }
}

export class HybridContactRepository implements IContactRepository {
  private memoryRepo = new ContactRepository();
  private postgresRepo = new PostgresContactRepository();

  private getActiveRepo(): IContactRepository {
    return isPostgresConfigured() ? this.postgresRepo : this.memoryRepo;
  }

  save(contact: Omit<StoredContact, 'id' | 'timestamp' | 'status'> & { id?: string }) {
    return this.getActiveRepo().save(contact);
  }
  findAll(options?: ContactFilterOptions) {
    return this.getActiveRepo().findAll(options);
  }
  findById(id: string) {
    return this.getActiveRepo().findById(id);
  }
  updateStatus(id: string, status: StoredContact['status']) {
    return this.getActiveRepo().updateStatus(id, status);
  }
  delete(id: string) {
    return this.getActiveRepo().delete(id);
  }
}

export const defaultFeedbackRepository = new HybridFeedbackRepository();
export const defaultContactRepository = new HybridContactRepository();

