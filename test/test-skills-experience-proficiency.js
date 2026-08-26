/**
 * Unit Test: Skills with Experience and Proficiency
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import { LlmService } from '../src/services/llm/LlmService.js';

const mockProfileWithStructuredSkills = {
  personal: { fullName: 'Alex Morgan' },
  skills: [
    { name: 'Java', years: '3', level: 'Expert' },
    { name: 'Spring Boot', years: '3', level: 'Expert' },
    { name: 'React', years: '2', level: 'Advanced' },
    { name: 'Docker', years: '1.5', level: 'Intermediate' },
    { name: 'Kubernetes', years: '1', level: 'Beginner' },
    'PostgreSQL' // Legacy string format compatibility check
  ],
  professional: {
    currentRole: 'Backend Engineer',
    currentOrganization: 'CloudTech',
    totalExperienceYears: '3'
  }
};

async function runTest() {
  console.log('----------------------------------------------------');
  console.log('TESTING SKILLS WITH EXPERIENCE AND PROFICIENCY');
  console.log('----------------------------------------------------\n');

  // Test 1: Checkbox multi-select with structured skills
  const formCheckboxes = ['Java', 'Python', 'Spring Boot', 'Ruby', 'Docker', 'PostgreSQL'];
  const matchedCheckboxes = FieldMatcherService.matchCheckboxOptions(
    'Which tools have you worked with?',
    formCheckboxes,
    mockProfileWithStructuredSkills
  );

  console.log('Available Checkboxes in Form:', formCheckboxes);
  console.log('Matched Checkboxes:', matchedCheckboxes);

  const expectedMatches = ['Java', 'Spring Boot', 'Docker', 'PostgreSQL'];
  const isMatchCorrect = expectedMatches.every((m) => matchedCheckboxes.includes(m)) && !matchedCheckboxes.includes('Python');

  console.log('[PASS] Checkbox matching with structured skills:', isMatchCorrect ? 'TRUE' : 'FALSE');
  if (!isMatchCorrect) throw new Error('Checkbox matching failed');

  // Test 2: Verify RAG prompt formats skills with level and experience
  let capturedPrompt = '';
  const mockProvider = {
    async generate({ prompt }) {
      capturedPrompt = prompt;
      return 'Generated answer with rich skill proficiency';
    }
  };

  const origGetProvider = LlmService.getProvider;
  LlmService.getProvider = () => mockProvider;

  await LlmService.generateRagAnswer({
    question: 'Tell us about your core backend stack.',
    retrievedChunks: [],
    profile: mockProfileWithStructuredSkills
  });

  LlmService.getProvider = origGetProvider;

  console.log('\n[PROMPT SKILLS FORMAT CHECK]:');
  console.log('Contains "Java - (Expert) - 3 yr(s)":', capturedPrompt.includes('Java - (Expert) - 3 yr(s)'));
  console.log('Contains "React - (Advanced) - 2 yr(s)":', capturedPrompt.includes('React - (Advanced) - 2 yr(s)'));
  console.log('Contains legacy string "PostgreSQL":', capturedPrompt.includes('PostgreSQL'));

  const isPromptCorrect =
    capturedPrompt.includes('Java - (Expert) - 3 yr(s)') &&
    capturedPrompt.includes('React - (Advanced) - 2 yr(s)') &&
    capturedPrompt.includes('PostgreSQL');

  if (isPromptCorrect) {
    console.log('\n====================================================');
    console.log('SUCCESS: SKILLS EXPERIENCE & PROFICIENCY VERIFIED!');
    console.log('====================================================\n');
  } else {
    throw new Error('Skills formatting in prompt failed');
  }
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
