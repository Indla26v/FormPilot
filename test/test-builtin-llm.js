import assert from 'assert';
import { LlmService, DEFAULT_LLM_CONFIG } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('----------------------------------------------------');
console.log('TESTING BUILT-IN SMART ENGINE AI CONFIGURATION');
console.log('----------------------------------------------------\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

// Set default profile
await StorageService.set('gfaf_profiles', [DEFAULT_PROFILE]);
await StorageService.set('gfaf_active_profile_id', DEFAULT_PROFILE.id);

// 1. Verify default config has provider === 'builtin'
console.log('1. Checking default LLM config...');
const config = await LlmService.getConfig();
assert.strictEqual(config.provider, 'builtin', `Expected default provider to be 'builtin', got '${config.provider}'`);
console.log(`[PASS] Default Provider is: ${config.provider}`);

// 2. Test testConnection() for Built-in Smart Engine
console.log('\n2. Testing testConnection() on Built-in Smart Engine...');
const testResult = await LlmService.testConnection(config);
console.log('Test Connection Result:');
console.log('  -> success:', testResult.success);
console.log('  -> message:', testResult.message);
console.log('  -> modelResponse:', testResult.modelResponse);

assert.strictEqual(testResult.success, true, 'Expected testConnection to succeed');
assert(testResult.message.includes('Built-in Smart Engine'), 'Expected message to mention Built-in Smart Engine');
assert(testResult.modelResponse.includes('Candidate profile calibrated'), 'Expected modelResponse to confirm candidate profile');
console.log('[PASS] Built-in Smart Engine testConnection succeeded instantly out of the box!');

// 3. Test generateRagAnswer() with Built-in provider
console.log('\n3. Testing generateRagAnswer() with Built-in provider...');
const answer = await LlmService.generateRagAnswer({
  question: 'What are your core technical skills?',
  profile: DEFAULT_PROFILE,
  retrievedChunks: [{ docTitle: 'Resume', text: 'Full-stack engineering with Python and TypeScript.' }]
});
console.log('Generated Answer:', answer);
assert(answer && answer.length > 0, 'Expected non-empty answer from builtin engine');
console.log('[PASS] Generated answer successfully.');

console.log('\n====================================================');
console.log('SUCCESS: BUILT-IN AI CONFIGURATION VERIFIED 100%!');
console.log('====================================================');
