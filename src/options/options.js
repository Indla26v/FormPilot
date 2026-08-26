/**
 * Options Dashboard Controller
 * Follows clean UI and SOLID structure.
 */

import { StorageService } from '../services/StorageService.js';
import { ICONS } from '../utils/svgIcons.js';
import { DEFAULT_PROFILE } from '../utils/constants.js';
import { DocumentParserService } from '../services/rag/DocumentParserService.js';
import { RagKnowledgeBaseService } from '../services/rag/RagKnowledgeBaseService.js';
import { LlmService, DEFAULT_LLM_CONFIG } from '../services/llm/LlmService.js';

let currentProfile = null;
let currentSettings = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inject SVG Icons into UI slots
  injectIcons();

  // 2. Initialize Navigation and Event Listeners
  initNavigation();

  // 3. Load Initial Data from Storage
  await loadProfilesAndSettings();

  // 4. Initialize RAG & AI Handlers
  await initRagHandlers();
  await initLlmHandlers();

  // 5. Bind Form & Actions
  initActionHandlers();
});

/**
 * Populate all SVG icon containers
 */
function injectIcons() {
  const safeSetIcon = (id, svg) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  };

  safeSetIcon('brand-badge-icon', ICONS.zap);
  safeSetIcon('icon-rename-profile', ICONS.edit);
  safeSetIcon('icon-duplicate', ICONS.layers);
  safeSetIcon('icon-new-profile', ICONS.plus);
  safeSetIcon('icon-delete-profile', ICONS.trash);

  safeSetIcon('nav-icon-personal', ICONS.user);
  safeSetIcon('nav-icon-education', ICONS.education);
  safeSetIcon('nav-icon-experience', ICONS.briefcase);
  safeSetIcon('nav-icon-links', ICONS.link);
  safeSetIcon('nav-icon-skills', ICONS.zap);
  safeSetIcon('nav-icon-rag', ICONS.database);
  safeSetIcon('nav-icon-llm', ICONS.bot);
  safeSetIcon('nav-icon-custom', ICONS.edit);
  safeSetIcon('nav-icon-settings', ICONS.settings);

  safeSetIcon('icon-save', ICONS.save);
  safeSetIcon('icon-add-skill', ICONS.plus);
  safeSetIcon('icon-add-custom', ICONS.plus);
  safeSetIcon('icon-export', ICONS.download);
  safeSetIcon('icon-import', ICONS.upload);
  safeSetIcon('global-toast-icon', ICONS.checkCircle);

  // RAG & LLM Icons
  safeSetIcon('icon-dropzone-upload', ICONS.upload);
  safeSetIcon('icon-github-fetch', ICONS.download);
  safeSetIcon('icon-clear-kb', ICONS.trash);
  safeSetIcon('icon-detect-models', ICONS.search);
  safeSetIcon('icon-test-llm', ICONS.zap);
  safeSetIcon('icon-save-llm', ICONS.save);
}

/**
 * Handle Tab Switching
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabTitle = document.getElementById('tab-title');
  const tabDesc = document.getElementById('tab-desc');

  const tabMeta = {
    'tab-personal': {
      title: 'Personal Details',
      desc: 'Configure candidate identity, contact details, and location.'
    },
    'tab-education': {
      title: 'Education & Marks',
      desc: 'Set up college name, graduation year, degree, and GPA / percentages (text & numbers).'
    },
    'tab-experience': {
      title: 'Experience & Compensation',
      desc: 'Set current employer, role, experience, notice period, and CTC expectations (e.g. 7-12 LPA and 700000).'
    },
    'tab-links': {
      title: 'Links & Portfolio',
      desc: 'Manage LinkedIn, GitHub, Portfolio website, and live project demo links.'
    },
    'tab-skills': {
      title: 'Skills & Tech Stack',
      desc: 'Interactive skill tags used to match multi-choice checkbox questions.'
    },
    'tab-rag': {
      title: 'Knowledge Base (RAG)',
      desc: 'Upload your resume and GitHub project READMEs to auto-synthesize factual answers for open-ended technical questions.'
    },
    'tab-llm': {
      title: 'AI & Local LLM Setup',
      desc: 'Connect to local Ollama (100% free & offline) or Google Gemini / OpenAI / Anthropic cloud APIs.'
    },
    'tab-custom': {
      title: 'Custom Fields',
      desc: 'Map custom question titles to exact answers.'
    },
    'tab-settings': {
      title: 'Settings & Backup',
      desc: 'Configure extension behavior and export/import database backups.'
    }
  };

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      navItems.forEach((i) => i.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');

      if (tabMeta[targetId]) {
        tabTitle.textContent = tabMeta[targetId].title;
        tabDesc.textContent = tabMeta[targetId].desc;
      }
    });
  });
}

/**
 * Load Active Profile and Populate Controls
 */
async function loadProfilesAndSettings() {
  const profiles = await StorageService.getProfiles();
  currentProfile = await StorageService.getActiveProfile();
  currentSettings = await StorageService.getSettings();

  // Populate profile selector
  const profileSelect = document.getElementById('active-profile-select');
  profileSelect.innerHTML = '';
  profiles.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    if (p.id === currentProfile.id) opt.selected = true;
    profileSelect.appendChild(opt);
  });

  // Populate Personal
  setVal('field-profileName', currentProfile.name);
  setVal('field-fullName', currentProfile.personal?.fullName);
  setVal('field-firstName', currentProfile.personal?.firstName);
  setVal('field-lastName', currentProfile.personal?.lastName);
  setVal('field-email', currentProfile.personal?.email);
  setVal('field-phone', currentProfile.personal?.phone);
  setVal('field-phoneDigits', currentProfile.personal?.phoneDigits);
  setVal('field-currentLocation', currentProfile.personal?.currentLocation);
  setVal('field-city', currentProfile.personal?.city);
  setVal('field-address', currentProfile.personal?.address);

  // Populate Education
  setVal('field-collegeName', currentProfile.education?.collegeName);
  setVal('field-degree', currentProfile.education?.degree);
  setVal('field-graduationYear', currentProfile.education?.graduationYear);
  setVal('field-graduationStatus', currentProfile.education?.graduationStatus);
  setVal('field-workingStatus', currentProfile.education?.workingStatus);
  setVal('field-tenthPercentage', currentProfile.education?.tenthPercentage);
  setVal('field-tenthPercentageNumeric', currentProfile.education?.tenthPercentageNumeric);
  setVal('field-twelfthPercentage', currentProfile.education?.twelfthPercentage);
  setVal('field-twelfthPercentageNumeric', currentProfile.education?.twelfthPercentageNumeric);
  setVal('field-graduationCgpa', currentProfile.education?.graduationCgpa);
  setVal('field-graduationCgpaNumeric', currentProfile.education?.graduationCgpaNumeric);

  // Populate Experience
  setVal('field-currentOrganization', currentProfile.professional?.currentOrganization);
  setVal('field-currentRole', currentProfile.professional?.currentRole);
  setVal('field-totalExperienceYears', currentProfile.professional?.totalExperienceYears);
  setVal('field-noticePeriod', currentProfile.professional?.noticePeriod);
  setVal('field-noticePeriodDays', currentProfile.professional?.noticePeriodDays || '0');
  setVal('field-canJoinImmediately', currentProfile.professional?.canJoinImmediately);
  setVal('field-hoursCommitmentConfirmed', currentProfile.professional?.hoursCommitmentConfirmed);
  setVal('field-currentCtc', currentProfile.professional?.currentCtc);
  setVal('field-currentCtcNumeric', currentProfile.professional?.currentCtcNumeric);
  setVal('field-expectedCtc', currentProfile.professional?.expectedCtc);
  setVal('field-expectedCtcNumeric', currentProfile.professional?.expectedCtcNumeric);
  setVal('field-stipendExpectation', currentProfile.professional?.stipendExpectation);
  setVal('field-stipendExpectationNumeric', currentProfile.professional?.stipendExpectationNumeric);

  // Populate Links
  setVal('field-linkedinUrl', currentProfile.links?.linkedinUrl);
  setVal('field-githubUrl', currentProfile.links?.githubUrl);
  setVal('field-portfolioUrl', currentProfile.links?.portfolioUrl);
  setVal('field-projectDemoUrl', currentProfile.links?.projectDemoUrl);
  setVal('field-resumeUrl', currentProfile.links?.resumeUrl);

  // Render Skills
  renderSkills();

  // Render Custom Fields
  renderCustomFields();

  // Populate Settings
  document.getElementById('setting-autoHighlight').checked = currentSettings.autoHighlight !== false;
  document.getElementById('setting-showFloatingWidget').checked = currentSettings.showFloatingWidget !== false;
  document.getElementById('setting-autoFillRadioCheckboxes').checked = currentSettings.autoFillRadioCheckboxes !== false;
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.tagName === 'SELECT' && val) {
    const exists = Array.from(el.options).some((opt) => opt.value === val);
    if (!exists) {
      const newOpt = document.createElement('option');
      newOpt.value = val;
      newOpt.textContent = val;
      el.appendChild(newOpt);
    }
  }
  el.value = val !== undefined && val !== null ? val : '';
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function normalizeSkillObj(skill) {
  if (typeof skill === 'object' && skill !== null) {
    let rating = parseFloat(skill.rating);
    if (isNaN(rating) || rating <= 0) {
      const lvl = (skill.level || 'Intermediate').toLowerCase();
      if (lvl.includes('expert')) rating = 10;
      else if (lvl.includes('advanced')) rating = 8;
      else if (lvl.includes('intermediate')) rating = 6;
      else rating = 3;
    }
    return {
      name: skill.name || '',
      years: skill.years || '',
      level: skill.level || 'Intermediate',
      rating: Math.min(10, Math.max(1, Math.round(rating)))
    };
  }
  return {
    name: String(skill || ''),
    years: '',
    level: 'Intermediate',
    rating: 6
  };
}

/**
 * Render Skills Tag Pills with Experience, 1-10 Rating Scale, and Proficiency
 */
function renderSkills() {
  const container = document.getElementById('skill-tags-container');
  container.innerHTML = '';

  const skills = currentProfile.skills || [];
  skills.forEach((skill, index) => {
    const s = normalizeSkillObj(skill);
    if (!s.name) return;

    const pill = document.createElement('div');
    pill.className = 'skill-pill';
    pill.innerHTML = `
      <span class="skill-name">${escapeHtml(s.name)}</span>
      ${s.years ? `<span class="skill-badge-years">${escapeHtml(s.years)}</span>` : ''}
      <span class="skill-badge-rating" title="Proficiency Rating: ${s.rating}/10">${s.rating}/10</span>
      <span class="skill-badge-level level-${s.level.toLowerCase()}">${escapeHtml(s.level)}</span>
      <button type="button" class="skill-remove-btn" data-index="${index}" title="Remove skill">
        ${ICONS.close}
      </button>
    `;

    pill.querySelector('.skill-remove-btn').addEventListener('click', () => {
      currentProfile.skills.splice(index, 1);
      renderSkills();
    });

    container.appendChild(pill);
  });
}

/**
 * Render Custom Fields
 */
function renderCustomFields() {
  const container = document.getElementById('custom-fields-container');
  container.innerHTML = '';

  const customFields = currentProfile.customFields || [];
  customFields.forEach((field, index) => {
    const row = document.createElement('div');
    row.className = 'custom-field-row';
    row.innerHTML = `
      <input type="text" class="form-input cf-key-input" value="${escapeHtml(field.key || '')}" placeholder="Form Question / Field Name" />
      <input type="text" class="form-input cf-val-input" value="${escapeHtml(field.value || '')}" placeholder="Answer to fill" />
      <button type="button" class="pill-btn-small pill-btn-danger-ghost cf-delete-btn" data-index="${index}" title="Delete Custom Field">
        ${ICONS.trash}
      </button>
    `;

    row.querySelector('.cf-delete-btn').addEventListener('click', () => {
      currentProfile.customFields.splice(index, 1);
      renderCustomFields();
    });

    row.querySelector('.cf-key-input').addEventListener('input', (e) => {
      field.key = e.target.value;
    });

    row.querySelector('.cf-val-input').addEventListener('input', (e) => {
      field.value = e.target.value;
    });

    container.appendChild(row);
  });
}

// ----------------------------------------------------
// RAG KNOWLEDGE BASE HANDLERS
// ----------------------------------------------------
async function initRagHandlers() {
  const dropzone = document.getElementById('rag-dropzone');
  const fileInput = document.getElementById('input-resume-file');
  const fetchGithubBtn = document.getElementById('btn-fetch-github');
  const githubInput = document.getElementById('input-github-url');
  const clearKbBtn = document.getElementById('btn-clear-knowledge-base');

  // Click dropzone to browse
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleResumeFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await handleResumeFileUpload(e.target.files[0]);
        fileInput.value = '';
      }
    });
  }

  // GitHub README Fetcher
  if (fetchGithubBtn && githubInput) {
    fetchGithubBtn.addEventListener('click', async () => {
      const url = githubInput.value.trim();
      if (!url) {
        showToast('Please enter a valid GitHub repository URL.', 'error');
        return;
      }

      fetchGithubBtn.disabled = true;
      fetchGithubBtn.innerHTML = `<span>Fetching...</span>`;

      try {
        const doc = await DocumentParserService.fetchGitHubReadme(url);
        await RagKnowledgeBaseService.addDocument(doc);
        githubInput.value = '';
        await renderRagDocuments();
        showToast(`Indexed "${doc.title}" with ${doc.chunkCount} knowledge chunks!`, 'success');
      } catch (err) {
        showToast(`GitHub fetch error: ${err.message}`, 'error');
      } finally {
        fetchGithubBtn.disabled = false;
        fetchGithubBtn.innerHTML = `<span class="btn-icon">${ICONS.download}</span><span>Fetch & Ingest README</span>`;
      }
    });
  }

  // Clear Knowledge Base
  if (clearKbBtn) {
    clearKbBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all indexed documents from the Knowledge Base?')) {
        await RagKnowledgeBaseService.clearKnowledgeBase();
        await renderRagDocuments();
        showToast('Knowledge Base cleared.', 'info');
      }
    });
  }

  // Initial render of documents
  await renderRagDocuments();
}

async function handleResumeFileUpload(file) {
  try {
    showToast(`Parsing ${file.name}...`, 'info');
    const doc = await DocumentParserService.parseFile(file);
    await RagKnowledgeBaseService.addDocument(doc);
    await renderRagDocuments();
    showToast(`Indexed "${doc.title}" with ${doc.chunkCount} knowledge chunks!`, 'success');
  } catch (err) {
    showToast(`Error processing file: ${err.message}`, 'error');
  }
}

async function renderRagDocuments() {
  const container = document.getElementById('docs-list-container');
  if (!container) return;

  const docs = await RagKnowledgeBaseService.getDocuments();
  container.innerHTML = '';

  if (docs.length === 0) {
    container.innerHTML = `<div class="empty-state">No documents ingested yet. Upload a resume or add a GitHub repo above.</div>`;
    return;
  }

  docs.forEach((doc) => {
    const card = document.createElement('div');
    card.className = 'doc-item-card';

    const typeBadgeClass = doc.type === 'pdf' ? 'badge-pdf' : doc.type === 'github_readme' ? 'badge-github' : 'badge-doc';
    const typeLabel = doc.type === 'pdf' ? 'Resume PDF' : doc.type === 'github_readme' ? 'GitHub Repo' : 'Document';

    card.innerHTML = `
      <div class="doc-item-left">
        <span class="doc-type-badge ${typeBadgeClass}">${typeLabel}</span>
        <div>
          <div class="doc-meta-title">${escapeHtml(doc.title)}</div>
          <div class="doc-meta-sub">${doc.chunkCount || 0} indexed chunks • Added on ${new Date(doc.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="doc-item-actions">
        <button type="button" class="pill-btn-small pill-btn-danger-ghost doc-delete-btn" title="Delete document">
          ${ICONS.trash}
        </button>
      </div>
    `;

    card.querySelector('.doc-delete-btn').addEventListener('click', async () => {
      await RagKnowledgeBaseService.deleteDocument(doc.id);
      await renderRagDocuments();
      showToast(`Removed "${doc.title}"`);
    });

    container.appendChild(card);
  });
}

// ----------------------------------------------------
// AI & LOCAL LLM SETUP HANDLERS
// ----------------------------------------------------
async function initLlmHandlers() {
  const config = await LlmService.getConfig();

  // Populate fields
  setVal('llm-ollamaEndpoint', config.ollamaEndpoint || 'http://localhost:11434');
  setVal('llm-ollamaModel', config.ollamaModel || 'llama3.2');
  setVal('llm-geminiApiKey', config.geminiApiKey || '');
  setVal('llm-geminiModel', config.geminiModel || 'gemini-1.5-flash');
  setVal('llm-openaiApiKey', config.openaiApiKey || '');
  setVal('llm-openaiModel', config.openaiModel || 'gpt-4o-mini');
  setVal('llm-anthropicApiKey', config.anthropicApiKey || '');
  setVal('llm-anthropicModel', config.anthropicModel || 'claude-3-5-haiku-20241022');

  // Provider switcher
  const providerCards = document.querySelectorAll('.provider-radio-card');
  const providerGroups = {
    ollama: document.getElementById('fields-ollama'),
    gemini: document.getElementById('fields-gemini'),
    openai: document.getElementById('fields-openai'),
    anthropic: document.getElementById('fields-anthropic')
  };
  const providerTitle = document.getElementById('provider-settings-title');

  function updateProviderView(providerName) {
    providerCards.forEach((card) => {
      const isSelected = card.getAttribute('data-provider') === providerName;
      card.classList.toggle('active', isSelected);
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = isSelected;
    });

    Object.keys(providerGroups).forEach((p) => {
      if (providerGroups[p]) {
        providerGroups[p].classList.toggle('hidden', p !== providerName);
      }
    });

    const titles = {
      ollama: 'Ollama Settings (Local Offline)',
      gemini: 'Google Gemini Cloud Settings',
      openai: 'OpenAI Cloud Settings',
      anthropic: 'Anthropic Claude Cloud Settings'
    };
    if (providerTitle) providerTitle.textContent = titles[providerName] || 'AI Provider Settings';
  }

  updateProviderView(config.provider || 'ollama');

  providerCards.forEach((card) => {
    card.addEventListener('click', () => {
      const pName = card.getAttribute('data-provider');
      updateProviderView(pName);
    });
  });

  // Custom Ollama Model Dropdown (Only displays models detected on the machine)
  const modelWrapper = document.getElementById('wrapper-ollama-model');
  const modelTrigger = document.getElementById('trigger-ollama-model');
  const modelHiddenInput = document.getElementById('llm-ollamaModel');
  const modelText = document.getElementById('text-ollama-model');
  const modelDropdown = document.getElementById('dropdown-ollama-model');

  function renderOllamaModels(models, selectedModel = '') {
    if (!modelDropdown) return;
    modelDropdown.innerHTML = '';

    if (!models || models.length === 0) {
      modelDropdown.innerHTML = `<div class="custom-select-empty-state">No models detected on machine.<br/>Run <code>ollama pull llama3.2</code> and click Detect Models.</div>`;
      return;
    }

    const currentVal = selectedModel || modelHiddenInput?.value || models[0];

    models.forEach((m) => {
      const opt = document.createElement('div');
      opt.className = `custom-select-option ${m === currentVal ? 'selected' : ''}`;
      opt.setAttribute('data-value', m);
      opt.setAttribute('role', 'option');
      opt.innerHTML = `
        <div class="model-option-content">
          <span class="model-option-name">${escapeHtml(m)}</span>
          <span class="model-option-badge">Installed</span>
        </div>
      `;

      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        if (modelHiddenInput) modelHiddenInput.value = m;
        if (modelText) modelText.textContent = m;

        modelDropdown.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');

        if (modelWrapper) {
          modelWrapper.classList.remove('open');
          modelTrigger?.setAttribute('aria-expanded', 'false');
        }
      });

      modelDropdown.appendChild(opt);
    });

    const activeModel = models.includes(currentVal) ? currentVal : models[0];
    if (modelHiddenInput) modelHiddenInput.value = activeModel;
    if (modelText) modelText.textContent = activeModel;
  }

  if (modelWrapper && modelTrigger) {
    modelTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      modelWrapper.classList.toggle('open');
      modelTrigger.setAttribute('aria-expanded', modelWrapper.classList.contains('open'));
    });

    document.addEventListener('click', (e) => {
      if (!modelWrapper.contains(e.target)) {
        modelWrapper.classList.remove('open');
        modelTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Initial load: Auto-detect installed local models from Ollama
  const initialEndpoint = getVal('llm-ollamaEndpoint') || config.ollamaEndpoint || 'http://localhost:11434';
  const initialSavedModel = config.ollamaModel || 'llama3.2';
  if (modelHiddenInput) modelHiddenInput.value = initialSavedModel;
  if (modelText) modelText.textContent = initialSavedModel;

  LlmService.listOllamaModels(initialEndpoint)
    .then((detected) => {
      if (detected && detected.length > 0) {
        renderOllamaModels(detected, initialSavedModel);
      } else {
        renderOllamaModels([initialSavedModel], initialSavedModel);
      }
    })
    .catch(() => {
      renderOllamaModels([initialSavedModel], initialSavedModel);
    });

  // Detect Ollama Models button
  const detectBtn = document.getElementById('btn-detect-ollama');
  if (detectBtn) {
    detectBtn.addEventListener('click', async () => {
      detectBtn.disabled = true;
      detectBtn.innerHTML = `<span>Scanning...</span>`;
      try {
        const endpoint = getVal('llm-ollamaEndpoint') || 'http://localhost:11434';
        const models = await LlmService.listOllamaModels(endpoint);
        if (models && models.length > 0) {
          renderOllamaModels(models, modelHiddenInput?.value);
          showToast(`Detected ${models.length} installed model(s) and loaded into dropdown!`, 'success');
        } else {
          renderOllamaModels([], '');
          showToast('Connected to Ollama, but no installed models found. Run `ollama pull llama3.2` in terminal.', 'info');
        }
      } catch (err) {
        showToast(`Could not connect to Ollama: ${err.message}. Ensure Ollama is running at ${getVal('llm-ollamaEndpoint')}`, 'error');
      } finally {
        detectBtn.disabled = false;
        detectBtn.innerHTML = `<span class="btn-icon">${ICONS.search}</span><span>Detect Models</span>`;
      }
    });
  }

  // Test Connection button
  const testBtn = document.getElementById('btn-test-llm');
  const statusBanner = document.getElementById('llm-test-status');

  if (testBtn && statusBanner) {
    testBtn.addEventListener('click', async () => {
      testBtn.disabled = true;
      testBtn.innerHTML = `<span>Testing (loading model into memory)...</span>`;
      statusBanner.classList.add('hidden');

      const activeProvider = document.querySelector('.provider-radio-card.active')?.getAttribute('data-provider') || 'ollama';
      const testConfig = {
        provider: activeProvider,
        ollamaEndpoint: getVal('llm-ollamaEndpoint'),
        ollamaModel: getVal('llm-ollamaModel'),
        geminiApiKey: getVal('llm-geminiApiKey'),
        geminiModel: getVal('llm-geminiModel'),
        openaiApiKey: getVal('llm-openaiApiKey'),
        openaiModel: getVal('llm-openaiModel'),
        anthropicApiKey: getVal('llm-anthropicApiKey'),
        anthropicModel: getVal('llm-anthropicModel')
      };

      const result = await LlmService.testConnection(testConfig);
      statusBanner.className = `status-banner ${result.success ? 'status-banner-success' : 'status-banner-error'}`;
      
      let html = `<div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(result.message)}</div>`;
      if (result.modelResponse) {
        html += `
          <div style="margin-top: 8px; padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 8px; border-left: 3px solid #10b981; font-family: monospace; font-size: 12px; color: #f8fafc;">
            <span style="display: block; font-weight: 700; color: #a5b4fc; margin-bottom: 2px; font-family: sans-serif;">Live Model Answer:</span>
            "${escapeHtml(result.modelResponse)}"
          </div>
        `;
      }
      statusBanner.innerHTML = html;
      statusBanner.classList.remove('hidden');

      testBtn.disabled = false;
      testBtn.innerHTML = `<span class="btn-icon">${ICONS.zap}</span><span>Test Connection</span>`;
    });
  }

  // Save AI Config button
  const saveLlmBtn = document.getElementById('btn-save-llm');
  if (saveLlmBtn) {
    saveLlmBtn.addEventListener('click', async () => {
      const activeProvider = document.querySelector('.provider-radio-card.active')?.getAttribute('data-provider') || 'ollama';
      const updatedConfig = {
        provider: activeProvider,
        ollamaEndpoint: getVal('llm-ollamaEndpoint'),
        ollamaModel: getVal('llm-ollamaModel'),
        geminiApiKey: getVal('llm-geminiApiKey'),
        geminiModel: getVal('llm-geminiModel'),
        openaiApiKey: getVal('llm-openaiApiKey'),
        openaiModel: getVal('llm-openaiModel'),
        anthropicApiKey: getVal('llm-anthropicApiKey'),
        anthropicModel: getVal('llm-anthropicModel')
      };

      await LlmService.saveConfig(updatedConfig);
      showToast('AI Configuration saved successfully!', 'success');
    });
  }
}

/**
 * Main Actions: Save, Profile Switch, Import/Export
 */
function initActionHandlers() {
  // Save All
  document.getElementById('btn-save-all').addEventListener('click', saveCurrentProfile);

  // Add Skill Tag with Experience, 1-10 Scale Rating, and Proficiency
  const skillInput = document.getElementById('input-new-skill') || document.getElementById('new-skill-input');
  const yearsInput = document.getElementById('input-skill-years');
  const ratingInput = document.getElementById('input-skill-rating');
  const levelSelect = document.getElementById('select-skill-level');
  const addSkillBtn = document.getElementById('btn-add-skill');

  const addSkill = () => {
    if (!skillInput) return;
    const name = skillInput.value.trim();
    const years = yearsInput ? yearsInput.value.trim() : '';
    const level = levelSelect ? levelSelect.value : 'Advanced';
    const rating = ratingInput ? parseInt(ratingInput.value, 10) || 8 : 8;

    if (name) {
      if (!currentProfile.skills) currentProfile.skills = [];
      const existingIdx = currentProfile.skills.findIndex((s) => {
        const sName = typeof s === 'object' && s !== null ? s.name : s;
        return (sName || '').toLowerCase() === name.toLowerCase();
      });

      const newSkillObj = { name, years, level, rating };
      if (existingIdx >= 0) {
        currentProfile.skills[existingIdx] = newSkillObj;
      } else {
        currentProfile.skills.push(newSkillObj);
      }

      renderSkills();
      skillInput.value = '';
      if (yearsInput) yearsInput.value = '';
      skillInput.focus();
    }
  };

  if (addSkillBtn && skillInput) {
    addSkillBtn.addEventListener('click', addSkill);
    skillInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
    });
    if (yearsInput) {
      yearsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkill();
        }
      });
    }
    if (ratingInput) {
      ratingInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSkill();
        }
      });
      ratingInput.addEventListener('input', () => {
        const val = parseInt(ratingInput.value, 10);
        if (!isNaN(val)) {
          let lvl = 'Intermediate';
          if (val >= 9) lvl = 'Expert';
          else if (val >= 7) lvl = 'Advanced';
          else if (val >= 5) lvl = 'Intermediate';
          else lvl = 'Beginner';

          if (levelSelect) levelSelect.value = lvl;
          const textEl = document.getElementById('text-skill-level');
          if (textEl) textEl.textContent = lvl;

          const options = document.querySelectorAll('#dropdown-skill-level .custom-select-option');
          options.forEach((o) => o.classList.toggle('selected', o.getAttribute('data-value') === lvl));
        }
      });
    }
  }

  // Custom Skill Level Dropdown Handler
  const skillWrapper = document.getElementById('wrapper-skill-level');
  const skillTrigger = document.getElementById('trigger-skill-level');
  const skillHiddenInput = document.getElementById('select-skill-level');
  const skillText = document.getElementById('text-skill-level');

  if (skillWrapper && skillTrigger) {
    skillTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      skillWrapper.classList.toggle('open');
      skillTrigger.setAttribute('aria-expanded', skillWrapper.classList.contains('open'));
    });

    const options = skillWrapper.querySelectorAll('.custom-select-option');
    options.forEach((opt) => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value');
        const defaultRating = opt.getAttribute('data-default-rating');

        if (skillHiddenInput) skillHiddenInput.value = val;
        if (skillText) skillText.textContent = val;
        if (ratingInput && defaultRating) ratingInput.value = defaultRating;

        options.forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');

        skillWrapper.classList.remove('open');
        skillTrigger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (e) => {
      if (!skillWrapper.contains(e.target)) {
        skillWrapper.classList.remove('open');
        skillTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Add Custom Field
  document.getElementById('btn-add-custom-field')?.addEventListener('click', () => {
    currentProfile.customFields.push({ key: '', value: '' });
    renderCustomFields();
  });

  // Active Profile Selector in Sidebar
  document.getElementById('active-profile-select')?.addEventListener('change', async (e) => {
    await StorageService.setActiveProfileId(e.target.value);
    await loadProfilesAndSettings();
    showToast('Switched profile');
  });

  // Rename Profile (Sanitized)
  const renameBtn = document.getElementById('btn-rename-profile');
  if (renameBtn) {
    renameBtn.addEventListener('click', async () => {
      const rawName = prompt('Enter new name for this profile:', currentProfile.name);
      if (rawName) {
        const cleanName = rawName.replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
        if (cleanName && cleanName !== currentProfile.name) {
          currentProfile.name = cleanName;
          await StorageService.saveProfile(currentProfile);
          await loadProfilesAndSettings();
          showToast(`Profile renamed to "${currentProfile.name}"!`);
        }
      }
    });
  }

  // Duplicate Profile (Sanitized)
  document.getElementById('btn-duplicate-profile')?.addEventListener('click', async () => {
    const rawName = prompt('Enter name for duplicate profile:', `${currentProfile.name} (Copy)`);
    if (rawName) {
      const cleanName = rawName.replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
      if (cleanName) {
        const cloned = JSON.parse(JSON.stringify(currentProfile));
        cloned.id = `profile_${Date.now()}`;
        cloned.name = cleanName;
        await StorageService.saveProfile(cloned);
        await StorageService.setActiveProfileId(cloned.id);
        await loadProfilesAndSettings();
        showToast(`Created "${cleanName}"`);
      }
    }
  });

  // New Profile (Sanitized)
  document.getElementById('btn-new-profile')?.addEventListener('click', async () => {
    const rawName = prompt('Enter profile name:', 'New Profile');
    if (rawName) {
      const cleanName = rawName.replace(/<[^>]*>?/gm, '').trim().slice(0, 100);
      if (cleanName) {
        const newP = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
        newP.id = `profile_${Date.now()}`;
        newP.name = cleanName;
        await StorageService.saveProfile(newP);
        await StorageService.setActiveProfileId(newP.id);
        await loadProfilesAndSettings();
        showToast(`Created profile "${cleanName}"`);
      }
    }
  });

  // Delete Profile
  document.getElementById('btn-delete-profile')?.addEventListener('click', async () => {
    const profiles = await StorageService.getProfiles();
    if (profiles.length <= 1) {
      showToast('Cannot delete the last remaining profile.', 'error');
      return;
    }
    if (confirm(`Delete profile "${currentProfile.name}"?`)) {
      await StorageService.deleteProfile(currentProfile.id);
      await loadProfilesAndSettings();
      showToast('Profile deleted');
    }
  });

  // Export Safe JSON Backup (API keys redacted by default)
  const exportBtn = document.getElementById('btn-export-backup');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const jsonStr = await StorageService.exportBackup({ includeApiKeys: false });
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GFAF_Safe_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Safe JSON backup exported (API keys redacted)!');
      } catch (err) {
        showToast(`Export failed: ${err.message}`, 'error');
      }
    });
  }

  // Export Password-Protected Encrypted Backup (.gfaf.enc)
  const exportEncBtn = document.getElementById('btn-export-encrypted');
  if (exportEncBtn) {
    exportEncBtn.addEventListener('click', async () => {
      try {
        const passphrase = prompt('Enter a secure password to encrypt this backup:');
        if (!passphrase || passphrase.length < 4) {
          showToast('Password must be at least 4 characters.', 'error');
          return;
        }

        const encryptedData = await StorageService.exportEncryptedBackup(passphrase, { includeApiKeys: true });
        const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GFAF_Encrypted_Backup_${new Date().toISOString().slice(0, 10)}.gfaf.enc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('AES-256 password-protected backup exported!');
      } catch (err) {
        showToast(`Encrypted export failed: ${err.message}`, 'error');
      }
    });
  }

  // Import Backup (Supports standard JSON & Encrypted .gfaf.enc)
  const importInput = document.getElementById('input-import-file');
  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const isEncrypted = file.name.endsWith('.enc') || file.name.endsWith('.gfaf.enc');
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target.result;
          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch {}

          if (isEncrypted || (parsed && parsed.alg === 'AES-GCM-256')) {
            const passphrase = prompt('This backup is password-protected. Enter decryption password:');
            if (!passphrase) {
              showToast('Decryption cancelled.', 'error');
              importInput.value = '';
              return;
            }
            await StorageService.importEncryptedBackup(content, passphrase);
          } else {
            await StorageService.importBackup(content);
          }

          await loadProfilesAndSettings();
          await renderRagDocuments();
          await initLlmHandlers();
          importInput.value = '';
          showToast('Backup verified and imported successfully!');
        } catch (err) {
          showToast(`Import failed: ${err.message}`, 'error');
          importInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }
}

/**
 * Save Current Profile Form Data
 */
async function saveCurrentProfile() {
  if (!currentProfile) return;

  const editedProfileName = getVal('field-profileName');
  if (editedProfileName && editedProfileName.trim()) {
    currentProfile.name = editedProfileName.trim();
  }

  currentProfile.personal = {
    fullName: getVal('field-fullName'),
    firstName: getVal('field-firstName'),
    lastName: getVal('field-lastName'),
    email: getVal('field-email'),
    phone: getVal('field-phone'),
    phoneDigits: getVal('field-phoneDigits'),
    currentLocation: getVal('field-currentLocation'),
    city: getVal('field-city'),
    address: getVal('field-address')
  };

  currentProfile.education = {
    collegeName: getVal('field-collegeName'),
    degree: getVal('field-degree'),
    graduationYear: getVal('field-graduationYear'),
    graduationStatus: getVal('field-graduationStatus'),
    workingStatus: getVal('field-workingStatus'),
    tenthPercentage: getVal('field-tenthPercentage'),
    tenthPercentageNumeric: getVal('field-tenthPercentageNumeric'),
    twelfthPercentage: getVal('field-twelfthPercentage'),
    twelfthPercentageNumeric: getVal('field-twelfthPercentageNumeric'),
    graduationCgpa: getVal('field-graduationCgpa'),
    graduationCgpaNumeric: getVal('field-graduationCgpaNumeric')
  };

  currentProfile.professional = {
    currentOrganization: getVal('field-currentOrganization'),
    currentRole: getVal('field-currentRole'),
    totalExperienceYears: getVal('field-totalExperienceYears'),
    noticePeriod: getVal('field-noticePeriod'),
    noticePeriodDays: getVal('field-noticePeriodDays') || '0',
    canJoinImmediately: getVal('field-canJoinImmediately'),
    hoursCommitmentConfirmed: getVal('field-hoursCommitmentConfirmed'),
    currentCtc: getVal('field-currentCtc'),
    currentCtcLpa: getVal('field-currentCtc'),
    currentCtcNumeric: getVal('field-currentCtcNumeric'),
    expectedCtc: getVal('field-expectedCtc'),
    expectedCtcLpa: getVal('field-expectedCtc'),
    expectedCtcNumeric: getVal('field-expectedCtcNumeric'),
    stipendExpectation: getVal('field-stipendExpectation'),
    stipendExpectationNumeric: getVal('field-stipendExpectationNumeric')
  };

  currentProfile.links = {
    linkedinUrl: getVal('field-linkedinUrl'),
    githubUrl: getVal('field-githubUrl'),
    portfolioUrl: getVal('field-portfolioUrl'),
    projectDemoUrl: getVal('field-projectDemoUrl'),
    resumeUrl: getVal('field-resumeUrl')
  };

  // Save Settings
  const settings = {
    autoHighlight: document.getElementById('setting-autoHighlight').checked,
    showFloatingWidget: document.getElementById('setting-showFloatingWidget').checked,
    autoFillRadioCheckboxes: document.getElementById('setting-autoFillRadioCheckboxes').checked
  };

  await StorageService.saveProfile(currentProfile);
  await StorageService.saveSettings(settings);

  showToast('Profile and settings saved successfully!');
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('global-toast');
  const msgEl = document.getElementById('global-toast-msg');
  const iconEl = document.getElementById('global-toast-icon');

  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  iconEl.innerHTML = type === 'error' ? ICONS.close : ICONS.checkCircle;
  toast.style.background = type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)';

  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
