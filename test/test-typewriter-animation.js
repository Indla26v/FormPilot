/**
 * Test Suite: Word-by-Word Typewriter Animation for AI Answers
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';

console.log('----------------------------------------------------');
console.log('TESTING WORD-BY-WORD TYPEWRITER STREAMING ANIMATION');
console.log('----------------------------------------------------\n');

// Mock a DOM textarea input element
class MockTextArea {
  constructor() {
    this.value = '';
    this.events = [];
    this.scrollTop = 0;
    this.scrollHeight = 100;
    this.clientHeight = 50;
    this.tagName = 'TEXTAREA';
  }
  focus() {
    this.events.push('focus');
  }
  dispatchEvent(evt) {
    this.events.push(evt.type);
    return true;
  }
}

const mockInput = new MockTextArea();
const sampleAiAnswer = "I led the migration of legacy synchronous REST endpoints to Spring Boot reactive WebFlux streams with Kafka event queues.";

const snapshots = [];
const originalSetInputValue = GoogleFormsFillerService.setInputValue;
GoogleFormsFillerService.setInputValue = function(el, val) {
  snapshots.push(val);
  return originalSetInputValue.call(this, el, val);
};

console.log('Streaming answer into mock input...');
const startTime = Date.now();
const success = await GoogleFormsFillerService.typewriteInputValue(mockInput, sampleAiAnswer, 5);
const duration = Date.now() - startTime;

console.log(`[PASS] Stream completed in ${duration}ms over ${snapshots.length} progressive increments.`);

if (snapshots.length >= 10) {
  console.log(`[PASS] Progressive stream verified: ${snapshots.length} frames captured.`);
  console.log(`       Early frame: "${snapshots[2]}"`);
  console.log(`       Mid frame:   "${snapshots[Math.floor(snapshots.length / 2)]}"`);
  console.log(`       Final frame: "${snapshots[snapshots.length - 1]}"`);
} else {
  console.error('[FAIL] Typewriter stream did not generate sufficient word increments:', snapshots);
  process.exit(1);
}

if (mockInput.value === sampleAiAnswer) {
  console.log('[PASS] Final value exactly matches target AI text.');
} else {
  console.error('[FAIL] Final value mismatch:', mockInput.value);
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: WORD-BY-WORD TYPEWRITER ANIMATION VERIFIED!');
console.log('====================================================\n');
