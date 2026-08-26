/**
 * Unit Test for Per-Column AI Action Button
 * Verifies that every input column receives a small AI button and clicking it replaces the column value with an AI answer.
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
}

function matchesSelector(el, selector) {
  const parts = selector.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part.startsWith('.')) {
      const cls = part.substring(1);
      if (el.classList.contains(cls)) return true;
    }
    if (part.includes('[role="')) {
      const roleMatch = part.match(/\[role="([^"]+)"\]/);
      if (roleMatch && el.getAttribute('role') === roleMatch[1]) return true;
    }
    if (part.includes('[jscontroller="')) {
      const jscMatch = part.match(/\[jscontroller="([^"]+)"\]/);
      if (jscMatch && el.getAttribute('jscontroller') === jscMatch[1]) return true;
    }
    if (part.includes('[jsname="')) {
      const jsnMatch = part.match(/\[jsname="([^"]+)"\]/);
      if (jsnMatch && el.getAttribute('jsname') === jsnMatch[1]) return true;
    }
    if (part.toUpperCase() === el.tagName) return true;
    if (part.startsWith('input') && el.tagName === 'INPUT') return true;
    if (part.startsWith('textarea') && el.tagName === 'TEXTAREA') return true;
  }
  return false;
}

// Global DOM mock
const rootDoc = new MockElement('DIV');
global.document = {
  createElement: (tag) => new MockElement(tag),
  querySelectorAll: (selector) => rootDoc.querySelectorAll(selector),
  querySelector: (selector) => rootDoc.querySelector(selector)
};
global.Event = class { constructor(type) { this.type = type; } };
global.KeyboardEvent = class { constructor(type) { this.type = type; } };
global.fetch = async () => ({
  ok: true,
  json: async () => ({
    message: {
      content: 'I have used AWS services including S3 for object storage and Lambda functions integrated with API Gateway in my university projects and hackathon submissions.'
    }
  })
});

console.log('----------------------------------------------------');
console.log('TESTING PER-COLUMN AI ACTION BUTTON');
console.log('----------------------------------------------------\n');

// 1. Build a Mock Google Form DOM tree with input columns
// Question 1: AWS Knowledge Question (Initially filled with incorrect default answer)
const q1Container = new MockElement('DIV', { role: 'listitem', className: 'Qr7Oae' });
const q1Header = new MockElement('DIV', { role: 'heading', innerText: '1. This internship requires basic AWS knowledge. Have you used AWS in any college projects, hackathons, or personal assignments? Which specific services did you touch?' });
const q1Wrap = new MockElement('DIV', { className: 'o3DHgf' });
const q1Input = new MockElement('TEXTAREA', { className: 'KHxj8b', value: 'Vellore Institute of Technology' });
q1Wrap.appendChild(q1Input);
q1Container.appendChild(q1Header);
q1Container.appendChild(q1Wrap);
rootDoc.appendChild(q1Container);

// Question 2: Another Open-ended question
const q2Container = new MockElement('DIV', { role: 'listitem', className: 'Qr7Oae' });
const q2Header = new MockElement('DIV', { role: 'heading', innerText: '2. Describe a challenging project you built recently.' });
const q2Wrap = new MockElement('DIV', { className: 'o3DHgf' });
const q2Input = new MockElement('INPUT', { className: 'whsOnd', value: '' });
q2Wrap.appendChild(q2Input);
q2Container.appendChild(q2Header);
q2Container.appendChild(q2Wrap);
rootDoc.appendChild(q2Container);

// 2. Run injectAiButtonsToAllInputs
const count = GoogleFormsFillerService.injectAiButtonsToAllInputs(DEFAULT_PROFILE, rootDoc);
console.log(`[PASS] Mounted AI Action Buttons on ${count} input columns.`);

// 3. Verify buttons exist on both containers
const q1Btn = q1Container.querySelector('.gfaf-ai-column-btn');
const q2Btn = q2Container.querySelector('.gfaf-ai-column-btn');

if (q1Btn && q2Btn) {
  console.log('[PASS] .gfaf-ai-column-btn found on all input question containers.');
} else {
  console.error('[FAIL] AI button missing on one or more containers.');
  process.exit(1);
}

// 4. Test clicking the button to replace default answer with AI answer
console.log(`\nInitial value in Question 1: "${q1Input.value}"`);

// Click the button
const clickHandlers = q1Btn.eventListeners['click'] || [];
if (clickHandlers.length === 0) {
  console.error('[FAIL] No click handler registered on AI button.');
  process.exit(1);
}

// Invoke click handler
const fakeEvent = { preventDefault: () => {}, stopPropagation: () => {} };
await clickHandlers[0](fakeEvent);

console.log(`Updated value in Question 1: "${q1Input.value}"`);

if (q1Input.value !== 'Vellore Institute of Technology' && q1Input.value.length > 0) {
  console.log('[PASS] Default answered column successfully replaced with AI answer!');
} else {
  console.error('[FAIL] Column value was not changed.');
  process.exit(1);
}

// 5. Verify highlight and revision toolbar
if (q1Container.classList.contains('gfaf-filled-highlight')) {
  console.log('[PASS] Container received .gfaf-filled-highlight.');
} else {
  console.error('[FAIL] Container missing highlight class.');
  process.exit(1);
}

const badge = q1Container.querySelector('.gfaf-match-badge');
if (badge && badge.textContent.includes('AI')) {
  console.log(`[PASS] Match badge updated to "${badge.textContent}".`);
} else {
  console.error('[FAIL] Match badge missing or incorrect.');
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: PER-COLUMN AI BUTTONS VERIFIED!');
console.log('====================================================');
