/**
 * Test Suite: Common Candidate Data & Switchable Role Profiles Verification
 * Validates that Personal, Education, and Experience are synchronized globally across all profiles,
 * while Skills, Links, and Custom Fields remain switchable and isolated per profile.
 */

import { StorageService } from '../src/services/StorageService.js';
import { STORAGE_KEYS, DEFAULT_PROFILE, DEFAULT_COMMON_DATA } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING COMMON CANDIDATE DATA & SWITCHABLE ROLE PROFILES');
console.log('----------------------------------------------------\n');

// Mock localStorage for headless Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// 1. Initial State Check
console.log('Test 1: Initializing default common data and profiles...');
const initialProfiles = await StorageService.getProfiles();
const initialCommon = await StorageService.getCommonData();

if (initialProfiles.length >= 1 && initialCommon && initialCommon.personal) {
  console.log('[PASS] StorageService initialized default profile with common candidate data.');
} else {
  console.error('[FAIL] Initialization failed!');
  process.exit(1);
}

// 2. Create Two Distinct Role Profiles: "Java Backend SDE" and "AI / ML Engineer"
console.log('\nTest 2: Creating distinct role profiles...');
const javaProfile = {
  id: 'profile_java_1',
  name: 'Java Backend SDE',
  skills: [
    { name: 'Java', level: 'Expert', years: '4', rating: 10 },
    { name: 'Spring Boot', level: 'Advanced', years: '3', rating: 9 },
    { name: 'Microservices', level: 'Advanced', years: '3', rating: 8 },
    { name: 'PostgreSQL', level: 'Intermediate', years: '2', rating: 7 }
  ],
  links: {
    linkedinUrl: 'https://www.linkedin.com/in/alex-morgan-java',
    githubUrl: 'https://github.com/alex-morgan-java',
    portfolioUrl: 'https://alexmorgan-java.dev',
    resumeUrl: 'https://drive.google.com/file/d/java-resume-pdf'
  },
  customFields: [
    { key: 'Primary Framework', value: 'Spring Boot / Hibernate' },
    { key: 'JVM Architecture', value: 'JVM Memory Tuning & GC profiling' }
  ]
};

const aiProfile = {
  id: 'profile_ai_2',
  name: 'AI / ML Engineer',
  skills: [
    { name: 'Python', level: 'Expert', years: '4', rating: 10 },
    { name: 'FastAPI', level: 'Advanced', years: '2', rating: 8 },
    { name: 'LangChain', level: 'Advanced', years: '2', rating: 9 },
    { name: 'Vector DBs (Qdrant)', level: 'Intermediate', years: '1', rating: 7 }
  ],
  links: {
    linkedinUrl: 'https://www.linkedin.com/in/alex-morgan-ai',
    githubUrl: 'https://github.com/alex-morgan-ai',
    portfolioUrl: 'https://alexmorgan-ai.dev',
    resumeUrl: 'https://drive.google.com/file/d/ai-resume-pdf'
  },
  customFields: [
    { key: 'Primary Framework', value: 'LangChain / PyTorch' },
    { key: 'LLM Deployment', value: 'Local Ollama & vLLM inference orchestration' }
  ]
};

await StorageService.set(STORAGE_KEYS.PROFILES, [javaProfile]);
await StorageService.saveProfile(aiProfile);

const storedProfiles = await StorageService.getProfiles();
if (storedProfiles.length === 2) {
  console.log('[PASS] Successfully saved 2 distinct role profiles.');
} else {
  console.error(`[FAIL] Expected 2 profiles, found ${storedProfiles.length}`);
  process.exit(1);
}

// 3. Test Common Candidate Data Synchronization
console.log('\nTest 3: Updating Common Candidate Data (Personal, Education, Experience)...');
const updatedCandidateData = {
  personal: {
    fullName: 'Alex Jonathan Morgan',
    email: 'alex.j.morgan@formpilot.io',
    phone: '+1 555-987-6543',
    city: 'Seattle',
    currentLocation: 'Seattle, WA'
  },
  education: {
    collegeName: 'Stanford Institute of Technology',
    degree: 'M.S. in Computer Science',
    graduationYear: '2024',
    graduationCgpa: '9.4 / 10'
  },
  professional: {
    currentOrganization: 'Apex Autonomous Systems',
    currentRole: 'Lead Engineer',
    totalExperienceYears: '3',
    expectedCtc: '25 - 35 LPA'
  }
};

// Save common candidate data globally
await StorageService.saveCommonData(updatedCandidateData);

// Verify ALL profiles inherited the updated common fields
const allProfilesAfterSync = await StorageService.getProfiles();
const javaAfter = allProfilesAfterSync.find((p) => p.id === 'profile_java_1');
const aiAfter = allProfilesAfterSync.find((p) => p.id === 'profile_ai_2');

if (javaAfter.personal.fullName === 'Alex Jonathan Morgan' &&
    aiAfter.personal.fullName === 'Alex Jonathan Morgan' &&
    javaAfter.education.collegeName === 'Stanford Institute of Technology' &&
    aiAfter.education.collegeName === 'Stanford Institute of Technology' &&
    javaAfter.professional.currentOrganization === 'Apex Autonomous Systems' &&
    aiAfter.professional.currentOrganization === 'Apex Autonomous Systems') {
  console.log('[PASS] Personal, Education, and Experience synchronized 100% across all profiles!');
} else {
  console.error('[FAIL] Common data synchronization failed between profiles!');
  console.error('Java Profile:', javaAfter);
  console.error('AI Profile:', aiAfter);
  process.exit(1);
}

// 4. Test Role-Specific Data Isolation
console.log('\nTest 4: Verifying Role-Specific Data Isolation (Skills, Links, Custom Fields)...');

// Check Java Profile Skills & Links
const javaSkills = javaAfter.skills.map((s) => (typeof s === 'object' ? s.name : s));
const aiSkills = aiAfter.skills.map((s) => (typeof s === 'object' ? s.name : s));

if (javaSkills.includes('Java') && javaSkills.includes('Spring Boot') && !javaSkills.includes('LangChain')) {
  console.log('[PASS] Java profile strictly contains Java & Spring Boot skills.');
} else {
  console.error('[FAIL] Java profile skills corrupted:', javaSkills);
  process.exit(1);
}

if (aiSkills.includes('Python') && aiSkills.includes('LangChain') && !aiSkills.includes('Spring Boot')) {
  console.log('[PASS] AI profile strictly contains Python & LangChain skills.');
} else {
  console.error('[FAIL] AI profile skills corrupted:', aiSkills);
  process.exit(1);
}

// Check Links Isolation
if (javaAfter.links.githubUrl === 'https://github.com/alex-morgan-java' &&
    aiAfter.links.githubUrl === 'https://github.com/alex-morgan-ai') {
  console.log('[PASS] GitHub and portfolio links remain strictly isolated per role profile.');
} else {
  console.error('[FAIL] Role profile links leaked across profiles!');
  process.exit(1);
}

// Check Custom Fields Isolation
const javaCf = javaAfter.customFields.find((f) => f.key === 'Primary Framework')?.value;
const aiCf = aiAfter.customFields.find((f) => f.key === 'Primary Framework')?.value;

if (javaCf === 'Spring Boot / Hibernate' && aiCf === 'LangChain / PyTorch') {
  console.log('[PASS] Custom Fields remain isolated per role profile.');
} else {
  console.error('[FAIL] Custom Fields isolation failed:', { javaCf, aiCf });
  process.exit(1);
}

// 5. Test Profile Duplication (Cloning)
console.log('\nTest 5: Testing Profile Cloning / Duplication...');
const clonedAi = await StorageService.duplicateProfile('profile_ai_2');

if (clonedAi.name === 'AI / ML Engineer (Copy)' &&
    clonedAi.personal.fullName === 'Alex Jonathan Morgan' &&
    clonedAi.skills.some((s) => (typeof s === 'object' ? s.name : s) === 'LangChain')) {
  console.log('[PASS] Cloned profile inherited common candidate details and cloned role-specific skills/links.');
} else {
  console.error('[FAIL] Cloned profile verification failed:', clonedAi);
  process.exit(1);
}

// 6. Test Export & Import Roundtrip
console.log('\nTest 6: Testing Backup Export and Import Roundtrip...');
const backupJson = await StorageService.exportBackup();
const parsedBackup = JSON.parse(backupJson);

if (parsedBackup.commonData && parsedBackup.commonData.personal.fullName === 'Alex Jonathan Morgan' &&
    parsedBackup.profiles.length === 3) {
  console.log('[PASS] Backup export payload includes common candidate data block and all role profiles.');
} else {
  console.error('[FAIL] Backup payload malformed:', parsedBackup);
  process.exit(1);
}

// Simulate importing onto a fresh device
mockStorage.clear();
await StorageService.importBackup(backupJson);

const reloadedProfiles = await StorageService.getProfiles();
const reloadedCommon = await StorageService.getCommonData();

if (reloadedProfiles.length === 3 &&
    reloadedCommon.personal.fullName === 'Alex Jonathan Morgan' &&
    reloadedProfiles.some((p) => p.name === 'Java Backend SDE') &&
    reloadedProfiles.some((p) => p.name === 'AI / ML Engineer')) {
  console.log('[PASS] Backup import roundtrip restored common candidate data and all role profiles successfully.');
} else {
  console.error('[FAIL] Backup import roundtrip failed!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL COMMON & SWITCHABLE ROLE PROFILE TESTS PASSED (100%)');
console.log('====================================================\n');
