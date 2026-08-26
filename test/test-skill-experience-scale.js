/**
 * Unit Test: Linear Scale & Radio Matching for Skills Experience & Proficiency
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';

const mockProfile = {
  personal: { fullName: 'Alex Morgan' },
  skills: [
    { name: 'database', years: '', level: 'INTERMEDIATE' },
    { name: 'Operating system', years: '', level: 'INTERMEDIATE' },
    { name: 'linux', years: '', level: 'INTERMEDIATE' },
    { name: 'java', years: '4', level: 'ADVANCED' },
    { name: 'spring boot', years: '2', level: 'INTERMEDIATE' }
  ],
  professional: {
    currentRole: 'Backend Engineer'
  }
};

function runTest() {
  console.log('----------------------------------------------------');
  console.log('TESTING SKILL EXPERIENCE LINEAR SCALE RADIO MATCHER');
  console.log('----------------------------------------------------\n');

  const linearScaleOptions = ['0', '1', '2', '3', '4', '5', '5 or more'];

  // Test 1: Spring Boot experience -> Expected option: '2'
  const q1 = 'Spring Boot experience (including personal projects) *';
  const match1 = FieldMatcherService.matchRadioOption(q1, linearScaleOptions, mockProfile);
  console.log(`[Q1] "${q1}"`);
  console.log('     -> Selected Option:', match1 ? match1.option : 'NONE', `(Score: ${match1?.confidence})`);

  if (!match1 || match1.option !== '2') {
    throw new Error(`Expected Spring Boot to match option '2', got '${match1?.option}'`);
  }

  // Test 2: Python experience (not in skills) -> Expected option: '0'
  const q2 = 'Python Backend Programming experience (including personal projects) *';
  const match2 = FieldMatcherService.matchRadioOption(q2, linearScaleOptions, mockProfile);
  console.log(`[Q2] "${q2}"`);
  console.log('     -> Selected Option:', match2 ? match2.option : 'NONE', `(Score: ${match2?.confidence})`);

  if (!match2 || match2.option !== '0') {
    throw new Error(`Expected Python to match option '0', got '${match2?.option}'`);
  }

  // Test 3: Java experience (4 years) -> Expected option: '4'
  const q3 = 'Java Programming experience (years) *';
  const match3 = FieldMatcherService.matchRadioOption(q3, linearScaleOptions, mockProfile);
  console.log(`[Q3] "${q3}"`);
  console.log('     -> Selected Option:', match3 ? match3.option : 'NONE', `(Score: ${match3?.confidence})`);

  if (!match3 || match3.option !== '4') {
    throw new Error(`Expected Java to match option '4', got '${match3?.option}'`);
  }

  // Test 4: Proficiency scale dropdown/radios (Beginner / Intermediate / Advanced / Expert)
  const profScaleOptions = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const q4 = 'Rate your proficiency in Java';
  const match4 = FieldMatcherService.matchRadioOption(q4, profScaleOptions, mockProfile);
  console.log(`[Q4] "${q4}"`);
  console.log('     -> Selected Option:', match4 ? match4.option : 'NONE', `(Score: ${match4?.confidence})`);

  if (!match4 || match4.option !== 'Advanced') {
    throw new Error(`Expected Java proficiency to match 'Advanced', got '${match4?.option}'`);
  }

  // Test 5: Text input resolution for skill experience
  const q5 = 'Years of experience in Spring Boot';
  const match5 = FieldMatcherService.resolveMatch(q5, mockProfile);
  console.log(`[Q5] Text Field: "${q5}"`);
  console.log('     -> Resolved Value:', match5 ? match5.value : 'NONE', `(Score: ${match5?.confidence})`);

  if (!match5 || match5.value !== '2') {
    throw new Error(`Expected resolveMatch to return '2', got '${match5?.value}'`);
  }

  console.log('\n====================================================');
  console.log('SUCCESS: ALL SKILL EXPERIENCE SCALES MATCH ACCURATELY!');
  console.log('====================================================\n');
}

runTest();
