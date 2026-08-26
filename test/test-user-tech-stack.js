/**
 * Test tech stack radio matching against user's specific skill set
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';

const userProfile = {
  skills: [
    'PostgreSQL',
    'React',
    'java',
    'spring boot',
    'spring security',
    'Rest API',
    'Mysql',
    'AWS'
  ]
};

const question = 'Tech Stack';
const options = [
  'Golang',
  'Java',
  'Java and python',
  'Java and Go',
  'Python',
  'Frontend'
];

console.log('----------------------------------------------------');
console.log('TESTING USER SPECIFIC TECH STACK RADIO MATCHING');
console.log('----------------------------------------------------\n');

console.log('User Skills:', userProfile.skills);
console.log('Question:', question);
console.log('Options:', options);

const textMatch = FieldMatcherService.resolveMatch(question, userProfile);
const result = FieldMatcherService.matchRadioOption(question, options, userProfile, textMatch);

console.log('\nMatching Result:');
console.log('  -> Selected Option:', result?.option);
console.log('  -> Confidence:', result?.confidence);

if (result && result.option === 'Java') {
  console.log('\n====================================================');
  console.log('SUCCESS: Matched "Java" accurately (Did NOT pick Python)!');
  console.log('====================================================');
} else {
  console.error(`FAILED: Expected "Java", but got "${result?.option}"`);
  process.exit(1);
}
