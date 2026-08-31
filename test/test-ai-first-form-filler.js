/**
 * Automated test suite for the AI-First Form Filling Architecture
 * Verifies that all questions are evaluated by AI, extracting strict profile values,
 * picking valid choices, and synthesizing grounded technical answers without regex reliance.
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { LlmService } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

console.log('====================================================');
console.log('TESTING AI-FIRST FORM DECISION & FILLING ENGINE');
console.log('====================================================\n');

// Mock in-memory storage
const store = new Map();
StorageService.get = async (key) => store.get(key);
StorageService.set = async (key, val) => store.set(key, val);

const candidateProfile = {
  ...DEFAULT_PROFILE,
  personal: {
    ...DEFAULT_PROFILE.personal,
    fullName: 'Alex Morgan',
    email: 'alex.morgan.dev@example.com',
    phone: '+1 555-019-2834',
    currentLocation: 'San Francisco, CA'
  },
  education: {
    ...DEFAULT_PROFILE.education,
    collegeName: 'University of Technology',
    degree: 'B.S. in Computer Science',
    graduationYear: '2025',
    tenthPercentageNumeric: '92.5',
    graduationCgpaNumeric: '8.8'
  },
  professional: {
    ...DEFAULT_PROFILE.professional,
    noticePeriod: 'Immediate',
    noticePeriodDays: '0',
    expectedCtcLpa: '10',
    expectedCtcNumeric: '1000000'
  },
  skills: [
    { name: 'FastAPI', level: 'Expert', years: '3', rating: 9 },
    { name: 'React', level: 'Advanced', years: '3', rating: 8 },
    { name: 'Python', level: 'Expert', years: '4', rating: 9 },
    { name: 'TypeScript', level: 'Advanced', years: '2', rating: 8 },
    { name: 'N8N', level: 'Intermediate', years: '1', rating: 6 }
  ]
};

// ----------------------------------------------------
// TEST 1: Strict Profile Attribute Evaluations via AI
// ----------------------------------------------------
console.log('--- TEST 1: AI Evaluating Profile Questions & Strict Formatting ---');

// Mock LLM generation to simulate Ollama / Gemini / OpenAI JSON output
global.fetch = async (url, opts) => {
  let bodyObj = {};
  try {
    bodyObj = typeof opts?.body === 'string' ? JSON.parse(opts.body) : {};
  } catch (e) {}

  const fullText = (bodyObj?.messages?.map((m) => m.content).join(' ') || JSON.stringify(bodyObj) || '');
  const questionMatch = fullText.match(/Question Text:\s*"([^"]+)"/i) || fullText.match(/QUESTION TO EVALUATE:\s*([^"\n]+)/i);
  const qText = (questionMatch ? questionMatch[1] : fullText).toLowerCase();

  let responseJson = { decisionType: 'strict_profile', value: 'Alex Morgan', confidence: 0.98 };

  if (qText.includes('confidential interview') || qText.includes('email')) {
    responseJson = { decisionType: 'strict_profile', value: 'alex.morgan.dev@example.com', confidence: 0.98 };
  } else if (qText.includes('notice period') || qText.includes('notice') || qText.includes('days')) {
    responseJson = { decisionType: 'strict_profile', value: '0', confidence: 0.98 };
  } else if (qText.includes('expected compensation in lpa') || qText.includes('(lpa)')) {
    responseJson = { decisionType: 'strict_profile', value: '10', confidence: 0.98 };
  } else if (qText.includes('in inr digits') || qText.includes('in inr')) {
    responseJson = { decisionType: 'strict_profile', value: '1000000', confidence: 0.98 };
  } else if (qText.includes('college/work status') || qText.includes('current status')) {
    responseJson = { decisionType: 'choice_selection', value: 'Student', confidence: 0.95 };
  } else if (qText.includes('select all tools') || qText.includes('apis or agents')) {
    responseJson = { decisionType: 'choice_selection', value: ['FastAPI', 'React', 'N8N'], confidence: 0.96 };
  } else if (qText.includes('production bug') || qText.includes('resolved and what you learned')) {
    responseJson = {
      decisionType: 'rag_synthesis',
      value: 'In my voice agent project, I resolved a critical backpressure queue race condition during streaming chunk emissions by implementing bounded async queues in FastAPI.',
      confidence: 0.98
    };
  } else if (qText.includes('what should we call you') || qText.includes('name')) {
    responseJson = { decisionType: 'strict_profile', value: 'Alex Morgan', confidence: 0.98 };
  }

  return {
    ok: true,
    json: async () => ({
      message: {
        content: JSON.stringify(responseJson)
      }
    })
  };
};

const testQuestions = [
  {
    title: 'What should we call you (Full Legal Moniker)?',
    expected: 'Alex Morgan',
    type: 'text'
  },
  {
    title: 'Where can we send confidential interview invitations?',
    expected: 'alex.morgan.dev@example.com',
    type: 'text'
  },
  {
    title: 'How many days notice are you required to serve (In days)?',
    expected: '0',
    type: 'number'
  },
  {
    title: 'Expected compensation in LPA?',
    expected: '10',
    type: 'text'
  },
  {
    title: 'Expected fixed package in INR digits only?',
    expected: '1000000',
    type: 'number'
  }
];

for (const q of testQuestions) {
  const decision = await LlmService.evaluateAndFillQuestion({
    question: q.title,
    fieldType: q.type,
    profile: candidateProfile
  });

  if (decision.value === q.expected && decision.decisionType === 'strict_profile') {
    console.log(`[PASS] "${q.title}" => "${decision.value}" (Type: ${decision.decisionType})`);
  } else {
    console.error(`[FAIL] "${q.title}" expected "${q.expected}" but got "${decision.value}"`);
    process.exit(1);
  }
}

// ----------------------------------------------------
// TEST 2: Single-Choice (Radio) Selection via AI
// ----------------------------------------------------
console.log('\n--- TEST 2: AI Single-Choice (Radio) Selection ---');
const radioDecision = await LlmService.evaluateAndFillQuestion({
  question: 'What is your current college/work status?',
  fieldType: 'radio',
  options: ['Full-time employed', 'Student', 'Freelancer'],
  profile: candidateProfile
});

if (radioDecision.value === 'Student' && radioDecision.decisionType === 'choice_selection') {
  console.log(`[PASS] Radio: "What is your current college/work status?" => Selected: "${radioDecision.value}"`);
} else {
  console.error(`[FAIL] Radio decision failed:`, radioDecision);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 3: Multi-Choice (Checkbox) Selection via AI
// ----------------------------------------------------
console.log('\n--- TEST 3: AI Multi-Choice (Checkbox) Selection ---');
const checkboxDecision = await LlmService.evaluateAndFillQuestion({
  question: 'Select all tools you have built APIs or agents with:',
  fieldType: 'checkbox',
  options: ['FastAPI', 'React', 'Rust', 'N8N', 'COBOL', 'Fortran'],
  profile: candidateProfile
});

if (Array.isArray(checkboxDecision.value) && checkboxDecision.value.includes('FastAPI') && checkboxDecision.value.includes('React') && checkboxDecision.value.includes('N8N') && !checkboxDecision.value.includes('Rust')) {
  console.log(`[PASS] Checkbox: Matched options => ${JSON.stringify(checkboxDecision.value)}`);
} else {
  console.error(`[FAIL] Checkbox decision failed:`, checkboxDecision);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 4: Open-Ended Technical Essay Question via AI
// ----------------------------------------------------
console.log('\n--- TEST 4: AI Open-Ended Grounded Synthesis ---');
const essayDecision = await LlmService.evaluateAndFillQuestion({
  question: 'Describe a production bug you personally resolved and what you learned from it.',
  fieldType: 'textarea',
  profile: candidateProfile
});

if (essayDecision.decisionType === 'rag_synthesis' && essayDecision.value.includes('FastAPI')) {
  console.log(`[PASS] Open-Ended Essay: "${essayDecision.value}"`);
} else {
  console.error(`[FAIL] Essay decision failed:`, essayDecision);
  process.exit(1);
}

// ----------------------------------------------------
// TEST 5: Batch Form Auto-Fill DOM Simulation
// ----------------------------------------------------
console.log('\n--- TEST 5: Full DOM Auto-Fill Pipeline via GoogleFormsFillerService ---');

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

  get className() {
    return Array.from(this.classList.classes).join(' ');
  }

  set className(val) {
    this.classList.classes.clear();
    (val || '').split(' ').filter(Boolean).forEach((c) => this.classList.add(c));
  }

  getAttribute(name) {
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

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
        if (matchesSelector(node, selector)) {
          matches.push(node);
        }
      }
      for (const child of node.children) {
        walk(child);
      }
    };
    walk(this);
    return matches;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSelector(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  focus() {}
  blur() {}
  click() {
    if (this.getAttribute('role') === 'radio' || this.getAttribute('role') === 'checkbox') {
      this.setAttribute('aria-checked', 'true');
    }
  }
}

function matchesSelector(el, selector) {
  if (!el || !el.tagName) return false;
  const parts = selector.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part.startsWith('div[role="') && part.endsWith('"]')) {
      const role = part.slice(10, -2);
      if (el.tagName === 'DIV' && el.getAttribute('role') === role) return true;
    }
    if (part === 'div[role="listitem"]' && el.tagName === 'DIV' && el.getAttribute('role') === 'listitem') return true;
    if (part === 'div[role="heading"]' && el.tagName === 'DIV' && el.getAttribute('role') === 'heading') return true;
    if (part === 'div[role="radio"]' && el.tagName === 'DIV' && el.getAttribute('role') === 'radio') return true;
    if (part === 'div[role="checkbox"]' && el.tagName === 'DIV' && el.getAttribute('role') === 'checkbox') return true;
    if (part.includes('input.whsOnd') && el.tagName === 'INPUT' && el.classList.contains('whsOnd')) return true;
    if (part.includes('input[type="text"]') && el.tagName === 'INPUT') return true;
    if (part.includes('input[type="number"]') && el.tagName === 'INPUT' && el.getAttribute('type') === 'number') return true;
    if (part.includes('textarea.KHxj8b') && el.tagName === 'TEXTAREA') return true;
    if (part.includes('textarea') && el.tagName === 'TEXTAREA') return true;
  }
  return false;
}

global.HTMLInputElement = MockElement;
global.HTMLTextAreaElement = MockElement;
global.Event = class { constructor(type) { this.type = type; } };
global.KeyboardEvent = class { constructor(type) { this.type = type; } };

function createMockContainer(title, inputConfig = {}) {
  const container = new MockElement('div', { role: 'listitem' });
  container.classList.add('geS5n');

  const heading = new MockElement('div', { role: 'heading', innerText: title });
  container.appendChild(heading);

  if (inputConfig.type === 'radio' && inputConfig.options) {
    inputConfig.options.forEach((optText) => {
      const radio = new MockElement('div', { role: 'radio', 'aria-label': optText, 'data-value': optText, innerText: optText });
      container.appendChild(radio);
    });
  } else if (inputConfig.type === 'checkbox' && inputConfig.options) {
    inputConfig.options.forEach((optText) => {
      const cb = new MockElement('div', { role: 'checkbox', 'aria-label': optText, innerText: optText });
      container.appendChild(cb);
    });
  } else if (inputConfig.type === 'textarea') {
    const ta = new MockElement('textarea', { className: 'KHxj8b' });
    container.appendChild(ta);
  } else {
    const input = new MockElement('input', { type: inputConfig.isNumeric ? 'number' : 'text', className: 'whsOnd' });
    container.appendChild(input);
  }

  return container;
}

const mockContainers = [
  createMockContainer('What should we call you (Full Legal Moniker)?', { type: 'text' }),
  createMockContainer('Where can we send confidential interview invitations?', { type: 'text' }),
  createMockContainer('How many days notice are you required to serve (In days)?', { isNumeric: true }),
  createMockContainer('What is your current college/work status?', { type: 'radio', options: ['Full-time employed', 'Student', 'Freelancer'] }),
  createMockContainer('Select all tools you have built APIs or agents with:', { type: 'checkbox', options: ['FastAPI', 'React', 'Rust', 'N8N', 'COBOL'] }),
  createMockContainer('Describe a production bug you personally resolved and what you learned from it.', { type: 'textarea' })
];

GoogleFormsFillerService.findQuestionContainers = () => mockContainers;

const fillResults = await GoogleFormsFillerService.fillForm(candidateProfile, { autoHighlight: true });

console.log(`\nQuestions Scanned: ${fillResults.totalQuestions}`);
console.log(`Questions Filled by AI: ${fillResults.filledCount}`);

fillResults.details.forEach((d, idx) => {
  console.log(` [${idx + 1}] [${d.type.toUpperCase()}] "${d.question}" => ${JSON.stringify(d.value)}`);
});

if (fillResults.filledCount === 6) {
  console.log('\n====================================================');
  console.log('ALL AI-FIRST FORM FILLING TESTS PASSED (100% SUCCESS)');
  console.log('====================================================');
} else {
  console.error('\nFAILED: Not all questions were filled');
  process.exit(1);
}
