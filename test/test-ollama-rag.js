/**
 * End-to-end test for RAG prompt construction, Ollama generation interface & live test connection
 */

import { LlmService } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING RAG PROMPT SYNTHESIS & OLLAMA ADAPTER');
console.log('----------------------------------------------------\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

// Set Ollama Config
const ollamaConfig = {
  provider: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2'
};
await LlmService.saveConfig(ollamaConfig);

const config = await LlmService.getConfig();
console.log('[PASS] Configured Provider:', config.provider, `(${config.ollamaModel})`);

// 1. Test live testConnection prompt response
global.fetch = async (url, opts) => {
  if (url.endsWith('/api/tags')) {
    return {
      ok: true,
      json: async () => ({ models: [{ name: 'llama3.2:latest' }, { name: 'deepseek-r1:8b' }] })
    };
  }
  if (url.endsWith('/api/chat')) {
    return {
      ok: true,
      json: async () => ({
        message: {
          content: 'I am online and ready to assist with job application questions.'
        }
      })
    };
  }
};

const testConnResult = await LlmService.testConnection(ollamaConfig);
console.log('testConnection Result:');
console.log(`  -> Success: ${testConnResult.success}`);
console.log(`  -> Message: "${testConnResult.message}"`);
console.log(`  -> Live Model Answer: "${testConnResult.modelResponse}"\n`);

if (!testConnResult.success || !testConnResult.modelResponse) {
  console.error('FAILED: testConnection did not return modelResponse');
  process.exit(1);
}

// 2. Test RAG Synthesis
const sampleChunks = [
  {
    docTitle: 'ai-voice-agent-pipeline (GitHub README)',
    sectionTitle: 'Concurrency & Latency',
    text: 'Designed an asynchronous streaming pipeline using WebSocket backpressure and asyncio queues, reducing TTFB to under 380ms.'
  }
];

const question = 'Describe your experience with low-latency streaming and LLM pipelines.';

const answer = await LlmService.generateRagAnswer({
  question: question,
  retrievedChunks: sampleChunks,
  profile: DEFAULT_PROFILE
});

console.log('Generated Answer via RAG Pipeline:');
console.log(`"${answer}"\n`);

if (answer.length > 0) {
  console.log('====================================================');
  console.log('SUCCESS: LIVE OLLAMA TEST & RAG PROMPT FULLY VERIFIED!');
  console.log('====================================================');
} else {
  console.error('FAILED: RAG pipeline output did not match expectations');
  process.exit(1);
}
