/**
 * Service Worker (Background Script) for Google Forms Auto-Filler
 * Manifest V3 compliant with proxy fetching for Ollama, GitHub, and LLM APIs.
 */

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[GFAF] Extension installed/updated:', details.reason);

  // Setup context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'gfaf_fill_form',
      title: 'Auto-fill with GFAF',
      contexts: ['page', 'editable'],
      documentUrlPatterns: ['*://docs.google.com/forms/*', '*://forms.gle/*']
    });

    chrome.contextMenus.create({
      id: 'gfaf_open_options',
      title: 'Manage Candidate Profiles & Answers',
      contexts: ['action']
    });
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'gfaf_fill_form' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_AUTO_FILL' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[GFAF] Content script not ready:', chrome.runtime.lastError.message);
      }
    });
  } else if (info.menuItemId === 'gfaf_open_options') {
    chrome.runtime.openOptionsPage();
  }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'fill_form') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TRIGGER_AUTO_FILL' });
      }
    });
  }
});

// Strict allowlist of permissible proxy destination hosts (matching manifest host_permissions)
const ALLOWED_PROXY_HOSTS = new Set([
  'localhost:11434',
  '127.0.0.1:11434',
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.github.com',
  'raw.githubusercontent.com'
]);

function isAllowedProxyUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol === 'https:') {
      return ALLOWED_PROXY_HOSTS.has(parsed.host);
    }
    if (parsed.protocol === 'http:') {
      return parsed.host === 'localhost:11434' || parsed.host === '127.0.0.1:11434';
    }
    return false;
  } catch {
    return false;
  }
}

// Handle Message Routing & Proxy Fetching
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate sender
  if (sender && sender.id && sender.id !== chrome.runtime.id) {
    sendResponse({ success: false, error: 'Unauthorized sender origin' });
    return;
  }

  if (message.action === 'OPEN_OPTIONS_PAGE' || message.action === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  // Proxy fetch for GitHub READMEs
  if (message.action === 'FETCH_GITHUB_RAW') {
    if (!isAllowedProxyUrl(message.url) || !message.url.startsWith('https://raw.githubusercontent.com/')) {
      sendResponse({ success: false, error: 'Security violation: destination URL is not an allowed GitHub raw repository.' });
      return true;
    }

    fetch(message.url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        sendResponse({ success: true, text });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // Proxy Ollama / LLM API calls with strict host allowlist validation
  if (message.action === 'PROXY_FETCH' || message.action === 'GENERATE_LLM_RAG') {
    const endpoint = message.url || message.endpoint;
    
    if (!isAllowedProxyUrl(endpoint)) {
      sendResponse({ success: false, error: `Security violation: destination host is not in allowed proxy list.` });
      return true;
    }

    const options = message.options || {};
    
    if (message.payload && !options.body) {
      options.method = message.method || 'POST';
      options.headers = message.headers || { 'Content-Type': 'application/json' };
      options.body = typeof message.payload === 'string' ? message.payload : JSON.stringify(message.payload);
    }

    fetch(endpoint, options)
      .then(async (res) => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : await res.text();
        if (res.ok) {
          sendResponse({ success: true, status: res.status, data });
        } else {
          sendResponse({ success: false, status: res.status, error: data?.error?.message || data || `HTTP ${res.status}` });
        }
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
