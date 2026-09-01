/**
 * LlmService - Multi-Provider LLM Orchestrator for RAG Generation
 * Follows Open/Closed Principle (OCP) and Strategy Pattern.
 * Supports: Local Ollama (Offline / Free), Google Gemini, OpenAI, and Anthropic Claude.
 */

import { StorageService } from '../StorageService.js';
import { SecurityGuardService } from '../security/SecurityGuardService.js';
import { ProfileValidatorService } from '../ProfileValidatorService.js';

export const LLM_STORAGE_KEYS = {
  CONFIG: 'gfaf_llm_config'
};

export const DEFAULT_LLM_CONFIG = {
  provider: 'ollama', // 'ollama' | 'gemini' | 'openai' | 'anthropic'
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  geminiApiKey: '',
  geminiModel: '',
  openaiApiKey: '',
  openaiModel: '',
  anthropicApiKey: '',
  anthropicModel: '',
  temperature: 0.3,
  maxTokens: 500
};

/**
 * In-Memory LRU Response Cache for Form Answers
 */
export class LruResponseCache {
  constructor(maxCapacity = 50) {
    this.maxCapacity = maxCapacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key, val) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCapacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, val);
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

/**
 * Deduplicate text across retrieved RAG chunks to save prompt tokens
 */
export function deduplicateContextChunks(chunks = []) {
  if (!chunks || chunks.length === 0) return [];
  const seenLines = new Set();
  return chunks.map((c) => {
    const rawLines = (c.text || '').split('\n');
    const uniqueLines = [];
    for (const line of rawLines) {
      const norm = line.trim().toLowerCase();
      if (norm.length > 20) {
        if (seenLines.has(norm)) continue;
        seenLines.add(norm);
      }
      uniqueLines.push(line);
    }
    const cleanText = uniqueLines.join('\n').trim();
    return { ...c, text: cleanText || c.text };
  }).filter((c) => c.text && c.text.length > 5);
}

/**
 * Universal Proxy Request Handler (Bypasses browser extension CSP/Mixed-Content & handles timeouts/abort signals)
 */
async function fetchViaProxyOrDirect(endpoint, options = {}) {
  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Create an automatic fallback timeout (3s) if no custom signal provided
  const timeoutMs = options.timeout || (options.signal ? 0 : 3000);
  let timer = null;
  let effectiveSignal = options.signal;

  if (timeoutMs > 0 && typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    effectiveSignal = controller.signal;
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  const enhancedOptions = { ...options, signal: effectiveSignal };

  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      return await new Promise((resolve, reject) => {
        if (effectiveSignal) {
          effectiveSignal.addEventListener('abort', () => {
            reject(new DOMException('Aborted or timed out', 'AbortError'));
          });
        }

        chrome.runtime.sendMessage({
          action: 'PROXY_FETCH',
          url: endpoint,
          options: enhancedOptions
        }, (res) => {
          if (chrome.runtime.lastError) {
            // Direct fetch fallback
            fetch(endpoint, enhancedOptions)
              .then(async (r) => {
                let data;
                try {
                  data = typeof r.json === 'function' ? await r.json() : await r.text();
                } catch {
                  data = await r.text();
                }
                if (r.ok) resolve(data);
                else reject(new Error(typeof data === 'string' ? data : JSON.stringify(data)));
              })
              .catch(reject);
          } else if (res && res.success) {
            resolve(res.data);
          } else {
            reject(new Error(res?.error || 'Request failed'));
          }
        });
      });
    } else {
      const r = await fetch(endpoint, enhancedOptions);
      let data;
      try {
        data = typeof r.json === 'function' ? await r.json() : await r.text();
      } catch {
        data = await r.text();
      }
      if (!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      return data;
    }
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Base Abstract Provider
 */
export class BaseLlmProvider {
  async generate({ prompt, systemPrompt, config, signal }) {
    throw new Error('generate method must be implemented by provider');
  }
  async testConnection(config) {
    throw new Error('testConnection method must be implemented by provider');
  }
}

/**
 * Local Ollama Provider (100% Offline, Free, Zero API Key)
 */
class OllamaProvider extends BaseLlmProvider {
  async listModels(endpoint = 'http://localhost:11434') {
    const cleanUrl = endpoint.replace(/\/+$/, '');
    const data = await fetchViaProxyOrDirect(`${cleanUrl}/api/tags`);
    return (data.models || []).map((m) => m.name);
  }

  async resolveModel(endpoint, requestedModel) {
    if (!requestedModel) return 'gemma4:e4b';
    try {
      const models = await this.listModels(endpoint);
      if (models && models.length > 0) {
        if (models.includes(requestedModel)) return requestedModel;
        const prefix = models.find((m) => m.startsWith(requestedModel + ':') || m.toLowerCase().startsWith(requestedModel.toLowerCase()));
        if (prefix) return prefix;
        const partial = models.find((m) => m.toLowerCase().includes(requestedModel.toLowerCase()));
        if (partial) return partial;
        return models[0];
      }
    } catch (e) {}
    return requestedModel;
  }

  async testConnection(config) {
    const endpoint = (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const rawModel = (config.ollamaModel || 'gemma4:e4b').trim();
    const model = await this.resolveModel(endpoint, rawModel);

    try {
      // 1. Verify endpoint and list models
      const models = await this.listModels(endpoint);

      // 2. Perform live generation test prompt to confirm model execution
      const payload = {
        model: model,
        messages: [
          { role: 'user', content: 'In one short sentence, confirm you are online and ready to answer form questions.' }
        ],
        stream: false,
        options: {
          num_predict: 150,
          temperature: 0.2
        }
      };

      const data = await fetchViaProxyOrDirect(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const answer = data?.message?.content?.trim() || data?.response?.trim() || 'Model is ready.';

      return {
        success: true,
        message: `Success! Local model "${model}" is connected and returned an answer.`,
        modelResponse: answer,
        models: models
      };
    } catch (err) {
      return {
        success: false,
        message: `Could not connect to Ollama at ${endpoint} with model "${model}": ${err.message}. Ensure Ollama is running and OLLAMA_ORIGINS is set to '*'.`
      };
    }
  }

  async generate({ prompt, systemPrompt, config, signal }) {
    const endpoint = (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const rawModel = (config.ollamaModel || 'gemma4:e4b').trim();
    const model = await this.resolveModel(endpoint, rawModel);

    const payload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: config.temperature !== undefined ? config.temperature : 0.3,
        num_predict: config.maxTokens || 1500
      }
    };

    const data = await fetchViaProxyOrDirect(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: signal || config?.signal
    });

    return data?.message?.content?.trim() || data?.response?.trim() || '';
  }
}

/**
 * Google Gemini Provider
 */
class GeminiProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.geminiApiKey) {
      return { success: false, message: 'Google Gemini API key is missing. Please enter your API key in Settings.' };
    }
    const model = (config.geminiModel || '').trim();
    if (!model) {
      return { success: false, message: 'Gemini Model Name is missing. Please check https://aistudio.google.com/docs and enter a model name.' };
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

      const data = await fetchViaProxyOrDirect(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'In one short sentence, confirm you are online and ready.' }] }],
          generationConfig: { maxOutputTokens: 40 }
        })
      });

      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Gemini online.';

      return {
        success: true,
        message: `Success! Google Gemini (${model}) is connected and returned an answer.`,
        modelResponse: answer
      };
    } catch (err) {
      return { success: false, message: `Error connecting to Gemini: ${err.message}` };
    }
  }

  async generate({ prompt, systemPrompt, config, signal }) {
    if (!config.geminiApiKey) throw new Error('Google Gemini API Key is required.');
    const model = (config.geminiModel || '').trim();
    if (!model) throw new Error('Gemini Model Name is missing. Please enter a valid model in Settings from https://aistudio.google.com/docs');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nTask:\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: config.temperature || 0.3,
        maxOutputTokens: config.maxTokens || 500
      }
    };

    const data = await fetchViaProxyOrDirect(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: signal || config?.signal
    });

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }
}

/**
 * OpenAI Provider
 */
class OpenAiProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.openaiApiKey) return { success: false, message: 'OpenAI API key is missing. Please enter your API key in Settings.' };
    const model = (config.openaiModel || '').trim();
    if (!model) return { success: false, message: 'OpenAI Model Name is missing. Please check https://developers.openai.com/api/docs/models and enter a model name.' };
    try {
      const data = await fetchViaProxyOrDirect('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'In one sentence, confirm you are online.' }],
          max_tokens: 30
        })
      });

      const answer = data.choices?.[0]?.message?.content?.trim() || 'OpenAI online.';

      return {
        success: true,
        message: `Success! OpenAI (${model}) is connected and returned an answer.`,
        modelResponse: answer
      };
    } catch (err) {
      return { success: false, message: `Error connecting to OpenAI: ${err.message}` };
    }
  }

  async generate({ prompt, systemPrompt, config, signal }) {
    if (!config.openaiApiKey) throw new Error('OpenAI API Key is required.');
    const model = (config.openaiModel || '').trim();
    if (!model) throw new Error('OpenAI Model Name is missing. Please enter a valid model in Settings from https://developers.openai.com/api/docs/models');

    const data = await fetchViaProxyOrDirect('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature || 0.3,
        max_tokens: config.maxTokens || 500
      }),
      signal: signal || config?.signal
    });

    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}

/**
 * Anthropic Claude Provider
 */
class AnthropicProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.anthropicApiKey) return { success: false, message: 'Anthropic API key is missing. Please enter your API key in Settings.' };
    const model = (config.anthropicModel || '').trim();
    if (!model) return { success: false, message: 'Anthropic Model Name is missing. Please check https://platform.claude.com/docs/en/models/overview and enter a model name.' };
    try {
      const data = await fetchViaProxyOrDirect('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'In one sentence, confirm you are online.' }],
          max_tokens: 30
        })
      });

      const answer = data.content?.[0]?.text?.trim() || 'Anthropic online.';

      return {
        success: true,
        message: `Success! Anthropic (${model}) is connected and returned an answer.`,
        modelResponse: answer
      };
    } catch (err) {
      return { success: false, message: `Error connecting to Anthropic: ${err.message}` };
    }
  }

  async generate({ prompt, systemPrompt, config, signal }) {
    if (!config.anthropicApiKey) throw new Error('Anthropic API Key is required.');
    const model = (config.anthropicModel || '').trim();
    if (!model) throw new Error('Anthropic Model Name is missing. Please enter a valid model in Settings from https://platform.claude.com/docs/en/models/overview');

    const data = await fetchViaProxyOrDirect('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature || 0.3,
        max_tokens: config.maxTokens || 500
      }),
      signal: signal || config?.signal
    });

    return data.content?.[0]?.text?.trim() || '';
  }
}

/**
 * LLM Factory & Generation Orchestrator
 */
export class LlmService {
  static _customProviders = new Map();
  static _responseCache = new LruResponseCache(50);

  /**
   * Register a custom or mock LLM provider (Open/Closed Principle)
   */
  static registerProvider(name, providerInstance) {
    if (name && providerInstance) {
      this._customProviders.set(name.toLowerCase(), providerInstance);
    }
  }

  static getProvider(providerName) {
    const norm = (providerName || '').toLowerCase();
    if (this._customProviders.has(norm)) {
      return this._customProviders.get(norm);
    }

    switch (norm) {
      case 'ollama':
        return new OllamaProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'openai':
        return new OpenAiProvider();
      case 'anthropic':
        return new AnthropicProvider();
      default:
        return new OllamaProvider();
    }
  }

  static clearResponseCache() {
    this._responseCache.clear();
  }

  static getResponseCacheSize() {
    return this._responseCache.size;
  }

  static async getConfig() {
    const saved = await StorageService.get(LLM_STORAGE_KEYS.CONFIG);
    return { ...DEFAULT_LLM_CONFIG, ...(saved || {}) };
  }

  static async saveConfig(config) {
    const safeConfig = SecurityGuardService.validateLlmConfig(config);
    await StorageService.set(LLM_STORAGE_KEYS.CONFIG, safeConfig);
    return true;
  }

  static async testConnection(config = null) {
    const activeConfig = config ? SecurityGuardService.validateLlmConfig(config) : (await this.getConfig());
    const provider = this.getProvider(activeConfig.provider);
    return await provider.testConnection(activeConfig);
  }

  static async listOllamaModels(endpoint = 'http://localhost:11434') {
    const provider = new OllamaProvider();
    return await provider.listModels(endpoint);
  }

  /**
   * Synthesize candidate answer using retrieved RAG context chunks and temporary conversation memory
   */
  static async generateRagAnswer({ question, retrievedChunks, profile, customInstructions = '', conversationHistory = [], currentFieldValue = '', jobDescription = '', config: customConfig = null, signal = null }) {
    const savedConfig = await this.getConfig();
    const config = customConfig ? { ...savedConfig, ...customConfig } : savedConfig;
    const provider = this.getProvider(config.provider);

    // Question-Hash Response Cache Check
    const isInitialGeneration = !currentFieldValue && (!conversationHistory || conversationHistory.length === 0);
    const cacheKey = isInitialGeneration
      ? `q:${(question || '').trim().toLowerCase()}|p:${profile?.id || ''}|jd:${(jobDescription || '').slice(0, 100)}|prov:${config.provider}|inst:${customInstructions}`
      : null;

    if (cacheKey) {
      const cached = this._responseCache.get(cacheKey);
      if (cached) return cached;
    }

    // Token-efficient context deduplication
    const deduplicatedChunks = deduplicateContextChunks(retrievedChunks);

    // Build structured context from retrieved chunks
    const contextText = deduplicatedChunks
      .map((c, i) => `[Source ${i + 1}: ${c.docTitle} - ${c.sectionTitle || 'General'}]\n${c.text}`)
      .join('\n\n');

    const candidateName = profile?.personal?.fullName || 'the candidate';
    const skillsList = (profile?.skills || []).map((s) => {
      if (typeof s === 'object' && s !== null) {
        const parts = [s.name];
        if (s.level) parts.push(`(${s.level})`);
        if (s.years) parts.push(`${s.years} yr(s)`);
        return parts.join(' - ');
      }
      return String(s);
    }).join(', ');

    const systemPrompt = `You are ${candidateName}, a real software engineer filling out an application form question.
Answer in the first person ("I", "my").

STRICT GROUNDING & ANTI-HALLUCINATION POLICY:
1. ONLY USE TOOLS FROM THE CANDIDATE'S RESUME & PROFILE:
   - You MUST ONLY mention programming languages, libraries, frameworks, cloud services, and tools that are EXPLICITLY present in the candidate's Profile Skills or Retrieved Resume/Project Context below.
   - NEVER invent, assume, or hallucinate external tools or frameworks (e.g. NEVER make up tools like Cypress, Selenium, Playwright, Jest, Mocha, Docker, Kubernetes, Jenkins, AWS, React Native, etc. unless they appear in the candidate's provided skills or resume context).
2. ADAPTING TO DOMAIN-SPECIFIC QUESTIONS (Testing, Cloud, DevOps, CI/CD, etc.):
   - If a question asks about a specific area (such as "software testing", "test automation", "cloud deployment", or "CI/CD") and the candidate does not list dedicated third-party tools for it:
     - DO NOT invent unlisted third-party tools.
     - Instead, explain how the candidate implemented, tested, validated, or built systems using their ACTUAL listed stack (e.g. writing custom test scripts, API validation routines, TypeScript type-safety guards, integration tests, or unit testing in their listed language like Python / Node.js / Java).
3. 100% FACTUAL HONESTY:
   - Stay strictly faithful to the candidate's real projects, metrics, and background. Do not claim experience with technologies the candidate has never worked with.

HUMANIZED WRITING STYLE & TONE:
1. Write naturally, authentically, and conversationally, exactly as a human developer would write in a job application.
2. Avoid AI cliches and buzzwords (e.g. do NOT use words like "delve", "spearhead", "testament", "tapestry", "in today's fast-paced landscape", "thrilled to", or generic textbook explanations).
3. Be direct, clear, and practical. Jump straight into the explanation without throat-clearing intros or fluffy conclusions.
4. Ground your response in real implementation decisions, technical details, and actual problem-solving from the candidate's actual projects.
5. Strictly adhere to any word count or constraint in the prompt.
6. Do NOT include markdown code block envelopes, preamble (e.g. "Here is my answer:"), or emojis. Output ONLY the clean, raw text ready to be pasted directly into the form.`;

    let userPrompt = `CANDIDATE PROFILE:
Name: ${candidateName}
Core Skills: ${skillsList}

RETRIEVED KNOWLEDGE BASE CONTEXT (From Resume & Project READMEs):
${contextText || 'No specific document chunks retrieved. Rely strictly on core skills and standard candidate background.'}

QUESTION TO ANSWER:
"${question}"

CRITICAL ANTI-HALLUCINATION GUARD:
You must strictly restrict all technical references, frameworks, and tools to the candidate's actual Skills and Resume/Project context provided above.
DO NOT introduce, hallucinate, or assume any third-party tools (e.g., Cypress, Selenium, Jest, Docker, Kubernetes, etc.) if they are not listed in the candidate's profile/context.\n\n`;

    const cleanJd = SecurityGuardService.validateJobDescription(jobDescription);
    if (cleanJd) {
      userPrompt += `TARGET JOB DESCRIPTION / ROLE REQUIREMENTS (Alignment Directive):
"""
${cleanJd}
"""
ALIGNMENT INSTRUCTION: Tailor and align your response to directly emphasize the requirements, skills, and qualifications mentioned in the Target Job Description above, while staying completely truthful to the candidate profile facts.\n\n`;
    }

    if (currentFieldValue || (conversationHistory && conversationHistory.length > 0)) {
      const prevDraft = currentFieldValue || (conversationHistory.filter((c) => c.role === 'assistant').pop()?.content) || '';
      userPrompt += `[CURRENT FORM DRAFT]:\n"${prevDraft}"\n\n`;
      if (conversationHistory.length > 0) {
        userPrompt += `[REVISION HISTORY]:\n${conversationHistory.map((h) => `${h.role === 'user' ? 'User Follow-up' : 'Previous Answer'}: ${h.content}`).join('\n')}\n\n`;
      }
      userPrompt += `[LATEST USER REVISION INSTRUCTION]:\n"${customInstructions || 'Refine and polish the answer'}"\n\nTask: Revise the previous answer incorporating the user's latest revision instruction while maintaining profile consistency and strict adherence to the candidate's actual toolset.\nGenerate the revised raw response:`;
    } else {
      userPrompt += `${customInstructions ? `USER INSTRUCTIONS / CONSTRAINTS:\n"${customInstructions}"\n\n` : ''}Generate the final response (strictly using candidate's actual skills/resume tools only):`;
    }

    const result = await provider.generate({
      prompt: userPrompt,
      systemPrompt: systemPrompt,
      config: config,
      signal: signal || customConfig?.signal || config?.signal
    });

    if (cacheKey && result) {
      this._responseCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * AI-First Form Question Evaluation & Decision Engine
   * Evaluates any form question (profile attribute, choices, or open-ended essay)
   * and returns strict data, matching options, or synthesized RAG response.
   */
  static async evaluateAndFillQuestion({
    question,
    fieldType = 'text',
    options = [],
    profile,
    retrievedChunks = [],
    jobDescription = '',
    customInstructions = '',
    formContext = {},
    config: customConfig = null,
    signal = null
  }) {
    if (!question || !profile) {
      return { decisionType: 'none', value: '', confidence: 0 };
    }

    const savedConfig = await this.getConfig();
    const config = customConfig ? { ...savedConfig, ...customConfig } : savedConfig;
    const provider = this.getProvider(config.provider);

    const candidateName = profile.personal?.fullName || 'the candidate';
    const skillsList = (profile.skills || []).map((s) => {
      if (typeof s === 'object' && s !== null) {
        const parts = [s.name];
        if (s.level) parts.push(`(${s.level})`);
        if (s.years) parts.push(`${s.years} yr(s)`);
        if (s.rating) parts.push(`[${s.rating}/10]`);
        return parts.join(' - ');
      }
      return String(s);
    }).join(', ');

    // Format profile context for AI reasoning
    const profileContext = {
      personal: profile.personal || {},
      education: profile.education || {},
      professional: profile.professional || {},
      links: profile.links || {},
      skills: skillsList,
      customFields: profile.customFields || [],
      smartAnswers: (profile.smartAnswers || []).map((qa) => ({ q: qa.keywords?.join(', '), a: qa.answer }))
    };

    const deduplicatedChunks = deduplicateContextChunks(retrievedChunks);
    const ragContextText = deduplicatedChunks
      .map((c, i) => `[Source ${i + 1}: ${c.docTitle} - ${c.sectionTitle || 'General'}]\n${c.text}`)
      .join('\n\n');

    // Extract explicit Candidate Project Names from RAG chunks, links, and custom fields
    const projectTitles = new Set();
    deduplicatedChunks.forEach((c) => {
      if (c.docTitle && !c.docTitle.toLowerCase().includes('.pdf') && !c.docTitle.toLowerCase().includes('resume')) {
        projectTitles.add(c.docTitle.replace(/\s*\(GitHub README\)/i, '').trim());
      }
      if (c.sectionTitle && !['general', 'overview', 'skills', 'education', 'experience'].includes(c.sectionTitle.toLowerCase())) {
        projectTitles.add(c.sectionTitle.replace(/^[#\*\-\s]+/, '').trim());
      }
    });
    if (profile.links?.projectDemoUrl) {
      const match = profile.links.projectDemoUrl.match(/\/([^\/]+)$/);
      if (match) projectTitles.add(match[1].replace(/[-_]/g, ' '));
    }
    if (profile.customFields && Array.isArray(profile.customFields)) {
      profile.customFields.forEach((cf) => {
        if (cf.key && (cf.key.toLowerCase().includes('project') || cf.key.toLowerCase().includes('built'))) {
          projectTitles.add(`${cf.key}: ${cf.value}`);
        }
      });
    }
    const projectsSummary = Array.from(projectTitles).filter(Boolean);

    const pers = profile.personal || {};
    const edu = profile.education || {};
    const prof = profile.professional || {};
    const links = profile.links || {};

    const expYears = prof.totalExperienceYears !== undefined && prof.totalExperienceYears !== null && prof.totalExperienceYears !== ''
      ? String(prof.totalExperienceYears).trim()
      : '0';
    const curCtcLpa = prof.currentCtcLpa !== undefined && prof.currentCtcLpa !== null && prof.currentCtcLpa !== ''
      ? String(prof.currentCtcLpa).trim()
      : '0';
    const noticeText = prof.noticePeriod !== undefined && prof.noticePeriod !== null && prof.noticePeriod !== ''
      ? String(prof.noticePeriod).trim()
      : 'Immediate';
    const noticeDays = prof.noticePeriodDays !== undefined && prof.noticePeriodDays !== null && prof.noticePeriodDays !== ''
      ? String(prof.noticePeriodDays).trim()
      : '0';

    const systemPrompt = `You are the AI Autopilot Form-Filling Decision Engine for candidate ${candidateName}.
Your objective is to evaluate form questions and decide the exact, optimal response based on the candidate's profile, skills, and resume/project context.

STRICT DECISION RULES:
1. STANDARD PROFILE ATTRIBUTES (Strict Data Extraction):
   - If the question asks for a standard personal, educational, professional, or social link attribute (e.g. Full Name, Email, Phone, Location, College, Degree, Graduation Year, CGPA/Percentage, Total Work Experience, Current Organization, Current Role, Current CTC, Expected CTC, Notice Period, LinkedIn URL, GitHub URL, Portfolio):
   - Extract the EXACT matching field from the Candidate Profile.
   - Enforce STRICT VALUE ONLY: Output ONLY the raw value with ZERO preamble, ZERO explanations, and ZERO quotes.
   - Critical Rules for Experience, CTC, and Notice Period:
     * TOTAL WORK EXPERIENCE -> "${expYears}" (DO NOT calculate from individual skill practice years. Use "${expYears}").
     * CURRENT CTC (LPA) -> "${curCtcLpa}" (Candidate is not currently employed or at ${curCtcLpa} LPA).
     * CURRENT CTC (INR digits) -> "${prof.currentCtcNumeric || '0'}".
     * EXPECTED CTC (LPA) -> "${prof.expectedCtcLpa || '10'}".
     * EXPECTED CTC (INR digits) -> "${prof.expectedCtcNumeric || '1000000'}".
     * NOTICE PERIOD (text) -> "${noticeText}".
     * NOTICE PERIOD (in days / numeric) -> "${noticeDays}".
     * Graduation year -> "${edu.graduationYear || '2025'}".
     * 10th Marks -> "${edu.tenthPercentageNumeric || edu.tenthPercentage || '92.5'}".

2. CHOICE QUESTIONS (Radio Buttons, Checkboxes, Dropdowns):
   - If 'options' list is provided:
   - For single-choice ('radio' / 'dropdown'): Select the SINGLE EXACT matching string from the 'options' list that represents the candidate's profile/skills/status.
   - For multi-choice ('checkbox'): Select an ARRAY of EXACT strings from the 'options' list matching the candidate's skills and experience.
   - ROLE & SENIORITY QUESTIONS (e.g. 'Which role are you applying for?'): Candidate's Total Work Experience is "${expYears}" years.
     * If candidate experience is 0-2 years: Choose ONLY the Junior / 0-2 yrs role tier (NEVER select Senior 3+ yrs).
     * If candidate experience is 3+ years: Choose Senior / 3+ yrs tier.
     * Candidate applies to ONLY ONE role tier matching their experience, even if rendered as checkboxes.
   - NEVER invent options outside the provided 'options' list.

3. OPEN-ENDED & ESSAY QUESTIONS:
   - PROJECT SPECIFIC QUESTIONS (ONLY when asked to explain/describe a project, architecture, technical achievement, or something built, e.g. 'explain a project', 'tell us about a project you built'):
     * You MUST explicitly NAME the Project Title / Repository Name from the Candidate Projects list in the opening sentence (e.g. 'In my project **[Exact Project Title / Repo Name]**, I developed...').
     * NEVER write vague openings like 'I worked on a project where I...' without explicitly citing the actual project title.
     * Ground every technical detail strictly in the candidate's actual projects, resume chunks, and listed skills.
   - NON-PROJECT OPEN-ENDED QUESTIONS (e.g. 'Why do you want to join us?', 'Tell us about yourself', 'What are your strengths?', 'Describe a challenge at work'):
     * Synthesize a concise, professional first-person ('I', 'my') response grounded in the candidate's background, skills, and values.
     * DO NOT force project titles into non-project questions where they are not asked for.
   - REVISION INSTRUCTIONS: If the user provides a custom instruction or comment, prioritize and follow the user's specific instruction precisely.

OUTPUT FORMAT:
You MUST respond with valid JSON strictly matching this schema:
{
  "decisionType": "strict_profile" | "choice_selection" | "rag_synthesis",
  "value": "string value" or ["array", "of", "options"],
  "confidence": 0.95
}`;

    let userPrompt = `CANDIDATE PRIMARY PROFILE FACTS (GROUND TRUTH):
- Full Name: "${pers.fullName || 'Alex Morgan'}"
- Email: "${pers.email || ''}"
- Phone: "${pers.phone || ''}"
- Location: "${pers.currentLocation || pers.city || ''}"
- College / University: "${edu.collegeName || ''}"
- Degree: "${edu.degree || ''}"
- Graduation Year: "${edu.graduationYear || '2025'}"
- Total Work Experience (Years): "${expYears}"
- Current Organization: "${prof.currentOrganization || 'NA'}"
- Current Role: "${prof.currentRole || 'NA'}"
- Current CTC (in LPA): "${curCtcLpa}"
- Expected CTC (in LPA): "${prof.expectedCtcLpa || '10'}"
- Expected Fixed Package (in INR): "${prof.expectedCtcNumeric || '1000000'}"
- Notice Period (Text): "${noticeText}"
- Notice Period (in Days): "${noticeDays}"
- Can Join Immediately: "${prof.canJoinImmediately || 'Yes'}"
- LinkedIn URL: "${links.linkedinUrl || links.linkedin || ''}"
- GitHub URL: "${links.githubUrl || links.github || ''}"
- Portfolio / Personal Website: "${links.portfolioUrl || links.portfolio || links.website || ''}"
- Project Demo URL: "${links.projectDemoUrl || links.projectDemo || ''}"
- Resume Link: "${links.resumeUrl || links.resume || ''}"

CANDIDATE PROJECT REPOSITORIES & TITLES (GROUND TRUTH):
${projectsSummary.length > 0 ? projectsSummary.map((p, i) => `${i + 1}. "${p}"`).join('\n') : 'Projects documented in resume RAG context below.'}

CANDIDATE PROFILE DATA (JSON):
\`\`\`json
${JSON.stringify(profileContext, null, 2)}
\`\`\`

RETRIEVED RESUME & PROJECT RAG CONTEXT:
${ragContextText || 'No external document chunks. Use candidate profile data.'}
`;

    if (formContext && (formContext.formTitle || formContext.formDescription)) {
      userPrompt += `\nFORM CONTEXT (APPLICATION CONTEXT):\n- Form Title: "${formContext.formTitle || 'Application Form'}"\n${formContext.formDescription ? `- Form Description: "${formContext.formDescription.slice(0, 500)}"\n` : ''}${formContext.allQuestions && formContext.allQuestions.length > 0 ? `- Other Questions in Form: ${JSON.stringify(formContext.allQuestions.slice(0, 10))}\n` : ''}`;
    }

    if (jobDescription && jobDescription.trim()) {
      userPrompt += `\nJOB DESCRIPTION ALIGNMENT CONTEXT:\n"""\n${jobDescription.trim().slice(0, 3000)}\n"""\n`;
    }

    userPrompt += `\nFORM QUESTION TO EVALUATE:
Question Text: "${question}"
Field Type: "${fieldType}"
Available Options: ${options && options.length > 0 ? JSON.stringify(options) : 'None (Text / Number input)'}
${customInstructions ? `Special User Instruction: "${customInstructions}"\n` : ''}
Determine the decisionType, extract or synthesize the value, and output ONLY valid JSON:`;

    try {
      const rawOutput = await provider.generate({
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        config: { ...config, temperature: 0.1, maxTokens: 1000 },
        signal: signal || config?.signal
      });

      // Parse JSON from output
      let parsed = this._extractJsonDecision(rawOutput, options, fieldType);
      if (!parsed && rawOutput && rawOutput.trim()) {
        const cleanText = rawOutput.trim().replace(/^["']|["']$/g, '');
        parsed = {
          decisionType: fieldType === 'checkbox' ? 'choice_selection' : (cleanText.length > 60 ? 'rag_synthesis' : 'strict_profile'),
          value: fieldType === 'checkbox' ? [cleanText] : cleanText,
          confidence: 0.90
        };
      }

      if (parsed) {
        // Ground decision against ProfileValidatorService to prevent hallucinations on profile facts
        const isNumericField = fieldType === 'number' || question.toLowerCase().includes('in numbers') || question.toLowerCase().includes('in days') || question.toLowerCase().includes('digits');
        const grounded = ProfileValidatorService.validateAndGroundDecision(
          question,
          parsed,
          profile,
          isNumericField,
          fieldType
        );
        return grounded;
      }
    } catch (err) {
      console.warn('[GFAF] AI question evaluation error:', err.message || err);
    }

    // Direct fallback grounded via ProfileValidatorService
    return ProfileValidatorService.validateAndGroundDecision(
      question,
      { decisionType: 'none', value: '', confidence: 0 },
      profile,
      fieldType === 'number',
      fieldType
    );
  }

  /**
   * Batch evaluate multiple form questions in a single fast LLM prompt
   */
  static async evaluateFormBatch({
    questions = [],
    profile,
    retrievedChunks = [],
    jobDescription = '',
    config: customConfig = null,
    signal = null
  }) {
    if (!questions || questions.length === 0 || !profile) {
      return [];
    }

    const savedConfig = await this.getConfig();
    const config = customConfig ? { ...savedConfig, ...customConfig } : savedConfig;
    const provider = this.getProvider(config.provider);

    const candidateName = profile.personal?.fullName || 'the candidate';
    const skillsList = (profile.skills || []).map((s) => (typeof s === 'object' && s !== null ? s.name : String(s))).join(', ');

    const profileContext = {
      personal: profile.personal || {},
      education: profile.education || {},
      professional: profile.professional || {},
      links: profile.links || {},
      skills: skillsList,
      customFields: profile.customFields || [],
      smartAnswers: (profile.smartAnswers || []).map((qa) => ({ q: qa.keywords?.join(', '), a: qa.answer }))
    };

    const deduplicatedChunks = deduplicateContextChunks(retrievedChunks);
    const ragContextText = deduplicatedChunks
      .map((c, i) => `[Source ${i + 1}: ${c.docTitle} - ${c.sectionTitle || 'General'}]\n${c.text}`)
      .join('\n\n');

    const systemPrompt = `You are the AI Autopilot Form Decision Engine.
Evaluate each form question and output a JSON array of decisions.
Enforce STRICT VALUES for profile attributes (Name, Email, Phone, College, Experience, CTC, Notice Period, URLs).`;

    const questionsPayload = questions.map((q, idx) => ({
      id: q.id !== undefined ? q.id : idx,
      question: q.questionText || q.question || '',
      fieldType: q.fieldType || (q.options && q.options.length > 0 ? (q.isMultiSelect ? 'checkbox' : 'radio') : 'text'),
      options: q.options || []
    }));

    const userPrompt = `CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

QUESTIONS:
${JSON.stringify(questions, null, 2)}

Output ONLY valid JSON array with decisions for each question id:`;

    try {
      const rawOutput = await provider.generate({
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        config: { ...config, temperature: 0.1, maxTokens: 2500 },
        signal: signal || config?.signal
      });

      const jsonMatch = rawOutput.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const parsedArray = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsedArray)) {
          return parsedArray.map((item) => {
            const originalQ = questions.find((q) => q.id === item.id);
            if (originalQ) {
              return ProfileValidatorService.validateAndGroundDecision(
                originalQ.question,
                item,
                profile,
                originalQ.fieldType === 'number',
                originalQ.fieldType
              );
            }
            return item;
          });
        }
      }
    } catch (err) {
      console.warn('[GFAF] Batch AI evaluation error:', err.message || err);
    }

    return [];
  }

  /**
   * AI Post-Validation & Constraint Correction Engine
   * Validates a field's filled value against dynamic form validation errors, min/max limits,
   * length restrictions, or reactive error messages reflected in the DOM.
   */
  static async validateAndCorrectEntry({
    question,
    currentValue,
    validationError = '',
    constraints = {},
    profile,
    config: customConfig = null,
    signal = null
  }) {
    const valStr = String(currentValue !== undefined && currentValue !== null ? currentValue : '').trim();

    // 1. Profile Ground Truth Check (Prevents experience / CTC / notice period mismatches)
    if (profile) {
      const profileValidation = ProfileValidatorService.validateFilledValue(question, valStr, profile);
      if (!profileValidation.isValid && profileValidation.correctedValue !== undefined) {
        return {
          isValid: false,
          correctedValue: profileValidation.correctedValue,
          reason: profileValidation.reason
        };
      }
    }

    // 2. Fast Deterministic Attribute Checks (Min / Max / MaxLength)
    if (constraints.max !== undefined && constraints.max !== null && constraints.max !== '') {
      const maxNum = parseFloat(constraints.max);
      const currNum = parseFloat(valStr);
      if (!isNaN(maxNum) && !isNaN(currNum) && currNum > maxNum) {
        return {
          isValid: false,
          correctedValue: String(maxNum),
          reason: `Value clamped to maximum limit (${maxNum})`
        };
      }
    }

    if (constraints.min !== undefined && constraints.min !== null && constraints.min !== '') {
      const minNum = parseFloat(constraints.min);
      const currNum = parseFloat(valStr);
      if (!isNaN(minNum) && !isNaN(currNum) && currNum < minNum) {
        return {
          isValid: false,
          correctedValue: String(minNum),
          reason: `Value raised to minimum limit (${minNum})`
        };
      }
    }

    if (constraints.maxlength && valStr.length > constraints.maxlength) {
      return {
        isValid: false,
        correctedValue: valStr.slice(0, constraints.maxlength),
        reason: `Value trimmed to max character length (${constraints.maxlength})`
      };
    }

    if (!validationError && !constraints.hasError) {
      return { isValid: true, correctedValue: valStr, reason: 'Valid entry' };
    }

    // 3. AI Semantic Error Correction
    const savedConfig = await this.getConfig();
    const config = customConfig ? { ...savedConfig, ...customConfig } : savedConfig;
    const provider = this.getProvider(config.provider);

    const systemPrompt = `You are the AI Form Post-Validation and Error Correction Engine.
A form input was filled with a value, but the form emitted an error message, warning, or failed a validation constraint.

YOUR OBJECTIVE:
Analyze the question, current value, the validation error, and constraints.
Determine the corrected value that strictly satisfies the form's requirement while accurately reflecting the candidate.

RULES:
1. If the error specifies numeric bounds (e.g., "Must be between 1 and 10", "Must be less than 50", "Must be greater than 0"):
   - Adjust the number to fit strictly within the allowed range.
2. If the error specifies format (e.g., "Must be a whole number", "Must be an integer"):
   - Convert to integer (e.g. 92.5 -> 92 or 0 for immediate notice period).
3. If the error specifies LPA vs INR (e.g., 1000000 entered when 10 LPA expected, or 10 entered when full INR expected):
   - Correct the unit scale appropriately.
4. Output STRICT CORRECTED VALUE without any extra text or conversational fluff.

OUTPUT FORMAT:
Respond with valid JSON:
{
  "isValid": false,
  "correctedValue": "exact corrected value",
  "reason": "short explanation of the fix"
}`;

    const prof = profile?.professional || {};
    const edu = profile?.education || {};

    const userPrompt = `QUESTION: "${question}"
CURRENT VALUE ENTERED: "${valStr}"
VALIDATION ERROR / CONSTRAINT FROM FORM: "${validationError}"
EXPLICIT ATTRIBUTES: ${JSON.stringify(constraints)}
CANDIDATE FACTS:
- Total Experience: ${prof.totalExperienceYears !== undefined && prof.totalExperienceYears !== '' ? prof.totalExperienceYears : '0'} year(s)
- Current CTC: ${prof.currentCtcLpa !== undefined && prof.currentCtcLpa !== '' ? prof.currentCtcLpa : '0'} LPA (${prof.currentCtcNumeric || '0'} INR)
- Expected CTC: ${prof.expectedCtcLpa || '10'} LPA (${prof.expectedCtcNumeric || '1000000'} INR)
- Notice Period: ${prof.noticePeriod || 'Immediate'} (${prof.noticePeriodDays || '0'} days)
- 10th Marks: ${edu.tenthPercentageNumeric || '92.5'}
- Graduation Year: ${edu.graduationYear || '2025'}

Determine the corrected value and output JSON:`;

    try {
      const rawOutput = await provider.generate({
        prompt: userPrompt,
        systemPrompt: systemPrompt,
        config: { ...config, temperature: 0.1, maxTokens: 400 },
        signal: signal || config?.signal
      });

      const jsonMatch = rawOutput.match(/\{[\s\S]*"correctedValue"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && parsed.correctedValue !== undefined) {
          return {
            isValid: false,
            correctedValue: String(parsed.correctedValue).trim(),
            reason: parsed.reason || 'AI post-validation correction applied'
          };
        }
      }
    } catch (err) {
      console.warn('[GFAF] AI post-validation error:', err.message || err);
    }

    // Fallback deterministic regex correction for standard numeric constraint errors
    const normErr = validationError.toLowerCase();
    if (normErr.includes('less than') || normErr.includes('maximum') || normErr.includes('at most')) {
      const limitMatch = normErr.match(/\b\d+(\.\d+)?\b/);
      if (limitMatch) {
        const limit = parseFloat(limitMatch[0]);
        const curr = parseFloat(valStr);
        if (!isNaN(curr) && curr > limit) {
          return { isValid: false, correctedValue: String(limit), reason: `Clamped to limit ${limit}` };
        }
      }
    }

    if (normErr.includes('greater than') || normErr.includes('minimum') || normErr.includes('at least')) {
      const limitMatch = normErr.match(/\b\d+(\.\d+)?\b/);
      if (limitMatch) {
        const limit = parseFloat(limitMatch[0]);
        const curr = parseFloat(valStr);
        if (!isNaN(curr) && curr < limit) {
          return { isValid: false, correctedValue: String(limit), reason: `Raised to limit ${limit}` };
        }
      }
    }

    if (normErr.includes('whole number') || normErr.includes('integer')) {
      const intVal = parseInt(valStr.replace(/\D/g, '') || '0', 10);
      return { isValid: false, correctedValue: String(intVal), reason: 'Converted to whole number' };
    }

    return { isValid: true, correctedValue: valStr, reason: 'Maintained current value' };
  }

  /**
   * Helper to safely extract JSON decision from LLM output
   */
  static _extractJsonDecision(rawText, options = [], fieldType = 'text') {
    if (!rawText || typeof rawText !== 'string') return null;

    try {
      // 1. Try direct JSON parse
      const trimmed = rawText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return JSON.parse(trimmed);
      }

      // 2. Try fenced markdown json block
      const mdJsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (mdJsonMatch && mdJsonMatch[1]) {
        return JSON.parse(mdJsonMatch[1].trim());
      }

      // 3. Try regex substring match for object
      const objMatch = rawText.match(/\{[\s\S]*"value"[\s\S]*\}/);
      if (objMatch) {
        return JSON.parse(objMatch[0]);
      }
    } catch (e) {}

    // 4. If options provided and rawText matches one of the options
    if (options && options.length > 0) {
      const cleanRaw = rawText.trim().toLowerCase().replace(/^["']|["']$/g, '');
      const matchedOpt = options.find((opt) => opt.toLowerCase() === cleanRaw || opt.toLowerCase().includes(cleanRaw) || cleanRaw.includes(opt.toLowerCase()));
      if (matchedOpt) {
        return {
          decisionType: 'choice_selection',
          value: fieldType === 'checkbox' ? [matchedOpt] : matchedOpt,
          confidence: 0.92
        };
      }
    }

    return null;
  }

  /**
   * Pre-warm / wake up local LLM model into VRAM / Memory
   */
  static async wakeUpModel(modelName = null) {
    const config = await this.getConfig();
    const providerName = config.provider || 'ollama';

    if (providerName === 'ollama') {
      const endpoint = (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
      const rawModel = (modelName || config.ollamaModel || 'gemma4:e4b').trim();
      const provider = this.getProvider('ollama');

      try {
        const model = await provider.resolveModel(endpoint, rawModel);
        // Pre-warm model in memory by generating 1 token with keep_alive
        const payload = {
          model: model,
          messages: [{ role: 'user', content: 'ping' }],
          stream: false,
          keep_alive: '10m',
          options: {
            num_predict: 1,
            temperature: 0.1
          }
        };

        await fetchViaProxyOrDirect(`${endpoint}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        return {
          success: true,
          model: model,
          provider: 'ollama',
          message: `Model "${model}" is awake & loaded in GPU / Memory!`
        };
      } catch (err) {
        return {
          success: false,
          model: rawModel,
          provider: 'ollama',
          message: `Ollama is offline at ${endpoint}. Run 'ollama serve' in your terminal.`
        };
      }
    } else {
      const provider = this.getProvider(providerName);
      const testRes = await provider.testConnection(config);
      return {
        success: testRes.success,
        model: config[`${providerName}Model`] || providerName,
        provider: providerName,
        message: testRes.message
      };
    }
  }
}

