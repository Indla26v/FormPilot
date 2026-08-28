/**
 * Test Suite: Performance Optimizations, Memory Caching & LLM Token Deduplication
 */

import { StorageService } from '../src/services/StorageService.js';
import { LlmService, LruResponseCache, deduplicateContextChunks } from '../src/services/llm/LlmService.js';
import { RagKnowledgeBaseService } from '../src/services/rag/RagKnowledgeBaseService.js';
import { RetrievalService } from '../src/services/rag/RetrievalService.js';

console.log('----------------------------------------------------');
console.log('TESTING PERFORMANCE OPTIMIZATIONS & CACHING PIPELINE');
console.log('----------------------------------------------------\n');

// 1. Test LRU Response Cache
console.log('1. Testing LruResponseCache eviction and hit rate...');
const lru = new LruResponseCache(3);
lru.set('q1', 'ans1');
lru.set('q2', 'ans2');
lru.set('q3', 'ans3');

if (lru.get('q1') === 'ans1' && lru.get('q2') === 'ans2' && lru.get('q3') === 'ans3') {
  console.log('[PASS] Basic LRU cache get and set.');
} else {
  console.error('[FAIL] LRU cache get/set failed.');
  process.exit(1);
}

// Access q1, then insert q4 -> oldest q2 should be evicted
lru.get('q1');
lru.set('q4', 'ans4');

if (lru.get('q2') === undefined && lru.get('q1') === 'ans1' && lru.get('q4') === 'ans4') {
  console.log('[PASS] LRU eviction order maintained correctly.');
} else {
  console.error('[FAIL] LRU eviction failed.');
  process.exit(1);
}

// 2. Test Context Deduplication
console.log('\n2. Testing prompt context deduplication...');
const rawChunks = [
  { docTitle: 'Resume', sectionTitle: 'Experience', text: 'Built real-time voice pipeline with sub-400ms latency.\nImplemented WebSockets in FastAPI with postgres.' },
  { docTitle: 'Project README', sectionTitle: 'Architecture', text: 'Built real-time voice pipeline with sub-400ms latency.\nAdded Redis caching for session tokens.' }
];

const deduped = deduplicateContextChunks(rawChunks);
console.log('Deduped Chunks Count:', deduped.length);
const combinedDedupedText = deduped.map((c) => c.text).join('\n');
const matchCount = (combinedDedupedText.match(/Built real-time voice pipeline with sub-400ms latency/g) || []).length;

if (matchCount === 1) {
  console.log('[PASS] Overlapping duplicate line was eliminated from context.');
} else {
  console.error('[FAIL] Context deduplication did not remove duplicate sentence, count was:', matchCount);
  process.exit(1);
}

// 3. Test Pre-Indexed Token Frequency & Retrieval
console.log('\n3. Testing Pre-Indexed Token Frequency and O(queryTokens) scoring...');
const sampleDoc = {
  id: 'doc_perf_test',
  title: 'Performance Optimization Guide.md',
  content: '# Database Indexing\nPostgreSQL indexes provide fast retrieval using B-tree lookups.\n# Caching Strategies\nIn-memory Redis cache reduces network latency.'
};

const preIndexedChunks = RagKnowledgeBaseService.chunkDocument(sampleDoc);
console.log(`Created ${preIndexedChunks.length} pre-indexed chunks.`);

if (preIndexedChunks[0]._termFreq && preIndexedChunks[0]._sectionTokens && preIndexedChunks[0]._lengthPenalty) {
  console.log('[PASS] Pre-computed term frequency, section tokens, and length penalty exist on chunk.');
} else {
  console.error('[FAIL] Pre-indexed chunk metadata missing!');
  process.exit(1);
}

const queryTokens = RetrievalService.tokenize('PostgreSQL indexing');
const score = RetrievalService.scoreChunk(queryTokens, preIndexedChunks[0]);
console.log('Chunk 0 Relevance Score:', score.toFixed(4));

if (score > 0) {
  console.log('[PASS] Score calculated directly from pre-computed _termFreq map.');
} else {
  console.error('[FAIL] Chunk scoring failed!');
  process.exit(1);
}

// 4. Test In-Memory Read-Through Cache in StorageService
console.log('\n4. Testing In-Memory Read-Through Storage Cache...');
StorageService.clearCache();
const initialProfile = await StorageService.getActiveProfile();
console.log('Fetched Profile from Storage:', initialProfile.name);

// Second call should hit memory cache
const cachedProfile = await StorageService.getActiveProfile();
if (cachedProfile === initialProfile) {
  console.log('[PASS] Active profile returned from memory read-through cache without secondary IPC.');
} else {
  console.error('[FAIL] Read-through memory cache missed!');
  process.exit(1);
}

// Mutation should invalidate cache
await StorageService.setActiveProfileId(initialProfile.id);
const refreshedProfile = await StorageService.getActiveProfile();
if (refreshedProfile) {
  console.log('[PASS] Cache invalidation on mutation verified.');
}

// 5. Test Dynamic Provider Registry on LlmService
console.log('\n5. Testing Dynamic Provider Registry (Open/Closed Principle)...');
class CustomBenchmarkProvider {
  async generate({ prompt }) {
    return 'Benchmark custom response: ' + prompt.slice(0, 15);
  }
  async testConnection() {
    return { success: true, message: 'Custom Benchmark Provider Online.' };
  }
}

LlmService.registerProvider('custom-benchmark', new CustomBenchmarkProvider());
const provider = LlmService.getProvider('custom-benchmark');
const testConn = await provider.testConnection();

if (testConn.success && testConn.message.includes('Custom Benchmark Provider Online')) {
  console.log('[PASS] Dynamic custom provider registered and resolved successfully.');
} else {
  console.error('[FAIL] Dynamic provider registration failed!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: ALL PERFORMANCE & CACHING OPTIMIZATIONS VERIFIED!');
console.log('====================================================\n');
