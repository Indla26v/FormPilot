/**
 * Automated test suite for AI Post-Validation & Constraint Auto-Correction Engine
 * Verifies that fields reflecting error messages, min/max limits, or reactive invalid states
 * are dynamically evaluated and auto-corrected by AI.
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { LlmService } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('====================================================');
console.log('TESTING AI POST-VALIDATION & AUTO-CORRECTION ENGINE');
console.log('====================================================\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

const candidateProfile = {
  ...DEFAULT_PROFILE,
  personal: { fullName: 'Alex Morgan' },
  professional: {
    totalExperienceYears: '1',
    expectedCtcLpa: '10',
    expectedCtcNumeric: '1000000',
    noticePeriodDays: '0'
  },
  education: {
    graduationYear: '2025',
    tenthPercentageNumeric: '92.5'
  }
};

// ----------------------------------------------------
// TEST 1: Direct LlmService.validateAndCorrectEntry
// ----------------------------------------------------
console.log('--- TEST 1: Direct AI Post-Validation on Error Feedback ---');

// Mock LLM generation for post-validation test
global.fetch = async (url, opts) => {
  let bodyObj = {};
  try { bodyObj = typeof opts?.body === 'string' ? JSON.parse(opts.body) : {}; } catch (e) {}
  const fullText = (bodyObj?.messages?.map((m) => m.content).join(' ') || JSON.stringify(bodyObj) || '');
  const errMatch = fullText.match(/VALIDATION ERROR \/ CONSTRAINT FROM FORM:\s*"([^"]+)"/i);
  const errorText = (errMatch ? errMatch[1] : fullText).toLowerCase();

  let responseJson = { isValid: false, correctedValue: '5', reason: 'Clamped to max range 5' };

  if (errorText.includes('must be a whole number')) {
    responseJson = { isValid: false, correctedValue: '0', reason: 'Converted to integer 0' };
  } else if (errorText.includes('must be less than or equal to 100')) {
    responseJson = { isValid: false, correctedValue: '10', reason: 'Converted from INR units to LPA number 10' };
  } else if (errorText.includes('must be greater than 0')) {
    responseJson = { isValid: false, correctedValue: '1', reason: 'Adjusted to minimum valid number 1' };
  } else if (errorText.includes('between 1 and 5')) {
    responseJson = { isValid: false, correctedValue: '5', reason: 'Clamped to max range 5' };
  }

  return {
    ok: true,
    json: async () => ({ message: { content: JSON.stringify(responseJson) } })
  };
};

// Case A: Form emitted "Must be between 1 and 5" on a rating field where AI had entered "8"
const testCaseA = await LlmService.validateAndCorrectEntry({
  question: 'Rate your Python skill (Scale 1-5)',
  currentValue: '8',
  validationError: 'Must be between 1 and 5',
  profile: candidateProfile
});
console.log(`[PASS] Case A (Range Error): "8" with error "Must be between 1 and 5" => Corrected to: "${testCaseA.correctedValue}" (${testCaseA.reason})`);
if (testCaseA.correctedValue !== '5') {
  console.error('[FAIL] Case A expected "5", got', testCaseA.correctedValue);
  process.exit(1);
}

// Case B: Form emitted "Must be less than or equal to 100" on Expected CTC where "1000000" was entered
const testCaseB = await LlmService.validateAndCorrectEntry({
  question: 'Expected CTC (In Lakhs)',
  currentValue: '1000000',
  validationError: 'Must be less than or equal to 100',
  profile: candidateProfile
});
console.log(`[PASS] Case B (Scale Error): "1000000" with error "Must be less than or equal to 100" => Corrected to: "${testCaseB.correctedValue}" (${testCaseB.reason})`);
if (testCaseB.correctedValue !== '10') {
  console.error('[FAIL] Case B expected "10", got', testCaseB.correctedValue);
  process.exit(1);
}

// Case C: Explicit HTML5 attribute bounds check (e.g. max="10")
const testCaseC = await LlmService.validateAndCorrectEntry({
  question: 'Rating out of 10',
  currentValue: '15',
  constraints: { max: '10' },
  profile: candidateProfile
});
console.log(`[PASS] Case C (Attribute max="10"): "15" => Clamped to: "${testCaseC.correctedValue}" (${testCaseC.reason})`);
if (testCaseC.correctedValue !== '10') {
  console.error('[FAIL] Case C expected "10", got', testCaseC.correctedValue);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 2: In-DOM Reactive Validation Error Detection & Auto-Correction
// ----------------------------------------------------
console.log('\n--- TEST 2: In-DOM Reactive Validation Detection & Fix Pipeline ---');

class MockClassList {
  constructor() { this.classes = new Set(); }
  add(name) { this.classes.add(name); }
  remove(name) { this.classes.delete(name); }
  contains(name) { return this.classes.has(name); }
  has(name) { return this.classes.has(name); }
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
        const parts = selector.split(',').map((s) => s.trim());
        for (const p of parts) {
          if (p === 'div[role="alert"]' && node.tagName === 'DIV' && node.getAttribute('role') === 'alert') matches.push(node);
          else if (p === 'div.R3NpKe' && node.tagName === 'DIV' && node.classList.contains('R3NpKe')) matches.push(node);
          else if (p === 'input' && node.tagName === 'INPUT') matches.push(node);
          else if (p === 'textarea' && node.tagName === 'TEXTAREA') matches.push(node);
        }
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

// Create question container simulating a Google Form that renders an error alert when notice period is not whole number
const container = new MockElement('div', { role: 'listitem' });
const heading = new MockElement('div', { role: 'heading', innerText: 'Notice Period (In days)' });
const input = new MockElement('input', { type: 'text', value: 'Immediate' });
const errorAlert = new MockElement('div', { role: 'alert', className: 'R3NpKe', innerText: 'Must be a whole number' });

container.appendChild(heading);
container.appendChild(input);
container.appendChild(errorAlert);

// Detect validation feedback from DOM
const detected = GoogleFormsFillerService.detectValidationFeedback(container, input);
console.log(`[PASS] Detected Reactive DOM Error: "${detected.errorText}" (Has Error: ${detected.hasError})`);

if (!detected.hasError || detected.errorText !== 'Must be a whole number') {
  console.error('[FAIL] Error detection failed');
  process.exit(1);
}

// Run postValidateAndFixField
const correctedResult = await GoogleFormsFillerService.postValidateAndFixField(
  container,
  input,
  'Notice Period (In days)',
  candidateProfile,
  'Immediate'
);

const correctedVal = typeof correctedResult === 'object' ? correctedResult.value : correctedResult;
console.log(`[PASS] Value before post-validation: "Immediate" => Corrected value in DOM: "${input.value}"`);

if (correctedVal !== '0' || input.value !== '0') {
  console.error('[FAIL] Post-validation correction failed, got', input.value);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 3: User's Exact Screenshot Cases (Expected CTC & Notice Period Validation Errors)
// ----------------------------------------------------
console.log('\n--- TEST 3: User Screenshot Live Error Auto-Correction Tests ---');

// Case 1: "What is Your Expected CTC (in LPA) ? *" filled with "7-10LPA" -> Form error: "Must be a number greater than 1"
const ctcContainer = new MockElement('div', { role: 'listitem' });
const ctcInput = new MockElement('input', { type: 'text', value: '7-10LPA' });
const ctcAlert = new MockElement('div', { role: 'alert', className: 'R3NpKe', innerText: 'Must be a number greater than 1' });
ctcContainer.appendChild(ctcInput);
ctcContainer.appendChild(ctcAlert);

const ctcFixed = await GoogleFormsFillerService.postValidateAndFixField(
  ctcContainer,
  ctcInput,
  'What is Your Expected CTC (in LPA) ? *',
  candidateProfile,
  '7-10LPA'
);

const ctcVal = typeof ctcFixed === 'object' ? ctcFixed.value : ctcFixed;
console.log(`[PASS] Expected CTC Fix: "7-10LPA" with "Must be a number greater than 1" => Corrected in DOM to: "${ctcInput.value}"`);
if (ctcInput.value !== '10' && ctcInput.value !== '7') {
  console.error('[FAIL] Expected CTC fix expected "10" or "7", got', ctcInput.value);
  process.exit(1);
}

// Case 2: "What Is your Notice Period ? *" filled with "Immediate" -> Form error: "Must be a number greater than 0"
const npContainer = new MockElement('div', { role: 'listitem' });
const npInput = new MockElement('input', { type: 'text', value: 'Immediate' });
const npAlert = new MockElement('div', { role: 'alert', className: 'R3NpKe', innerText: 'Must be a number greater than 0' });
npContainer.appendChild(npInput);
npContainer.appendChild(npAlert);

const npFixed = await GoogleFormsFillerService.postValidateAndFixField(
  npContainer,
  npInput,
  'What Is your Notice Period ? *',
  candidateProfile,
  'Immediate'
);

console.log(`[PASS] Notice Period Fix: "Immediate" with "Must be a number greater than 0" => Cleared due to conflict, in DOM: "${npInput.value}"`);
if (npInput.value !== '' || !npFixed.hasConflict) {
  console.error('[FAIL] Notice Period conflict expected empty input "" and hasConflict=true, got', `"${npInput.value}"`, npFixed);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 4: Conflict Detection & Truth Retention (No Fake Data Creation)
// ----------------------------------------------------
console.log('\n--- TEST 4: Conflict Detection & Truth Retention (No Fabricating 2 for 0) ---');

const fresherProfile = {
  ...candidateProfile,
  professional: {
    ...candidateProfile.professional,
    totalExperienceYears: '0',
    currentCtcLpa: '0'
  }
};

// Case 1: Total Experience 0 with form requiring > 1
const expContainer = new MockElement('div', { role: 'listitem' });
const expInput = new MockElement('input', { type: 'text', value: '0' });
const expAlert = new MockElement('div', { role: 'alert', className: 'R3NpKe', innerText: 'Must be a number greater than 1' });
expContainer.appendChild(expInput);
expContainer.appendChild(expAlert);

const expResult = await GoogleFormsFillerService.postValidateAndFixField(
  expContainer,
  expInput,
  'Total Experience *',
  fresherProfile,
  '0'
);

console.log(`[PASS] Total Experience Conflict: Cleared and left empty "${expInput.value}" in DOM, Conflict Detected: ${expResult.hasConflict} (${expResult.conflictMessage})`);
if (expInput.value !== '' || !expResult.hasConflict) {
  console.error('[FAIL] Expected empty input "" and hasConflict=true, got', `"${expInput.value}"`, expResult);
  process.exit(1);
}

// Case 2: Current CTC 0 with form requiring > 1
const curCtcContainer = new MockElement('div', { role: 'listitem' });
const curCtcInput = new MockElement('input', { type: 'text', value: '0' });
const curCtcAlert = new MockElement('div', { role: 'alert', className: 'R3NpKe', innerText: 'Must be a number greater than 1' });
curCtcContainer.appendChild(curCtcInput);
curCtcContainer.appendChild(curCtcAlert);

const curCtcResult = await GoogleFormsFillerService.postValidateAndFixField(
  curCtcContainer,
  curCtcInput,
  'What is your Current CTC (in LPA) ? *',
  fresherProfile,
  '0'
);

console.log(`[PASS] Current CTC Conflict: Cleared and left empty "${curCtcInput.value}" in DOM, Conflict Detected: ${curCtcResult.hasConflict} (${curCtcResult.conflictMessage})`);
if (curCtcInput.value !== '' || !curCtcResult.hasConflict) {
  console.error('[FAIL] Expected empty input "" and hasConflict=true, got', `"${curCtcInput.value}"`, curCtcResult);
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL AI POST-VALIDATION & CONFLICT TESTS PASSED (100% SUCCESS)');
console.log('====================================================');
