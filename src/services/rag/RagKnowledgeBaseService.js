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

    const rawText = String(doc.content || '').slice(0, 500000);
    const lines = rawText.split('\n');
    const chunks = [];
    const MAX_CHUNKS = 200; // Hard cap per document

    let currentSectionTitle = String(doc.title || 'General').slice(0, 100);
    let currentBuffer = [];
    let currentWordCount = 0;
    let chunkIndex = 0;

    const sanitizeChunkText = (txt) => {
      return String(txt || '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .slice(0, 5000)
        .trim();
    };

    for (let i = 0; i < lines.length && chunks.length < MAX_CHUNKS; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect Markdown / section headers
      if (line.startsWith('#') || line.endsWith(':') || /^(experience|projects|education|skills|architecture|overview|features)/i.test(line)) {
        if (currentBuffer.length > 0) {
          const chunkText = sanitizeChunkText(currentBuffer.join('\n'));
          if (chunkText.length > 10) {
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
          currentBuffer = [];
          currentWordCount = 0;
        }
        currentSectionTitle = line.replace(/^[#\*\-\s]+/, '').replace(/:$/, '').slice(0, 100).trim();
      }

      const words = line.split(/\s+/).filter(Boolean);
      currentBuffer.push(line);
      currentWordCount += words.length;

      if (currentWordCount >= options.maxChunkSize && chunks.length < MAX_CHUNKS) {
        const chunkText = sanitizeChunkText(currentBuffer.join('\n'));
        if (chunkText.length > 10) {
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

        // Sliding window overlap
        const lastFewLines = currentBuffer.slice(-2);
        currentBuffer = [...lastFewLines];
        currentWordCount = lastFewLines.join(' ').split(/\s+/).filter(Boolean).length;
      }
    }

    if (currentBuffer.length > 0 && chunks.length < MAX_CHUNKS) {
      const chunkText = sanitizeChunkText(currentBuffer.join('\n'));
      if (chunkText.length > 10) {
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

    // Sanitize document metadata
    const cleanDoc = {
      id: String(doc.id || `doc_${Date.now()}`).slice(0, 64),
      title: String(doc.title || 'Untitled Document').slice(0, 150),
      type: String(doc.type || 'document').slice(0, 40),
      source: String(doc.source || 'document').slice(0, 40),
      repoUrl: doc.repoUrl ? String(doc.repoUrl).slice(0, 500) : undefined,
      owner: doc.owner ? String(doc.owner).slice(0, 80) : undefined,
      repo: doc.repo ? String(doc.repo).slice(0, 80) : undefined,
      fileName: doc.fileName ? String(doc.fileName).slice(0, 150) : undefined,
      content: String(doc.content || '').slice(0, 500000),
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || undefined
    };

    const chunks = this.chunkDocument(cleanDoc);
    cleanDoc.chunkCount = chunks.length;

    // Load existing docs
    const docs = (await StorageService.get(STORAGE_KEYS.DOCS)) || [];
    // Remove if duplicate id exists
    const updatedDocs = docs.filter((d) => d.id !== cleanDoc.id);
    
    // Hard cap: keep maximum 50 documents in knowledge base to prevent quota overflow
    if (updatedDocs.length >= 50) {
      const removed = updatedDocs.pop();
      const allExistingChunks = (await StorageService.get(STORAGE_KEYS.CHUNKS)) || [];
      await StorageService.set(STORAGE_KEYS.CHUNKS, allExistingChunks.filter((c) => c.docId !== removed.id));
    }

    updatedDocs.unshift(cleanDoc);

    // Load existing chunks
    const allChunks = (await StorageService.get(STORAGE_KEYS.CHUNKS)) || [];
    const filteredChunks = allChunks.filter((c) => c.docId !== cleanDoc.id);
    filteredChunks.push(...chunks);

    await StorageService.set(STORAGE_KEYS.DOCS, updatedDocs);
    await StorageService.set(STORAGE_KEYS.CHUNKS, filteredChunks);

    return { document: cleanDoc, chunksCount: chunks.length };
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
