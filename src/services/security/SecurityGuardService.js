/**
 * SecurityGuardService - Defensive Security & Data Sanitization Layer
 * Protects against XSS, Prototype Pollution, Untrusted Backups, Prompt Injection, and PII Leaks.
 */

export class SecurityGuardService {
  /**
   * Escape HTML special characters for safe inclusion in DOM
   * @param {string} str 
   * @returns {string}
   */
  static escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const s = String(str);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Recursively sanitize an object by stripping prototype pollution keys (__proto__, constructor, prototype)
   * @param {any} obj 
   * @returns {any}
   */
  static stripPrototypePollution(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.stripPrototypePollution(item));
    }

    const clean = Object.create(null);
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = this.stripPrototypePollution(obj[key]);
    }
    return { ...clean };
  }

  /**
   * Validate and sanitize a candidate profile object
   * @param {any} p 
   * @returns {object} Clean sanitized profile
   */
  static validateAndSanitizeProfile(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) {
      throw new Error('Profile must be a non-empty object.');
    }

    const clean = this.stripPrototypePollution(p);

    const safeProfile = {
      id: typeof clean.id === 'string' && clean.id.trim() ? clean.id.trim().slice(0, 64) : `profile_${Date.now()}`,
      name: typeof clean.name === 'string' && clean.name.trim() ? clean.name.trim().slice(0, 100) : 'Untitled Profile',
      createdAt: clean.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      personal: typeof clean.personal === 'object' && clean.personal ? {
        fullName: String(clean.personal.fullName || '').slice(0, 120),
        firstName: String(clean.personal.firstName || '').slice(0, 60),
        lastName: String(clean.personal.lastName || '').slice(0, 60),
        email: String(clean.personal.email || '').slice(0, 120),
        phone: String(clean.personal.phone || '').slice(0, 40),
        phoneDigits: String(clean.personal.phoneDigits || '').slice(0, 30),
        alternatePhone: String(clean.personal.alternatePhone || '').slice(0, 40),
        gender: String(clean.personal.gender || '').slice(0, 30),
        dob: String(clean.personal.dob || '').slice(0, 30),
        address: String(clean.personal.address || '').slice(0, 250),
        city: String(clean.personal.city || '').slice(0, 80),
        state: String(clean.personal.state || '').slice(0, 80),
        pincode: String(clean.personal.pincode || '').slice(0, 20),
        country: String(clean.personal.country || '').slice(0, 60),
        currentLocation: String(clean.personal.currentLocation || '').slice(0, 80)
      } : {},

      education: typeof clean.education === 'object' && clean.education ? {
        collegeName: String(clean.education.collegeName || '').slice(0, 150),
        degree: String(clean.education.degree || '').slice(0, 100),
        branch: String(clean.education.branch || '').slice(0, 100),
        graduationYear: String(clean.education.graduationYear || '').slice(0, 20),
        graduationStatus: String(clean.education.graduationStatus || '').slice(0, 100),
        workingStatus: String(clean.education.workingStatus || '').slice(0, 100),
        tenthPercentage: String(clean.education.tenthPercentage || clean.education.percentage10th || '').slice(0, 30),
        tenthPercentageNumeric: String(clean.education.tenthPercentageNumeric || '').slice(0, 20),
        twelfthPercentage: String(clean.education.twelfthPercentage || clean.education.percentage12th || '').slice(0, 30),
        twelfthPercentageNumeric: String(clean.education.twelfthPercentageNumeric || '').slice(0, 20),
        graduationCgpa: String(clean.education.graduationCgpa || clean.education.cgpa || '').slice(0, 30),
        graduationCgpaNumeric: String(clean.education.graduationCgpaNumeric || '').slice(0, 20)
      } : {},

      professional: typeof clean.professional === 'object' && clean.professional ? {
        currentOrganization: String(clean.professional.currentOrganization || clean.professional.currentCompany || '').slice(0, 150),
        currentRole: String(clean.professional.currentRole || '').slice(0, 120),
        totalExperienceYears: String(clean.professional.totalExperienceYears || '').slice(0, 20),
        noticePeriod: String(clean.professional.noticePeriod || '').slice(0, 50),
        noticePeriodDays: String(clean.professional.noticePeriodDays || '0').slice(0, 10),
        canJoinImmediately: String(clean.professional.canJoinImmediately || '').slice(0, 20),
        hoursCommitmentConfirmed: String(clean.professional.hoursCommitmentConfirmed || '').slice(0, 20),
        currentCtc: String(clean.professional.currentCtc || '').slice(0, 50),
        currentCtcLpa: String(clean.professional.currentCtcLpa || '').slice(0, 30),
        currentCtcNumeric: String(clean.professional.currentCtcNumeric || '').slice(0, 30),
        expectedCtc: String(clean.professional.expectedCtc || '').slice(0, 50),
        expectedCtcLpa: String(clean.professional.expectedCtcLpa || '').slice(0, 30),
        expectedCtcNumeric: String(clean.professional.expectedCtcNumeric || '').slice(0, 30),
        stipendExpectation: String(clean.professional.stipendExpectation || '').slice(0, 60),
        stipendExpectationNumeric: String(clean.professional.stipendExpectationNumeric || '').slice(0, 30)
      } : {},

      links: typeof clean.links === 'object' && clean.links ? {
        linkedinUrl: this.validateProfileUrl(clean.links.linkedinUrl),
        githubUrl: this.validateProfileUrl(clean.links.githubUrl),
        portfolioUrl: this.validateProfileUrl(clean.links.portfolioUrl),
        projectDemoUrl: this.validateProfileUrl(clean.links.projectDemoUrl),
        resumeUrl: this.validateProfileUrl(clean.links.resumeUrl)
      } : (typeof clean.social === 'object' && clean.social ? {
        linkedinUrl: this.validateProfileUrl(clean.social.linkedinUrl),
        githubUrl: this.validateProfileUrl(clean.social.githubUrl),
        portfolioUrl: this.validateProfileUrl(clean.social.portfolioUrl),
        projectDemoUrl: this.validateProfileUrl(clean.social.projectDemoUrl),
        resumeUrl: this.validateProfileUrl(clean.social.resumeUrl)
      } : {}),

      skills: Array.isArray(clean.skills) ? clean.skills.map((s) => {
        if (typeof s === 'string') return s.slice(0, 80);
        if (s && typeof s === 'object') {
          return {
            name: String(s.name || '').slice(0, 80),
            level: s.level ? String(s.level).slice(0, 30) : undefined,
            years: s.years ? String(s.years).slice(0, 20) : undefined,
            experienceYears: Number(s.experienceYears) || 0,
            proficiency: String(s.proficiency || 'Intermediate').slice(0, 30)
          };
        }
        return String(s || '').slice(0, 80);
      }) : [],

      customFields: Array.isArray(clean.customFields) ? clean.customFields.map((cf) => ({
        key: String(cf.key || '').slice(0, 150),
        value: String(cf.value || '').slice(0, 2000)
      })) : []
    };

    return safeProfile;
  }

  /**
   * Validate and sanitize an entire backup import payload
   * @param {any} backup 
   * @returns {object} Clean validated backup data
   */
  static validateAndSanitizeBackup(backup) {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Backup payload is invalid or empty.');
    }

    const clean = this.stripPrototypePollution(backup);

    // Support array of profiles
    if (Array.isArray(clean)) {
      if (clean.length === 0) throw new Error('Backup profiles array is empty.');
      const safeProfiles = clean.map((p) => this.validateAndSanitizeProfile(p));
      return {
        profiles: safeProfiles,
        activeProfileId: safeProfiles[0].id
      };
    }

    if (!clean.profiles || !Array.isArray(clean.profiles) || clean.profiles.length === 0) {
      throw new Error('Backup must contain a valid "profiles" array.');
    }

    const safeProfiles = clean.profiles.map((p) => this.validateAndSanitizeProfile(p));
    const activeId = safeProfiles.some((p) => p.id === clean.activeProfileId)
      ? clean.activeProfileId
      : safeProfiles[0].id;

    const safeSettings = clean.settings && typeof clean.settings === 'object'
      ? {
          autoHighlight: Boolean(clean.settings.autoHighlight !== false),
          showFloatingWidget: Boolean(clean.settings.showFloatingWidget !== false),
          autoSelectBestRadio: Boolean(clean.settings.autoSelectBestRadio !== false),
          enableRagAi: Boolean(clean.settings.enableRagAi !== false),
          confidenceThreshold: Math.max(0.5, Math.min(1.0, Number(clean.settings.confidenceThreshold) || 0.70))
        }
      : null;

    const safeRagDocs = Array.isArray(clean.ragDocs)
      ? clean.ragDocs.map((d) => ({
          id: String(d.id || '').slice(0, 64),
          title: String(d.title || '').slice(0, 150),
          type: String(d.type || 'document').slice(0, 30),
          chunkCount: Number(d.chunkCount) || 0,
          createdAt: String(d.createdAt || new Date().toISOString())
        }))
      : [];

    const safeRagChunks = Array.isArray(clean.ragChunks)
      ? clean.ragChunks.map((c) => ({
          id: String(c.id || '').slice(0, 64),
          docId: String(c.docId || '').slice(0, 64),
          docTitle: String(c.docTitle || '').slice(0, 150),
          content: String(c.content || '').slice(0, 5000),
          keywords: Array.isArray(c.keywords) ? c.keywords.map((k) => String(k).slice(0, 40)) : []
        }))
      : [];

    // Sanitize LLM config (strip any malicious keys)
    let safeLlmConfig = null;
    if (clean.llmConfig && typeof clean.llmConfig === 'object') {
      safeLlmConfig = {
        provider: String(clean.llmConfig.provider || 'ollama').slice(0, 30),
        ollamaEndpoint: String(clean.llmConfig.ollamaEndpoint || 'http://localhost:11434').slice(0, 150),
        ollamaModel: String(clean.llmConfig.ollamaModel || 'llama3.2').slice(0, 60),
        geminiModel: String(clean.llmConfig.geminiModel || 'gemini-1.5-flash').slice(0, 60),
        openaiModel: String(clean.llmConfig.openaiModel || 'gpt-4o-mini').slice(0, 60),
        anthropicModel: String(clean.llmConfig.anthropicModel || 'claude-3-5-haiku-20241022').slice(0, 60)
      };
      if (clean.llmConfig.geminiApiKey) safeLlmConfig.geminiApiKey = String(clean.llmConfig.geminiApiKey).slice(0, 120);
      if (clean.llmConfig.openaiApiKey) safeLlmConfig.openaiApiKey = String(clean.llmConfig.openaiApiKey).slice(0, 120);
      if (clean.llmConfig.anthropicApiKey) safeLlmConfig.anthropicApiKey = String(clean.llmConfig.anthropicApiKey).slice(0, 120);
    }

    return {
      profiles: safeProfiles,
      activeProfileId: activeId,
      settings: safeSettings,
      ragDocs: safeRagDocs,
      ragChunks: safeRagChunks,
      llmConfig: safeLlmConfig
    };
  }

  /**
   * Neutralize prompt injection attempts in form questions
   * @param {string} question 
   * @returns {string} Sanitized question
   */
  static sanitizePromptQuestion(question) {
    if (!question || typeof question !== 'string') return '';
    let sanitized = question.trim();

    // Neutralize common prompt jailbreak/override phrases
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/gi,
      /system\s+prompt\s+(leak|override|reveal)/gi,
      /print\s+(your\s+)?(system|hidden|developer)\s+instructions?/gi,
      /print\s+(the\s+)?(api[_\s]?key|credentials?|password)/gi,
      /you\s+are\s+now\s+in\s+developer\s+mode/gi
    ];

    for (const pattern of injectionPatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED_PROMPT_COMMAND]');
    }

    return sanitized;
  }

  /**
   * Strict validation for GitHub repository URLs
   * @param {string} rawUrl
   * @returns {{ owner: string, repo: string, cleanRepoName: string, canonicalUrl: string }}
   */
  static validateGitHubUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('GitHub repository URL is required.');
    }

    const trimmed = rawUrl.trim();
    if (trimmed.length > 500) {
      throw new Error('URL is too long (maximum 500 characters).');
    }

    // Prohibit embedded credentials or suspicious encoded traversal
    if (/[\x00-\x1F\x7F]/.test(trimmed) || /%2e%2e/i.test(trimmed) || /\.\./.test(trimmed)) {
      throw new Error('URL contains prohibited characters or traversal sequences.');
    }

    let parsed;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new Error('Invalid URL format. Please provide a valid https://github.com/owner/repo URL.');
    }

    // Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      throw new Error('GitHub URL must use secure HTTPS protocol (https://).');
    }

    // Hostname must strictly be github.com or www.github.com
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') {
      throw new Error('Only public repositories on github.com are permitted.');
    }

    // Reject usernames or passwords in URL
    if (parsed.username || parsed.password) {
      throw new Error('Embedded user credentials in GitHub URLs are not allowed.');
    }

    // Reject non-standard ports
    if (parsed.port && parsed.port !== '443') {
      throw new Error('Non-standard network ports are not permitted.');
    }

    // Pathname must match /owner/repo pattern
    const cleanPath = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    const pathParts = cleanPath.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      throw new Error('Invalid GitHub repository path. Format: https://github.com/owner/repo');
    }

    const owner = pathParts[0];
    const repo = pathParts[1].replace(/\.git$/i, '');

    // Valid GitHub username & repo name slug check
    const slugRegex = /^[a-zA-Z0-9._-]+$/;
    if (!slugRegex.test(owner) || !slugRegex.test(repo)) {
      throw new Error('GitHub owner or repository name contains invalid characters.');
    }

    // Block reserved system paths
    const reserved = ['settings', 'explore', 'features', 'topics', 'trending', 'collections', 'events', 'sponsors', 'login', 'join'];
    if (reserved.includes(owner.toLowerCase())) {
      throw new Error(`"${owner}" is a reserved GitHub system path, not a user repository.`);
    }

    return {
      owner,
      repo,
      cleanRepoName: repo,
      canonicalUrl: `https://github.com/${owner}/${repo}`
    };
  }

  /**
   * Strict validation for uploaded document files
   * @param {File|{ name: string, size: number, type?: string }} file
   * @param {ArrayBuffer|Uint8Array} [rawBuffer]
   * @returns {{ valid: boolean, sanitizedName: string, extension: string, size: number }}
   */
  static validateDocumentFile(file, rawBuffer = null) {
    if (!file || typeof file !== 'object') {
      throw new Error('No file provided for ingestion.');
    }

    const name = String(file.name || '').trim();
    const size = Number(file.size);

    if (!name) {
      throw new Error('File name is missing or invalid.');
    }

    // Check size bounds (0 < size <= 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (isNaN(size) || size <= 0) {
      throw new Error('Cannot ingest empty (0 bytes) file.');
    }
    if (size > MAX_SIZE) {
      throw new Error(`File is too large (${(size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
    }

    // Sanitize filename and extract extension
    const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
    if (!extMatch) {
      throw new Error('File must have a valid extension (.pdf, .md, .txt, .docx).');
    }
    const ext = extMatch[1].toLowerCase();
    const allowedExtensions = ['pdf', 'md', 'txt', 'docx', 'markdown'];
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`Unsupported file type ".${ext}". Allowed: PDF, Markdown (.md), Plain Text (.txt), and Word (.docx).`);
    }

    // Optional magic-byte validation when buffer is supplied
    if (rawBuffer) {
      const bytes = new Uint8Array(rawBuffer instanceof ArrayBuffer ? rawBuffer : rawBuffer.buffer || rawBuffer);
      if (ext === 'pdf') {
        // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
        if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
          throw new Error('Corrupted or invalid PDF file header.');
        }
      } else if (ext === 'docx') {
        // DOCX is a ZIP container: PK\x03\x04 (0x50 0x4B 0x03 0x04)
        if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4B || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
          throw new Error('Corrupted or invalid Word (.docx) file header.');
        }
      } else if (ext === 'txt' || ext === 'md' || ext === 'markdown') {
        // Reject binary executable headers (MZ for DOS/PE, \x7fELF for Linux)
        if (bytes.length >= 2 && bytes[0] === 0x4D && bytes[1] === 0x5A) {
          throw new Error('Executable binary files are strictly prohibited.');
        }
        if (bytes.length >= 4 && bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
          throw new Error('ELF binary files are strictly prohibited.');
        }
      }
    }

    const sanitizedName = name.replace(/[^a-zA-Z0-9._\-\s]/g, '_').slice(0, 150);

    return {
      valid: true,
      sanitizedName,
      extension: ext,
      size
    };
  }

  /**
   * Strict validation and sanitization for Job Description (JD) text
   * @param {any} text
   * @returns {string} Cleaned, injection-neutralized JD string
   */
  static validateJobDescription(text) {
    if (text === null || text === undefined) return '';
    if (typeof text !== 'string') {
      text = String(text);
    }

    let clean = text.trim();
    if (!clean) return '';

    // Hard length cap: 10,000 characters
    if (clean.length > 10000) {
      clean = clean.slice(0, 10000);
    }

    // Strip HTML and script tags
    clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    clean = clean.replace(/<[^>]+>/g, ' ');

    // Neutralize prompt injection phrases
    clean = this.sanitizePromptQuestion(clean);

    return clean.replace(/\s+/g, ' ').trim();
  }

  /**
   * Validate generic profile URL
   * @param {string} url
   * @param {string} [expectedDomain]
   * @returns {string} Safe canonical URL or empty string
   */
  static validateProfileUrl(url, expectedDomain = null) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed || trimmed.length > 500) return '';

    // Strictly reject dangerous schemes
    if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
      return '';
    }

    try {
      const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return '';
      }

      if (expectedDomain) {
        const host = parsed.hostname.toLowerCase();
        if (!host.includes(expectedDomain.toLowerCase())) {
          return '';
        }
      }

      return parsed.href;
    } catch {
      return '';
    }
  }

  /**
   * Validate and sanitize LLM provider configuration
   * @param {any} config
   * @returns {object} Safe LLM configuration
   */
  static validateLlmConfig(config) {
    if (!config || typeof config !== 'object') {
      return {
        provider: 'ollama',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3.2'
      };
    }

    const clean = this.stripPrototypePollution(config);
    const validProviders = ['ollama', 'gemini', 'openai', 'anthropic'];
    const provider = validProviders.includes(clean.provider) ? clean.provider : 'ollama';

    // Validate endpoint
    let endpoint = String(clean.ollamaEndpoint || 'http://localhost:11434').trim();
    try {
      const parsed = new URL(endpoint);
      const host = parsed.hostname.toLowerCase();
      // Block cloud metadata SSRF addresses
      if (host === '169.254.169.254' || host === 'metadata.google.internal' || host === 'instance-data') {
        endpoint = 'http://localhost:11434';
      }
    } catch {
      endpoint = 'http://localhost:11434';
    }

    const modelSlugRegex = /^[a-zA-Z0-9._:-]+$/;
    const sanitizeModel = (m, def) => {
      const s = String(m || '').trim();
      return (s && modelSlugRegex.test(s)) ? s.slice(0, 80) : def;
    };

    return {
      provider,
      ollamaEndpoint: endpoint.slice(0, 150),
      ollamaModel: sanitizeModel(clean.ollamaModel, 'llama3.2'),
      geminiApiKey: clean.geminiApiKey ? String(clean.geminiApiKey).trim().slice(0, 120) : '',
      geminiModel: sanitizeModel(clean.geminiModel, 'gemini-1.5-flash'),
      openaiApiKey: clean.openaiApiKey ? String(clean.openaiApiKey).trim().slice(0, 120) : '',
      openaiModel: sanitizeModel(clean.openaiModel, 'gpt-4o-mini'),
      anthropicApiKey: clean.anthropicApiKey ? String(clean.anthropicApiKey).trim().slice(0, 120) : '',
      anthropicModel: sanitizeModel(clean.anthropicModel, 'claude-3-5-haiku-20241022')
    };
  }
}
