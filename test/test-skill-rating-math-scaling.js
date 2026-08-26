import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import assert from 'assert';

console.log('----------------------------------------------------');
console.log('TESTING 1-10 TO 1-5 PROFICIENCY MATH SCALING');
console.log('----------------------------------------------------');

const mockProfile = {
  skills: [
    { name: 'Java', years: '4', level: 'Advanced', rating: 8 },         // 8/10 -> on 1-5 scale = 4
    { name: 'Spring Boot', years: '2', level: 'Intermediate', rating: 6 }, // 6/10 -> on 1-5 scale = 3
    { name: 'React', years: '3', level: 'Expert', rating: 10 },          // 10/10 -> on 1-5 scale = 5
    { name: 'Docker', years: '1', level: 'Beginner', rating: 3 }         // 3/10 -> on 1-5 scale = 2
  ]
};

// 1. Test 1-5 Scale Radio Rating
const q1 = "Rate your proficiency in Java (1 to 5)";
const opt1 = ["1", "2", "3", "4", "5"];
const match1 = FieldMatcherService.matchRadioOption(q1, opt1, mockProfile);
console.log(`[Q1] "${q1}"`);
console.log(`     -> Expected: 4 | Got: ${match1?.option} (Score: ${match1?.confidence})`);
assert.strictEqual(match1?.option, '4');

// 2. Test 1-5 Scale Radio for Spring Boot (Rating 6 -> 3)
const q2 = "Rate your knowledge of Spring Boot from 1 (lowest) to 5 (highest)";
const opt2 = ["1", "2", "3", "4", "5"];
const match2 = FieldMatcherService.matchRadioOption(q2, opt2, mockProfile);
console.log(`[Q2] "${q2}"`);
console.log(`     -> Expected: 3 | Got: ${match2?.option} (Score: ${match2?.confidence})`);
assert.strictEqual(match2?.option, '3');

// 3. Test 1-5 Scale Radio for React (Rating 10 -> 5)
const q3 = "React proficiency rating (1-5)";
const opt3 = ["1", "2", "3", "4", "5"];
const match3 = FieldMatcherService.matchRadioOption(q3, opt3, mockProfile);
console.log(`[Q3] "${q3}"`);
console.log(`     -> Expected: 5 | Got: ${match3?.option} (Score: ${match3?.confidence})`);
assert.strictEqual(match3?.option, '5');

// 4. Test 1-5 Scale Radio for Docker (Rating 3 -> 2)
const q4 = "Docker skill scale (1 to 5)";
const opt4 = ["1", "2", "3", "4", "5"];
const match4 = FieldMatcherService.matchRadioOption(q4, opt4, mockProfile);
console.log(`[Q4] "${q4}"`);
console.log(`     -> Expected: 2 | Got: ${match4?.option} (Score: ${match4?.confidence})`);
assert.strictEqual(match4?.option, '2');

// 5. Test 1-10 Scale Radio for Java (Rating 8 -> 8)
const q5 = "Rate your Java skills on a scale of 1 to 10";
const opt5 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const match5 = FieldMatcherService.matchRadioOption(q5, opt5, mockProfile);
console.log(`[Q5] "${q5}"`);
console.log(`     -> Expected: 8 | Got: ${match5?.option} (Score: ${match5?.confidence})`);
assert.strictEqual(match5?.option, '8');

// 6. Test Experience in Years (Spring Boot -> 2 yrs)
const q6 = "Spring Boot experience (including personal projects) *";
const opt6 = ["0", "1", "2", "3", "4", "5", "5 or more"];
const match6 = FieldMatcherService.matchRadioOption(q6, opt6, mockProfile);
console.log(`[Q6] "${q6}"`);
console.log(`     -> Expected: 2 | Got: ${match6?.option} (Score: ${match6?.confidence})`);
assert.strictEqual(match6?.option, '2');

// 7. Direct text input rating scaled to 1-5
const textMatch1 = FieldMatcherService.matchSkillExperienceOrLevel("Rate your Java proficiency (1-5)", mockProfile);
console.log(`[Q7] Text input: "Rate your Java proficiency (1-5)"`);
console.log(`     -> Expected: 4 | Got: ${textMatch1?.value}`);
assert.strictEqual(textMatch1?.value, '4');

// 8. Direct text input rating scaled to 1-10
const textMatch2 = FieldMatcherService.matchSkillExperienceOrLevel("Java proficiency rating (1-10)", mockProfile);
console.log(`[Q8] Text input: "Java proficiency rating (1-10)"`);
console.log(`     -> Expected: 8 | Got: ${textMatch2?.value}`);
assert.strictEqual(textMatch2?.value, '8');

console.log('\n====================================================');
console.log('SUCCESS: 1-10 TO 1-5 MATH SCALING VERIFIED 100%!');
console.log('====================================================\n');
