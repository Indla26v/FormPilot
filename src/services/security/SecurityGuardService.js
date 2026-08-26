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
        linkedinUrl: String(clean.links.linkedinUrl || '').slice(0, 300),
        githubUrl: String(clean.links.githubUrl || '').slice(0, 300),
        portfolioUrl: String(clean.links.portfolioUrl || '').slice(0, 300),
        projectDemoUrl: String(clean.links.projectDemoUrl || '').slice(0, 300),
        resumeUrl: String(clean.links.resumeUrl || '').slice(0, 300)
      } : (typeof clean.social === 'object' && clean.social ? {
        linkedinUrl: String(clean.social.linkedinUrl || '').slice(0, 300),
        githubUrl: String(clean.social.githubUrl || '').slice(0, 300),
        portfolioUrl: String(clean.social.portfolioUrl || '').slice(0, 300),
        projectDemoUrl: String(clean.social.projectDemoUrl || '').slice(0, 300),
        resumeUrl: String(clean.social.resumeUrl || '').slice(0, 300)
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
}
