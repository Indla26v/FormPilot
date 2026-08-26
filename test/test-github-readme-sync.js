/**
 * Test Suite: GitHub README Sync & Reload Verification
 */

import { RagKnowledgeBaseService } from '../src/services/rag/RagKnowledgeBaseService.js';
import { DocumentParserService } from '../src/services/rag/DocumentParserService.js';
import { StorageService } from '../src/services/StorageService.js';

console.log('----------------------------------------------------');
console.log('TESTING GITHUB REPOSITORY README RELOAD & SYNC');
console.log('----------------------------------------------------\n');

// Mock Storage
const storageMap = new Map();
StorageService.get = async (key) => storageMap.get(key) || null;
StorageService.set = async (key, val) => { storageMap.set(key, val); return true; };

// Mock DocumentParserService.fetchGitHubReadme
let mockRemoteReadmeContent = `# AI Voice Agent Pipeline v1.0
Initial implementation with WebSockets and FastAPI.
## Testing
Written using Python unittest with async test clients.`;

DocumentParserService.fetchGitHubReadme = async (repoUrl) => {
  return {
    id: `gh_alex-morgan-dev_ai-voice-agent-pipeline_${Date.now()}`,
    title: `ai-voice-agent-pipeline (GitHub README)`,
    type: 'github_readme',
    source: 'github',
    repoUrl: repoUrl,
    owner: 'alex-morgan-dev',
    repo: 'ai-voice-agent-pipeline',
    content: mockRemoteReadmeContent,
    createdAt: new Date().toISOString()
  };
};

// 1. Initial Ingestion
console.log('Ingesting initial GitHub repository README...');
const initialDoc = await DocumentParserService.fetchGitHubReadme('https://github.com/alex-morgan-dev/ai-voice-agent-pipeline');
initialDoc.id = 'gh_alex_ai_voice_1';
await RagKnowledgeBaseService.addDocument(initialDoc);

let docs = await RagKnowledgeBaseService.getDocuments();
console.log(`Ingested: "${docs[0].title}" with ${docs[0].chunkCount} chunks.`);
if (docs.length === 1 && docs[0].content.includes('v1.0')) {
  console.log('[PASS] Initial GitHub document added to knowledge base.');
} else {
  console.error('[FAIL] Initial ingestion failed!');
  process.exit(1);
}

// 2. Simulate README update on GitHub
console.log('\nSimulating README.md update on GitHub (v2.0 with Redis caching & metrics)...');
mockRemoteReadmeContent = `# AI Voice Agent Pipeline v2.0
Added Redis streaming cache and Prometheus performance monitoring metrics.
## Architecture
Event-driven pipeline using Kafka and asyncio.
## Testing
Refactored unit test suites to use pytest and FastAPI TestClient.`;

// 3. Trigger Document Sync
console.log('Triggering syncGitHubDocument()...');
const syncResult = await RagKnowledgeBaseService.syncGitHubDocument('gh_alex_ai_voice_1');
console.log('Sync Result:', syncResult.document.title, `(${syncResult.chunksCount} chunks)`);

docs = await RagKnowledgeBaseService.getDocuments();
const updatedDoc = docs[0];

if (updatedDoc.content.includes('v2.0') && updatedDoc.content.includes('Redis streaming cache')) {
  console.log('[PASS] Document content updated with fresh GitHub README.');
} else {
  console.error('[FAIL] Document content not updated!');
  process.exit(1);
}

if (updatedDoc.updatedAt) {
  console.log('[PASS] Updated timestamp recorded:', updatedDoc.updatedAt);
} else {
  console.error('[FAIL] updatedAt timestamp missing!');
  process.exit(1);
}

// 4. Test Sync All Repos
console.log('\nTesting syncAllGitHubDocuments()...');
const syncAllResult = await RagKnowledgeBaseService.syncAllGitHubDocuments();
console.log('Sync All Result:', syncAllResult);

if (syncAllResult.total === 1 && syncAllResult.synced === 1 && syncAllResult.failed === 0) {
  console.log('[PASS] syncAllGitHubDocuments() successfully synced all indexed repositories.');
} else {
  console.error('[FAIL] syncAllGitHubDocuments() failed:', syncAllResult);
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: GITHUB README RELOAD & SYNC FULLY VERIFIED!');
console.log('====================================================\n');
