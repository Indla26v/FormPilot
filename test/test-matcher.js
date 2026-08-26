/**
 * Unit Test Runner to verify field matcher and numeric formatting
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

const SAMPLE_QUESTIONS = [
  // --- Highspring India Form ---
  { form: 'Highspring India', q: 'Name', type: 'text' },
  { form: 'Highspring India', q: 'Contact No.', type: 'text' },
  { form: 'Highspring India', q: 'Email id', type: 'text' },
  { form: 'Highspring India', q: 'Current Location', type: 'text' },
  { form: 'Highspring India', q: 'College/University Name', type: 'text' },
  { form: 'Highspring India', q: '10th Percentage / CGPA', type: 'text' },
  { form: 'Highspring India', q: '12th Percentage / CGPA', type: 'text' },
  { form: 'Highspring India', q: 'Graduation Percentage / CGPA', type: 'text' },

  // --- Numeric variations test ---
  { form: 'Numeric Test', q: 'Expected CTC (in INR / digits only)', type: 'numeric' },
  { form: 'Numeric Test', q: 'Current CTC (in numbers)', type: 'numeric' },
  { form: 'Numeric Test', q: '10th % (digits only)', type: 'numeric' },

  // --- Thinkly AI Form ---
  { form: 'Thinkly AI', q: 'Name* First and last name', type: 'text' },
  { form: 'Thinkly AI', q: 'Email*', type: 'text' },
  { form: 'Thinkly AI', q: 'Phone number*', type: 'text' },
  { 
    form: 'Thinkly AI', 
    q: 'When did you graduate?*', 
    type: 'radio', 
    options: ['I am in my last year', '1 year back', '2 - 4 years back', '4 + years back'] 
  },
  { 
    form: 'Thinkly AI', 
    q: 'Working status*', 
    type: 'radio', 
    options: ['Student', 'In between Jobs', 'Working - Part time'] 
  },
  { form: 'Thinkly AI', q: 'Where are you based out of*', type: 'text' },
  { form: 'Thinkly AI', q: 'linkedin URL*', type: 'text' },
  { form: 'Thinkly AI', q: 'What coding stack/ tool do you understand?*', type: 'text' },
  { 
    form: 'Thinkly AI', 
    q: 'This role requires 8 hours daily, Monday-Saturday, during the internship. Can you commit to this?*', 
    type: 'radio', 
    options: ['Yes', 'No'] 
  },
  { 
    form: 'Thinkly AI', 
    q: 'Can you join immediately (i.e in the 1st week of September)*', 
    type: 'radio', 
    options: ['Yes', 'No'] 
  },
  { form: 'Thinkly AI', q: 'Your Github URL*', type: 'text' },
  { 
    form: 'Thinkly AI', 
    q: 'Link to one thing you built that a stranger can open and use. If nothing is deployed, link the repo and name the specific file you\'re proudest of.*', 
    type: 'text' 
  },
  { 
    form: 'Thinkly AI', 
    q: 'What LLM APIs / tools have you actually written code against? (multi-select: OpenAI, Anthropic, Gemini, open-source/local, LangChain/LlamaIndex, voice APIs, none)*', 
    type: 'checkbox', 
    options: ['OpenAI', 'Anthropic', 'Gemini', 'Opensource/Local', 'LangChain/LlamaIndex', 'voice APIs', 'N8N', 'None'] 
  },

  // --- CraftAI Form ---
  { 
    form: 'CraftAI', 
    q: 'Role*', 
    type: 'radio', 
    options: ['DevRel Engineer', 'AI Engineer'] 
  },
  { form: 'CraftAI', q: 'LinkedIn*', type: 'text' },
  { form: 'CraftAI', q: 'Name*', type: 'text' },
  { form: 'CraftAI', q: 'Github', type: 'text' },
  { form: 'CraftAI', q: 'Projects or Portfolio', type: 'text' },
  { form: 'CraftAI', q: 'Stipend Expectations*', type: 'text' }
];

console.log('----------------------------------------------------');
console.log('RUNNING GOOGLE FORMS FIELD MATCHER BENCHMARK TESTS');
console.log('----------------------------------------------------\n');

let passedCount = 0;
let totalCount = SAMPLE_QUESTIONS.length;

for (const item of SAMPLE_QUESTIONS) {
  let result = null;

  if (item.type === 'text') {
    result = FieldMatcherService.resolveMatch(item.q, DEFAULT_PROFILE);
    if (result.matched) {
      passedCount++;
      console.log(`[PASS] [${item.form}] "${item.q.substring(0, 45)}..."`);
      console.log(`       -> Matched [${result.source}] => "${String(result.value).substring(0, 50)}..." (Score: ${result.confidence.toFixed(2)})\n`);
    } else {
      console.log(`[FAIL] [${item.form}] "${item.q}" -> NO MATCH\n`);
    }
  } else if (item.type === 'numeric') {
    result = FieldMatcherService.resolveMatch(item.q, DEFAULT_PROFILE);
    const numVal = result.numericValue || FieldMatcherService.extractNumericValue(result.value);
    if (result.matched && numVal) {
      passedCount++;
      console.log(`[PASS] [${item.form}] "${item.q}"`);
      console.log(`       -> Matched Numeric => "${numVal}" (Original Text: "${result.value}")\n`);
    } else {
      console.log(`[FAIL] [${item.form}] "${item.q}" -> NO NUMERIC MATCH\n`);
    }
  } else if (item.type === 'radio') {
    const textMatch = FieldMatcherService.resolveMatch(item.q, DEFAULT_PROFILE);
    const radioMatch = FieldMatcherService.matchRadioOption(item.q, item.options, DEFAULT_PROFILE, textMatch);
    if (radioMatch && radioMatch.option) {
      passedCount++;
      console.log(`[PASS] [${item.form}] Radio: "${item.q.substring(0, 45)}..."`);
      console.log(`       -> Selected Option => "${radioMatch.option}" (Score: ${radioMatch.confidence.toFixed(2)})\n`);
    } else {
      console.log(`[FAIL] [${item.form}] Radio: "${item.q}" -> NO OPTION SELECTED\n`);
    }
  } else if (item.type === 'checkbox') {
    const checked = FieldMatcherService.matchCheckboxOptions(item.q, item.options, DEFAULT_PROFILE);
    if (checked.length > 0) {
      passedCount++;
      console.log(`[PASS] [${item.form}] Checkboxes: "${item.q.substring(0, 45)}..."`);
      console.log(`       -> Selected [${checked.length}]: ${JSON.stringify(checked)}\n`);
    } else {
      console.log(`[FAIL] [${item.form}] Checkboxes: "${item.q}" -> NO OPTIONS CHECKED\n`);
    }
  }
}

console.log('====================================================');
console.log(`BENCHMARK RESULTS: ${passedCount} / ${totalCount} (${((passedCount / totalCount) * 100).toFixed(1)}%) SUCCESSFUL MATCHES`);
console.log('====================================================\n');

// Specific check: Ensure open-ended question with keyword "college projects" is NOT falsely matched to collegeName
const awsQuestion = '1. This internship requires basic AWS knowledge. Have you used AWS in any college projects, hackathons, or personal assignments? Which specific services did you touch?';
const awsMatch = FieldMatcherService.resolveMatch(awsQuestion, DEFAULT_PROFILE);
if (!awsMatch || !awsMatch.matched || awsMatch.fieldPath !== 'education.collegeName') {
  console.log('[PASS] [False-Positive Protection] AWS Question correctly NOT matched to collegeName (Score: ' + (awsMatch?.confidence || 0) + ')');
} else {
  console.error('[FAIL] AWS question was falsely matched to: ' + awsMatch.fieldPath);
  process.exit(1);
}

