/**
 * Test Suite: Green Processing Buffer Verification
 */

import { GoogleFormsFillerService } from '../src/services/GoogleFormsFillerService.js';

console.log('----------------------------------------------------');
console.log('TESTING DYNAMIC GREEN PROCESSING BUFFER & INDICATOR');
console.log('----------------------------------------------------\n');

// Mock DOM Container
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag;
    this.classList = new Set();
    this.children = [];
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
  }
  appendChild(el) {
    this.children.push(el);
    el.parentElement = this;
    return el;
  }
  querySelector(sel) {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      return this.children.find((c) => c.classList && c.classList.has(cls)) || null;
    }
    return null;
  }
  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1) this.parentElement.children.splice(idx, 1);
    }
  }
}

// Add classList polyfill methods
Set.prototype.add = function(cls) { this.addReal(cls); return this; };
Set.prototype.addReal = Set.prototype.add;
Set.prototype.contains = function(cls) { return this.has(cls); };
Set.prototype.remove = function(cls) { return this.delete(cls); };

const container = new MockElement('div');

// 1. Activate Green Processing Buffer
console.log('Activating green processing buffer on question container...');
GoogleFormsFillerService.setProcessingState(container, true, 'Synthesizing with AI...');

if (container.classList.has('gfaf-processing-buffer')) {
  console.log('[PASS] .gfaf-processing-buffer class added to active container.');
} else {
  console.error('[FAIL] .gfaf-processing-buffer missing from container!');
  process.exit(1);
}

const indicator = container.querySelector('.gfaf-processing-indicator');
if (indicator) {
  console.log('[PASS] .gfaf-processing-indicator pill successfully mounted on container.');
} else {
  console.error('[FAIL] .gfaf-processing-indicator not found in container!');
  process.exit(1);
}

// 2. Complete Processing and Highlight Container
console.log('\nFinalizing processing and applying filled match highlight...');
GoogleFormsFillerService.highlightContainer(container, { confidence: 0.98, isRag: true });

if (!container.classList.has('gfaf-processing-buffer')) {
  console.log('[PASS] .gfaf-processing-buffer cleanly removed upon completion.');
} else {
  console.error('[FAIL] .gfaf-processing-buffer persisted after highlight!');
  process.exit(1);
}

if (container.classList.has('gfaf-filled-highlight')) {
  console.log('[PASS] .gfaf-filled-highlight successfully applied.');
} else {
  console.error('[FAIL] .gfaf-filled-highlight missing from container!');
  process.exit(1);
}

const matchBadge = container.querySelector('.gfaf-match-badge');
if (matchBadge && matchBadge.textContent === 'Auto-filled via AI') {
  console.log('[PASS] Match badge displays correct finalized status: "' + matchBadge.textContent + '"');
} else {
  console.error('[FAIL] Match badge text incorrect:', matchBadge);
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: DYNAMIC GREEN PROCESSING BUFFER VERIFIED!');
console.log('====================================================\n');
