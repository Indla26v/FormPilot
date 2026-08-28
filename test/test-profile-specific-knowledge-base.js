/**
 * Test Suite: Profile-Specific Knowledge Base (RAG Documents & Chunks)
 * Validates that each role profile maintains its own isolated Knowledge Base documents,
 * semantic chunks, and retrieval pipeline, and supports cloning and backup round-trip.
 */

import { StorageService } from '../src/services/StorageService.js';
import { RagKnowledgeBaseService } from '../src/services/rag/RagKnowledgeBaseService.js';
import { RetrievalService } from '../src/services/rag/RetrievalService.js';
import { STORAGE_KEYS } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING PROFILE-SPECIFIC KNOWLEDGE BASE (RAG)');
console.log('----------------------------------------------------\n');

// Mock localStorage for headless Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// 1. Setup two distinct role profiles
console.log('Test 1: Setting up distinct role profiles...');
const javaProfile = {
  id: 'profile_java_rag',
  name: 'Java Backend SDE',
  skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Microservices'],
  links: { githubUrl: 'https://github.com/alex-morgan-java' }
};

const aiProfile = {
  id: 'profile_ai_rag',
  name: 'AI / ML Engineer',
  skills: ['Python', 'FastAPI', 'LangChain', 'PyTorch'],
  links: { githubUrl: 'https://github.com/alex-morgan-ai' }
};

await StorageService.set(STORAGE_KEYS.PROFILES, [javaProfile, aiProfile]);
await StorageService.setActiveProfileId('profile_java_rag');

console.log('[PASS] Profiles initialized successfully.');

// 2. Ingest Java Resume Doc into Java Profile KB
console.log('\nTest 2: Ingesting documents into Java profile knowledge base...');
const javaResumeDoc = {
  id: 'doc_java_resume',
  title: 'Alex Morgan - Java SDE Resume.pdf',
  type: 'pdf',
  source: 'resume',
  content: `# Experience
Senior Java Backend Engineer at Enterprise FinTech.
Built distributed payment microservices handling 50k transactions/sec using Java 21, Spring Boot 3, and Apache Kafka.
Architected resilient PostgreSQL schemas and Hibernate database caching.

# Education
B.S. in Computer Science - University of Technology.`
};

await RagKnowledgeBaseService.addDocument(javaResumeDoc, 'profile_java_rag');

// 3. Ingest AI LangChain README into AI Profile KB
console.log('\nTest 3: Ingesting documents into AI profile knowledge base...');
const aiAgentDoc = {
  id: 'doc_ai_agent_readme',
  title: 'Autonomous Voice & RAG Agent Pipeline',
  type: 'github_readme',
  source: 'github',
  repoUrl: 'https://github.com/alex-morgan-ai/voice-rag-agent',
  content: `# Architecture Overview
Autonomous multi-agent system built using Python, FastAPI, LangChain, and Qdrant Vector Database.
Implements dynamic semantic routing and low-latency voice WebSocket streaming with Ollama and OpenAI.`
};

await RagKnowledgeBaseService.addDocument(aiAgentDoc, 'profile_ai_rag');

// 4. Verify Document Isolation
console.log('\nTest 4: Verifying Document Storage Isolation...');
const javaDocs = await RagKnowledgeBaseService.getDocuments('profile_java_rag');
const aiDocs = await RagKnowledgeBaseService.getDocuments('profile_ai_rag');

if (javaDocs.length === 1 && javaDocs[0].id === 'doc_java_resume' &&
    aiDocs.length === 1 && aiDocs[0].id === 'doc_ai_agent_readme') {
  console.log('[PASS] Documents strictly stored in their respective profile Knowledge Bases.');
} else {
  console.error('[FAIL] Document isolation failed:', { javaDocs, aiDocs });
  process.exit(1);
}

// 5. Verify Chunks Isolation & Semantic Retrieval
console.log('\nTest 5: Verifying Semantic Retrieval Isolation per Profile...');
const javaChunks = await RetrievalService.retrieveRelevantChunks('How do you build payment microservices in Spring Boot?', 3, 'profile_java_rag');
const aiChunks = await RetrievalService.retrieveRelevantChunks('How do you build autonomous voice agents in LangChain?', 3, 'profile_ai_rag');

if (javaChunks.length > 0 && javaChunks[0].text.includes('Spring Boot') && !javaChunks[0].text.includes('LangChain')) {
  console.log('[PASS] Java Profile RAG queries retrieve Java-specific chunks only.');
} else {
  console.error('[FAIL] Java Profile RAG retrieval failed:', javaChunks);
  process.exit(1);
}

if (aiChunks.length > 0 && aiChunks[0].text.includes('LangChain') && !aiChunks[0].text.includes('Spring Boot')) {
  console.log('[PASS] AI Profile RAG queries retrieve AI-specific chunks only.');
} else {
  console.error('[FAIL] AI Profile RAG retrieval failed:', aiChunks);
  process.exit(1);
}

// Check cross-query: querying for "LangChain" in Java profile must return 0 or non-leaking results
const leakedChunks = await RetrievalService.retrieveRelevantChunks('LangChain and Qdrant', 3, 'profile_java_rag');
if (!leakedChunks.some((c) => c.text.includes('Autonomous multi-agent system'))) {
  console.log('[PASS] Java profile knowledge base does not leak AI profile documents.');
} else {
  console.error('[FAIL] Knowledge base data leaked across profiles!');
  process.exit(1);
}

// 6. Test Profile Duplication with Knowledge Base Cloning
console.log('\nTest 6: Testing Profile Duplication & Knowledge Base Cloning...');
const duplicatedProfile = await StorageService.duplicateProfile('profile_java_rag');
const clonedDocs = await RagKnowledgeBaseService.getDocuments(duplicatedProfile.id);

if (clonedDocs.length === 1 && clonedDocs[0].title.includes('Java SDE Resume')) {
  console.log('[PASS] Duplicating a role profile seamlessly cloned its Knowledge Base documents.');
} else {
  console.error('[FAIL] Knowledge Base cloning on profile duplicate failed:', clonedDocs);
  process.exit(1);
}

// 7. Test Export and Import Backup Round-trip with Profile-Scoped Knowledge Bases
console.log('\nTest 7: Testing Backup Export & Import with Profile-Scoped Knowledge Bases...');
const backupJson = await StorageService.exportBackup();
const parsedBackup = JSON.parse(backupJson);

if (parsedBackup.ragDocsByProfile && parsedBackup.ragDocsByProfile['profile_java_rag'] &&
    parsedBackup.ragDocsByProfile['profile_ai_rag']) {
  console.log('[PASS] Backup payload contains profile-scoped Knowledge Base mappings.');
} else {
  console.error('[FAIL] Backup payload missing ragDocsByProfile:', parsedBackup);
  process.exit(1);
}

// Wipe storage and restore from backup
mockStorage.clear();
await StorageService.importBackup(backupJson);

const restoredJavaDocs = await RagKnowledgeBaseService.getDocuments('profile_java_rag');
const restoredAiDocs = await RagKnowledgeBaseService.getDocuments('profile_ai_rag');

if (restoredJavaDocs.length === 1 && restoredJavaDocs[0].id === 'doc_java_resume' &&
    restoredAiDocs.length === 1 && restoredAiDocs[0].id === 'doc_ai_agent_readme') {
  console.log('[PASS] Restored profile-specific Knowledge Bases after backup import successfully.');
} else {
  console.error('[FAIL] Backup restore of profile knowledge bases failed:', { restoredJavaDocs, restoredAiDocs });
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL PROFILE-SPECIFIC KNOWLEDGE BASE TESTS PASSED (100%)');
console.log('====================================================\n');
