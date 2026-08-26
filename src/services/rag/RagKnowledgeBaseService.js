/**
 * RagKnowledgeBaseService - Semantic Chunking and Knowledge Base Management
 * Follows Single Responsibility Principle (SRP) and Dependency Inversion.
 */

import { StorageService } from '../StorageService.js';
import { DocumentParserService } from './DocumentParserService.js';

const STORAGE_KEYS = {
  DOCS: 'gfaf_rag_documents',
  CHUNKS: 'gfaf_rag_chunks'
};

export class RagKnowledgeBaseService {
  /**
   * Split document content into semantic chunks based on headers & paragraphs
   */
  static chunkDocument(doc, options = { maxChunkSize: 500, overlap: 60 }) {
    if (!doc || !doc.content) return [];

    const rawText = doc.content;
    const lines = rawText.split('\n');
    const chunks = [];

    let currentSectionTitle = doc.title || 'General';
    let currentBuffer = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect Markdown / section headers
      if (line.startsWith('#') || line.endsWith(':') || /^(experience|projects|education|skills|architecture|overview|features)/i.test(line)) {
        if (currentBuffer.length > 0) {
          const chunkText = currentBuffer.join('\n');
          chunks.push({
            id: `${doc.id}_chunk_${chunkIndex++}`,
            docId: doc.id,
            docTitle: doc.title,
            sectionTitle: currentSectionTitle,
            source: doc.source || 'document',
            text: chunkText,
            wordCount: currentWordCount,
            createdAt: new Date().toISOString()
          });
          currentBuffer = [];
          currentWordCount = 0;
        }
        currentSectionTitle = line.replace(/^[#\*\-\s]+/, '').replace(/:$/, '').trim();
      }

      const words = line.split(/\s+/).filter(Boolean);
      currentBuffer.push(line);
      currentWordCount += words.length;

      if (currentWordCount >= options.maxChunkSize) {
        const chunkText = currentBuffer.join('\n');
        chunks.push({
          id: `${doc.id}_chunk_${chunkIndex++}`,
          docId: doc.id,
          docTitle: doc.title,
          sectionTitle: currentSectionTitle,
          source: doc.source || 'document',
          text: chunkText,
          wordCount: currentWordCount,
          createdAt: new Date().toISOString()
        });

        // Sliding window overlap
        const lastFewLines = currentBuffer.slice(-2);
        currentBuffer = [...lastFewLines];
        currentWordCount = lastFewLines.join(' ').split(/\s+/).filter(Boolean).length;
      }
    }

    if (currentBuffer.length > 0) {
      const chunkText = currentBuffer.join('\n');
      if (chunkText.trim().length > 10) {
        chunks.push({
          id: `${doc.id}_chunk_${chunkIndex++}`,
          docId: doc.id,
          docTitle: doc.title,
          sectionTitle: currentSectionTitle,
          source: doc.source || 'document',
          text: chunkText,
          wordCount: currentWordCount,
          createdAt: new Date().toISOString()
        });
      }
    }

    return chunks;
  }

  /**
   * Ingest and store a document into the Knowledge Base
   */
  static async addDocument(doc) {
    if (!doc || !doc.content) throw new Error('Invalid document');

    const chunks = this.chunkDocument(doc);
    doc.chunkCount = chunks.length;

    // Load existing docs
    const docs = (await StorageService.get(STORAGE_KEYS.DOCS)) || [];
    // Remove if duplicate id exists
    const updatedDocs = docs.filter((d) => d.id !== doc.id);
    updatedDocs.unshift(doc);

    // Load existing chunks
    const allChunks = (await StorageService.get(STORAGE_KEYS.CHUNKS)) || [];
    const filteredChunks = allChunks.filter((c) => c.docId !== doc.id);
    filteredChunks.push(...chunks);

    await StorageService.set(STORAGE_KEYS.DOCS, updatedDocs);
    await StorageService.set(STORAGE_KEYS.CHUNKS, filteredChunks);

    return { document: doc, chunksCount: chunks.length };
  }

  /**
   * Get all ingested documents
   */
  static async getDocuments() {
    return (await StorageService.get(STORAGE_KEYS.DOCS)) || [];
  }

  /**
   * Get all indexed chunks
   */
  static async getAllChunks() {
    return (await StorageService.get(STORAGE_KEYS.CHUNKS)) || [];
  }

  /**
   * Delete a document and all its chunks
   */
  static async deleteDocument(docId) {
    const docs = (await StorageService.get(STORAGE_KEYS.DOCS)) || [];
    const updatedDocs = docs.filter((d) => d.id !== docId);

    const allChunks = (await StorageService.get(STORAGE_KEYS.CHUNKS)) || [];
    const updatedChunks = allChunks.filter((c) => c.docId !== docId);

    await StorageService.set(STORAGE_KEYS.DOCS, updatedDocs);
    await StorageService.set(STORAGE_KEYS.CHUNKS, updatedChunks);

    return true;
  }

  /**
   * Reload & Sync a GitHub repository README document with its latest remote version
   */
  static async syncGitHubDocument(docId) {
    const docs = await this.getDocuments();
    const existingDoc = docs.find((d) => d.id === docId);
    if (!existingDoc) {
      throw new Error(`Document with ID "${docId}" not found.`);
    }

    const repoUrl = existingDoc.repoUrl || (existingDoc.owner && existingDoc.repo ? `https://github.com/${existingDoc.owner}/${existingDoc.repo}` : null);
    if (!repoUrl) {
      throw new Error('This document is not an indexed GitHub repository.');
    }

    // Fetch fresh README from GitHub
    const freshDoc = await DocumentParserService.fetchGitHubReadme(repoUrl);

    // Preserve original ID and creation time while updating content & timestamp
    const updatedDoc = {
      ...existingDoc,
      title: freshDoc.title,
      content: freshDoc.content,
      repoUrl: freshDoc.repoUrl,
      owner: freshDoc.owner,
      repo: freshDoc.repo,
      updatedAt: new Date().toISOString()
    };

    return await this.addDocument(updatedDoc);
  }

  /**
   * Sync all indexed GitHub repositories to ensure READMEs are up to date
   */
  static async syncAllGitHubDocuments() {
    const docs = await this.getDocuments();
    const ghDocs = docs.filter((d) => d.type === 'github_readme' || d.source === 'github' || Boolean(d.repoUrl));

    const results = {
      total: ghDocs.length,
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const doc of ghDocs) {
      try {
        await this.syncGitHubDocument(doc.id);
        results.synced++;
      } catch (err) {
        results.failed++;
        results.errors.push({ docId: doc.id, title: doc.title, error: err.message });
      }
    }

    return results;
  }

  /**
   * Clear all knowledge base entries
   */
  static async clearKnowledgeBase() {
    await StorageService.set(STORAGE_KEYS.DOCS, []);
    await StorageService.set(STORAGE_KEYS.CHUNKS, []);
    return true;
  }
}
