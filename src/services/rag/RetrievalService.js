/**
 * RetrievalService - Hybrid Token Relevance & BM25 Scoring Retriever for RAG
 * Follows Single Responsibility Principle (SRP).
 */

import { RagKnowledgeBaseService } from './RagKnowledgeBaseService.js';

export class RetrievalService {
  /**
   * Normalize text into token array with stopword removal
   */
  static tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'of', 'to', 'for',
      'with', 'about', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were',
      'will', 'would', 'can', 'could', 'should', 'have', 'had', 'has', 'do', 'does', 'did',
      'you', 'your', 'we', 'our', 'what', 'how', 'why', 'when', 'where', 'who', 'please'
    ]);

    return text
      .toLowerCase()
      .replace(/[*_#~`\(\)\[\]\{\}\:\?\.\,\/\\\-\"\']/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopwords.has(word));
  }

  /**
   * Calculate relevance score of a chunk against query tokens
   */
  static scoreChunk(queryTokens, chunk) {
    if (!chunk || !chunk.text || queryTokens.length === 0) return 0;

    let termFreq = chunk._termFreq;
    let sectionTokens = chunk._sectionTokens;
    let titleTokens = chunk._titleTokens;
    let lengthPenalty = chunk._lengthPenalty;

    // Fallback and on-demand cache for legacy or non-indexed chunks
    if (!termFreq) {
      const chunkTokens = this.tokenize(chunk.text);
      if (chunkTokens.length === 0) return 0;
      termFreq = {};
      for (const t of chunkTokens) {
        termFreq[t] = (termFreq[t] || 0) + 1;
      }
      sectionTokens = this.tokenize(chunk.sectionTitle || '');
      titleTokens = this.tokenize(chunk.docTitle || '');
      lengthPenalty = Math.sqrt(chunkTokens.length) || 1;

      // In-memory cache on chunk
      chunk._termFreq = termFreq;
      chunk._sectionTokens = sectionTokens;
      chunk._titleTokens = titleTokens;
      chunk._lengthPenalty = lengthPenalty;
    }

    let score = 0;
    const isMap = termFreq instanceof Map;

    for (const qToken of queryTokens) {
      // 1. Chunk body term frequency (O(1) direct lookup)
      const tf = isMap ? termFreq.get(qToken) : termFreq[qToken];
      if (tf !== undefined && tf > 0) {
        score += 1.0 + Math.log(1 + tf);
      } else {
        // Partial substring match for technical words (e.g. "postgres" in "postgresql")
        const entries = isMap ? termFreq.entries() : Object.entries(termFreq);
        for (const [cToken, cTf] of entries) {
          if (cToken.includes(qToken) || qToken.includes(cToken)) {
            score += 0.5 * Math.log(1 + cTf);
            break;
          }
        }
      }

      // 2. Section Header Bonus
      if (sectionTokens && (Array.isArray(sectionTokens) ? sectionTokens.includes(qToken) : sectionTokens.has?.(qToken))) {
        score += 2.5;
      }

      // 3. Document Title Bonus
      if (titleTokens && (Array.isArray(titleTokens) ? titleTokens.includes(qToken) : titleTokens.has?.(qToken))) {
        score += 1.8;
      }
    }

    return score / (lengthPenalty || 1);
  }

  /**
   * Retrieve top-K relevant chunks for a form question scoped to a specific profile
   */
  static async retrieveRelevantChunks(questionText, topK = 4, profileId = null) {
    if (!questionText || typeof questionText !== 'string') return [];

    const chunks = await RagKnowledgeBaseService.getAllChunks(profileId);
    if (chunks.length === 0) return [];

    const queryTokens = this.tokenize(questionText);
    if (queryTokens.length === 0) return chunks.slice(0, topK);

    const isProjectInquiry = queryTokens.some((t) => ['project', 'proud', 'built', 'worked', 'repo', 'system', 'architecture', 'github', 'app', 'application', 'developed', 'explain', 'describe'].includes(t));

    const scoredChunks = chunks.map((chunk) => {
      let score = this.scoreChunk(queryTokens, chunk);
      if (isProjectInquiry) {
        if (chunk.source === 'github' || (chunk.docTitle && chunk.docTitle.toLowerCase().includes('github'))) {
          score += 2.0;
        }
        if (chunk.sectionTitle && (chunk.sectionTitle.toLowerCase().includes('project') || chunk.sectionTitle.toLowerCase().includes('architecture') || chunk.sectionTitle.toLowerCase().includes('feature'))) {
          score += 1.5;
        }
      }
      return { chunk, score };
    });

    // Sort descending by score
    scoredChunks.sort((a, b) => b.score - a.score);

    // Filter out zero-score chunks unless everything is zero
    const topScored = scoredChunks.filter((sc) => sc.score > 0);
    const finalResults = (topScored.length > 0 ? topScored : scoredChunks)
      .slice(0, topK)
      .map((item) => item.chunk);

    return finalResults;
  }
}
