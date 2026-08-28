/**
 * RagKnowledgeBaseService - Semantic Chunking and Knowledge Base Management
 * Follows Single Responsibility Principle (SRP) and Dependency Inversion.
 */

import { StorageService } from '../StorageService.js';
import { DocumentParserService } from './DocumentParserService.js';
import { RetrievalService } from './RetrievalService.js';
import { STORAGE_KEYS, DEFAULT_PROFILE } from '../../utils/constants.js';

export class RagKnowledgeBaseService {
  /**
   * Helper to resolve active profile ID if not explicitly provided
   */
  static async resolveProfileId(profileId = null) {
    if (profileId) return profileId;
    try {
      const activeId = await StorageService.getActiveProfileId();
      if (activeId) return activeId;
    } catch (e) {}
    return DEFAULT_PROFILE?.id || 'profile_default';
  }

  /**
   * Create chunk object with pre-indexed tokens and term frequencies for O(queryTokens) retrieval
   */
  static createChunkObject(doc, chunkIndex, sectionTitle, chunkText, wordCount) {
    const chunkTokens = RetrievalService.tokenize(chunkText);
    const sectionTokens = RetrievalService.tokenize(sectionTitle || '');
    const titleTokens = RetrievalService.tokenize(doc.title || '');

    const termFreq = {};
    for (const t of chunkTokens) {
      termFreq[t] = (termFreq[t] || 0) + 1;
    }

    return {
      id: `${doc.id}_chunk_${chunkIndex}`,
      docId: doc.id,
      profileId: doc.profileId,
      docTitle: doc.title,
      sectionTitle: sectionTitle,
      source: doc.source || 'document',
      text: chunkText,
      wordCount: wordCount,
      _tokens: chunkTokens,
      _termFreq: termFreq,
      _sectionTokens: sectionTokens,
      _titleTokens: titleTokens,
      _lengthPenalty: Math.sqrt(chunkTokens.length) || 1,
      createdAt: new Date().toISOString()
    };
  }

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
            chunks.push(this.createChunkObject(doc, chunkIndex++, currentSectionTitle, chunkText, currentWordCount));
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
          chunks.push(this.createChunkObject(doc, chunkIndex++, currentSectionTitle, chunkText, currentWordCount));
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
        chunks.push(this.createChunkObject(doc, chunkIndex++, currentSectionTitle, chunkText, currentWordCount));
      }
    }

    return chunks;
  }

  /**
   * Ingest and store a document into the Knowledge Base for a specific profile
   */
  static async addDocument(doc, profileId = null) {
    if (!doc || !doc.content) throw new Error('Invalid document');
    const pId = await this.resolveProfileId(profileId);
    const docsKey = STORAGE_KEYS.getRagDocsKey ? STORAGE_KEYS.getRagDocsKey(pId) : `gfaf_rag_docs_${pId}`;
    const chunksKey = STORAGE_KEYS.getRagChunksKey ? STORAGE_KEYS.getRagChunksKey(pId) : `gfaf_rag_chunks_${pId}`;

    // Sanitize document metadata
    const cleanDoc = {
      id: String(doc.id || `doc_${Date.now()}`).slice(0, 64),
      profileId: pId,
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

    const chunks = this.chunkDocument(cleanDoc).map((c) => ({ ...c, profileId: pId }));
    cleanDoc.chunkCount = chunks.length;

    // Load existing docs for this profile
    const docs = (await this.getDocuments(pId)) || [];
    const updatedDocs = docs.filter((d) => d.id !== cleanDoc.id);

    // Hard cap: keep maximum 50 documents per profile
    if (updatedDocs.length >= 50) {
      const removed = updatedDocs.pop();
      const allExistingChunks = (await this.getAllChunks(pId)) || [];
      await StorageService.set(chunksKey, allExistingChunks.filter((c) => c.docId !== removed.id));
    }

    updatedDocs.unshift(cleanDoc);

    // Load existing chunks for this profile
    const allChunks = (await this.getAllChunks(pId)) || [];
    const filteredChunks = allChunks.filter((c) => c.docId !== cleanDoc.id);
    filteredChunks.push(...chunks);

    await StorageService.set(docsKey, updatedDocs);
    await StorageService.set(chunksKey, filteredChunks);

    return { document: cleanDoc, chunksCount: chunks.length };
  }

  /**
   * Get all ingested documents for a specific profile
   */
  static async getDocuments(profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const profileKey = STORAGE_KEYS.getRagDocsKey ? STORAGE_KEYS.getRagDocsKey(pId) : `gfaf_rag_docs_${pId}`;
    let docs = await StorageService.get(profileKey);

    // Legacy migration fallback for default profile
    if ((!docs || !Array.isArray(docs) || docs.length === 0) && (pId === 'profile_default' || pId === 'default')) {
      const legacyDocs = await StorageService.get('gfaf_rag_documents');
      if (legacyDocs && Array.isArray(legacyDocs) && legacyDocs.length > 0) {
        docs = legacyDocs;
        await StorageService.set(profileKey, docs);
      }
    }

    return docs || [];
  }

  /**
   * Get all indexed chunks for a specific profile
   */
  static async getAllChunks(profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const chunksKey = STORAGE_KEYS.getRagChunksKey ? STORAGE_KEYS.getRagChunksKey(pId) : `gfaf_rag_chunks_${pId}`;
    let chunks = await StorageService.get(chunksKey);

    // Legacy migration fallback for default profile
    if ((!chunks || !Array.isArray(chunks) || chunks.length === 0) && (pId === 'profile_default' || pId === 'default')) {
      const legacyChunks = await StorageService.get('gfaf_rag_chunks');
      if (legacyChunks && Array.isArray(legacyChunks) && legacyChunks.length > 0) {
        chunks = legacyChunks;
        await StorageService.set(chunksKey, chunks);
      }
    }

    return chunks || [];
  }

  /**
   * Delete a document and all its chunks from a specific profile's Knowledge Base
   */
  static async deleteDocument(docId, profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const docsKey = STORAGE_KEYS.getRagDocsKey ? STORAGE_KEYS.getRagDocsKey(pId) : `gfaf_rag_docs_${pId}`;
    const chunksKey = STORAGE_KEYS.getRagChunksKey ? STORAGE_KEYS.getRagChunksKey(pId) : `gfaf_rag_chunks_${pId}`;

    const docs = (await this.getDocuments(pId)) || [];
    const updatedDocs = docs.filter((d) => d.id !== docId);

    const allChunks = (await this.getAllChunks(pId)) || [];
    const updatedChunks = allChunks.filter((c) => c.docId !== docId);

    await StorageService.set(docsKey, updatedDocs);
    await StorageService.set(chunksKey, updatedChunks);

    return true;
  }

  /**
   * Reload & Sync a GitHub repository README document for a profile
   */
  static async syncGitHubDocument(docId, profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const docs = await this.getDocuments(pId);
    const existingDoc = docs.find((d) => d.id === docId);
    if (!existingDoc) {
      throw new Error(`Document with ID "${docId}" not found in this profile.`);
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

    return await this.addDocument(updatedDoc, pId);
  }

  /**
   * Sync all indexed GitHub repositories for a profile
   */
  static async syncAllGitHubDocuments(profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const docs = await this.getDocuments(pId);
    const ghDocs = docs.filter((d) => d.type === 'github_readme' || d.source === 'github' || Boolean(d.repoUrl));

    const results = {
      total: ghDocs.length,
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const doc of ghDocs) {
      try {
        await this.syncGitHubDocument(doc.id, pId);
        results.synced++;
      } catch (err) {
        results.failed++;
        results.errors.push({ docId: doc.id, title: doc.title, error: err.message });
      }
    }

    return results;
  }

  /**
   * Clear all knowledge base entries for a profile
   */
  static async clearKnowledgeBase(profileId = null) {
    const pId = await this.resolveProfileId(profileId);
    const docsKey = STORAGE_KEYS.getRagDocsKey ? STORAGE_KEYS.getRagDocsKey(pId) : `gfaf_rag_docs_${pId}`;
    const chunksKey = STORAGE_KEYS.getRagChunksKey ? STORAGE_KEYS.getRagChunksKey(pId) : `gfaf_rag_chunks_${pId}`;
    await StorageService.set(docsKey, []);
    await StorageService.set(chunksKey, []);
    return true;
  }
}
