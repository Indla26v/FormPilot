/**
 * GoogleFormsFillerService - Robust DOM Filler Engine for Google Forms with RAG Support
 * Follows SOLID principles and handles text, numeric, and RAG-generated responses.
 */

import { FieldMatcherService } from './FieldMatcherService.js';
import { RetrievalService } from './rag/RetrievalService.js';
import { LlmService } from './llm/LlmService.js';

export class GoogleFormsFillerService {
  /**
   * Extract question text from a Google Form question container
   */
  static extractQuestionText(containerEl) {
    if (!containerEl) return '';
    let title = '';

    // 1. Try finding heading with role="heading"
    const headingEl = containerEl.querySelector('div[role="heading"]');
    if (headingEl) {
      title = (headingEl.innerText || headingEl.textContent || '').trim();
    } else {
      const titleEl = containerEl.querySelector('.M7eMe, .HoPJnd, .F9N7Re, span[dir="auto"]');
      if (titleEl) {
        title = (titleEl.innerText || titleEl.textContent || '').trim();
      }
    }

    const inputWithLabel = containerEl.querySelector('input[aria-label], textarea[aria-label]');
    if (!title && inputWithLabel) {
      title = (inputWithLabel.getAttribute('aria-label') || '').trim();
    }

    // Also extract sub-description / prompt constraints if present
    const descEl = containerEl.querySelector('.gHjhdc, .jibhHc, .vRMGwf, .asQ4ud, div[id$="_desc"], div[jsname="V67aGc"]');
    let desc = '';
    if (descEl) {
      desc = (descEl.innerText || descEl.textContent || '').trim();
    }

    if (title && desc && !title.includes(desc)) {
      return `${title}\n${desc}`;
    }

    return title || '';
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
    const radioElements = containerEl.querySelectorAll('div[role="radio"]');
    const options = [];

    radioElements.forEach((radio) => {
      const dataVal = radio.getAttribute('data-value');
      const ariaLabel = radio.getAttribute('aria-label');
      
      let text = '';
      const textContainer = radio.closest('label') || radio.parentElement;
      if (textContainer) {
        text = textContainer.innerText || textContainer.textContent || '';
      }

      const finalLabel = (dataVal || ariaLabel || text || '').trim();
      if (finalLabel) {
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
      const isAlreadyChecked = radioEl.getAttribute('aria-checked') === 'true';
      if (!isAlreadyChecked) {
        radioEl.focus();
        radioEl.click();
        radioEl.dispatchEvent(new Event('click', { bubbles: true }));
        radioEl.dispatchEvent(new Event('change', { bubbles: true }));
        radioEl.setAttribute('aria-checked', 'true');
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
    const checkboxElements = containerEl.querySelectorAll('div[role="checkbox"]');
    const options = [];

    checkboxElements.forEach((checkbox) => {
      const ariaLabel = checkbox.getAttribute('aria-label');
      let text = '';
      const textContainer = checkbox.closest('label') || checkbox.parentElement;
      if (textContainer) {
        text = textContainer.innerText || textContainer.textContent || '';
      }

      const finalLabel = (ariaLabel || text || '').trim();
      if (finalLabel) {
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
      const isChecked = checkboxEl.getAttribute('aria-checked') === 'true';
      if (!isChecked) {
        checkboxEl.focus();
        checkboxEl.click();
        checkboxEl.dispatchEvent(new Event('click', { bubbles: true }));
        checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
        checkboxEl.setAttribute('aria-checked', 'true');
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Find all question item containers in the active Google Form
   */
  static findQuestionContainers(root = document) {
    const selectors = [
      'div[role="listitem"]',
      'div.geS5n',
      'div.Qr7Oae',
      'div[jsmodel="CP1oW"]',
      'div.m2'
    ];

    for (const selector of selectors) {
      const items = root.querySelectorAll(selector);
      if (items && items.length > 0) {
        return Array.from(items);
      }
    }

    const headings = root.querySelectorAll('div[role="heading"]');
    if (headings && headings.length > 0) {
      const containers = [];
      headings.forEach((h) => {
        const parent = h.closest('div[jscontroller]') || h.parentElement?.parentElement;
        if (parent && !containers.includes(parent)) {
          containers.push(parent);
        }
      });
      return containers;
    }

    return [];
  }

  /**
   * Display or remove dynamic green processing buffer
   */
  static setProcessingState(containerEl, isProcessing, message = 'Processing...') {
    if (!containerEl) return;
    if (isProcessing) {
      containerEl.classList.add('gfaf-processing-buffer');
      if (containerEl.style) {
        containerEl.style.position = 'relative';
      }
      let indicator = containerEl.querySelector('.gfaf-processing-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'gfaf-processing-indicator';
        indicator.innerHTML = `
          <span class="gfaf-processing-dot"></span>
          <span class="gfaf-processing-text">${message}</span>
        `;
        containerEl.appendChild(indicator);
      } else {
        const textEl = indicator.querySelector('.gfaf-processing-text');
        if (textEl) textEl.textContent = message;
      }
    } else {
      containerEl.classList.remove('gfaf-processing-buffer');
      const indicator = containerEl.querySelector('.gfaf-processing-indicator');
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
    containerEl.classList.add('gfaf-filled-highlight');

    let badge = containerEl.querySelector('.gfaf-match-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'gfaf-match-badge';
      if (containerEl.style) {
        containerEl.style.position = 'relative';
      }
      containerEl.appendChild(badge);
    }

    const confidencePct = Math.round((matchInfo.confidence || 1.0) * 100);
    badge.textContent = matchInfo.isRag ? 'Auto-filled via AI' : `Auto-filled (${confidencePct}%)`;
  }

  /**
   * Attach a sleek, modern pill-shaped AI button to an individual input column
   */
  static attachAiColumnButton(containerEl, targetEl, questionText, profile) {
    if (!containerEl || !targetEl) return null;
    let actionBar = containerEl.querySelector('.gfaf-ai-column-action-bar');
    if (!actionBar) {
      actionBar = document.createElement('div');
      actionBar.className = 'gfaf-ai-column-action-bar';

      const btn = document.createElement('button');
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
            const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3);
            const generated = await LlmService.generateRagAnswer({
              question: questionText,
              retrievedChunks: chunks || [],
              profile: profile,
              currentFieldValue: currentVal
            });

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
  static injectAiButtonsToAllInputs(profile, root = document) {
    const containers = this.findQuestionContainers(root);
    let attachedCount = 0;

    containers.forEach((container) => {
      const questionText = this.extractQuestionText(container);
      const targetEl = container.querySelector('textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
      if (targetEl && questionText) {
        this.attachAiColumnButton(container, targetEl, questionText, profile);
        attachedCount++;
      }
    });

    return attachedCount;
  }

  static attachAiToolbar(containerEl, targetEl, questionText, profile) {
    if (!containerEl) return;
    let toolbar = containerEl.querySelector('.gfaf-ai-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'gfaf-ai-toolbar';

      const commentInput = document.createElement('input');
      commentInput.type = 'text';
      commentInput.className = 'gfaf-ai-comment-input';
      commentInput.setAttribute('aria-label', 'AI prompt revision instruction');
      commentInput.placeholder = "Prompt instruction (e.g. 'mention Spring Boot & AWS', 'make it 100 words')...";
      toolbar.appendChild(commentInput);

      const regenBtn = document.createElement('button');
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
          const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3);
          const newAnswer = await LlmService.generateRagAnswer({
            question: questionText,
            retrievedChunks: chunks || [],
            profile: profile,
            customInstructions: userComment
          });

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

      const textInput = container.querySelector('input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
      const textareaInput = container.querySelector('textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea');
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
            const chunks = await RetrievalService.retrieveRelevantChunks(questionText, 3);
            const generated = await LlmService.generateRagAnswer({
              question: questionText,
              retrievedChunks: chunks || [],
              profile: profile
            });

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

