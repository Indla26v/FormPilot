/**
 * GoogleFormsFillerService - Robust DOM Filler Engine for Google Forms with RAG Support
 * Follows SOLID principles and handles text, numeric, and RAG-generated responses.
 */

import { FieldMatcherService } from './FieldMatcherService.js';
import { RetrievalService } from './rag/RetrievalService.js';
import { LlmService } from './llm/LlmService.js';
import { ProfileValidatorService } from './ProfileValidatorService.js';

export class GoogleFormsFillerService {
  /**
   * Extract question text from a Google Form or Microsoft Form question container
   */
  static extractQuestionText(containerEl) {
    if (!containerEl) return '';
    let title = '';

    // 1. Check Microsoft Forms title elements
    const msTitleEl = containerEl.querySelector('span[data-automation-id="questionTitle"], div[data-automation-id="questionTitle"], .office-form-question-title, .question-title-box, .text-format-content, span.question-title-text');
    if (msTitleEl) {
      title = (msTitleEl.innerText || msTitleEl.textContent || '').trim();
    }

    // 2. Try finding heading with role="heading" or Google Forms classes
    if (!title) {
      const headingEl = containerEl.querySelector('div[role="heading"]');
      if (headingEl) {
        title = (headingEl.innerText || headingEl.textContent || '').trim();
      } else {
        const titleEl = containerEl.querySelector('.M7eMe, .HoPJnd, .F9N7Re, span[dir="auto"]');
        if (titleEl) {
          title = (titleEl.innerText || titleEl.textContent || '').trim();
        }
      }
    }

    const inputWithLabel = containerEl.querySelector('input[aria-label], textarea[aria-label]');
    if (!title && inputWithLabel) {
      title = (inputWithLabel.getAttribute('aria-label') || '').trim();
    }

    // Also extract sub-description / prompt constraints if present
    const descEl = containerEl.querySelector('span[data-automation-id="questionSubTitle"], .office-form-question-subtitle, .gHjhdc, .jibhHc, .vRMGwf, .asQ4ud, div[id$="_desc"], div[jsname="V67aGc"]');
    let desc = '';
    if (descEl) {
      desc = (descEl.innerText || descEl.textContent || '').trim();
    }

    // Clean leading numbering (e.g. "1. Full Name" -> "Full Name")
    const cleanTitle = title.replace(/^\s*\d+[\.\)\s]+\s*/, '').trim();

    if (cleanTitle && desc && !cleanTitle.includes(desc)) {
      return `${cleanTitle}\n${desc}`;
    }

    return cleanTitle || title || '';
  }

  static isOpenEndedQuestion(questionText, targetEl) {
    if (!questionText) return false;
    if (targetEl && targetEl.tagName === 'TEXTAREA') return true;

    const norm = questionText.toLowerCase();
    const openEndedKeywords = [
      'describe', 'explain', 'why', 'how did', 'how do you', 'what did you',
      'what was', 'tell us', 'paste one', 'hill you', 'faster or better',
      'ai tool', 'words', 'experience with', 'built that', 'debugged',
      'walk us through', 'give an example', 'situation', 'approach',
      'what about it', 'anything else', 'concrete'
    ];

    if (openEndedKeywords.some((k) => norm.includes(k))) return true;
    if (questionText.length > 30) return true;

    return false;
  }

  /**
   * Detect if an input expects numbers/digits only
   */
  static isNumericRequirement(inputEl, containerEl, questionText = '') {
    if (!inputEl) return false;
    if (inputEl.type === 'number') return true;
    if (inputEl.getAttribute('data-input-type') === 'number') return true;

    const textToScan = [
      questionText,
      inputEl.getAttribute('aria-label') || '',
      inputEl.getAttribute('placeholder') || '',
      containerEl ? (containerEl.innerText || containerEl.textContent || '') : ''
    ].join(' ').toLowerCase();

    const numericIndicators = [
      'must be a number',
      'must be a whole number',
      'must be greater than',
      'must be less than',
      'in numbers',
      'in digits',
      'digits only',
      'numbers only',
      'enter number',
      'only numbers',
      'in inr',
      'in rupees',
      'in days',
      '(in days)',
      '(lpa)',
      'in lpa',
      'years of experience',
      'year of graduation',
      'numeric value'
    ];

    return numericIndicators.some((ind) => textToScan.includes(ind));
  }

  /**
   * Set value on a standard text input or textarea with full Google Forms event dispatching
   */
  static setInputValue(inputEl, value) {
    if (!inputEl) return false;

    try {
      inputEl.focus();

      // Native setter bypass for React/Closure components
      const win = typeof window !== 'undefined' ? window : globalThis;
      const isTextArea = (typeof HTMLTextAreaElement !== 'undefined' && inputEl instanceof HTMLTextAreaElement) || inputEl.tagName === 'TEXTAREA';
      const prototype = isTextArea ? (win.HTMLTextAreaElement?.prototype || win.HTMLInputElement?.prototype) : win.HTMLInputElement?.prototype;
      const nativeSetter = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set : null;

      if (nativeSetter) {
        nativeSetter.call(inputEl, value);
      } else {
        inputEl.value = value;
      }

      // Dispatch comprehensive event sequence
      inputEl.dispatchEvent(new Event('focus', { bubbles: true }));
      inputEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
      inputEl.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      inputEl.dispatchEvent(new Event('blur', { bubbles: true }));

      return true;
    } catch (err) {
      try {
        inputEl.value = value;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Animate typing text into input/textarea word-by-word with natural streaming cadence
   */
  static async typewriteInputValue(inputEl, fullText, speedMs = 18) {
    if (!inputEl || !fullText) return false;
    const text = String(fullText);
    const words = text.split(/(\s+)/); // Preserves words and whitespace
    let accumulated = '';

    try {
      inputEl.focus();
    } catch {}

    for (let i = 0; i < words.length; i++) {
      accumulated += words[i];
      this.setInputValue(inputEl, accumulated);

      try {
        if (inputEl.scrollHeight > inputEl.clientHeight) {
          inputEl.scrollTop = inputEl.scrollHeight;
        }
      } catch {}

      // Only delay after actual word tokens (not empty / whitespace)
      if (words[i].trim().length > 0 && i < words.length - 1) {
        let delay = speedMs;
        const lastChar = words[i].slice(-1);
        if (['.', '!', '?', ';'].includes(lastChar)) {
          delay = speedMs * 3;
        } else if ([',', ':', '-'].includes(lastChar)) {
          delay = speedMs * 1.8;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Final pass to guarantee 100% full text integrity
    this.setInputValue(inputEl, text);
    return true;
  }

  /**
   * Extract available options for a Radio Group
   */
  static extractRadioOptions(containerEl) {
    const radioElements = containerEl.querySelectorAll('div[role="radio"], input[type="radio"], div[data-automation-id="choiceItem"], label.ms-Radio-field');
    const options = [];

    radioElements.forEach((radio) => {
      if (radio.tagName === 'INPUT' && radio.type === 'checkbox') return;
      if (radio.getAttribute && radio.getAttribute('role') === 'checkbox') return;

      const dataVal = radio.getAttribute ? radio.getAttribute('data-value') : '';
      const ariaLabel = radio.getAttribute ? radio.getAttribute('aria-label') : '';
      const msChoiceLabel = radio.querySelector ? radio.querySelector('span[data-automation-id="choiceLabel"], span.office-form-question-choice-text') : null;
      let text = '';
      if (msChoiceLabel) {
        text = msChoiceLabel.innerText || msChoiceLabel.textContent || '';
      } else {
        const textContainer = radio.closest ? radio.closest('label') || radio.parentElement : radio.parentElement;
        if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
      }

      const finalLabel = (dataVal || ariaLabel || text || radio.value || '').trim();
      if (finalLabel && !options.some((o) => o.label === finalLabel)) {
        options.push({ element: radio, label: finalLabel });
      }
    });

    return options;
  }

  /**
   * Select a specific radio button
   */
  static selectRadio(radioEl) {
    if (!radioEl) return false;
    try {
      if (radioEl.tagName === 'INPUT' && radioEl.type === 'radio') {
        radioEl.checked = true;
        if (radioEl.click) radioEl.click();
        radioEl.dispatchEvent(new Event('change', { bubbles: true }));
        radioEl.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      const isAlreadyChecked = radioEl.getAttribute && radioEl.getAttribute('aria-checked') === 'true';
      if (!isAlreadyChecked) {
        if (radioEl.focus) radioEl.focus();
        if (radioEl.click) radioEl.click();
        const innerInput = radioEl.querySelector ? radioEl.querySelector('input[type="radio"]') : null;
        if (innerInput) {
          innerInput.checked = true;
          if (innerInput.click) innerInput.click();
          innerInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        radioEl.dispatchEvent(new Event('click', { bubbles: true }));
        radioEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (radioEl.setAttribute) radioEl.setAttribute('aria-checked', 'true');
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Extract available options for a Checkbox group
   */
  static extractCheckboxOptions(containerEl) {
    const checkboxElements = containerEl.querySelectorAll('div[role="checkbox"], input[type="checkbox"], label.ms-Checkbox-field');
    const options = [];

    checkboxElements.forEach((checkbox) => {
      const ariaLabel = checkbox.getAttribute ? checkbox.getAttribute('aria-label') : '';
      const msChoiceLabel = checkbox.querySelector ? checkbox.querySelector('span[data-automation-id="choiceLabel"], span.office-form-question-choice-text') : null;
      let text = '';
      if (msChoiceLabel) {
        text = msChoiceLabel.innerText || msChoiceLabel.textContent || '';
      } else {
        const textContainer = checkbox.closest ? checkbox.closest('label') || checkbox.parentElement : checkbox.parentElement;
        if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
      }

      const finalLabel = (ariaLabel || text || checkbox.value || '').trim();
      if (finalLabel && !options.some((o) => o.label === finalLabel)) {
        options.push({ element: checkbox, label: finalLabel });
      }
    });

    return options;
  }

  /**
   * Toggle a specific checkbox to checked state
   */
  static selectCheckbox(checkboxEl) {
    if (!checkboxEl) return false;
    try {
      if (checkboxEl.tagName === 'INPUT' && checkboxEl.type === 'checkbox') {
        if (!checkboxEl.checked) {
          checkboxEl.checked = true;
          if (checkboxEl.click) checkboxEl.click();
          checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
          checkboxEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      }
      const isChecked = checkboxEl.getAttribute && checkboxEl.getAttribute('aria-checked') === 'true';
      if (!isChecked) {
        if (checkboxEl.focus) checkboxEl.focus();
        if (checkboxEl.click) checkboxEl.click();
        const innerInput = checkboxEl.querySelector ? checkboxEl.querySelector('input[type="checkbox"]') : null;
        if (innerInput && !innerInput.checked) {
          innerInput.checked = true;
          if (innerInput.click) innerInput.click();
          innerInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        checkboxEl.dispatchEvent(new Event('click', { bubbles: true }));
        checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
        if (checkboxEl.setAttribute) checkboxEl.setAttribute('aria-checked', 'true');
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Find all question item containers in the active Google Form or Microsoft Form
   */
  static findQuestionContainers(root = document) {
    // 1. Microsoft Forms containers
    const msContainers = root.querySelectorAll('div[data-automation-id="questionItem"], div[data-automation-key="questionItem"], div.office-form-question, div.question-container, div[data-automation-id="questionWrapper"]');
    if (msContainers && msContainers.length > 0) return Array.from(msContainers);

    // 2. Google Forms standard containers
    const selectors = [
      'div[role="listitem"]',
      'div.geS5n',
      'div.Qr7Oae',
      'div[jsmodel="CP1oW"]',
      'div.m2',
      'div[jscontroller="e2CuFe"]',
      'div[jscontroller="r3Nsxc"]'
    ];

    for (const selector of selectors) {
      const items = root.querySelectorAll(selector);
      if (items && items.length > 0) {
        return Array.from(items);
      }
    }

    // 3. Headings fallback
    const headings = root.querySelectorAll('div[role="heading"], span[data-automation-id="questionTitle"]');
    if (headings && headings.length > 0) {
      const containers = [];
      headings.forEach((h) => {
        const parent = h.closest('div[jscontroller], div[data-automation-id="questionItem"], div.office-form-question') || h.parentElement?.parentElement;
        if (parent && !containers.includes(parent)) {
          containers.push(parent);
        }
      });
      return containers;
    }

    return [];
  }

  /**
   * Safe element creator working across both browser DOM and mock testing environments
   */
  static safeCreateElement(tag, contextEl = null) {
    if (typeof document !== 'undefined' && document && document.createElement) {
      return document.createElement(tag);
    }
    if (contextEl && contextEl.ownerDocument && contextEl.ownerDocument.createElement) {
      return contextEl.ownerDocument.createElement(tag);
    }
    if (typeof globalThis !== 'undefined' && globalThis.document && globalThis.document.createElement) {
      return globalThis.document.createElement(tag);
    }
    // Headless test mock element
    return {
      tagName: tag.toUpperCase(),
      classList: new Set(),
      children: [],
      style: {},
      attributes: {},
      textContent: '',
      innerHTML: '',
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] || null; },
      appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
      querySelector(sel) {
        if (sel.startsWith('.')) {
          const cls = sel.slice(1);
          return this.children.find((c) => c.classList && (c.classList.has?.(cls) || c.classList.contains?.(cls))) || null;
        }
        return null;
      },
      querySelectorAll() { return []; },
      remove() {
        if (this.parentElement && this.parentElement.children) {
          const idx = this.parentElement.children.indexOf(this);
          if (idx !== -1) this.parentElement.children.splice(idx, 1);
        }
      }
    };
  }

  /**
   * Display or remove dynamic green processing buffer
   */
  static setProcessingState(containerEl, isProcessing, message = 'Processing...') {
    if (!containerEl) return;
    if (isProcessing) {
      if (containerEl.classList && containerEl.classList.add) {
        containerEl.classList.add('gfaf-processing-buffer');
      }
      if (containerEl.style) {
        containerEl.style.position = 'relative';
      }
      let indicator = containerEl.querySelector ? containerEl.querySelector('.gfaf-processing-indicator') : null;
      if (!indicator) {
        indicator = this.safeCreateElement('div', containerEl);
        indicator.className = 'gfaf-processing-indicator';
        if (indicator.classList && indicator.classList.add) {
          indicator.classList.add('gfaf-processing-indicator');
        }
        indicator.innerHTML = `
          <span class="gfaf-processing-dot"></span>
          <span class="gfaf-processing-text">${message}</span>
        `;
        containerEl.appendChild(indicator);
      } else {
        const textEl = indicator.querySelector ? indicator.querySelector('.gfaf-processing-text') : null;
        if (textEl) textEl.textContent = message;
      }
    } else {
      if (containerEl.classList && containerEl.classList.remove) {
        containerEl.classList.remove('gfaf-processing-buffer');
      }
      const indicator = containerEl.querySelector ? containerEl.querySelector('.gfaf-processing-indicator') : null;
      if (indicator) {
        if (typeof indicator.remove === 'function') {
          indicator.remove();
        } else if (indicator.parentElement && indicator.parentElement.removeChild) {
          indicator.parentElement.removeChild(indicator);
        }
      }
    }
  }

  /**
   * Apply a sleek visual badge and highlight to filled containers
   */
  static highlightContainer(containerEl, matchInfo) {
    if (!containerEl) return;
    this.setProcessingState(containerEl, false);

    // Always resolve to the outermost question card to prevent inner/overlapping badges
    const outerQuestion = (typeof containerEl.closest === 'function')
      ? (containerEl.closest('div[role="listitem"], div[jsmodel], div[data-automation-id="questionItem"], .office-form-question') || containerEl)
      : containerEl;

    if (matchInfo.hasConflict) {
      if (outerQuestion.classList && outerQuestion.classList.add) {
        outerQuestion.classList.add('gfaf-conflict-highlight');
        outerQuestion.classList.remove('gfaf-filled-highlight');
      }
    } else {
      if (outerQuestion.classList && outerQuestion.classList.add) {
        outerQuestion.classList.add('gfaf-filled-highlight');
        outerQuestion.classList.remove('gfaf-conflict-highlight');
      }
    }

    // Strip any inner/duplicate badges across all children inside this question container
    const existingBadges = outerQuestion.querySelectorAll ? outerQuestion.querySelectorAll('.gfaf-badge-container, .gfaf-match-badge, .gfaf-info-pill, .gfaf-conflict-badge') : [];
    if (existingBadges && existingBadges.length > 0) {
      existingBadges.forEach((b) => {
        if (typeof b.remove === 'function') {
          b.remove();
        } else if (b.parentElement && b.parentElement.removeChild) {
          b.parentElement.removeChild(b);
        }
      });
    }

    if (outerQuestion.style) {
      outerQuestion.style.position = 'relative';
    }

    const badgeContainer = this.safeCreateElement('div', outerQuestion);
    badgeContainer.className = 'gfaf-badge-container';

    // 1. Conflict Badge or Context Info Pill
    if (matchInfo.hasConflict && matchInfo.conflictMessage) {
      const conflictPill = this.safeCreateElement('div', badgeContainer);
      conflictPill.className = 'gfaf-conflict-badge';
      conflictPill.textContent = matchInfo.conflictMessage;
      badgeContainer.appendChild(conflictPill);

      const statusBadge = this.safeCreateElement('div', badgeContainer);
      statusBadge.className = 'gfaf-match-badge gfaf-match-badge-conflict';
      statusBadge.textContent = 'Not Filled (Conflict)';
      badgeContainer.appendChild(statusBadge);
    } else {
      if (matchInfo.infoMessage) {
        const infoPill = this.safeCreateElement('div', badgeContainer);
        infoPill.className = 'gfaf-info-pill';
        infoPill.textContent = matchInfo.infoMessage;
        badgeContainer.appendChild(infoPill);
      }

      // 2. Status Badge
      const badge = this.safeCreateElement('div', badgeContainer);
      badge.className = 'gfaf-match-badge';
      const confidencePct = Math.round((matchInfo.confidence || 1.0) * 100);
      badge.textContent = matchInfo.isRag
        ? 'Auto-filled via AI'
        : `Auto-filled (${confidencePct}%)`;
      badgeContainer.appendChild(badge);
    }

    outerQuestion.appendChild(badgeContainer);
  }

  /**
   * Attach a sleek, modern pill-shaped AI button to an individual input column
   */
  static attachAiColumnButton(containerEl, targetEl, questionText, profile) {
    if (!containerEl || !targetEl) return null;
    let actionBar = containerEl.querySelector ? containerEl.querySelector('.gfaf-ai-column-action-bar') : null;
    if (!actionBar) {
      actionBar = this.safeCreateElement('div', containerEl);
      actionBar.className = 'gfaf-ai-column-action-bar';

      const btn = this.safeCreateElement('button', containerEl);
      btn.type = 'button';
      btn.className = 'gfaf-ai-column-btn';
      btn.setAttribute('title', 'Answer or replace this field with AI');
      btn.innerHTML = `
        <svg class="gfaf-sparkle-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
        </svg>
        <span class="gfaf-ai-column-btn-text">AI Answer</span>
      `;
      actionBar.appendChild(btn);
      if (btn.addEventListener) {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (btn.disabled) return;

          // 1. Immediately open the comment & re-generate toolbar
          GoogleFormsFillerService.attachAiToolbar(containerEl, targetEl, questionText, profile);
          const toolbar = containerEl.querySelector('.gfaf-ai-toolbar');
          const commentInput = toolbar ? toolbar.querySelector('.gfaf-ai-comment-input') : null;
          if (commentInput && commentInput.focus) {
            commentInput.focus();
          }

          btn.disabled = true;
          btn.classList.add('loading');
          btn.innerHTML = `
            <svg class="gfaf-spin" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            <span class="gfaf-ai-column-btn-text">Synthesizing AI Answer...</span>
          `;
          GoogleFormsFillerService.setProcessingState(containerEl, true, 'Synthesizing with AI...');

          try {
            const currentVal = (targetEl.value || '').trim();
            const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3, profile?.id);
            let generated = '';
            try {
              generated = await LlmService.generateRagAnswer({
                question: questionText,
                retrievedChunks: chunks || [],
                profile: profile,
                currentFieldValue: currentVal
              });
            } catch (llmErr) {
              console.warn('[GFAF] LLM unavailable, using candidate profile smart answers:', llmErr.message);
            }

            if (!generated || !generated.trim()) {
              const smart = FieldMatcherService.matchSmartAnswers(questionText, profile);
              if (smart && smart.value) {
                generated = smart.value;
              } else {
                const custom = FieldMatcherService.matchCustomFields(questionText, profile);
                if (custom && custom.value) {
                  generated = custom.value;
                } else {
                  const skills = (profile.skills || []).map((s) => (typeof s === 'object' && s !== null ? s.name : s)).filter(Boolean).slice(0, 10).join(', ');
                  const role = profile.professional?.currentRole || 'Full Stack Engineer';
                  const org = profile.professional?.currentOrganization || 'Open Source Builder';
                  const exp = profile.professional?.totalExperienceYears || '1';
                  const normQ = FieldMatcherService.normalize(questionText);
                  if (normQ.includes('stack') || normQ.includes('tool') || normQ.includes('technolog') || normQ.includes('skill')) {
                    generated = `I specialize in ${skills || 'Full Stack Development'} with ${exp} year(s) of experience building systems at ${org}.`;
                  }
                }
              }
            }

            if (generated && generated.trim()) {
              await GoogleFormsFillerService.typewriteInputValue(targetEl, generated.trim());
              GoogleFormsFillerService.highlightContainer(containerEl, { confidence: 0.98, isRag: true });
              btn.classList.remove('loading');
              btn.classList.add('active');
              btn.innerHTML = `
                <svg class="gfaf-sparkle-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <span class="gfaf-ai-column-btn-text">Regenerate AI</span>
              `;
            } else {
              btn.classList.remove('loading');
              btn.innerHTML = `
                <svg class="gfaf-sparkle-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
                </svg>
                <span class="gfaf-ai-column-btn-text">AI Answer</span>
              `;
            }
          } catch (err) {
            console.warn('[GFAF] Column AI generation error:', err);
            btn.classList.remove('loading');
            btn.innerHTML = `
              <svg class="gfaf-sparkle-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
              </svg>
              <span class="gfaf-ai-column-btn-text">AI Answer</span>
            `;
          } finally {
            GoogleFormsFillerService.setProcessingState(containerEl, false);
          }

          btn.disabled = false;
        });
      }

      // Place outside the input box, right-aligned on the question container
      containerEl.appendChild(actionBar);
    }
    return actionBar;
  }

  /**
   * Mount AI buttons on all detected input columns in the form
   */
  static injectAiButtonsToAllInputs(profile, root = null) {
    const targetRoot = root || (typeof document !== 'undefined' ? document : null);
    if (!targetRoot) return 0;
    const containers = this.findQuestionContainers(targetRoot);
    let attachedCount = 0;

    containers.forEach((container) => {
      const questionText = this.extractQuestionText(container);
      const targetEl = container.querySelector('textarea[data-automation-id="textInput"], textarea.office-form-question-textarea, textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea, input[data-automation-id="textInput"], input.office-form-question-textbox, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"]');
      if (targetEl && questionText) {
        this.attachAiColumnButton(container, targetEl, questionText, profile);
        attachedCount++;
      }
    });

    return attachedCount;
  }

  static attachAiToolbar(containerEl, targetEl, questionText, profile) {
    if (!containerEl) return;
    let toolbar = containerEl.querySelector ? containerEl.querySelector('.gfaf-ai-toolbar') : null;
    if (!toolbar) {
      toolbar = this.safeCreateElement('div', containerEl);
      toolbar.className = 'gfaf-ai-toolbar';

      const commentInput = this.safeCreateElement('input', containerEl);
      commentInput.type = 'text';
      commentInput.className = 'gfaf-ai-comment-input';
      commentInput.setAttribute('aria-label', 'AI prompt revision instruction');
      commentInput.placeholder = "Prompt instruction (e.g. 'mention Spring Boot & AWS', 'make it 100 words')...";
      toolbar.appendChild(commentInput);

      const regenBtn = this.safeCreateElement('button', containerEl);
      regenBtn.type = 'button';
      regenBtn.className = 'gfaf-ai-regen-btn';
      regenBtn.title = 'Re-generate answer with AI';
      regenBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span>Re-generate</span>
      `;
      toolbar.appendChild(regenBtn);

      const triggerRegen = async () => {
        if (regenBtn.disabled) return;
        const userComment = commentInput.value.trim();
        const parentContainer = targetEl.closest('div[jscontroller]') || targetEl.parentElement?.parentElement;
        GoogleFormsFillerService.setProcessingState(parentContainer, true, 'Refining with AI...');
        regenBtn.disabled = true;
        regenBtn.innerHTML = `
          <svg class="gfaf-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
          </svg>
          <span>Generating...</span>
        `;

        try {
          const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3, profile?.id);
          let newAnswer = '';
          try {
            newAnswer = await LlmService.generateRagAnswer({
              question: questionText,
              retrievedChunks: chunks || [],
              profile: profile,
              customInstructions: userComment
            });
          } catch (llmErr) {
            console.warn('[GFAF] Re-generate LLM unavailable, using smart answer fallback:', llmErr.message);
          }

          if (!newAnswer || !newAnswer.trim()) {
            const smart = FieldMatcherService.matchSmartAnswers(questionText, profile);
            if (smart && smart.value) newAnswer = smart.value;
          }

          if (newAnswer) {
            await GoogleFormsFillerService.typewriteInputValue(targetEl, newAnswer);
            GoogleFormsFillerService.highlightContainer(parentContainer, { confidence: 0.98, isRag: true });
          }
        } catch (e) {
          console.warn('[GFAF] Re-generate error:', e);
        } finally {
          GoogleFormsFillerService.setProcessingState(parentContainer, false);
        }

        regenBtn.disabled = false;
        regenBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>Try Again</span>
        `;
      };

      if (regenBtn.addEventListener) regenBtn.addEventListener('click', triggerRegen);
      if (commentInput.addEventListener) {
        commentInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            triggerRegen();
          }
        });
      }

      // Replace existing single-line action bar in place so only 1 line exists!
      const existingActionBar = containerEl.querySelector('.gfaf-ai-column-action-bar');
      if (existingActionBar && existingActionBar.parentElement) {
        existingActionBar.parentElement.replaceChild(toolbar, existingActionBar);
      } else {
        containerEl.appendChild(toolbar);
      }
    }

    const commentInput = toolbar.querySelector('.gfaf-ai-comment-input');
    if (commentInput && commentInput.focus) {
      commentInput.focus();
    }
  }

  /**
   * Detect reactive validation errors or constraint feedback reflected in the DOM
   */
  static detectValidationFeedback(containerEl, inputEl = null) {
    if (!containerEl) return { hasError: false, errorText: '', constraints: {} };

    const constraints = {};
    if (inputEl) {
      if (inputEl.getAttribute) {
        if (inputEl.getAttribute('min')) constraints.min = inputEl.getAttribute('min');
        if (inputEl.getAttribute('max')) constraints.max = inputEl.getAttribute('max');
        if (inputEl.getAttribute('maxlength')) constraints.maxlength = parseInt(inputEl.getAttribute('maxlength'), 10);
        if (inputEl.getAttribute('minlength')) constraints.minlength = parseInt(inputEl.getAttribute('minlength'), 10);
        if (inputEl.getAttribute('pattern')) constraints.pattern = inputEl.getAttribute('pattern');
        if (inputEl.getAttribute('aria-invalid') === 'true') constraints.hasError = true;
      }
    }

    const searchRoot = (containerEl.closest && containerEl.closest('div[role="listitem"], div[jsmodel], div[data-automation-id="questionItem"], .office-form-question')) || containerEl;

    // Google Forms error message elements across all modern and legacy variants (excluding question containers)
    const gfErrorEl = searchRoot.querySelector
      ? searchRoot.querySelector('div[role="alert"], span[role="alert"], div.R3NpKe, div[jsname="B34EJ"], .asQ4ud, .gHjhdc, .snByac, .d9OAGc')
      : null;
    // Microsoft Forms error message elements
    const msErrorEl = searchRoot.querySelector
      ? searchRoot.querySelector('div[data-automation-id="validationError"], span[data-automation-id="validationError"], .office-form-validation-error, .office-form-question-error')
      : null;

    const errEl = gfErrorEl || msErrorEl;
    let errorText = '';
    if (errEl) {
      const raw = (errEl.innerText || errEl.textContent || '').trim();
      const norm = raw.toLowerCase();
      if (
        norm.includes('must') ||
        norm.includes('greater') ||
        norm.includes('less') ||
        norm.includes('number') ||
        norm.includes('required') ||
        norm.includes('valid') ||
        norm.includes('between') ||
        norm.includes('whole') ||
        norm.includes('integer') ||
        norm.includes('digits') ||
        norm.includes('match')
      ) {
        errorText = raw;
      }
    }

    const hasError = Boolean(errorText) || Boolean(constraints.hasError);

    return {
      hasError,
      errorText,
      constraints
    };
  }

  /**
   * Execute AI Post-Validation on filled field and auto-correct if bounds/errors are violated
   */
  static async postValidateAndFixField(containerEl, targetEl, questionText, profile, currentFilledVal) {
    if (!containerEl || !targetEl) return currentFilledVal;

    // 1. Profile Ground Truth Check (Prevents experience / CTC / notice period mismatches)
    if (profile) {
      const profileCheck = ProfileValidatorService.validateFilledValue(questionText, currentFilledVal, profile, targetEl);
      if (!profileCheck.isValid && profileCheck.correctedValue !== undefined && profileCheck.correctedValue !== currentFilledVal) {
        this.setInputValue(targetEl, profileCheck.correctedValue);
        currentFilledVal = profileCheck.correctedValue;
      }
    }

    // Brief delay for reactive framework validation rendering
    await new Promise((r) => setTimeout(r, 60));

    let feedback = this.detectValidationFeedback(containerEl, targetEl);

    // If no error rendered yet, trigger a native blur event to provoke form validation
    if (!feedback.hasError) {
      try {
        targetEl.dispatchEvent(new Event('blur', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 40));
        feedback = this.detectValidationFeedback(containerEl, targetEl);
      } catch (e) {}
    }

    if (!feedback.hasError && !feedback.errorText && !feedback.constraints.max && !feedback.constraints.min && !feedback.constraints.maxlength) {
      return currentFilledVal;
    }

    // 2. Deterministic Post-Validation Correction & Conflict Engine
    if (feedback.errorText) {
      const fixResult = ProfileValidatorService.correctValidationError(questionText, currentFilledVal, feedback.errorText, profile);
      if (fixResult !== null && fixResult.value !== undefined) {
        if (fixResult.hasConflict) {
          // User requirement: Do not fill if there is a conflict with form constraints
          this.setInputValue(targetEl, '');
          await new Promise((r) => setTimeout(r, 40));
          return { value: '', hasConflict: true, conflictMessage: fixResult.conflictMessage };
        }

        if (fixResult.value !== currentFilledVal) {
          this.setInputValue(targetEl, fixResult.value);
          await new Promise((r) => setTimeout(r, 40));
        }
        return fixResult;
      }
    }

    // Deterministic attribute checks
    if (feedback.constraints.max !== undefined && feedback.constraints.max !== null && feedback.constraints.max !== '') {
      const maxNum = parseFloat(feedback.constraints.max);
      const currNum = parseFloat(currentFilledVal);
      if (!isNaN(maxNum) && !isNaN(currNum) && currNum > maxNum) {
        this.setInputValue(targetEl, '');
        return { value: '', hasConflict: true, conflictMessage: `Conflict: Max allowed is ${maxNum}` };
      }
    }

    if (feedback.constraints.min !== undefined && feedback.constraints.min !== null && feedback.constraints.min !== '') {
      const minNum = parseFloat(feedback.constraints.min);
      const currNum = parseFloat(currentFilledVal);
      if (!isNaN(minNum) && !isNaN(currNum) && currNum < minNum) {
        this.setInputValue(targetEl, '');
        return { value: '', hasConflict: true, conflictMessage: `Conflict: Min required is ${minNum}` };
      }
    }

    if (feedback.constraints.maxlength && String(currentFilledVal).length > feedback.constraints.maxlength) {
      const trimmed = String(currentFilledVal).slice(0, feedback.constraints.maxlength);
      this.setInputValue(targetEl, trimmed);
      return { value: trimmed, hasConflict: false };
    }

    return { value: currentFilledVal, hasConflict: false, conflictMessage: '' };
  }

  /**
   * Extract high-level form context: Form Title, Subtitle / Description, and overview of questions
   */
  static extractFormContext(rootDoc = null) {
    const doc = rootDoc || (typeof document !== 'undefined' ? document : null);
    if (!doc) return { formTitle: '', formDescription: '', allQuestions: [] };

    let formTitle = '';
    let formDescription = '';

    // 1. Google Forms Form Title
    const gfTitleEl = doc.querySelector('.F9N7Re, .freebirdFormviewerViewHeaderTitle, [role="heading"][aria-level="1"], .ahS2Le, div.M7eMe');
    if (gfTitleEl) {
      formTitle = (gfTitleEl.innerText || gfTitleEl.textContent || '').trim();
    }

    // 2. Microsoft Forms Form Title
    if (!formTitle) {
      const msTitleEl = doc.querySelector('.office-form-title, span[data-automation-id="formTitle"], .form-title');
      if (msTitleEl) {
        formTitle = (msTitleEl.innerText || msTitleEl.textContent || '').trim();
      }
    }

    // 3. Document Title fallback
    if (!formTitle && doc.title) {
      formTitle = doc.title.replace(/\s*-\s*Google Forms\s*$/i, '').replace(/\s*-\s*Microsoft Forms\s*$/i, '').trim();
    }

    // Form Subtitle / Description
    const descEl = doc.querySelector('.freebirdFormviewerViewHeaderDescription, .gHjhdc, .jibhHc, .vRMGwf, .office-form-subtitle, span[data-automation-id="formSubtitle"]');
    if (descEl) {
      formDescription = (descEl.innerText || descEl.textContent || '').trim();
    }

    // Overview of all questions
    const questionEls = this.findQuestionContainers(doc);
    const allQuestions = questionEls
      .map((c) => this.extractQuestionText(c).split('\n')[0].trim())
      .filter(Boolean);

    return {
      formTitle,
      formDescription,
      allQuestions
    };
  }

  /**
   * Main scan and fill pipeline on the active form
   * AI-FIRST FORM DECISION & FILLING ENGINE WITH POST-VALIDATION:
   * 1. Extracts every question container and contextual requirements.
   * 2. Evaluates the question using the AI Decision Engine (LLM + RAG + Profile).
   * 3. AI decides exact strict value, matching options, or synthesized RAG essay.
   * 4. Dispatches native DOM events & animations to fill the form.
   * 5. Runs AI Post-Validation to check reflected min/max range constraints or errors.
   */
  static async fillForm(profile, settings = {}) {
    const containers = this.findQuestionContainers();
    const results = {
      totalQuestions: containers.length,
      filledCount: 0,
      skippedCount: 0,
      details: []
    };

    if (containers.length === 0) {
      return results;
    }

    // Ensure all input columns have per-field AI buttons mounted
    this.injectAiButtonsToAllInputs(profile);

    const sessionJd = settings.jobDescription || (typeof window !== 'undefined' ? window.__GFAF_SESSION_JD__ : '') || '';
    const formContext = this.extractFormContext();

    // Process every question through the AI Evaluation Engine
    for (let i = 0; i < containers.length; i++) {
      const container = containers[i];
      const questionText = this.extractQuestionText(container);
      if (!questionText) {
        results.skippedCount++;
        continue;
      }

      const textInput = container.querySelector('input[data-automation-id="textInput"], input.office-form-question-textbox, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"]');
      const textareaInput = container.querySelector('textarea[data-automation-id="textInput"], textarea.office-form-question-textarea, textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea');
      const radioOptions = this.extractRadioOptions(container);
      const checkboxOptions = this.extractCheckboxOptions(container);

      const targetEl = textareaInput || textInput;
      const isNumeric = this.isNumericRequirement(targetEl, container, questionText);
      const isTextArea = Boolean(textareaInput) || (targetEl && targetEl.tagName === 'TEXTAREA');

      let fieldType = 'text';
      let availableOptions = [];

      if (checkboxOptions.length > 0) {
        fieldType = 'checkbox';
        availableOptions = checkboxOptions.map((o) => o.label);
      } else if (radioOptions.length > 0) {
        fieldType = 'radio';
        availableOptions = radioOptions.map((o) => o.label);
      } else if (isTextArea) {
        fieldType = 'textarea';
      } else if (isNumeric) {
        fieldType = 'number';
      }

      this.setProcessingState(container, true, 'AI evaluating question...');

      try {
        // Retrieve relevant RAG context chunks from knowledge base
        let chunks = [];
        try {
          chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3, profile?.id);
        } catch (e) {}

        // Send question to AI Decision Engine
        let aiDecision = await LlmService.evaluateAndFillQuestion({
          question: questionText,
          fieldType: fieldType,
          options: availableOptions,
          profile: profile,
          retrievedChunks: chunks,
          jobDescription: sessionJd,
          formContext: formContext
        });

        // Offline / Fallback Resilience: If AI was offline or returned empty, resolve via local profile facts
        if (!aiDecision || !aiDecision.value || (Array.isArray(aiDecision.value) && aiDecision.value.length === 0)) {
          if (fieldType === 'radio' && radioOptions.length > 0) {
            const fallbackRadio = FieldMatcherService.matchRadioOption(questionText, availableOptions, profile);
            if (fallbackRadio && fallbackRadio.option) {
              aiDecision = { decisionType: 'choice_selection', value: fallbackRadio.option, confidence: fallbackRadio.confidence || 0.85 };
            }
          } else if (fieldType === 'checkbox' && checkboxOptions.length > 0) {
            const fallbackCb = FieldMatcherService.matchCheckboxOptions(questionText, availableOptions, profile);
            if (fallbackCb && fallbackCb.length > 0) {
              aiDecision = { decisionType: 'choice_selection', value: fallbackCb, confidence: 0.85 };
            }
          } else if (targetEl) {
            const directMatch = FieldMatcherService.resolveMatch(questionText, profile);
            if (directMatch && directMatch.value !== undefined && directMatch.value !== '') {
              let val = directMatch.value;
              if (isNumeric) {
                val = directMatch.numericValue || FieldMatcherService.extractNumericValue(val, questionText);
              }
              aiDecision = { decisionType: 'strict_profile', value: String(val).trim(), confidence: directMatch.confidence || 0.85 };
            } else {
              const smart = FieldMatcherService.matchSmartAnswers(questionText, profile);
              if (smart && smart.value) {
                aiDecision = { decisionType: 'rag_synthesis', value: smart.value, confidence: 0.90 };
              }
            }
          }
        }

        // Ground and validate decision with ProfileValidatorService to prevent hallucinations
        aiDecision = ProfileValidatorService.validateAndGroundDecision(
          questionText,
          aiDecision,
          profile,
          isNumeric,
          fieldType
        );

        // Apply AI Decision to DOM
        if (aiDecision && aiDecision.value !== undefined && aiDecision.value !== '') {
          // 1. Text & Textarea Inputs
          if (targetEl && (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'number')) {
            let fillVal = String(aiDecision.value).trim();
            if (isNumeric) {
              fillVal = FieldMatcherService.extractNumericValue(fillVal, questionText) || fillVal;
            }

            let success = false;
            if (aiDecision.decisionType === 'rag_synthesis' || fillVal.length > 60) {
              success = await this.typewriteInputValue(targetEl, fillVal);
              this.attachAiToolbar(container, targetEl, questionText, profile);
            } else {
              success = this.setInputValue(targetEl, fillVal);
            }

            if (success) {
              // POST-VALIDATION CHECK & CONFLICT DETECTION:
              // Inspect if form reflected validation error / min / max bounds in DOM
              const postResult = await this.postValidateAndFixField(container, targetEl, questionText, profile, fillVal);
              const hasConflict = Boolean(postResult?.hasConflict);
              const conflictMessage = postResult?.conflictMessage || '';

              if (hasConflict) {
                results.skippedCount++;
                if (settings.autoHighlight !== false) {
                  this.highlightContainer(container, {
                    confidence: 0,
                    isRag: false,
                    isStrict: false,
                    infoMessage: '',
                    hasConflict: true,
                    conflictMessage
                  });
                }
                results.details.push({ question: questionText, type: 'conflict_skipped', value: '', conflict: conflictMessage });
                continue;
              }

              if (postResult && typeof postResult === 'object') {
                fillVal = postResult.value !== undefined ? postResult.value : fillVal;
              } else if (typeof postResult === 'string') {
                fillVal = postResult;
              }

              // Compute right-side display message for CTC, Experience, Notice Period
              const category = ProfileValidatorService.detectQuestionCategory(questionText);
              let infoMessage = '';
              const prof = profile?.professional || {};

              if (category === 'total_experience') {
                const expYears = prof.totalExperienceYears !== undefined ? String(prof.totalExperienceYears).trim() : '0';
                infoMessage = `Profile: ${expYears === '0' ? 'Fresher (0 Yrs)' : `${expYears} Yrs`}`;
              } else if (category === 'current_ctc') {
                const curLpa = prof.currentCtcLpa !== undefined ? String(prof.currentCtcLpa).trim() : '0';
                infoMessage = `Profile: ${curLpa === '0' ? '0 LPA (Fresher)' : `${curLpa} LPA`}`;
              } else if (category === 'expected_ctc') {
                infoMessage = `Profile Expected: ${prof.expectedCtc || (prof.expectedCtcLpa ? `${prof.expectedCtcLpa} LPA` : '10 LPA')}`;
              } else if (category === 'notice_period') {
                const npText = prof.noticePeriod || 'Immediate';
                const npDays = prof.noticePeriodDays || '0';
                infoMessage = `Profile: ${npText} (${npDays} Days)`;
              }

              results.filledCount++;
              if (settings.autoHighlight !== false) {
                this.highlightContainer(container, {
                  confidence: aiDecision.confidence || 0.95,
                  isRag: aiDecision.decisionType === 'rag_synthesis',
                  isStrict: aiDecision.decisionType === 'strict_profile',
                  infoMessage,
                  hasConflict: false
                });
              }
              results.details.push({
                question: questionText,
                type: aiDecision.decisionType,
                value: fillVal,
                confidence: aiDecision.confidence || 0.95
              });
              continue;
            }
          }

          // 2. Radio Options (Single Choice)
          if (radioOptions.length > 0 && fieldType === 'radio') {
            const selectedOpt = typeof aiDecision.value === 'string' ? aiDecision.value : (Array.isArray(aiDecision.value) ? aiDecision.value[0] : '');
            if (selectedOpt) {
              const targetOpt = radioOptions.find((o) => o.label.trim().toLowerCase() === selectedOpt.trim().toLowerCase())
                || radioOptions.find((o) => o.label.toLowerCase().includes(selectedOpt.toLowerCase()) || selectedOpt.toLowerCase().includes(o.label.toLowerCase()));

              if (targetOpt && this.selectRadio(targetOpt.element)) {
                results.filledCount++;
                if (settings.autoHighlight !== false) {
                  this.highlightContainer(container, { confidence: aiDecision.confidence || 0.95, isStrict: true });
                }
                results.details.push({
                  question: questionText,
                  type: 'radio',
                  value: targetOpt.label,
                  confidence: aiDecision.confidence || 0.95
                });
                continue;
              }
            }
          }

          // 3. Checkbox Options (Multi-Choice)
          if (checkboxOptions.length > 0 && fieldType === 'checkbox') {
            const selectedArray = Array.isArray(aiDecision.value) ? aiDecision.value : [aiDecision.value];
            let anyChecked = false;
            const checkedLabels = [];

            for (const chosenLabel of selectedArray) {
              const targetCb = checkboxOptions.find((o) => o.label.trim().toLowerCase() === String(chosenLabel).trim().toLowerCase())
                || checkboxOptions.find((o) => o.label.toLowerCase().includes(String(chosenLabel).toLowerCase()) || String(chosenLabel).toLowerCase().includes(o.label.toLowerCase()));

              if (targetCb && this.selectCheckbox(targetCb.element)) {
                anyChecked = true;
                checkedLabels.push(targetCb.label);
              }
            }

            if (anyChecked) {
              results.filledCount++;
              if (settings.autoHighlight !== false) {
                this.highlightContainer(container, { confidence: aiDecision.confidence || 0.95, isStrict: true });
              }
              results.details.push({
                question: questionText,
                type: 'checkbox',
                value: checkedLabels,
                confidence: aiDecision.confidence || 0.95
              });
              continue;
            }
          }
        }

        results.skippedCount++;
      } catch (err) {
        console.warn('[GFAF] Field fill error:', err);
        results.skippedCount++;
      } finally {
        this.setProcessingState(container, false);
      }
    }

    // 4. Global Second-Pass Post-Validation Sweep:
    // Re-scans all form question containers to catch and auto-heal any reactive error banners
    try {
      await new Promise((r) => setTimeout(r, 80));
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const targetEl = container.querySelector('textarea, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"], input.whsOnd');
        const questionText = this.extractQuestionText(container);
        if (targetEl && questionText) {
          const feedback = this.detectValidationFeedback(container, targetEl);
          if (feedback.hasError) {
            const currentVal = targetEl.value;
            const postResult = await this.postValidateAndFixField(container, targetEl, questionText, profile, currentVal);
            if (postResult && postResult.hasConflict) {
              this.highlightContainer(container, {
                confidence: 0,
                isRag: false,
                isStrict: false,
                infoMessage: '',
                hasConflict: true,
                conflictMessage: postResult.conflictMessage
              });
            }
          }
        }
      }
    } catch (sweepErr) {
      console.warn('[GFAF] Global validation sweep notice:', sweepErr);
    }

    return results;
  }
}

