/**
 * Test Suite: Microsoft Forms (forms.cloud.microsoft / forms.office.com) Support
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { FieldMatcherService } from '../src/services/FieldMatcherService.js';

console.log('----------------------------------------------------');
console.log('TESTING MICROSOFT FORMS (forms.cloud.microsoft) SUPPORT');
console.log('----------------------------------------------------\n');

// Mock DOM Node & Element
class MockElement {
  constructor(tag = 'div', attrs = {}, text = '') {
    this.tagName = tag.toUpperCase();
    this.attributes = attrs;
    this.classList = new Set();
    this.children = [];
    this.textContent = text;
    this.innerText = text;
    this.value = '';
    this.checked = false;
    this.style = {};
    this.parentElement = null;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  appendChild(el) {
    this.children.push(el);
    el.parentElement = this;
    return el;
  }

  querySelector(sel) {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }

  querySelectorAll(sel) {
    const matches = [];
    const checkEl = (el) => {
      // Handle comma-separated selectors
      const parts = sel.split(',').map((s) => s.trim());
      for (const part of parts) {
        if (part.startsWith('div[data-automation-id="') || part.startsWith('span[data-automation-id="') || part.startsWith('input[data-automation-id="') || part.startsWith('textarea[data-automation-id="')) {
          const attrVal = part.match(/data-automation-id="([^"]+)"/)?.[1];
          const tag = part.split('[')[0].toUpperCase();
          if (el.tagName === tag && el.getAttribute('data-automation-id') === attrVal) {
            return true;
          }
        } else if (part === 'input[type="text"]' || part === 'input[type="email"]' || part === 'input[type="tel"]' || part === 'input[type="number"]' || part === 'input[type="radio"]' || part === 'input[type="checkbox"]') {
          const type = part.match(/type="([^"]+)"/)?.[1];
          if (el.tagName === 'INPUT' && (el.getAttribute('type') === type || el.type === type)) return true;
        } else if (part === 'textarea') {
          if (el.tagName === 'TEXTAREA') return true;
        } else if (part === 'input') {
          if (el.tagName === 'INPUT') return true;
        } else if (part.startsWith('.')) {
          const cls = part.slice(1);
          if (el.classList && el.classList.has(cls)) return true;
        } else if (part.startsWith('div[role="') || part.startsWith('span[role="')) {
          const role = part.match(/role="([^"]+)"/)?.[1];
          if (el.getAttribute('role') === role) return true;
        }
      }
      return false;
    };

    const traverse = (node) => {
      for (const child of node.children) {
        if (checkEl(child)) matches.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return matches;
  }

  closest(sel) {
    let curr = this;
    while (curr) {
      const parts = sel.split(',').map((s) => s.trim());
      for (const part of parts) {
        if (part.startsWith('div[data-automation-id="')) {
          const attrVal = part.match(/data-automation-id="([^"]+)"/)?.[1];
          if (curr.getAttribute('data-automation-id') === attrVal) return curr;
        } else if (part.startsWith('.')) {
          const cls = part.slice(1);
          if (curr.classList && curr.classList.has(cls)) return curr;
        }
      }
      curr = curr.parentElement;
    }
    return null;
  }

  focus() {}
  click() {
    if (this.tagName === 'INPUT' && (this.type === 'radio' || this.type === 'checkbox')) {
      this.checked = true;
    }
  }
  dispatchEvent() {}
}

if (!Set.prototype.addReal) {
  Set.prototype.addReal = Set.prototype.add;
  Set.prototype.add = function(cls) { this.addReal(cls); return this; };
}
Set.prototype.contains = function(cls) { return this.has(cls); };
Set.prototype.remove = function(cls) { return this.delete(cls); };

// Setup mock Microsoft Forms Document
const mockRoot = new MockElement('div');

// 1. Text Field: Full Name
const q1 = new MockElement('div', { 'data-automation-id': 'questionItem' });
const t1 = new MockElement('span', { 'data-automation-id': 'questionTitle' }, '1. Full Name*');
const in1 = new MockElement('input', { 'data-automation-id': 'textInput', type: 'text' });
q1.appendChild(t1);
q1.appendChild(in1);
mockRoot.appendChild(q1);

// 2. Text Field: Email
const q2 = new MockElement('div', { 'data-automation-id': 'questionItem' });
const t2 = new MockElement('span', { 'data-automation-id': 'questionTitle' }, '2. Email Address*');
const in2 = new MockElement('input', { 'data-automation-id': 'textInput', type: 'text' });
q2.appendChild(t2);
q2.appendChild(in2);
mockRoot.appendChild(q2);

// 3. Radio Group: Graduation Status
const q3 = new MockElement('div', { 'data-automation-id': 'questionItem' });
const t3 = new MockElement('span', { 'data-automation-id': 'questionTitle' }, '3. When did you graduate?*');
const c1 = new MockElement('div', { 'data-automation-id': 'choiceItem' });
const c1Label = new MockElement('span', { 'data-automation-id': 'choiceLabel' }, 'Graduated in 2024');
const c1Radio = new MockElement('input', { type: 'radio' });
c1.appendChild(c1Radio);
c1.appendChild(c1Label);

const c2 = new MockElement('div', { 'data-automation-id': 'choiceItem' });
const c2Label = new MockElement('span', { 'data-automation-id': 'choiceLabel' }, 'I am in my last year');
const c2Radio = new MockElement('input', { type: 'radio' });
c2.appendChild(c2Radio);
c2.appendChild(c2Label);

q3.appendChild(t3);
q3.appendChild(c1);
q3.appendChild(c2);
mockRoot.appendChild(q3);

// 4. Open-ended Textarea: Project Experience
const q4 = new MockElement('div', { 'data-automation-id': 'questionItem' });
const t4 = new MockElement('span', { 'data-automation-id': 'questionTitle' }, '4. Describe a challenging engineering project you built and how you debugged it.*');
const in4 = new MockElement('textarea', { 'data-automation-id': 'textInput' });
q4.appendChild(t4);
q4.appendChild(in4);
mockRoot.appendChild(q4);

const testProfile = {
  id: 'test-ms-profile',
  name: 'Alex Morgan Profile',
  personal: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan.dev@example.com',
    phone: '+1 555-019-2834'
  },
  education: {
    graduationStatus: 'I am in my last year',
    collegeName: 'University of Technology'
  }
};

// --- Test 1: Container Detection ---
console.log('Testing question container detection in Microsoft Forms...');
const containers = GoogleFormsFillerService.findQuestionContainers(mockRoot);
console.log(`Detected ${containers.length} question containers in Microsoft Forms.`);
if (containers.length === 4) {
  console.log('[PASS] All 4 Microsoft Forms questionItem containers detected.');
} else {
  console.error('[FAIL] Expected 4 containers, got', containers.length);
  process.exit(1);
}

// --- Test 2: Title Extraction and Prefix Number Cleaning ---
console.log('\nTesting title extraction and number prefix cleaning...');
const title1 = GoogleFormsFillerService.extractQuestionText(q1);
const title3 = GoogleFormsFillerService.extractQuestionText(q3);
console.log(`Title 1 Extracted: "${title1}"`);
console.log(`Title 3 Extracted: "${title3}"`);

if (title1 === 'Full Name*' && title3 === 'When did you graduate?*') {
  console.log('[PASS] Number prefixes (1., 3.) correctly cleaned from question titles.');
} else {
  console.error('[FAIL] Title extraction mismatch!');
  process.exit(1);
}

// --- Test 3: Radio Options Extraction & Selection ---
console.log('\nTesting radio choice extraction in Microsoft Forms...');
const radioOpts = GoogleFormsFillerService.extractRadioOptions(q3);
console.log('Extracted Radio Options:', radioOpts.map((r) => r.label));

if (radioOpts.length === 2 && radioOpts.some((r) => r.label === 'I am in my last year')) {
  console.log('[PASS] Microsoft Forms radio choice items parsed correctly.');
} else {
  console.error('[FAIL] Radio options parsing failed!');
  process.exit(1);
}

const match = FieldMatcherService.matchRadioOption('When did you graduate?', radioOpts.map((r) => r.label), testProfile);
console.log('Matched Radio Option:', match);
if (match.option === 'I am in my last year') {
  console.log('[PASS] Radio option correctly resolved to candidate profile.');
} else {
  console.error('[FAIL] Radio match failed!');
  process.exit(1);
}

// --- Test 4: Mounting AI Buttons & Processing Highlight ---
console.log('\nTesting AI Column Button mounting on Microsoft Forms...');
const mounted = GoogleFormsFillerService.injectAiButtonsToAllInputs(testProfile, mockRoot);
console.log(`Mounted AI action buttons on ${mounted} Microsoft Forms columns.`);

if (mounted >= 3) {
  console.log('[PASS] Per-column AI action buttons mounted onto Microsoft Forms inputs.');
} else {
  console.error('[FAIL] Failed mounting AI buttons on Microsoft Forms!');
  process.exit(1);
}

// --- Test 5: Dynamic Green Buffer on MS Forms Container ---
console.log('\nTesting green processing buffer on Microsoft Forms container...');
GoogleFormsFillerService.setProcessingState(q4, true, 'Synthesizing with AI...');
if (q4.classList.has('gfaf-processing-buffer')) {
  console.log('[PASS] Green processing buffer active on Microsoft Forms card.');
} else {
  console.error('[FAIL] Green buffer missing on Microsoft Forms card!');
  process.exit(1);
}

GoogleFormsFillerService.highlightContainer(q4, { confidence: 0.98, isRag: true });
if (!q4.classList.has('gfaf-processing-buffer') && q4.classList.has('gfaf-filled-highlight')) {
  console.log('[PASS] Processing buffer cleanly transitioned to filled highlight.');
} else {
  console.error('[FAIL] Highlight transition failed on Microsoft Forms card!');
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: MICROSOFT FORMS FULLY SUPPORTED & VERIFIED!');
console.log('====================================================\n');
