/**
 * Automated test for RagKnowledgeBaseService chunking and RetrievalService relevance scoring
 */

import { RagKnowledgeBaseService } from '../src/services/rag/RagKnowledgeBaseService.js';
import { RetrievalService } from '../src/services/rag/RetrievalService.js';
import { StorageService } from '../src/services/StorageService.js';

console.log('----------------------------------------------------');
console.log('TESTING RAG CHUNKING & RETRIEVAL SERVICE');
console.log('----------------------------------------------------\n');

// Mock in-memory storage for test
const inMemStore = new Map();
StorageService.get = async (key) => inMemStore.get(key);
StorageService.set = async (key, val) => inMemStore.set(key, val);

// 1. Create sample Resume doc
const resumeDoc = {
  id: 'doc_resume_alex',
  title: 'Alex_Morgan_Resume.pdf',
  source: 'resume_pdf',
  content: `
# Professional Summary
Senior Full Stack & AI Engineer with 4+ years of experience building real-time distributed pipelines and voice AI systems.

# Experience
## Acme AI Labs - Staff AI Engineer (2023 - Present)
- Architected an ultra-low latency voice agent pipeline serving 50,000+ active enterprise calls.
- Resolved memory leak race conditions in WebSocket streaming loops using chunk backpressure handling.
- Integrated PostgreSQL with pgvector and OpenAI Whisper/Anthropic Claude models.

# Education
B.S. in Computer Science from University of Technology (GPA: 8.8 / 10).
  `.trim()
};

// 2. Create sample GitHub README doc
const githubDoc = {
  id: 'doc_github_voice_agent',
  title: 'ai-voice-agent-pipeline (GitHub README)',
  source: 'github',
  content: `
# AI Voice Agent Pipeline
An open-source low-latency streaming pipeline combining WebSocket audio streaming, FastAPI, LangChain, and Qdrant vector database.

## Concurrency & Performance
Implemented asyncio semaphore queue and buffer streaming to achieve sub-400ms Time-To-First-Byte (TTFB).

## Debugging Stories
Debugged a race condition in WebSocket chunk-emitter loops that caused socket connection resets under 2,000 concurrent client calls.
  `.trim()
};

// Test Chunking
const resumeChunks = RagKnowledgeBaseService.chunkDocument(resumeDoc);
const githubChunks = RagKnowledgeBaseService.chunkDocument(githubDoc);

console.log(`Generated ${resumeChunks.length} chunks from Resume`);
console.log(`Generated ${githubChunks.length} chunks from GitHub README`);

// Ingest both
await RagKnowledgeBaseService.addDocument(resumeDoc);
await RagKnowledgeBaseService.addDocument(githubDoc);

const allChunks = await RagKnowledgeBaseService.getAllChunks();
console.log(`Total Indexed Chunks in Knowledge Base: ${allChunks.length}\n`);

// 3. Test Retrieval Queries
const testQueries = [
  {
    q: 'Describe the hardest bug you personally debugged and its root cause',
    expectedKeyword: 'race condition'
  },
  {
    q: 'Explain how you handled concurrency or latency in your voice agent architecture',
    expectedKeyword: 'latency'
  },
  {
    q: 'What is your education and university GPA?',
    expectedKeyword: 'University of Technology'
  }
];

let allPassed = true;

for (const t of testQueries) {
  const topChunks = await RetrievalService.retrieveRelevantChunks(t.q, 2);
  const combinedText = topChunks.map((c) => c.text).join(' ');
  const hasExpected = combinedText.toLowerCase().includes(t.expectedKeyword.toLowerCase());

  console.log(`Query: "${t.q}"`);
  console.log(`  -> Retrieved ${topChunks.length} chunks: [${topChunks.map((c) => c.sectionTitle).join(', ')}]`);
  console.log(`  -> Matches Expected Keyword ("${t.expectedKeyword}"): ${hasExpected ? 'PASS' : 'FAIL'}\n`);

  if (!hasExpected) allPassed = false;
}

if (allPassed) {
  console.log('====================================================');
  console.log('SUCCESS: RAG RETRIEVAL ACCURACY VERIFIED 100%!');
  console.log('====================================================');
} else {
  console.error('FAILED: Some queries failed to retrieve relevant context');
  process.exit(1);
}
