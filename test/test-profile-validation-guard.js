/**
 * Test Suite: Profile Ground Truth Validation & Anti-Hallucination Guard
 * Specifically tests the scenarios reported by the user:
 * 1. "Total Experience *" with profile totalExperienceYears = '0' => Evaluates to '0' (NOT '2').
 * 2. "What is your Current CTC (in LPA) ? *" with profile currentCtcLpa = '0' => Evaluates to '0' (NOT '2').
 * 3. "What Is your Notice Period ? *" with profile noticePeriod = 'Immediate' => Evaluates to 'Immediate' / '0' (NOT '1').
 * 4. In-DOM post-validation auto-correction for pre-filled wrong details.
 */

import { ProfileValidatorService } from '../src/services/ProfileValidatorService.js';
import { LlmService } from '../src/services/llm/LlmService.js';
import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('====================================================');
console.log('TESTING PROFILE GROUND TRUTH VALIDATION & ANTI-HALLUCINATION GUARD');
console.log('====================================================\n');

// Mock User Profile matching the screenshot:
// - Total Experience: '0'
// - Current Organization: 'NA'
// - Current Role: 'NA'
// - Current CTC: '0' / '0 LPA'
// - Notice Period: 'Immediate' (0 days)
// - Skills have practice years: FastAPI (2 yrs), Python (3 yrs)
const userProfile = {
  ...DEFAULT_PROFILE,
  personal: {
    ...DEFAULT_PROFILE.personal,
    fullName: 'Alex Morgan',
    email: 'alex.morgan.dev@example.com'
  },
  professional: {
    ...DEFAULT_PROFILE.professional,
    currentOrganization: 'NA',
    currentRole: 'NA',
    totalExperienceYears: '0',
    currentCtc: '0',
    currentCtcLpa: '0',
    currentCtcNumeric: '0',
    expectedCtc: '10 LPA',
    expectedCtcLpa: '10',
    expectedCtcNumeric: '1000000',
    noticePeriod: 'Immediate',
    noticePeriodDays: '0'
  },
  skills: [
    { name: 'FastAPI', level: 'Expert', years: '2', rating: 9 },
    { name: 'Python', level: 'Expert', years: '3', rating: 9 },
    { name: 'React', level: 'Advanced', years: '2', rating: 8 }
  ]
};

// ----------------------------------------------------
// TEST 1: ProfileValidatorService Direct Semantic Grounding
// ----------------------------------------------------
console.log('--- TEST 1: ProfileValidatorService Semantic Categorization & Grounding ---');

const testCases = [
  {
    question: 'Total Experience *',
    hallucinatedAiValue: '2',
    expected: '0',
    type: 'text'
  },
  {
    question: 'What is your Current CTC (in LPA) ? *',
    hallucinatedAiValue: '2',
    expected: '0',
    type: 'text'
  },
  {
    question: 'What Is your Notice Period ? *',
    hallucinatedAiValue: '1',
    expected: 'Immediate',
    type: 'text'
  },
  {
    question: 'Notice Period (In days) *',
    hallucinatedAiValue: '1',
    expected: '0',
    type: 'number'
  },
  {
    question: 'Expected CTC (in LPA) *',
    hallucinatedAiValue: '1000000',
    expected: '10',
    type: 'text'
  }
];

for (const tc of testCases) {
  const grounded = ProfileValidatorService.validateAndGroundDecision(
    tc.question,
    { decisionType: 'strict_profile', value: tc.hallucinatedAiValue },
    userProfile,
    tc.type === 'number',
    tc.type
  );

  if (grounded.value === tc.expected) {
    console.log(`[PASS] "${tc.question}" -> AI tried "${tc.hallucinatedAiValue}", Grounded to: "${grounded.value}"`);
  } else {
    console.error(`[FAIL] "${tc.question}" expected "${tc.expected}", got "${grounded.value}"`);
    process.exit(1);
  }
}

// ----------------------------------------------------
// TEST 2: LlmService with Simulating LLM Hallucinations
// ----------------------------------------------------
console.log('\n--- TEST 2: LlmService End-to-End Evaluation with Hallucination Defense ---');

// Mock fetch where LLM returns hallucinated "2" for experience and current CTC, and "1" for notice period
global.fetch = async (url, opts) => {
  let bodyObj = {};
  try { bodyObj = typeof opts?.body === 'string' ? JSON.parse(opts.body) : {}; } catch (e) {}
  const fullText = (bodyObj?.messages?.map((m) => m.content).join(' ') || JSON.stringify(bodyObj) || '');
  const qMatch = fullText.match(/Question Text:\s*"([^"]+)"/i);
  const qText = (qMatch ? qMatch[1] : fullText).toLowerCase();

  let hallucinatedJson = { decisionType: 'strict_profile', value: '2', confidence: 0.95 };

  if (qText.includes('notice period') && !qText.includes('days')) {
    hallucinatedJson = { decisionType: 'strict_profile', value: '1', confidence: 0.95 };
  } else if (qText.includes('notice period') && qText.includes('days')) {
    hallucinatedJson = { decisionType: 'strict_profile', value: '1', confidence: 0.95 };
  }

  return {
    ok: true,
    json: async () => ({ message: { content: JSON.stringify(hallucinatedJson) } })
  };
};

const q1 = await LlmService.evaluateAndFillQuestion({
  question: 'Total Experience *',
  fieldType: 'text',
  profile: userProfile
});
console.log(`[PASS] Q1: Total Experience evaluated to "${q1.value}" (Expected: "0")`);
if (q1.value !== '0') {
  console.error('[FAIL] Q1 Total Experience should be "0", got', q1.value);
  process.exit(1);
}

const q2 = await LlmService.evaluateAndFillQuestion({
  question: 'What is your Current CTC (in LPA) ? *',
  fieldType: 'text',
  profile: userProfile
});
console.log(`[PASS] Q2: Current CTC evaluated to "${q2.value}" (Expected: "0")`);
if (q2.value !== '0') {
  console.error('[FAIL] Q2 Current CTC should be "0", got', q2.value);
  process.exit(1);
}

const q3 = await LlmService.evaluateAndFillQuestion({
  question: 'What Is your Notice Period ? *',
  fieldType: 'text',
  profile: userProfile
});
console.log(`[PASS] Q3: Notice Period evaluated to "${q3.value}" (Expected: "Immediate")`);
if (q3.value !== 'Immediate') {
  console.error('[FAIL] Q3 Notice Period should be "Immediate", got', q3.value);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 3: In-DOM Post-Validation Auto-Correction for User's Exact Screenshot Fields
// ----------------------------------------------------
console.log('\n--- TEST 3: In-DOM Post-Validation Auto-Correction ---');

class MockClassList {
  constructor() { this.classes = new Set(); }
  add(name) { this.classes.add(name); }
  remove(name) { this.classes.delete(name); }
  contains(name) { return this.classes.has(name); }
}

class MockElement {
  constructor(tagName, attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.children = [];
    this.parentElement = null;
    this.value = attrs.value || '';
    this.innerText = attrs.innerText || '';
    this.textContent = attrs.textContent || this.innerText;
    this.classList = new MockClassList();
    this.style = {};
    this.eventListeners = {};
    if (attrs.className) {
      attrs.className.split(' ').filter(Boolean).forEach((c) => this.classList.add(c));
    }
  }

  getAttribute(name) { return this.attributes[name] !== undefined ? this.attributes[name] : null; }
  setAttribute(name, val) { this.attributes[name] = String(val); }
  addEventListener(event, handler) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }
  dispatchEvent(event) {
    const handlers = this.eventListeners[event.type || event] || [];
    for (const h of handlers) h(event);
    return true;
  }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }
  querySelectorAll(selector) {
    const matches = [];
    const walk = (node) => {
      if (node !== this) {
        if (node.tagName === selector.toUpperCase()) matches.push(node);
      }
      for (const child of node.children) walk(child);
    };
    walk(this);
    return matches;
  }
}

global.HTMLInputElement = MockElement;
global.HTMLTextAreaElement = MockElement;
global.Event = class { constructor(type) { this.type = type; } };
global.KeyboardEvent = class { constructor(type) { this.type = type; } };

// Case 1: Field has wrong value "2" in Total Experience -> postValidateAndFixField fixes to "0"
const c1 = new MockElement('div');
const in1 = new MockElement('input', { value: '2' });
c1.appendChild(in1);
const res1 = await GoogleFormsFillerService.postValidateAndFixField(c1, in1, 'Total Experience *', userProfile, '2');
console.log(`[PASS] In-DOM Fix Total Experience: "2" -> Corrected to: "${in1.value}"`);
if (in1.value !== '0') {
  console.error('[FAIL] In-DOM Fix Total Experience failed, got', in1.value);
  process.exit(1);
}

// Case 2: Field has wrong value "2" in Current CTC -> postValidateAndFixField fixes to "0"
const c2 = new MockElement('div');
const in2 = new MockElement('input', { value: '2' });
c2.appendChild(in2);
const res2 = await GoogleFormsFillerService.postValidateAndFixField(c2, in2, 'What is your Current CTC (in LPA) ? *', userProfile, '2');
console.log(`[PASS] In-DOM Fix Current CTC: "2" -> Corrected to: "${in2.value}"`);
if (in2.value !== '0') {
  console.error('[FAIL] In-DOM Fix Current CTC failed, got', in2.value);
  process.exit(1);
}

// Case 3: Field has wrong value "1" in Notice Period -> postValidateAndFixField fixes to "Immediate"
const c3 = new MockElement('div');
const in3 = new MockElement('input', { value: '1' });
c3.appendChild(in3);
const res3 = await GoogleFormsFillerService.postValidateAndFixField(c3, in3, 'What Is your Notice Period ? *', userProfile, '1');
console.log(`[PASS] In-DOM Fix Notice Period: "1" -> Corrected to: "${in3.value}"`);
if (in3.value !== 'Immediate') {
  console.error('[FAIL] In-DOM Fix Notice Period failed, got', in3.value);
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL PROFILE VALIDATION GUARD TESTS PASSED (100% SUCCESS)');
console.log('====================================================');
