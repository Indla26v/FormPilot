/**
 * End-to-end DOM simulation test for Google Forms Auto-Filler
 * Tests both text and numeric input handling
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';
import { DEFAULT_PROFILE } from '../src/utils/constants.js';

class MockClassList {
  constructor() {
    this.classes = new Set();
  }
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

  get nextSibling() {
    if (!this.parentElement) return null;
    const idx = this.parentElement.children.indexOf(this);
    if (idx !== -1 && idx < this.parentElement.children.length - 1) {
      return this.parentElement.children[idx + 1];
    }
    return null;
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
    for (const h of handlers) {
      h(event);
    }
    return true;
  }

  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  insertBefore(newNode, refNode) {
    const idx = this.children.indexOf(refNode);
    if (idx === -1) {
      return this.appendChild(newNode);
    }
    this.children.splice(idx, 0, newNode);
    newNode.parentElement = this;
    return newNode;
  }

  replaceChild(newChild, oldChild) {
    const idx = this.children.indexOf(oldChild);
    if (idx !== -1) {
      this.children.splice(idx, 1, newChild);
      newChild.parentElement = this;
      oldChild.parentElement = null;
      return oldChild;
    }
    return this.appendChild(newChild);
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
  dispatchEvent(event) {}
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

global.fetch = async (url, opts) => {
  let bodyObj = {};
  try { bodyObj = typeof opts?.body === 'string' ? JSON.parse(opts.body) : {}; } catch (e) {}
  const fullText = (bodyObj?.messages?.map((m) => m.content).join(' ') || JSON.stringify(bodyObj) || '');
  const questionMatch = fullText.match(/Question Text:\s*"([^"]+)"/i) || fullText.match(/QUESTION TO EVALUATE:\s*([^"\n]+)/i);
  const qText = (questionMatch ? questionMatch[1] : fullText).toLowerCase();

  let responseJson = { decisionType: 'strict_profile', value: 'Alex Morgan', confidence: 0.98 };
  if (qText.includes('must be a number') || qText.includes('in inr')) {
    responseJson = { decisionType: 'strict_profile', value: '1000000', confidence: 0.98 };
  } else if (qText.includes('expected ctc')) {
    responseJson = { decisionType: 'strict_profile', value: '10', confidence: 0.98 };
  } else if (qText.includes('10th percentage')) {
    responseJson = { decisionType: 'strict_profile', value: '92.5', confidence: 0.98 };
  } else if (qText.includes('when did you graduate')) {
    responseJson = { decisionType: 'choice_selection', value: 'I am in my last year', confidence: 0.95 };
  }

  return {
    ok: true,
    json: async () => ({ message: { content: JSON.stringify(responseJson) } })
  };
};

console.log('----------------------------------------------------');
console.log('TESTING GOOGLE FORMS DOM AUTO-FILLER ENGINE (TEXT & NUMERIC)');
console.log('----------------------------------------------------\n');

const mockRoot = new MockElement('div');

function createTextInputQuestion(questionText) {
  const container = new MockElement('div', { role: 'listitem' });
  const heading = new MockElement('div', { role: 'heading', innerText: questionText });
  const input = new MockElement('input', { type: 'text' });
  input.classList.add('whsOnd');
  container.appendChild(heading);
  container.appendChild(input);
  return { container, input };
}

function createNumericInputQuestion(questionText) {
  const container = new MockElement('div', { role: 'listitem' });
  const heading = new MockElement('div', { role: 'heading', innerText: questionText });
  const input = new MockElement('input', { type: 'number' });
  input.classList.add('whsOnd');
  container.appendChild(heading);
  container.appendChild(input);
  return { container, input };
}

function createTextareaQuestion(questionText) {
  const container = new MockElement('div', { role: 'listitem' });
  const heading = new MockElement('div', { role: 'heading', innerText: questionText });
  const textarea = new MockElement('textarea', {});
  textarea.classList.add('KHxj8b');
  container.appendChild(heading);
  container.appendChild(textarea);
  return { container, textarea };
}

function createRadioQuestion(questionText, options) {
  const container = new MockElement('div', { role: 'listitem' });
  const heading = new MockElement('div', { role: 'heading', innerText: questionText });
  container.appendChild(heading);

  const radioEls = [];
  options.forEach((optText) => {
    const radio = new MockElement('div', { role: 'radio', 'data-value': optText, 'aria-label': optText, 'aria-checked': 'false' });
    container.appendChild(radio);
    radioEls.push(radio);
  });

  return { container, radioEls };
}

// 1. Text question: Name
mockRoot.appendChild(createTextInputQuestion('Full Name').container);

// 2. Text question: Expected CTC (Text format)
mockRoot.appendChild(createTextInputQuestion('Expected CTC').container);

// 3. Numeric question: Expected CTC (Number format: Must be a number)
mockRoot.appendChild(createNumericInputQuestion('Expected CTC (Must be a number / in INR)').container);

// 4. Numeric question: 10th percentage
mockRoot.appendChild(createNumericInputQuestion('10th Percentage (numbers only)').container);

// 5. Radio question: Graduation status
mockRoot.appendChild(createRadioQuestion('When did you graduate?', ['I am in my last year', '1 year back']).container);

// Run scan and fill
global.document = {
  querySelector: (sel) => mockRoot.querySelector(sel),
  querySelectorAll: (sel) => mockRoot.querySelectorAll(sel),
  createElement: (tag) => new MockElement(tag)
};

const results = await GoogleFormsFillerService.fillForm(DEFAULT_PROFILE, { autoHighlight: false });

console.log(`Questions Found: ${results.totalQuestions}`);
console.log(`Questions Filled: ${results.filledCount}`);

console.log('\nDetailed Fill Summary:');
results.details.forEach((d, i) => {
  console.log(`[${i + 1}] [${d.type.toUpperCase()}] "${d.question}" => ${JSON.stringify(d.value)}`);
});

if (results.filledCount === 5) {
  console.log('\n====================================================');
  console.log('SUCCESS: TEXT & NUMERIC INPUTS FILLED ACCURATELY!');
  console.log('====================================================');
} else {
  console.error(`FAILED: Expected 5, got ${results.filledCount}`);
  process.exit(1);
}
