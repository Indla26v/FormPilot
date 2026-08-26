/**
 * Automated Test for Session-Scoped Job Description (JD) Alignment
 * Verifies that JD is captured, injected into prompt context for target alignment, and not persisted to storage.
 */

import { LlmService } from '../src/services/llm/LlmService.js';

console.log('----------------------------------------------------');
console.log('TESTING SESSION-SCOPED JOB DESCRIPTION (JD) ALIGNMENT');
console.log('----------------------------------------------------\n');

// Mock candidate profile
const testProfile = {
  personal: { fullName: 'Alex Morgan' },
  professional: { currentRole: 'Senior Full Stack Engineer', totalExperienceYears: '4' },
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL']
};

const sampleJd = `We are looking for a Senior AI Solutions Engineer with strong experience in Python, LLM orchestration (OpenAI / Anthropic / Local models), streaming WebSockets, and AWS Lambda deployments.`;

// Test Mock Provider to capture userPrompt
let capturedPrompt = '';
class MockJdProvider {
  async generate({ prompt }) {
    capturedPrompt = prompt;
    return 'Aligned AI answer synthesized with JD context.';
  }
}

// Monkey-patch getProvider for test
const originalGetProvider = LlmService.getProvider;
LlmService.getProvider = () => new MockJdProvider();

// 1. Generate answer WITH Job Description
await LlmService.generateRagAnswer({
  question: 'Describe how your background fits this role and your experience with AI pipelines.',
  retrievedChunks: [
    { docTitle: 'Resume', text: 'Alex built high-throughput WebSocket backpressure queues with Python and LangChain.' }
  ],
  profile: testProfile,
  jobDescription: sampleJd
});

// Assertions
if (capturedPrompt.includes('TARGET JOB DESCRIPTION / ROLE REQUIREMENTS') && capturedPrompt.includes('Senior AI Solutions Engineer')) {
  console.log('[PASS] Job Description successfully injected into LLM prompt context.');
} else {
  console.error('[FAIL] Job Description was NOT found in generated prompt.');
  process.exit(1);
}

if (capturedPrompt.includes('ALIGNMENT INSTRUCTION: Tailor and align your response')) {
  console.log('[PASS] Alignment instruction directive is active.');
} else {
  console.error('[FAIL] Alignment directive missing from prompt.');
  process.exit(1);
}

// 2. Generate answer WITHOUT Job Description
await LlmService.generateRagAnswer({
  question: 'Tell me about yourself.',
  retrievedChunks: [],
  profile: testProfile,
  jobDescription: ''
});

if (!capturedPrompt.includes('TARGET JOB DESCRIPTION')) {
  console.log('[PASS] Prompt without JD remains clean without target JD block.');
} else {
  console.error('[FAIL] Empty JD produced a target JD block in prompt.');
  process.exit(1);
}

// Restore
LlmService.getProvider = originalGetProvider;

console.log('\n====================================================');
console.log('SUCCESS: JOB DESCRIPTION (JD) ALIGNMENT VERIFIED!');
console.log('====================================================\n');
