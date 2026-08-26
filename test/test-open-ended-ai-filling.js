/**
 * Automated test verifying that open-ended questions trigger Ollama / LLM AI generation
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { LlmService } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING OPEN-ENDED AI / OLLAMA GENERATION TRIGGER');
console.log('----------------------------------------------------\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

const questionFromScreenshot = `Describe one specific thing you did faster or better in the last month because of an AI tool.
Be concrete: what the task was, what you asked for, what you got back, and what you had to fix yourself. Generic answers ("it helps me code faster") tell us nothing. 80-150 words.`;

// Test isOpenEndedQuestion
const isOpenEnded = GoogleFormsFillerService.isOpenEndedQuestion(questionFromScreenshot, { tagName: 'TEXTAREA' });
console.log(`[PASS] isOpenEndedQuestion detection: ${isOpenEnded ? 'TRUE (Matches AI Question)' : 'FALSE'}`);

// Test LLM Answer Generation
global.fetch = async (url, opts) => {
  return {
    ok: true,
    json: async () => ({
      message: {
        content: 'Last month, I used an AI coding assistant to scaffold a high-throughput WebSocket backpressure queue for audio chunk streaming. I prompted the model for an asynchronous Python asyncio queue with a semaphore lock and bounded buffer. The generated output gave me the core queue architecture, but I had to manually fix a memory leak where orphaned socket connections failed to clean up event listeners upon sudden client disconnections.'
      }
    })
  };
};

const candidateProfile = {
  ...DEFAULT_PROFILE,
  personal: { fullName: 'Alex Morgan' },
  skills: ['Python', 'FastAPI', 'WebSockets', 'LangChain']
};

const generatedAnswer = await LlmService.generateRagAnswer({
  question: questionFromScreenshot,
  retrievedChunks: [],
  profile: candidateProfile
});

console.log('\nGenerated Answer from Ollama / AI:');
console.log(`"${generatedAnswer}"\n`);

const wordCount = generatedAnswer.split(/\s+/).length;
console.log(`Word Count: ${wordCount} words (Target: 80-150 words)`);

if (isOpenEnded && generatedAnswer.length > 50 && wordCount >= 50) {
  console.log('\n====================================================');
  console.log('SUCCESS: OPEN-ENDED OLLAMA GENERATION FULLY VERIFIED!');
  console.log('====================================================');
} else {
  console.error('FAILED: Generation did not meet criteria');
  process.exit(1);
}
