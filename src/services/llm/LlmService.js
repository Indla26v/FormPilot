/**
 * LlmService - Multi-Provider LLM Orchestrator for RAG Generation
 * Follows Open/Closed Principle (OCP) and Strategy Pattern.
 * Supports: Local Ollama (Offline / Free), Google Gemini, OpenAI, and Anthropic Claude.
 */

import { StorageService } from '../StorageService.js';
import { SecurityGuardService } from '../security/SecurityGuardService.js';

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

  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    return new Promise((resolve, reject) => {
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }

      chrome.runtime.sendMessage({
        action: 'PROXY_FETCH',
        url: endpoint,
        options: options
      }, (res) => {
        if (chrome.runtime.lastError) {
          // Direct fetch fallback
          fetch(endpoint, options)
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
    const r = await fetch(endpoint, options);
    let data;
    try {
      data = typeof r.json === 'function' ? await r.json() : await r.text();
    } catch {
      data = await r.text();
    }
    if (!r.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    return data;
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
