/**
 * test-comprehensive-fixes.js
 * Test suite verifying:
 * 1. Social links matching (GitHub *, Personal Portfolio, LinkedIn) without wiping.
 * 2. Role experience grounding (Junior 0-2 yrs vs Senior 3+ yrs).
 * 3. Form Context extraction.
 * 4. Project titles prompt inclusion.
 * 5. Checkbox single-role tier matching vs multi-skill checkboxes.
 */

import { FieldMatcherService } from '../src/services/FieldMatcherService.js';
import { ProfileValidatorService } from '../src/services/ProfileValidatorService.js';
import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { RetrievalService } from '../src/services/rag/RetrievalService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('RUNNING COMPREHENSIVE FIXES TEST SUITE');
console.log('----------------------------------------------------');

const candidateProfile = {
  ...DEFAULT_PROFILE,
  personal: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+91 98765 43210'
  },
  professional: {
    totalExperienceYears: '1',
    currentRole: 'Junior AI Engineer',
    currentCtcLpa: '0',
    expectedCtcLpa: '12',
    noticePeriod: 'Immediate',
    noticePeriodDays: '0'
  },
  links: {
    githubUrl: 'https://github.com/alex-morgan-dev',
    linkedinUrl: 'https://linkedin.com/in/alex-morgan-dev',
    portfolioUrl: 'https://alexmorgan.dev',
    projectDemoUrl: 'https://github.com/alex-morgan-dev/ai-voice-agent-pipeline'
  },
  skills: [
    { name: 'Python', level: 'Advanced', years: '2', rating: 9 },
    { name: 'AI/Backend', level: 'Intermediate', years: '1', rating: 8 },
    { name: 'FastAPI', level: 'Advanced', years: '2', rating: 8 }
  ]
};

// 1. TEST SOCIAL & PORTFOLIO LINKS MATCHING & GROUNDING
console.log('\n--- 1. Social & Portfolio Links Matching & Grounding ---');

const githubMatch = FieldMatcherService.resolveMatch('github *', candidateProfile);
console.log('[1] Question: "github *" -> Value:', githubMatch?.value);
if (githubMatch?.value !== 'https://github.com/alex-morgan-dev') {
  throw new Error(`Expected GitHub URL, got: ${githubMatch?.value}`);
}

const groundedGithub = ProfileValidatorService.validateAndGroundDecision(
  'github *',
  { decisionType: 'strict_profile', value: 'https://github.com/alex-morgan-dev' },
  candidateProfile
);
console.log('[2] Grounded GitHub:', groundedGithub.value);
if (!groundedGithub.value || groundedGithub.value === '') {
  throw new Error('Grounded GitHub was wiped to empty string!');
}

const portfolioMatch = FieldMatcherService.resolveMatch('personal portfolio', candidateProfile);
console.log('[3] Question: "personal portfolio" -> Value:', portfolioMatch?.value);
if (portfolioMatch?.value !== 'https://alexmorgan.dev') {
  throw new Error(`Expected Portfolio URL, got: ${portfolioMatch?.value}`);
}

const groundedPortfolio = ProfileValidatorService.validateAndGroundDecision(
  'personal portfolio',
  { decisionType: 'strict_profile', value: 'https://alexmorgan.dev' },
  candidateProfile
);
console.log('[4] Grounded Portfolio:', groundedPortfolio.value);
if (!groundedPortfolio.value || groundedPortfolio.value === '') {
  throw new Error('Grounded Portfolio was wiped to empty string!');
}

// 2. TEST ROLE SELECTION & EXPERIENCE GROUNDING
console.log('\n--- 2. Role & Seniority Choice Matching (Junior 0-2 yrs vs Senior 3+ yrs) ---');

const roleQuestion = 'which role are you applying for? *';
const roleOptions = [
  'junior ai/backend engineer – 0-2 yrs · ₹20-30 LPA + equity',
  'senior ai/backend engineer – 3+ yrs · ₹30-50 LPA + equity'
];

// Test with 1 year experience profile (Junior)
const matchedRoleJunior = FieldMatcherService.matchRoleOrPositionOption(roleQuestion, roleOptions, candidateProfile);
console.log('[1] Junior Profile (1 yr exp) Matched:', matchedRoleJunior?.option);
if (!matchedRoleJunior?.option?.includes('junior')) {
  throw new Error(`Junior profile should pick junior role, got: ${matchedRoleJunior?.option}`);
}

// Test checkbox matching on role question -> must return ONLY Junior
const cbRoleSelected = FieldMatcherService.matchCheckboxOptions(roleQuestion, roleOptions, candidateProfile);
console.log('[2] Checkbox Selection for Role:', cbRoleSelected);
if (cbRoleSelected.length !== 1 || !cbRoleSelected[0].includes('junior')) {
  throw new Error(`Checkbox on role question selected ${cbRoleSelected.length} options! Expected only Junior.`);
}

// Test with Senior Profile (4 years exp)
const seniorProfile = {
  ...candidateProfile,
  professional: { ...candidateProfile.professional, totalExperienceYears: '4', currentRole: 'Senior Backend Engineer' }
};
const matchedRoleSenior = FieldMatcherService.matchRoleOrPositionOption(roleQuestion, roleOptions, seniorProfile);
console.log('[3] Senior Profile (4 yrs exp) Matched:', matchedRoleSenior?.option);
if (!matchedRoleSenior?.option?.includes('senior')) {
  throw new Error(`Senior profile should pick senior role, got: ${matchedRoleSenior?.option}`);
}

// Test ProfileValidator grounding if an AI mistakenly selected both
const groundedAiChoice = ProfileValidatorService.validateAndGroundDecision(
  roleQuestion,
  { decisionType: 'choice_selection', value: roleOptions },
  candidateProfile,
  false,
  'checkbox'
);
console.log('[4] Grounded AI Decision for Junior Candidate (when AI returned both):', groundedAiChoice.value);
if (Array.isArray(groundedAiChoice.value) && groundedAiChoice.value.length !== 1) {
  throw new Error(`Validator should have filtered out Senior tier, got: ${JSON.stringify(groundedAiChoice.value)}`);
}

// 3. TEST SKILL CHECKBOXES (SHOULD STILL SELECT MULTIPLE SKILLS)
console.log('\n--- 3. Skill Checkboxes (Multi-Choice) ---');

const skillQuestion = 'Which technologies and languages are you proficient in?';
const skillOptions = ['Python', 'Java', 'FastAPI', 'Rust', 'Ruby'];
const matchedSkills = FieldMatcherService.matchCheckboxOptions(skillQuestion, skillOptions, candidateProfile);
console.log('Matched Skills Checkboxes:', matchedSkills);
if (!matchedSkills.includes('Python') || !matchedSkills.includes('FastAPI') || matchedSkills.includes('Java')) {
  throw new Error(`Skill checkboxes failed: ${JSON.stringify(matchedSkills)}`);
}

// 4. TEST FORM CONTEXT EXTRACTION
console.log('\n--- 4. Form Context Extraction ---');

const mockDoc = {
  title: 'AI Engineer Application Form - Google Forms',
  querySelector: (sel) => {
    if (sel.includes('.freebirdFormviewerViewHeaderTitle') || sel.includes('.F9N7Re')) {
      return { innerText: 'Deep Tech Engineering Application' };
    }
    if (sel.includes('.freebirdFormviewerViewHeaderDescription')) {
      return { innerText: 'Join our cutting-edge AI startup building autonomous agents.' };
    }
    return null;
  },
  querySelectorAll: () => []
};

const extractedContext = GoogleFormsFillerService.extractFormContext(mockDoc);
console.log('Extracted Form Context:', extractedContext);
if (extractedContext.formTitle !== 'Deep Tech Engineering Application') {
  throw new Error(`Expected Form Title "Deep Tech Engineering Application", got: ${extractedContext.formTitle}`);
}
if (!extractedContext.formDescription.includes('cutting-edge AI startup')) {
  throw new Error(`Expected Form Description, got: ${extractedContext.formDescription}`);
}

// 5. TEST RETRIEVAL SERVICE BOOSTING FOR PROJECTS
console.log('\n--- 5. RAG Retrieval Project Query Boosting ---');

const mockChunks = [
  {
    id: 'chunk_1',
    docTitle: 'Resume.pdf',
    sectionTitle: 'Education',
    text: 'Graduated in 2025 with B.Tech in Computer Science from National Institute of Technology with 9.2 CGPA.'
  },
  {
    id: 'chunk_2',
    docTitle: 'AI Voice Agent Pipeline (GitHub README)',
    sectionTitle: 'Architecture & Features',
    source: 'github',
    text: 'Developed AI Voice Agent Pipeline: a real-time conversational streaming pipeline using WebSockets and FastAPI.'
  }
];

const tokens = RetrievalService.tokenize('tell us about a project you are proud of and explain its architecture');
const score1 = RetrievalService.scoreChunk(tokens, mockChunks[0]);
const score2 = RetrievalService.scoreChunk(tokens, mockChunks[1]);
console.log('Score Chunk 1 (Education):', score1);
console.log('Score Chunk 2 (AI Voice Agent Project):', score2);
if (score2 <= score1) {
  throw new Error('Project chunk should score significantly higher than education for a project inquiry!');
}

console.log('\n====================================================');
console.log('ALL COMPREHENSIVE FIX TESTS PASSED 100% SUCCESSFULLY!');
console.log('====================================================');
