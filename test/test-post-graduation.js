import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('Testing Education field matching: School Names, Numeric Marks, Divided Degree & Branch...');

const testProfile = {
  ...DEFAULT_PROFILE,
  education: {
    ...DEFAULT_PROFILE.education,
    // 10th & 12th Schooling
    tenthSchoolName: 'St. Xavier High School',
    tenthPercentageNumeric: '92.5',
    twelfthSchoolName: 'National Junior College',
    twelfthPercentageNumeric: '94.0',

    // Undergraduate
    collegeName: 'University of Technology',
    degree: 'B.S.',
    branch: 'Computer Science & Engineering',
    graduationYear: '2025',
    graduationCgpaNumeric: '8.8',
    graduationStatus: 'I am in my last year',
    workingStatus: 'Student',

    // Post Graduation
    pgCollegeName: 'Stanford University',
    pgDegree: 'M.S.',
    pgBranch: 'Artificial Intelligence',
    pgGraduationYear: '2027',
    pgGraduationStatus: 'Pursuing',
    pgCgpaNumeric: '3.9'
  }
};

const testQueries = [
  // 10th & 12th
  {
    query: '10th School / Board Name',
    expectedVal: 'St. Xavier High School'
  },
  {
    query: '10th Percentage / CGPA (Numeric)',
    expectedVal: '92.5'
  },
  {
    query: '12th School / Junior College Name',
    expectedVal: 'National Junior College'
  },
  {
    query: '12th Percentage / CGPA (Numeric)',
    expectedVal: '94.0'
  },

  // Undergraduate
  {
    query: 'College/University Name',
    expectedVal: 'University of Technology'
  },
  {
    query: 'Undergraduate Degree',
    expectedVal: 'B.S.'
  },
  {
    query: 'Engineering Branch / Specialization',
    expectedVal: 'Computer Science & Engineering'
  },
  {
    query: 'Degree & Branch',
    expectedVal: 'B.S. in Computer Science & Engineering'
  },
  {
    query: 'Year of Graduation',
    expectedVal: '2025'
  },
  {
    query: 'Graduation Percentage / CGPA',
    expectedVal: '8.8'
  },

  // Post Graduation
  {
    query: 'Post Graduation College / Institute',
    expectedVal: 'Stanford University'
  },
  {
    query: 'PG Degree',
    expectedVal: 'M.S.'
  },
  {
    query: 'Post Graduation Specialization / Branch',
    expectedVal: 'Artificial Intelligence'
  },
  {
    query: 'Post Graduation Degree & Branch',
    expectedVal: 'M.S. in Artificial Intelligence'
  },
  {
    query: 'Post Graduation End Year',
    expectedVal: '2027'
  },
  {
    query: 'PG CGPA / Percentage',
    expectedVal: '3.9'
  },
  {
    query: 'PG Status',
    expectedVal: 'Pursuing'
  }
];

let allPassed = true;

for (const t of testQueries) {
  const match = FieldMatcherService.resolveMatch(t.query, testProfile);
  if (!match || !match.matched) {
    console.error(`[FAIL] Query "${t.query}" failed to match any field!`);
    allPassed = false;
  } else if (match.value !== t.expectedVal) {
    console.error(`[FAIL] Query "${t.query}" returned value "${match.value}", expected "${t.expectedVal}"! (Matched: ${match.fieldPath})`);
    allPassed = false;
  } else {
    console.log(`[PASS] "${t.query}" -> ${match.fieldPath}: "${match.value}" (Score: ${match.confidence.toFixed(2)})`);
  }
}

if (!allPassed) {
  process.exit(1);
}

console.log('\nAll Education field matching tests (School Names, Numeric Marks, Divided Degree & Branch) passed with 100% precision!');
