/**
 * Unit Test: In-Memory Multi-Turn Conversational Memory for AI Re-generation
 */

import { LlmService } from '../src/services/llm/LlmService.js';

const mockProfile = {
  personal: { fullName: 'Alex Morgan' },
  skills: ['Java', 'Spring Boot', 'Kafka', 'AWS', 'Docker', 'PostgreSQL'],
  professional: {
    currentRole: 'Senior Backend Engineer',
    currentOrganization: 'Tech Solutions Inc.',
    totalExperienceYears: '4'
  }
};

const mockChunks = [
  {
    docTitle: 'Resume.pdf',
    text: 'Engineered high-throughput event queues using Kafka and Spring Boot, reducing event loss to 0% and handling 50k events/sec.'
  }
];

async function runTest() {
  console.log('----------------------------------------------------');
  console.log('TESTING MULTI-TURN AI CONVERSATION MEMORY');
  console.log('----------------------------------------------------\n');

  const question = 'Describe a technical challenge you solved using asynchronous messaging.';

  // Turn 1: Initial Generation
  console.log('Turn 1: Initial Question');
  const turn1History = [];
  const initialDraft = 'I designed an asynchronous pipeline using Spring Boot and Kafka to process transactions reliably under high load.';
  turn1History.push({ role: 'assistant', content: initialDraft });

  // Turn 2: User follow-up comment: "also add techstack used and problem it is solving"
  console.log('Turn 2: Follow-up Revision Comment: "also add techstack used and problem it is solving"');
  const userComment = 'also add techstack used and problem it is solving';
  turn1History.push({ role: 'user', content: userComment });

  // Verify LlmService prompt composition
  let capturedPrompt = '';
  const mockProvider = {
    async generate({ prompt }) {
      capturedPrompt = prompt;
      return 'I resolved a database bottleneck by migrating to an asynchronous event pipeline built with Spring Boot, Apache Kafka, and PostgreSQL on AWS. The problem was peak traffic overwhelming synchronous write locks, which Kafka distributed queues resolved by decoupling ingestion from worker processing.';
    }
  };

  const origGetProvider = LlmService.getProvider;
  LlmService.getProvider = () => mockProvider;

  const refinedAnswer = await LlmService.generateRagAnswer({
    question: question,
    retrievedChunks: mockChunks,
    profile: mockProfile,
    customInstructions: userComment,
    conversationHistory: turn1History,
    currentFieldValue: initialDraft
  });

  LlmService.getProvider = origGetProvider;

  console.log('[PROMPT VERIFICATION]:');
  console.log('Contains [CURRENT FORM DRAFT]:', capturedPrompt.includes('[CURRENT FORM DRAFT]'));
  console.log('Contains [REVISION HISTORY]:', capturedPrompt.includes('[REVISION HISTORY]'));
  console.log('Contains [LATEST USER REVISION INSTRUCTION]:', capturedPrompt.includes('[LATEST USER REVISION INSTRUCTION]'));
  console.log('Contains user comment:', capturedPrompt.includes('also add techstack used and problem it is solving'));

  console.log('\n[REFINED ANSWER]:');
  console.log(`"${refinedAnswer}"`);

  if (
    capturedPrompt.includes('[CURRENT FORM DRAFT]') &&
    capturedPrompt.includes('also add techstack used and problem it is solving') &&
    refinedAnswer.length > 50
  ) {
    console.log('\n====================================================');
    console.log('SUCCESS: MULTI-TURN AI CONVERSATION MEMORY VERIFIED!');
    console.log('====================================================\n');
  } else {
    throw new Error('Multi-turn memory prompt test failed');
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
