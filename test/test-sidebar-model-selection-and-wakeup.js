/**
 * Test Suite: Sidebar Model Selection & Wake-Up Pre-Warming
 * Validates quick AI model switching and local LLM wake-up / memory pre-warming functionality.
 */

import { LlmService, DEFAULT_LLM_CONFIG } from '../src/services/llm/LlmService.js';
import { StorageService } from '../src/services/StorageService.js';

console.log('----------------------------------------------------');
console.log('TESTING SIDEBAR MODEL SELECTION & LOCAL LLM WAKE UP');
console.log('----------------------------------------------------\n');

// Mock localStorage for headless Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

// 1. Test Default Configuration & Model Resolution
console.log('Test 1: Testing initial LLM config retrieval...');
const initialConfig = await LlmService.getConfig();
if ((initialConfig.provider === 'builtin' || initialConfig.provider === 'ollama') && initialConfig.ollamaModel) {
  console.log(`[PASS] Default config loaded with provider: ${initialConfig.provider}, model: ${initialConfig.ollamaModel}`);
} else {
  console.error('[FAIL] Unexpected default config:', initialConfig);
  process.exit(1);
}

// 2. Test Switching Model to a Cloud Provider
console.log('\nTest 2: Switching model to Google Gemini via config update...');
const geminiConfig = {
  ...initialConfig,
  provider: 'gemini',
  geminiModel: 'gemini-1.5-flash',
  geminiApiKey: 'test-gemini-key-xyz'
};
await LlmService.saveConfig(geminiConfig);
const updatedConfig = await LlmService.getConfig();

if (updatedConfig.provider === 'gemini' && updatedConfig.geminiModel === 'gemini-1.5-flash') {
  console.log('[PASS] Config updated to Gemini provider & model successfully.');
} else {
  console.error('[FAIL] Gemini config save failed:', updatedConfig);
  process.exit(1);
}

// 3. Test Switching Model to Local Ollama with a custom model (e.g. deepseek-r1:8b)
console.log('\nTest 3: Switching model to local Ollama with deepseek-r1:8b...');
const ollamaConfig = {
  ...updatedConfig,
  provider: 'ollama',
  ollamaModel: 'deepseek-r1:8b',
  ollamaEndpoint: 'http://localhost:11434'
};
await LlmService.saveConfig(ollamaConfig);
const loadedOllamaConfig = await LlmService.getConfig();

if (loadedOllamaConfig.provider === 'ollama' && loadedOllamaConfig.ollamaModel === 'deepseek-r1:8b') {
  console.log('[PASS] Switched to local Ollama model deepseek-r1:8b.');
} else {
  console.error('[FAIL] Ollama config switch failed:', loadedOllamaConfig);
  process.exit(1);
}

// 4. Test LlmService.wakeUpModel method structure and graceful error handling
console.log('\nTest 4: Testing LlmService.wakeUpModel execution with mock responses...');

// Mock fetch for Ollama wake-up test
let fetchedUrl = null;
let fetchedPayload = null;
globalThis.fetch = async (url, options) => {
  fetchedUrl = url;
  fetchedPayload = JSON.parse(options.body || '{}');
  return {
    ok: true,
    status: 200,
    json: async () => ({
      message: { role: 'assistant', content: 'Ready' },
      done: true
    })
  };
};

const wakeUpResult = await LlmService.wakeUpModel('deepseek-r1:8b');

if (wakeUpResult.success && fetchedPayload.keep_alive === '10m' && fetchedPayload.model.includes('deepseek-r1')) {
  console.log('[PASS] Wake-up request dispatched pre-warming ping with keep_alive: "10m" successfully.');
} else {
  console.error('[FAIL] Wake-up pre-warming request failed:', wakeUpResult);
  process.exit(1);
}

// 5. Test Offline LLM Wake-Up Error Handling
console.log('\nTest 5: Testing offline LLM wake-up graceful handling...');
globalThis.fetch = async () => {
  throw new Error('ECONNREFUSED: Connection refused at 127.0.0.1:11434');
};

const offlineResult = await LlmService.wakeUpModel('llama3.2');
if (!offlineResult.success && offlineResult.message.includes('offline')) {
  console.log('[PASS] Offline LLM handled gracefully with helpful user error guidance.');
} else {
  console.error('[FAIL] Expected offline error guidance:', offlineResult);
  process.exit(1);
}

console.log('\n====================================================');
console.log('ALL SIDEBAR MODEL & WAKE UP TESTS PASSED (100%)');
console.log('====================================================\n');
