import { sql } from '@vercel/postgres';
import { Pool } from '@neondatabase/serverless';
import {
  StoredFeedback,
  StoredContact,
  FeedbackFilterOptions,
  ContactFilterOptions,
  FeedbackSummaryKPIs,
  IFeedbackRepository,
  IContactRepository,
} from './types';

function getDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL
  );
}

export function isPostgresConfigured(): boolean {
  return !!getDatabaseUrl();
}

/**
 * Lazy Table Initializer for Postgres
 */
let tablesInitialized = false;

async function ensureTablesExist() {
  if (tablesInitialized) return;
  const connectionString = getDatabaseUrl();
  if (!connectionString) return;

  try {
    const pool = new Pool({ connectionString });
    
    // Create feedback table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fillvyn_feedbacks (
        id VARCHAR(64) PRIMARY KEY,
        rating INT NOT NULL,
        category VARCHAR(64) NOT NULL,
        persona VARCHAR(64) NOT NULL,
        feedback_text TEXT NOT NULL,
        nps_score INT,
        email VARCHAR(255),
        status VARCHAR(32) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON fillvyn_feedbacks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_feedbacks_rating ON fillvyn_feedbacks(rating);
    `);

    // Create contact inquiries table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fillvyn_contacts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON fillvyn_contacts(created_at DESC);
    `);

    await pool.end();
    tablesInitialized = true;
  } catch (err) {
    console.error('Error initializing Vercel Postgres tables:', err);
  }
}

/**
 * SRP & LSP: PostgresFeedbackRepository implements IFeedbackRepository using Vercel Postgres / Neon.
 */
export class PostgresFeedbackRepository implements IFeedbackRepository {
  private getPool() {
    return new Pool({ connectionString: getDatabaseUrl() });
  }

  async save(
    feedback: Omit<StoredFeedback, 'id' | 'timestamp' | 'status'> & { id?: string }
  ): Promise<StoredFeedback> {
    await ensureTablesExist();
    const id = feedback.id || `FDB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const status = 'new';

    const pool = this.getPool();
    try {
      await pool.query(
        `INSERT INTO fillvyn_feedbacks (id, rating, category, persona, feedback_text, nps_score, email, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          feedback.rating,
          feedback.category,
          feedback.persona,
          feedback.feedbackText,
          feedback.npsScore ?? null,
          feedback.email ?? null,
          status,
          timestamp,
        ]
      );

      return {
        ...feedback,
        id,
        timestamp,
        status,
      };
    } finally {
      await pool.end();
    }
  }

  async findAll(options?: FeedbackFilterOptions): Promise<StoredFeedback[]> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      let query = 'SELECT * FROM fillvyn_feedbacks WHERE 1=1';
      const params: (string | number)[] = [];

      if (options?.rating !== undefined && options.rating > 0) {
        params.push(options.rating);
        query += ` AND rating = $${params.length}`;
      }

      if (options?.category && options.category !== 'all') {
        params.push(options.category);
        query += ` AND category = $${params.length}`;
      }

      if (options?.persona && options.persona !== 'all') {
        params.push(options.persona);
        query += ` AND persona = $${params.length}`;
      }

      if (options?.status && options.status !== 'all') {
        params.push(options.status);
        query += ` AND status = $${params.length}`;
      }

      if (options?.search && options.search.trim().length > 0) {
        params.push(`%${options.search.toLowerCase().trim()}%`);
        query += ` AND (LOWER(feedback_text) LIKE $${params.length} OR LOWER(id) LIKE $${params.length} OR LOWER(COALESCE(email, '')) LIKE $${params.length})`;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        category: row.category,
        persona: row.persona,
        feedbackText: row.feedback_text,
        npsScore: row.nps_score ?? undefined,
        email: row.email ?? undefined,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      }));
    } finally {
      await pool.end();
    }
  }

  async findById(id: string): Promise<StoredFeedback | null> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query('SELECT * FROM fillvyn_feedbacks WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        rating: row.rating,
        category: row.category,
        persona: row.persona,
        feedbackText: row.feedback_text,
        npsScore: row.nps_score ?? undefined,
        email: row.email ?? undefined,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      };
    } finally {
      await pool.end();
    }
  }

  async updateStatus(id: string, status: StoredFeedback['status']): Promise<StoredFeedback | null> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query(
        'UPDATE fillvyn_feedbacks SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        rating: row.rating,
        category: row.category,
        persona: row.persona,
        feedbackText: row.feedback_text,
        npsScore: row.nps_score ?? undefined,
        email: row.email ?? undefined,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      };
    } finally {
      await pool.end();
    }
  }

  async delete(id: string): Promise<boolean> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query('DELETE FROM fillvyn_feedbacks WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      await pool.end();
    }
  }

  async getSummaryKPIs(): Promise<FeedbackSummaryKPIs> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query('SELECT * FROM fillvyn_feedbacks');
      const store = result.rows;
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

      for (const row of store) {
        totalRatingSum += row.rating;
        ratingDistribution[row.rating] = (ratingDistribution[row.rating] || 0) + 1;
        categoryDistribution[row.category] = (categoryDistribution[row.category] || 0) + 1;
        personaDistribution[row.persona] = (personaDistribution[row.persona] || 0) + 1;

        if (row.nps_score !== null && row.nps_score !== undefined) {
          npsCount++;
          if (row.nps_score >= 9) promoters++;
          else if (row.nps_score <= 6) detractors++;
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
    } finally {
      await pool.end();
    }
  }
}

/**
 * SRP & LSP: PostgresContactRepository implements IContactRepository using Vercel Postgres / Neon.
 */
export class PostgresContactRepository implements IContactRepository {
  private getPool() {
    return new Pool({ connectionString: getDatabaseUrl() });
  }

  async save(
    contact: Omit<StoredContact, 'id' | 'timestamp' | 'status'> & { id?: string }
  ): Promise<StoredContact> {
    await ensureTablesExist();
    const id = contact.id || `FLV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const status = 'new';

    const pool = this.getPool();
    try {
      await pool.query(
        `INSERT INTO fillvyn_contacts (id, name, email, category, subject, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, contact.name, contact.email, contact.category, contact.subject, contact.message, status, timestamp]
      );

      return {
        ...contact,
        id,
        timestamp,
        status,
      };
    } finally {
      await pool.end();
    }
  }

  async findAll(options?: ContactFilterOptions): Promise<StoredContact[]> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      let query = 'SELECT * FROM fillvyn_contacts WHERE 1=1';
      const params: string[] = [];

      if (options?.category && options.category !== 'all') {
        params.push(options.category);
        query += ` AND category = $${params.length}`;
      }

      if (options?.status && options.status !== 'all') {
        params.push(options.status);
        query += ` AND status = $${params.length}`;
      }

      if (options?.search && options.search.trim().length > 0) {
        params.push(`%${options.search.toLowerCase().trim()}%`);
        query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(subject) LIKE $${params.length} OR LOWER(message) LIKE $${params.length} OR LOWER(id) LIKE $${params.length})`;
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        category: row.category,
        subject: row.subject,
        message: row.message,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      }));
    } finally {
      await pool.end();
    }
  }

  async findById(id: string): Promise<StoredContact | null> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query('SELECT * FROM fillvyn_contacts WHERE id = $1', [id]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        category: row.category,
        subject: row.subject,
        message: row.message,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      };
    } finally {
      await pool.end();
    }
  }

  async updateStatus(id: string, status: StoredContact['status']): Promise<StoredContact | null> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query(
        'UPDATE fillvyn_contacts SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        category: row.category,
        subject: row.subject,
        message: row.message,
        status: row.status,
        timestamp: new Date(row.created_at).toISOString(),
      };
    } finally {
      await pool.end();
    }
  }

  async delete(id: string): Promise<boolean> {
    await ensureTablesExist();
    const pool = this.getPool();
    try {
      const result = await pool.query('DELETE FROM fillvyn_contacts WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } finally {
      await pool.end();
    }
  }
}
