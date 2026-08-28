/**
 * GoogleFormsFillerService - Robust DOM Filler Engine for Google Forms with RAG Support
 * Follows SOLID principles and handles text, numeric, and RAG-generated responses.
 */

import { FieldMatcherService } from './FieldMatcherService.js';
import { RetrievalService } from './rag/RetrievalService.js';
import { LlmService } from './llm/LlmService.js';

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

    if (outerQuestion.classList && outerQuestion.classList.add) {
      outerQuestion.classList.add('gfaf-filled-highlight');
    }

    // Strip any inner/duplicate badges across all children inside this question container
    const existingBadges = outerQuestion.querySelectorAll ? outerQuestion.querySelectorAll('.gfaf-match-badge') : [];
    if (existingBadges && existingBadges.length > 0) {
      existingBadges.forEach((b) => {
        if (typeof b.remove === 'function') {
          b.remove();
        } else if (b.parentElement && b.parentElement.removeChild) {
          b.parentElement.removeChild(b);
        }
      });
    }

    const badge = this.safeCreateElement('div', outerQuestion);
    badge.className = 'gfaf-match-badge';
    if (badge.classList && badge.classList.add) {
      badge.classList.add('gfaf-match-badge');
    }
    if (outerQuestion.style) {
      outerQuestion.style.position = 'relative';
    }
    outerQuestion.appendChild(badge);

    const confidencePct = Math.round((matchInfo.confidence || 1.0) * 100);
    badge.textContent = matchInfo.isRag ? 'Auto-filled via AI' : `Auto-filled (${confidencePct}%)`;
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
   * Main scan and fill pipeline on the current document
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

    const unfilledOpenEnded = [];

    // ====================================================
    // PASS 1: Fill All Default / Profile / Smart Q&A Answers FIRST
    // ====================================================
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

      // 1. Handle Text / Paragraph / Number Inputs
      if (textInput || textareaInput) {
        const targetEl = textareaInput || textInput;
        const isNumeric = this.isNumericRequirement(targetEl, container, questionText);
        const isOpenEnded = !isNumeric && this.isOpenEndedQuestion(questionText, targetEl);

        const directMatch = FieldMatcherService.resolveMatch(questionText, profile);
        if (directMatch && directMatch.matched && directMatch.value !== undefined && directMatch.confidence >= 0.70) {
          let finalValue = directMatch.value;
          if (isNumeric) {
            finalValue = directMatch.numericValue || FieldMatcherService.extractNumericValue(directMatch.value, questionText);
          }

          const success = this.setInputValue(targetEl, String(finalValue));
          if (success) {
            results.filledCount++;
            if (settings.autoHighlight !== false) {
              this.highlightContainer(container, directMatch);
            }
            results.details.push({
              question: questionText,
              type: 'text',
              value: finalValue,
              confidence: directMatch.confidence
            });
            continue;
          }
        }

        // If no default match found, mark as candidate for AI synthesis
        if (isOpenEnded || targetEl.tagName === 'TEXTAREA' || questionText.length > 30) {
          unfilledOpenEnded.push({ container, targetEl, questionText });
        }
      }

      // 2. Radio Options
      if (radioOptions.length > 0) {
        const optionLabels = radioOptions.map((o) => o.label);
        const textMatch = FieldMatcherService.resolveMatch(questionText, profile);
        const radioMatch = FieldMatcherService.matchRadioOption(questionText, optionLabels, profile, textMatch);
        if (radioMatch && radioMatch.option) {
          const targetOpt = radioOptions.find((o) => o.label === radioMatch.option);
          if (targetOpt) {
            const success = this.selectRadio(targetOpt.element);
            if (success) {
              results.filledCount++;
              if (settings.autoHighlight !== false) {
                this.highlightContainer(container, radioMatch);
              }
              results.details.push({
                question: questionText,
                type: 'radio',
                value: radioMatch.option,
                confidence: radioMatch.confidence
              });
              continue;
            }
          }
        }
      }

      // 3. Checkbox Options
      if (checkboxOptions.length > 0) {
        const optionLabels = checkboxOptions.map((o) => o.label);
        const selectedLabels = FieldMatcherService.matchCheckboxOptions(questionText, optionLabels, profile);
        if (selectedLabels.length > 0) {
          let anyChecked = false;
          for (const label of selectedLabels) {
            const targetCb = checkboxOptions.find((o) => o.label === label);
            if (targetCb && this.selectCheckbox(targetCb.element)) {
              anyChecked = true;
            }
          }
          if (anyChecked) {
            results.filledCount++;
            if (settings.autoHighlight !== false) {
              this.highlightContainer(container, { confidence: 0.95 });
            }
            results.details.push({
              question: questionText,
              type: 'checkbox',
              value: selectedLabels,
              confidence: 0.95
            });
            continue;
          }
        }
      }
    }

    // ====================================================
    // PASS 2: Synthesize AI Answers ONLY For Remaining Empty Open-Ended Questions
    // ====================================================
    if (settings.enableRag !== false) {
      for (const item of unfilledOpenEnded) {
        const { container, targetEl, questionText } = item;
        if (!targetEl.value || !targetEl.value.trim()) {
          this.setProcessingState(container, true, 'Synthesizing with AI...');
          try {
            const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3, profile?.id);
            let generated = '';
            try {
              generated = await LlmService.generateRagAnswer({
                question: questionText,
                retrievedChunks: chunks || [],
                profile: profile
              });
            } catch (llmErr) {
              console.warn('[GFAF] Auto-fill LLM offline, checking profile smart answers:', llmErr.message);
            }

            if (!generated || !generated.trim()) {
              const smart = FieldMatcherService.matchSmartAnswers(questionText, profile);
              if (smart && smart.value) {
                generated = smart.value;
              } else {
                const custom = FieldMatcherService.matchCustomFields(questionText, profile);
                if (custom && custom.value) {
                  generated = custom.value;
                }
              }
            }

            if (generated && generated.trim()) {
              const success = await this.typewriteInputValue(targetEl, generated.trim());
              if (success) {
                results.filledCount++;
                if (settings.autoHighlight !== false) {
                  this.highlightContainer(container, { confidence: 0.98, isRag: true });
                }
                this.attachAiToolbar(container, targetEl, questionText, profile);
                results.details.push({
                  question: questionText,
                  type: 'rag_ai',
                  value: generated.trim(),
                  confidence: 0.98
                });
              }
            }
          } catch (ragErr) {
            console.warn('[GFAF] RAG generation fallback:', ragErr.message);
          } finally {
            this.setProcessingState(container, false);
          }
        }
      }
    }

    return results;
  }
}

