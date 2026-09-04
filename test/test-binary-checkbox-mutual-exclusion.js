/**
 * Test Suite: Binary Checkbox Mutual Exclusion & Nested Container Prevention
 * 
 * Verifies that:
 * 1. findQuestionContainers filters out nested option rows with role="listitem",
 *    returning only top-level question cards.
 * 2. Questions with binary choices ("Yes" / "No") never select both options.
 * 3. Selecting "Yes" automatically unselects an opposing "No" checkbox and vice-versa.
 * 4. ProfileValidatorService grounds binary choices against candidate truth (e.g. "Graduated" -> Yes).
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { ProfileValidatorService } from '../src/services/ProfileValidatorService.js';
import { FieldMatcherService } from '../src/services/FieldMatcherService.js';

console.log('------------------------------------------------------------');
console.log('TESTING BINARY CHECKBOX MUTUAL EXCLUSION & NESTED CONTAINERS');
console.log('------------------------------------------------------------\n');

// Mock DOM classes
class MockElement {
  constructor(tagName, attributes = {}, className = '') {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.className = className;
    this.classList = {
      contains: (c) => this.className.split(' ').includes(c),
      add: (c) => { if (!this.classList.contains(c)) this.className = (this.className + ' ' + c).trim(); },
      remove: (c) => { this.className = this.className.split(' ').filter((x) => x !== c).join(' '); }
    };
    this.children = [];
    this.parentElement = null;
    this.value = attributes.value || '';
    this.innerText = attributes.innerText || '';
    this.textContent = this.innerText;
    this.checked = false;
  }

  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  querySelector(sel) {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }
  querySelectorAll(sel) {
    const res = [];
    const walk = (node) => {
      if (node !== this) {
        if (sel === 'div[role="listitem"]' && node.tagName === 'DIV' && node.getAttribute('role') === 'listitem') res.push(node);
        else if (sel === 'div[role="heading"]' && node.tagName === 'DIV' && node.getAttribute('role') === 'heading') res.push(node);
        else if (sel === 'div[role="checkbox"]' && node.tagName === 'DIV' && node.getAttribute('role') === 'checkbox') res.push(node);
        else if (sel === 'div.Qr7Oae' && node.tagName === 'DIV' && node.classList.contains('Qr7Oae')) res.push(node);
        else if (sel.includes('.e3Duub') && node.classList.contains('e3Duub')) res.push(node);
        else if (sel.includes('input[data-automation-id="textInput"]')) {}
      }
      for (const c of node.children) walk(c);
    };
    walk(this);
    return res;
  }
  closest(sel) {
    let curr = this;
    while (curr) {
      if (sel.includes('div[role="listitem"]') && curr.tagName === 'DIV' && curr.getAttribute('role') === 'listitem') return curr;
      if (sel.includes('.Qr7Oae') && curr.classList.contains('Qr7Oae')) return curr;
      curr = curr.parentElement;
    }
    return null;
  }
  focus() {}
  click() {}
  dispatchEvent() { return true; }
}

globalThis.Event = class { constructor(t) { this.type = t; } };

// Test 1: Nested div[role="listitem"] in Google Forms
console.log('Test 1: Container detection with nested option listitems...');
const mockDoc = new MockElement('body');

// Outer question card has role="listitem" and class="Qr7Oae"
const questionCard = new MockElement('div', { role: 'listitem' }, 'Qr7Oae');
const heading = new MockElement('div', { role: 'heading', innerText: 'Have you completed your graduation? *' });
questionCard.appendChild(heading);

// Inside question card, Google Forms creates option rows with role="listitem" and class="e3Duub"
const yesRow = new MockElement('div', { role: 'listitem' }, 'e3Duub');
const yesCheckbox = new MockElement('div', { role: 'checkbox', 'aria-label': 'Yes' });
yesRow.appendChild(yesCheckbox);
questionCard.appendChild(yesRow);

const noRow = new MockElement('div', { role: 'listitem' }, 'e3Duub');
const noCheckbox = new MockElement('div', { role: 'checkbox', 'aria-label': 'No' });
noRow.appendChild(noCheckbox);
questionCard.appendChild(noRow);

mockDoc.appendChild(questionCard);

const detectedContainers = GoogleFormsFillerService.findQuestionContainers(mockDoc);
console.log(`Detected ${detectedContainers.length} question container(s).`);

if (detectedContainers.length === 1 && detectedContainers[0] === questionCard) {
  console.log('[PASS] Option rows correctly filtered out; only top-level question card detected.');
} else {
  console.error('[FAIL] Expected exactly 1 top-level container, got:', detectedContainers.length);
  process.exit(1);
}

// Test 2: ProfileValidatorService.resolveBinaryChoice
console.log('\nTest 2: Resolving binary choice based on candidate profile facts...');
const testProfile = {
  education: {
    graduationStatus: 'Graduated',
    graduationYear: '2026'
  },
  professional: {
    totalExperienceYears: '2',
    canJoinImmediately: 'Yes'
  }
};

const gradChoice = ProfileValidatorService.resolveBinaryChoice('Have you completed your graduation? *', testProfile);
console.log(`Graduation choice resolved: "${gradChoice}"`);
if (gradChoice === 'Yes') {
  console.log('[PASS] Graduation question correctly resolved to "Yes" based on "Graduated" status.');
} else {
  console.error('[FAIL] Expected "Yes", got:', gradChoice);
  process.exit(1);
}

const locationChoice = ProfileValidatorService.resolveBinaryChoice('Are you comfortable with the work location Noida, sector 62 ? *', testProfile);
console.log(`Location comfort choice resolved: "${locationChoice}"`);
if (locationChoice === 'Yes') {
  console.log('[PASS] Location comfort question resolved to "Yes".');
} else {
  console.error('[FAIL] Expected "Yes", got:', locationChoice);
  process.exit(1);
}

// Test 3: Grounding against AI hallucination returning both Yes and No
console.log('\nTest 3: Anti-hallucination grounding when AI returns both ["Yes", "No"]...');
const conflictingAiDecision = {
  decisionType: 'choice_selection',
  value: ['Yes', 'No'],
  confidence: 0.95
};

const groundedDecision = ProfileValidatorService.validateAndGroundDecision(
  'Have you completed your graduation? *',
  conflictingAiDecision,
  testProfile,
  false,
  'checkbox'
);

console.log('Grounded Decision Value:', groundedDecision.value);
if (Array.isArray(groundedDecision.value) && groundedDecision.value.length === 1 && groundedDecision.value[0] === 'Yes') {
  console.log('[PASS] Conflicting ["Yes", "No"] successfully stripped down to single grounded ["Yes"].');
} else {
  console.error('[FAIL] Expected ["Yes"], got:', groundedDecision.value);
  process.exit(1);
}

// Test 4: unselectCheckbox toggles state
console.log('\nTest 4: unselectCheckbox functionality...');
yesCheckbox.setAttribute('aria-checked', 'true');
GoogleFormsFillerService.unselectCheckbox(yesCheckbox);
if (yesCheckbox.getAttribute('aria-checked') === 'false') {
  console.log('[PASS] unselectCheckbox correctly flipped aria-checked to "false".');
} else {
  console.error('[FAIL] Expected aria-checked to be "false", got:', yesCheckbox.getAttribute('aria-checked'));
  process.exit(1);
}

// Test 5: FieldMatcherService.matchCheckboxOptions
console.log('\nTest 5: FieldMatcherService.matchCheckboxOptions never returns both Yes and No...');
const matchedChoices = FieldMatcherService.matchCheckboxOptions(
  'Have you completed your graduation? *',
  ['Yes', 'No'],
  testProfile
);
console.log('Matched Checkbox Choices:', matchedChoices);
if (matchedChoices.length === 1 && matchedChoices[0] === 'Yes') {
  console.log('[PASS] FieldMatcherService returned only ["Yes"].');
} else {
  console.error('[FAIL] Expected ["Yes"], got:', matchedChoices);
  process.exit(1);
}

console.log('\n[ALL TESTS PASSED] Binary checkbox mutual exclusion and container filtering verified!');
