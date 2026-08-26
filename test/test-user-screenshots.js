/**
 * Test specifically verifying the 4 questions from the user's screenshots
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

const TEST_QUESTIONS = [
  {
    title: 'Notice period (In days)',
    expectedValue: '0',
    expectedNumeric: true
  },
  {
    title: 'Year of Graduation',
    expectedValue: '2025',
    expectedNumeric: true
  },
  {
    title: 'Years of experience',
    expectedValue: '1',
    expectedNumeric: true
  },
  {
    title: 'Current CTC (LPA) excluding stocks',
    expectedValue: '0',
    expectedNumeric: true
  },
  {
    title: 'Expected CTC (LPA)  excluding stocks',
    expectedValue: '10',
    expectedNumeric: true
  }
];

console.log('----------------------------------------------------');
console.log('TESTING SPECIFIC SCREENSHOT FORM QUESTIONS');
console.log('----------------------------------------------------\n');

let allPassed = true;

for (const t of TEST_QUESTIONS) {
  const match = FieldMatcherService.resolveMatch(t.title, DEFAULT_PROFILE);
  const numVal = match.numericValue || FieldMatcherService.extractNumericValue(match.value, t.title);

  console.log(`Question: "${t.title}"`);
  console.log(`  -> Matched Source : ${match.source} (${match.fieldPath || match.id})`);
  console.log(`  -> Resolved Value  : "${match.value}"`);
  console.log(`  -> Numeric Value   : "${numVal}"`);

  if (numVal === t.expectedValue || match.value === t.expectedValue) {
    console.log(`  -> [PASS] Matches expected output "${t.expectedValue}"\n`);
  } else {
    console.error(`  -> [FAIL] Expected "${t.expectedValue}", got "${numVal}" / "${match.value}"\n`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('====================================================');
  console.log('ALL SCREENSHOT QUESTIONS MATCHED & FORMATTED PROPERLY!');
  console.log('====================================================');
} else {
  process.exit(1);
}
