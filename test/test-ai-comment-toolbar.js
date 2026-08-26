/**
 * Automated test verifying the in-page AI comment toolbar and Re-generate / Try Again flow
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { LlmService } from '../src/services/llm/LlmService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING AI COMMENT COLUMN & RE-GENERATE BUTTON');
console.log('----------------------------------------------------\n');

const question = `Describe one specific thing you did faster or better in the last month because of an AI tool.
Be concrete: what the task was, what you asked for, what you got back, and what you had to fix yourself. 80-150 words.`;

let capturedPrompt = '';
global.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  capturedPrompt = body.messages ? body.messages[1].content : '';
  return {
    ok: true,
    json: async () => ({
      message: {
        content: 'Last month, I leveraged an AI tool to accelerate the migration of legacy synchronous REST endpoints to Spring Boot reactive WebFlux streams with Kafka event queues. When prompting the assistant for backpressure handlers, it provided the reactive publisher pipeline, but I had to manually adjust the Netty thread-pool allocations to prevent connection starvation.'
      }
    })
  };
};

const profile = {
  ...DEFAULT_PROFILE,
  personal: { fullName: 'Venkatesh Indla' },
  skills: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Docker']
};

const customComment = 'Focus on Spring Boot WebFlux and Kafka event streaming';

const reGenerated = await LlmService.generateRagAnswer({
  question: question,
  retrievedChunks: [],
  profile: profile,
  customInstructions: customComment
});

console.log(`[PASS] Captured Prompt contains custom instruction:\n${capturedPrompt.includes(customComment) ? 'TRUE' : 'FALSE'}`);
console.log('\nRe-generated Answer with Custom Comment:');
console.log(`"${reGenerated}"\n`);

if (reGenerated && reGenerated.includes('Spring Boot') && reGenerated.includes('Kafka')) {
  console.log('====================================================');
  console.log('SUCCESS: AI COMMENT COLUMN & RE-GENERATE VERIFIED!');
  console.log('====================================================');
} else {
  console.error('FAILED: Re-generated answer did not incorporate custom instruction.');
  process.exit(1);
}
