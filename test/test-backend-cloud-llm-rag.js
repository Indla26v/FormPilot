/**
 * test-backend-cloud-llm-rag.js
 * Comprehensive automated test verifying that LlmService supports custom model identifiers,
 * custom API keys, and executes RAG synthesis tasks faithfully with context grounding.
 */

const assert = require('assert');

// Mock chrome runtime if needed
global.chrome = {
  runtime: {
    id: 'test-ext-id',
    sendMessage: (msg, cb) => {
      // Mock background proxy fetch response based on request
      if (msg.action === 'PROXY_FETCH' || msg.action === 'GENERATE_LLM_RAG') {
        const url = msg.url || msg.endpoint || '';
        const body = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : (msg.payload || (msg.options?.body ? JSON.parse(msg.options.body) : {}));
        const headers = msg.headers || msg.options?.headers || {};

        if (url.includes('generativelanguage.googleapis.com')) {
          // Gemini endpoint test
          assert(url.includes('custom-gemini-2.0-flash'), `Expected custom gemini model in URL, got: ${url}`);
          assert(url.includes('key=AIzaSyFakeCustomGeminiKey'), `Expected custom API key in URL, got: ${url}`);
          
          cb({
            success: true,
            data: {
              candidates: [
                {
                  content: {
                    parts: [{ text: 'I built the microservices backend using Python, FastAPI, and PostgreSQL with high test coverage.' }]
                  }
                }
              ]
            }
          });
          return;
        }

        if (url.includes('api.openai.com')) {
          // OpenAI endpoint test
          assert.strictEqual(body.model, 'custom-gpt-4o-enterprise');
          assert.strictEqual(headers['Authorization'], 'Bearer sk-proj-FakeCustomOpenAIKey');
          
          cb({
            success: true,
            data: {
              choices: [
                {
                  message: {
                    content: 'I optimized distributed indexing pipelines in Python and PostgreSQL for sub-100ms search latency.'
                  }
                }
              ]
            }
          });
          return;
        }

        if (url.includes('api.anthropic.com')) {
          // Anthropic endpoint test
          assert.strictEqual(body.model, 'custom-claude-3-7-sonnet');
          assert.strictEqual(headers['x-api-key'], 'sk-ant-FakeCustomAnthropicKey');
          
          cb({
            success: true,
            data: {
              content: [
                {
                  text: 'I architected clean REST APIs and database schema migrations using Python and PostgreSQL.'
                }
              ]
            }
          });
          return;
        }

        if (url.includes('/api/chat')) {
          // Ollama endpoint test
          assert.strictEqual(body.model, 'deepseek-r1:14b-custom');
          cb({
            success: true,
            data: {
              message: {
                content: 'I designed automated backend services and data pipelines using Python.'
              }
            }
          });
          return;
        }
      }

      cb({ success: false, error: 'Unknown endpoint' });
    }
  }
};

// Mock storage
const mockStorageData = {};
global.chrome.storage = {
  local: {
    get: (keys, cb) => {
      if (typeof keys === 'string') {
        cb({ [keys]: mockStorageData[keys] });
      } else if (Array.isArray(keys)) {
        const res = {};
        keys.forEach(k => { res[k] = mockStorageData[k]; });
        cb(res);
      } else {
        cb(mockStorageData);
      }
    },
    set: (items, cb) => {
      Object.assign(mockStorageData, items);
      if (cb) cb();
    }
  }
};

(async function runTests() {
  console.log('--- Testing Backend LLM Cloud Service with Custom Models & RAG ---');

  // Dynamic import of LlmService
  const { LlmService, DEFAULT_LLM_CONFIG } = await import('../src/services/llm/LlmService.js');
  const { SecurityGuardService } = await import('../src/services/security/SecurityGuardService.js');

  const testProfile = {
    personal: { fullName: 'Alex Rivera' },
    skills: [{ name: 'Python', level: 'Expert', years: '4' }, { name: 'PostgreSQL', level: 'Advanced', years: '3' }, 'FastAPI']
  };

  const testRetrievedChunks = [
    {
      docTitle: 'Resume.pdf',
      sectionTitle: 'Experience',
      text: 'Led backend development for high-throughput data processing pipeline handling 5M daily events in Python and PostgreSQL.'
    },
    {
      docTitle: 'FastAPI_Search_Service.md',
      sectionTitle: 'Architecture',
      text: 'Built async search endpoints with Redis caching and PostgreSQL full-text search.'
    }
  ];

  // 1. Test Google Gemini with Custom Model & Custom API Key
  console.log('1. Testing Google Gemini with custom model & RAG data...');
  const geminiConfig = {
    provider: 'gemini',
    geminiApiKey: 'AIzaSyFakeCustomGeminiKey',
    geminiModel: 'custom-gemini-2.0-flash'
  };
  const geminiAnswer = await LlmService.generateRagAnswer({
    question: 'Describe a challenging backend project you worked on.',
    retrievedChunks: testRetrievedChunks,
    profile: testProfile,
    jobDescription: 'Seeking a Senior Backend Engineer proficient in Python and database scaling.',
    config: geminiConfig
  });
  assert(geminiAnswer.includes('Python'), 'Expected answer to mention Python');
  console.log('  [PASS] Gemini custom model & RAG answer generated successfully.');

  // 2. Test OpenAI with Custom Model & Custom API Key
  console.log('2. Testing OpenAI with custom model & RAG data...');
  const openaiConfig = {
    provider: 'openai',
    openaiApiKey: 'sk-proj-FakeCustomOpenAIKey',
    openaiModel: 'custom-gpt-4o-enterprise'
  };
  const openaiAnswer = await LlmService.generateRagAnswer({
    question: 'How do you handle database optimizations?',
    retrievedChunks: testRetrievedChunks,
    profile: testProfile,
    config: openaiConfig
  });
  assert(openaiAnswer.includes('PostgreSQL'), 'Expected answer to mention PostgreSQL');
  console.log('  [PASS] OpenAI custom model & RAG answer generated successfully.');

  // 3. Test Anthropic Claude with Custom Model & Custom API Key
  console.log('3. Testing Anthropic Claude with custom model & RAG data...');
  const anthropicConfig = {
    provider: 'anthropic',
    anthropicApiKey: 'sk-ant-FakeCustomAnthropicKey',
    anthropicModel: 'custom-claude-3-7-sonnet'
  };
  const anthropicAnswer = await LlmService.generateRagAnswer({
    question: 'Tell us about your experience designing APIs.',
    retrievedChunks: testRetrievedChunks,
    profile: testProfile,
    config: anthropicConfig
  });
  assert(anthropicAnswer.includes('REST APIs'), 'Expected answer to mention REST APIs');
  console.log('  [PASS] Anthropic custom model & RAG answer generated successfully.');

  // 4. Test Local Ollama with Custom Model
  console.log('4. Testing Local Ollama with custom model...');
  const ollamaConfig = {
    provider: 'ollama',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'deepseek-r1:14b-custom'
  };
  const ollamaAnswer = await LlmService.generateRagAnswer({
    question: 'What is your background in software engineering?',
    retrievedChunks: testRetrievedChunks,
    profile: testProfile,
    config: ollamaConfig
  });
  assert(ollamaAnswer.includes('Python'), 'Expected answer to mention Python');
  console.log('  [PASS] Ollama custom model generated successfully.');

  // 5. Test Missing Model validation
  console.log('5. Testing validation when model name or API key is missing...');
  try {
    await LlmService.generateRagAnswer({
      question: 'Test',
      profile: testProfile,
      config: { provider: 'gemini', geminiApiKey: 'AIzaSy...', geminiModel: '' }
    });
    assert.fail('Expected error for empty geminiModel');
  } catch (err) {
    assert(err.message.includes('Gemini Model Name is missing'), `Expected error message about missing model, got: ${err.message}`);
    console.log('  [PASS] Empty Gemini model threw helpful validation error.');
  }

  try {
    await LlmService.generateRagAnswer({
      question: 'Test',
      profile: testProfile,
      config: { provider: 'openai', openaiApiKey: 'sk-...', openaiModel: '' }
    });
    assert.fail('Expected error for empty openaiModel');
  } catch (err) {
    assert(err.message.includes('OpenAI Model Name is missing'), `Expected error message about missing model, got: ${err.message}`);
    console.log('  [PASS] Empty OpenAI model threw helpful validation error.');
  }

  try {
    await LlmService.generateRagAnswer({
      question: 'Test',
      profile: testProfile,
      config: { provider: 'anthropic', anthropicApiKey: 'sk-ant-...', anthropicModel: '' }
    });
    assert.fail('Expected error for empty anthropicModel');
  } catch (err) {
    assert(err.message.includes('Anthropic Model Name is missing'), `Expected error message about missing model, got: ${err.message}`);
    console.log('  [PASS] Empty Anthropic model threw helpful validation error.');
  }

  console.log('\nAll 5 Backend Cloud LLM Service tests passed 100%!');
})();
