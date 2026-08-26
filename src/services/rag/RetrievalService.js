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

    const chunkTokens = this.tokenize(chunk.text);
    const sectionTokens = this.tokenize(chunk.sectionTitle || '');
    const titleTokens = this.tokenize(chunk.docTitle || '');

    if (chunkTokens.length === 0) return 0;

    // Frequency map of chunk tokens
    const chunkFreq = new Map();
    chunkTokens.forEach((t) => chunkFreq.set(t, (chunkFreq.get(t) || 0) + 1));

    let score = 0;

    for (const qToken of queryTokens) {
      // 1. Chunk body term frequency
      if (chunkFreq.has(qToken)) {
        const tf = chunkFreq.get(qToken);
        score += 1.0 + Math.log(1 + tf);
      } else {
        // Partial substring match for technical words (e.g. "postgres" in "postgresql")
        for (const [cToken, tf] of chunkFreq.entries()) {
          if (cToken.includes(qToken) || qToken.includes(cToken)) {
            score += 0.5 * Math.log(1 + tf);
            break;
          }
        }
      }

      // 2. Section Header Bonus
      if (sectionTokens.includes(qToken)) {
        score += 2.5;
      }

      // 3. Document Title Bonus
      if (titleTokens.includes(qToken)) {
        score += 1.8;
      }
    }

    // Normalize by chunk length (sub-linear to prevent penalizing informative chunks)
    const lengthPenalty = Math.sqrt(chunkTokens.length) || 1;
    return score / lengthPenalty;
  }

  /**
   * Retrieve top-K relevant chunks for a form question
   */
  static async retrieveRelevantChunks(questionText, topK = 4) {
    if (!questionText || typeof questionText !== 'string') return [];

    const chunks = await RagKnowledgeBaseService.getAllChunks();
    if (chunks.length === 0) return [];

    const queryTokens = this.tokenize(questionText);
    if (queryTokens.length === 0) return chunks.slice(0, topK);

    const scoredChunks = chunks.map((chunk) => {
      const score = this.scoreChunk(queryTokens, chunk);
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
