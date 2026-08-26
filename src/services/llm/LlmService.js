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
  geminiModel: 'gemini-1.5-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-haiku-20241022',
  temperature: 0.3,
  maxTokens: 500
};

/**
 * Universal Proxy Request Handler (Bypasses browser extension CSP/Mixed-Content & handles timeouts)
 */
async function fetchViaProxyOrDirect(endpoint, options = {}) {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    return new Promise((resolve, reject) => {
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
class BaseLlmProvider {
  async generate({ prompt, systemPrompt, config }) {
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

  async testConnection(config) {
    const endpoint = (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const model = (config.ollamaModel || 'gemma4:e4b').trim();

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
          num_predict: 45,
          temperature: 0.2
        }
      };

      const data = await fetchViaProxyOrDirect(`${endpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const answer = data?.message?.content?.trim() || 'Model is ready.';

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

  async generate({ prompt, systemPrompt, config }) {
    const endpoint = (config.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const model = (config.ollamaModel || 'gemma4:e4b').trim();

    const payload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: config.temperature !== undefined ? config.temperature : 0.3,
        num_predict: config.maxTokens || 450
      }
    };

    const data = await fetchViaProxyOrDirect(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return data?.message?.content?.trim() || '';
  }
}

/**
 * Google Gemini Provider
 */
class GeminiProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.geminiApiKey) {
      return { success: false, message: 'Google Gemini API key is missing.' };
    }
    try {
      const model = config.geminiModel || 'gemini-1.5-flash';
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

  async generate({ prompt, systemPrompt, config }) {
    if (!config.geminiApiKey) throw new Error('Google Gemini API Key is required.');

    const model = config.geminiModel || 'gemini-1.5-flash';
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
      body: JSON.stringify(payload)
    });

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }
}

/**
 * OpenAI Provider
 */
class OpenAiProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.openaiApiKey) return { success: false, message: 'OpenAI API key is missing.' };
    try {
      const model = config.openaiModel || 'gpt-4o-mini';
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

  async generate({ prompt, systemPrompt, config }) {
    if (!config.openaiApiKey) throw new Error('OpenAI API Key is required.');

    const model = config.openaiModel || 'gpt-4o-mini';
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
      })
    });

    return data.choices?.[0]?.message?.content?.trim() || '';
  }
}

/**
 * Anthropic Claude Provider
 */
class AnthropicProvider extends BaseLlmProvider {
  async testConnection(config) {
    if (!config.anthropicApiKey) return { success: false, message: 'Anthropic API key is missing.' };
    try {
      const model = config.anthropicModel || 'claude-3-5-haiku-20241022';
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

  async generate({ prompt, systemPrompt, config }) {
    if (!config.anthropicApiKey) throw new Error('Anthropic API Key is required.');

    const model = config.anthropicModel || 'claude-3-5-haiku-20241022';
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
      })
    });

    return data.content?.[0]?.text?.trim() || '';
  }
}

/**
 * LLM Factory & Generation Orchestrator
 */
export class LlmService {
  static getProvider(providerName) {
    switch (providerName) {
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
  static async generateRagAnswer({ question, retrievedChunks, profile, customInstructions = '', conversationHistory = [], currentFieldValue = '', jobDescription = '' }) {
    const config = await this.getConfig();
    const provider = this.getProvider(config.provider);

    // Build structured context from retrieved chunks
    const contextText = (retrievedChunks || [])
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

    return await provider.generate({
      prompt: userPrompt,
      systemPrompt: systemPrompt,
      config: config
    });
  }
}
