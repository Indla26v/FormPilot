/**
 * Automated Test Suite: Google Forms Checkbox Option Extraction & Experience Brackets
 * Validates:
 * 1. extractCheckboxOptions accurately extracts labels in real Google Forms DOM (where aria-label is absent and closest('label') is null)
 * 2. Questions 1-5 from user screenshots are all filled without skipping:
 *    - "Have you completed your graduation? *" -> "Yes"
 *    - "How much is your Experience? *" -> "More than 1 year" (for exp > 1) or "0-1 Year" (for exp 0-1)
 *    - "Are you comfortable with the work location Noida, sector 62 ? *" -> "Yes"
 *    - "Do you have any internship/work experience in Operations, Analytics, Business Analytics, MIS, or a related field? *" -> "Yes"
 *    - "Do you have experience creating dashboards or performance trackers? *" -> "Yes"
 * 3. validateAndGroundDecision preserves choice decisions for total_experience and never overwrites choice labels with raw numbers.
 */

import assert from 'assert';
import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { ProfileValidatorService } from '../src/services/ProfileValidatorService.js';
import { FieldMatcherService } from '../src/services/FieldMatcherService.js';

console.log('------------------------------------------------------------');
console.log('TESTING GOOGLE FORMS CHECKBOX EXTRACTION & EXPERIENCE BRACKETS');
console.log('------------------------------------------------------------\n');

// Mock DOM elements
class MockElement {
  constructor(tagName, attributes = {}, className = '') {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.className = className;
    this.classList = {
      contains: (c) => this.className.split(' ').filter(Boolean).includes(c),
      add: (c) => { if (!this.classList.contains(c)) this.className = (this.className + ' ' + c).trim(); },
      remove: (c) => { this.className = this.className.split(' ').filter((x) => x !== c).join(' '); }
    };
    this.children = [];
    this.parentElement = null;
    this.value = attributes.value || '';
    this._innerText = attributes.innerText || '';
    this.checked = false;
    this.eventListeners = {};
  }

  get innerText() {
    if (this._innerText) return this._innerText;
    if (this.children.length > 0) {
      return this.children.map((c) => c.innerText).filter(Boolean).join(' ').trim();
    }
    return '';
  }
  set innerText(v) {
    this._innerText = v;
  }
  get textContent() {
    return this.innerText;
  }
  set textContent(v) {
    this._innerText = v;
  }

  getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  addEventListener(type, cb) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(cb);
  }
  dispatchEvent(event) {
    const handlers = this.eventListeners[event.type] || [];
    for (const h of handlers) h(event);
    return true;
  }
  querySelector(sel) {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }
  querySelectorAll(sel) {
    const res = [];
    const walk = (node) => {
      if (node !== this) {
        if (sel.includes('div[role="checkbox"]') && node.tagName === 'DIV' && node.getAttribute('role') === 'checkbox') res.push(node);
        else if (sel.includes('.M7eMe') && node.classList.contains('M7eMe')) res.push(node);
        else if (sel.includes('.aDTYNe') && node.classList.contains('aDTYNe')) res.push(node);
        else if (sel.includes('.docssharedWizToggleLabeledContainer') && node.classList.contains('docssharedWizToggleLabeledContainer')) res.push(node);
      }
      for (const c of node.children) walk(c);
    };
    walk(this);
    return res;
  }
  closest(sel) {
    let curr = this;
    while (curr) {
      if (sel.includes('.docssharedWizToggleLabeledContainer') && curr.classList.contains('docssharedWizToggleLabeledContainer')) return curr;
      if (sel.includes('.e3Duub') && curr.classList.contains('e3Duub')) return curr;
      if (sel.includes('.Qr7Oae') && curr.classList.contains('Qr7Oae')) return curr;
      curr = curr.parentElement;
    }
    return null;
  }
  focus() {}
  click() {
    this.dispatchEvent(new globalThis.Event('click'));
  }
}

globalThis.Event = class { constructor(t) { this.type = t; } };
globalThis.MouseEvent = class { constructor(t) { this.type = t; } };

const candidateProfileExperienced = {
  personal: {
    fullName: 'Alex Morgan',
    email: 'alex@example.com',
    phone: '9876543210',
    currentLocation: 'Noida'
  },
  education: {
    degree: 'B.Tech',
    collegeName: 'National Institute of Technology',
    graduationStatus: 'Graduated',
    graduationYear: '2024'
  },
  professional: {
    totalExperienceYears: '2',
    currentRole: 'Software Engineer',
    currentOrganization: 'Acme Corp',
    canJoinImmediately: 'Yes'
  },
  skills: ['Python', 'SQL', 'Data Analytics', 'Power BI', 'Dashboard']
};

const candidateProfileFresher = {
  ...candidateProfileExperienced,
  education: {
    degree: 'B.Tech',
    collegeName: 'National Institute of Technology',
    graduationStatus: 'Graduated',
    graduationYear: '2025'
  },
  professional: {
    totalExperienceYears: '0',
    currentRole: 'Fresher',
    currentOrganization: 'NA',
    canJoinImmediately: 'Yes'
  }
};

// ==========================================
// TEST 1: Google Forms Checkbox Label Extraction
// ==========================================
console.log('Test 1: Checkbox option extraction in realistic Google Forms DOM...');

const questionCard = new MockElement('div', { role: 'listitem' }, 'Qr7Oae');

// Yes row
const yesRow = new MockElement('div', {}, 'e3Duub docssharedWizToggleLabeledContainer');
const yesIconWrapper = new MockElement('div', {}, 'uHMk6b fsHoPb');
const yesCb = new MockElement('div', { role: 'checkbox', 'aria-checked': 'false' }, 'uHMk6b');
yesIconWrapper.appendChild(yesCb);
const yesTextWrapper = new MockElement('div', {}, 'aDTYNe snByac OvQpe');
const yesSpan = new MockElement('span', { innerText: 'Yes' }, 'M7eMe');
yesTextWrapper.appendChild(yesSpan);
yesRow.appendChild(yesIconWrapper);
yesRow.appendChild(yesTextWrapper);
questionCard.appendChild(yesRow);

// No row
const noRow = new MockElement('div', {}, 'e3Duub docssharedWizToggleLabeledContainer');
const noIconWrapper = new MockElement('div', {}, 'uHMk6b fsHoPb');
const noCb = new MockElement('div', { role: 'checkbox', 'aria-checked': 'false' }, 'uHMk6b');
noIconWrapper.appendChild(noCb);
const noTextWrapper = new MockElement('div', {}, 'aDTYNe snByac OvQpe');
const noSpan = new MockElement('span', { innerText: 'No' }, 'M7eMe');
noTextWrapper.appendChild(noSpan);
noRow.appendChild(noIconWrapper);
noRow.appendChild(noTextWrapper);
questionCard.appendChild(noRow);

const extractedOptions1 = GoogleFormsFillerService.extractCheckboxOptions(questionCard);
console.log('Extracted options:', extractedOptions1.map((o) => o.label));
assert.strictEqual(extractedOptions1.length, 2, 'Should extract exactly 2 options');
assert.strictEqual(extractedOptions1[0].label, 'Yes', 'Option 1 must be "Yes"');
assert.strictEqual(extractedOptions1[1].label, 'No', 'Option 2 must be "No"');
console.log('[PASS] Checkbox options extracted accurately from Google Forms structure.\n');

// ==========================================
// TEST 2: Experience Bracket Option Extraction & Matching
// ==========================================
console.log('Test 2: "How much is your Experience? *" bracket matching...');

// Candidate with 2 years experience:
const matchedExp2 = FieldMatcherService.matchExperienceOption('How much is your Experience? *', ['0-1 Year', 'More than 1 year'], candidateProfileExperienced);
console.log('Candidate with 2 yrs exp matched:', matchedExp2);
assert.strictEqual(matchedExp2.option, 'More than 1 year', 'Should match "More than 1 year" for 2 years experience');

// Candidate with 0 years experience (Fresher):
const matchedExp0 = FieldMatcherService.matchExperienceOption('How much is your Experience? *', ['0-1 Year', 'More than 1 year'], candidateProfileFresher);
console.log('Candidate with 0 yrs exp (Fresher) matched:', matchedExp0);
assert.strictEqual(matchedExp0.option, '0-1 Year', 'Should match "0-1 Year" for Fresher (0 years)');

// Check FieldMatcherService.matchCheckboxOptions:
const cbExpResult = FieldMatcherService.matchCheckboxOptions('How much is your Experience? *', ['0-1 Year', 'More than 1 year'], candidateProfileExperienced);
console.log('matchCheckboxOptions result:', cbExpResult);
assert.deepStrictEqual(cbExpResult, ['More than 1 year']);

console.log('[PASS] Experience bracket accurately resolved according to profile facts.\n');

// ==========================================
// TEST 3: validateAndGroundDecision preserves choice decisions
// ==========================================
console.log('Test 3: validateAndGroundDecision preserves choice decisions for total_experience...');

const groundedChoice = ProfileValidatorService.validateAndGroundDecision(
  'How much is your Experience? *',
  { decisionType: 'choice_selection', value: ['More than 1 year'], confidence: 0.95 },
  candidateProfileExperienced,
  false,
  'checkbox'
);

console.log('Grounded decision for checkbox experience:', groundedChoice);
assert.deepStrictEqual(groundedChoice.value, ['More than 1 year'], 'Must not overwrite choice with raw string "2"');
console.log('[PASS] Grounding does not corrupt checkbox choice values.\n');

// ==========================================
// TEST 4: All 5 Questions from User Screenshot Evaluated
// ==========================================
console.log('Test 4: Evaluating all 5 questions from user screenshots...');

const userQuestions = [
  {
    q: 'Have you completed your graduation? *',
    opts: ['Yes', 'No'],
    expected: 'Yes'
  },
  {
    q: 'How much is your Experience? *',
    opts: ['0-1 Year', 'More than 1 year'],
    expected: 'More than 1 year'
  },
  {
    q: 'Are you comfortable with the work location Noida, sector 62 ? *',
    opts: ['Yes', 'No'],
    expected: 'Yes'
  },
  {
    q: 'Do you have any internship/work experience in Operations, Analytics, Business Analytics, MIS, or a related field? *',
    opts: ['Yes', 'No'],
    expected: 'Yes'
  },
  {
    q: 'Do you have experience creating dashboards or performance trackers? *',
    opts: ['Yes', 'No'],
    expected: 'Yes'
  }
];

for (const item of userQuestions) {
  const match = FieldMatcherService.matchCheckboxOptions(item.q, item.opts, candidateProfileExperienced);
  console.log(`Question: "${item.q}" -> Selected:`, match);
  assert(match.length === 1, `Question "${item.q}" must have exactly 1 option selected`);
  assert.strictEqual(match[0], item.expected, `Question "${item.q}" should select "${item.expected}"`);
}

console.log('\n[PASS] All 5 questions successfully matched with ZERO skips and ZERO dual-selections!\n');

// ==========================================
// TEST 5: selectCheckbox toggles state on container and element
// ==========================================
console.log('Test 5: selectCheckbox click and event propagation...');

let clickedContainer = false;
yesRow.addEventListener('click', () => { clickedContainer = true; });

const selectedResult = GoogleFormsFillerService.selectCheckbox(yesCb);
assert.strictEqual(selectedResult, true);
assert.strictEqual(yesCb.getAttribute('aria-checked'), 'true');
assert.strictEqual(clickedContainer, true, 'Row container must receive click event');

console.log('[PASS] selectCheckbox toggled aria-checked and dispatched click to container.\n');

console.log('------------------------------------------------------------');
console.log('[ALL TESTS PASSED] Google Forms Checkbox Autofill Verified!');
console.log('------------------------------------------------------------');
