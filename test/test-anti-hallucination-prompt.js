/**
 * Test Suite: Anti-Hallucination & Tool Grounding Prompt Verification
 */

import { LlmService } from '../src/services/llm/LlmService.js';

console.log('----------------------------------------------------');
console.log('TESTING ANTI-HALLUCINATION & STRICT TOOL GROUNDING');
console.log('----------------------------------------------------\n');

let capturedPayload = null;

// Mock provider that captures the generated prompt
class MockCaptureProvider {
  async generate(payload) {
    capturedPayload = payload;
    return 'I implemented end-to-end integration and API unit test suites using Python unittest and custom FastAPI test clients for our backend services.';
  }
}

LlmService.registerProvider('mock-capture', new MockCaptureProvider());

const candidateProfile = {
  id: 'candidate-123',
  personal: { fullName: 'Alex Morgan' },
  skills: [
    { name: 'Python', level: 'Advanced' },
    { name: 'FastAPI', level: 'Intermediate' },
    { name: 'TypeScript', level: 'Advanced' },
    { name: 'PostgreSQL', level: 'Intermediate' }
  ]
};

const question = 'Describe the most relevant software testing or test automation project you have completed. Which tools or frameworks did you use?';

console.log('Generating RAG answer with strict tool grounding...');
await LlmService.generateRagAnswer({
  question: question,
  retrievedChunks: [
    {
      docTitle: 'Resume.pdf',
      text: 'Built high-throughput backend APIs in Python and FastAPI. Added integration validation scripts to ensure zero regression on database transactions.'
    }
  ],
  profile: candidateProfile,
  config: { provider: 'mock-capture' }
});

console.log('\nVerifying Prompt Constraints:');

const systemPrompt = capturedPayload.systemPrompt;
const userPrompt = capturedPayload.prompt;

// 1. Verify Anti-Hallucination Policy in System Prompt
if (systemPrompt.includes('STRICT GROUNDING & ANTI-HALLUCINATION POLICY') &&
    systemPrompt.includes('ONLY USE TOOLS FROM THE CANDIDATE\'S RESUME & PROFILE') &&
    systemPrompt.includes('NEVER invent, assume, or hallucinate external tools or frameworks')) {
  console.log('[PASS] System Prompt enforces strict anti-hallucination & tool restriction rules.');
} else {
  console.error('[FAIL] Anti-hallucination rules missing from system prompt!');
  process.exit(1);
}

// 2. Verify Explicit Unlisted Tools Prohibition
if (systemPrompt.includes('Cypress') && systemPrompt.includes('Selenium')) {
  console.log('[PASS] Explicit negative examples (Cypress, Selenium, etc.) specified to block hallucinated tools.');
} else {
  console.error('[FAIL] Explicit tool guard missing in system prompt!');
  process.exit(1);
}

// 3. Verify User Prompt Anti-Hallucination Guard
if (userPrompt.includes('CRITICAL ANTI-HALLUCINATION GUARD') &&
    userPrompt.includes('strictly restrict all technical references, frameworks, and tools to the candidate\'s actual Skills')) {
  console.log('[PASS] User Prompt contains the Critical Anti-Hallucination Guard.');
} else {
  console.error('[FAIL] User Prompt missing Critical Anti-Hallucination Guard!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: ANTI-HALLUCINATION PROMPTS VERIFIED!');
console.log('====================================================\n');
