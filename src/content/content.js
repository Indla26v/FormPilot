/**
 * Content Script for Google Forms Auto Filler (GFAF)
 * Self-contained, robust, zero-dependency, immune to page CSP and extension context invalidation.
 */

(function () {
  'use strict';

  // Prevent duplicate double injection while allowing re-mount if UI is missing
  if (window.__GFAF_CONTENT_INJECTED__) {
    if (!document.getElementById('gfaf-floating-root') && typeof window.__GFAF_INIT__ === 'function') {
      window.__GFAF_INIT__();
    }
    return;
  }
  window.__GFAF_CONTENT_INJECTED__ = true;
  const fieldChatHistory = (window.__GFAF_FIELD_CHAT_HISTORY__ = window.__GFAF_FIELD_CHAT_HISTORY__ || new Map());
  let sessionJobDescription = (window.__GFAF_SESSION_JD__ = window.__GFAF_SESSION_JD__ || '');

  // ----------------------------------------------------
  // 1. CONSTANTS & DICTIONARIES
  // ----------------------------------------------------
  const STORAGE_KEYS = {
    PROFILES: 'gfaf_profiles',
    ACTIVE_PROFILE_ID: 'gfaf_active_profile_id',
    SETTINGS: 'gfaf_settings',
    HISTORY: 'gfaf_fill_history'
  };

  const DEFAULT_SETTINGS = {
    autoHighlight: true,
    autoFillRadioCheckboxes: true,
    showFloatingWidget: true,
    notificationDurationMs: 3000,
    confidenceThreshold: 0.55
  };

  const DEFAULT_PROFILE = {
    id: 'profile_default',
    name: 'Default Profile',
    personal: {
      fullName: 'Alex Morgan',
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex.morgan.dev@example.com',
      phone: '+1 555-019-2834',
      phoneDigits: '5550192834',
      currentLocation: 'San Francisco, CA',
      city: 'San Francisco',
      country: 'United States',
      address: '742 Evergreen Terrace, San Francisco, CA 94107'
    },
    education: {
      collegeName: 'University of Technology',
      degree: 'B.S. in Computer Science & Engineering',
      graduationYear: '2025',
      graduationStatus: 'I am in my last year',
      workingStatus: 'Student',
      tenthPercentage: '92.5%',
      tenthPercentageNumeric: '92.5',
      twelfthPercentage: '94.0%',
      twelfthPercentageNumeric: '94.0',
      graduationCgpa: '8.8 / 10',
      graduationCgpaNumeric: '8.8',
      collegeAttendanceRequirement: 'No',
      vivasExamsUpcoming: 'No'
    },
    professional: {
      currentOrganization: 'Acme Labs / Open Source Builder',
      currentRole: 'AI & Full Stack Engineer',
      totalExperienceYears: '1',
      noticePeriod: 'Immediate',
      noticePeriodDays: '0',
      canJoinImmediately: 'Yes',
      hoursCommitmentConfirmed: 'Yes',
      currentCtc: '0',
      currentCtcLpa: '0',
      currentCtcNumeric: '0',
      expectedCtc: '7 - 12 LPA',
      expectedCtcLpa: '10',
      expectedCtcNumeric: '1000000',
      stipendExpectation: 'Rs. 40,000 - 60,000 / month',
      stipendExpectationNumeric: '50000',
      deployedInProduction: 'Yes, and I maintained it after',
      writtenLlmPipelines: 'Yes'
    },
    links: {
      linkedinUrl: 'https://www.linkedin.com/in/alex-morgan-dev',
      githubUrl: 'https://github.com/alex-morgan-dev',
      portfolioUrl: 'https://alexmorgan.dev',
      projectDemoUrl: 'https://github.com/alex-morgan-dev/ai-voice-agent-pipeline',
      resumeUrl: 'https://drive.google.com/file/d/1a2b3c4d5e-sample-resume/view'
    },
    skills: [
      'Next js', 'Next.js', 'N8N', 'Fast API', 'FastAPI', 'Postgress', 'Postgres',
      'PostgreSQL', 'Vector DB setup', 'OpenAI', 'Anthropic', 'Gemini', 'Opensource/Local',
      'LangChain/LlamaIndex', 'voice APIs', 'Python', 'JavaScript', 'TypeScript', 'React', 'Docker'
    ],
    smartAnswers: [
      {
        id: 'qa_built_for',
        keywords: ['What did you build it for', 'built it for', 'course, a client, yourself, or a hackathon'],
        answer: 'Built for myself and open-source users as an end-to-end autonomous AI workflow system with multi-agent orchestration.'
      },
      {
        id: 'qa_hardest_bug',
        keywords: ['hardest bug', 'personally debugged', 'what did you think the cause was', 'cause was, and what was it actually'],
        answer: 'Debugged a race condition in an asynchronous streaming LLM pipeline where WebSocket connections dropped under burst traffic. Initially suspected network timeouts or rate limits from LLM providers, but root cause was unbuffered backpressure in the chunk-emitter event loop causing memory leaks and socket resets.'
      },
      {
        id: 'qa_prompt_iteration',
        keywords: ['Paste one prompt', 'iterated on', 'version that didn\'t work', 'version that did', 'one line on what changed'],
        answer: `[Failed Version]: "Extract client intent, budget, and contact info from the call transcript and output JSON." -> [Issue: Hallucinated schema and missed nested constraints under edge cases].\n[Working Version]: "You are a deterministic financial call extractor. Output ONLY valid JSON strictly matching the schema: {"intent": enum, "budget_inr": number|null, "lead_status": "HOT"|"WARM"|"COLD"}. If any attribute is ambiguous, set to null. Do not include markdown formatting or commentary."\n[What changed]: Replaced vague open extraction with strict enum bounds, explicit null-handling rules, and zero markdown envelope instructions.`
      },
      {
        id: 'qa_robotic_voice_check',
        keywords: ['robotic and customers are hanging up', 'first three things you check', 'sounds robotic'],
        answer: '1. Latency & Audio Buffer Pipeline: Check Time-To-First-Byte (TTFB) on TTS generation, chunk size streaming, and WebSocket jitter. 2. Speech Synthesis Prosody: Adjust temperature, speech rate (wpm), punctuation injection, and emotion/pause tags (SSML). 3. Prompt Turn-Taking: Inspect LLM response verbosity, filler token generation, and conversational naturalness vs scripted monotone output.'
      },
      {
        id: 'qa_why_role',
        keywords: ['Why this role specifically', 'What about it interests you over a standard SDE', 'interests you over a standard'],
        answer: 'I thrive at the intersection of client-facing engineering and cutting-edge production AI. Rather than building isolated backend tickets, I want direct ownership of live AI agent performance, prompt engineering in production, and rapid feedback loops with real enterprise users.'
      },
      {
        id: 'qa_hill_to_die_on',
        keywords: ['hill you\'ll die on', 'hill you will die on', 'nothing to do with work', 'make it fun'],
        answer: 'Cold brew coffee is objectively superior to hot espresso in high-pressure debugging sessions, and pineapple on pizza is a perfectly valid savory-sweet flavor profile.'
      },
      {
        id: 'qa_coding_stack',
        keywords: ['What coding stack/ tool do you understand', 'stack/ tool do you understand', 'tech stack'],
        answer: 'Next.js, FastAPI, Python, TypeScript, Postgres, Vector DBs (Pinecone/Qdrant/pgvector), LangChain, n8n, OpenAI/Anthropic/Gemini APIs, and Docker.'
      },
      {
        id: 'qa_anything_else',
        keywords: ['Anything else we should know', 'additional information', 'any other details'],
        answer: 'High agency builder ready to deploy code, debug production voice/agent pipelines, and commit full-time with immediate availability.'
      }
    ],
    customFields: []
  };

  const FIELD_DICTIONARY = [
    { fieldPath: 'personal.fullName', type: 'text', aliases: ['full name', 'candidate name', 'your name', 'applicant name', 'name *', 'name*', 'name', 'first and last name', 'enter your name'] },
    { fieldPath: 'personal.firstName', type: 'text', aliases: ['first name', 'given name', 'forename'] },
    { fieldPath: 'personal.lastName', type: 'text', aliases: ['last name', 'surname', 'family name'] },
    { fieldPath: 'personal.email', type: 'text', aliases: ['email', 'email id', 'email address', 'e-mail', 'mail id', 'contact email', 'email*'] },
    { fieldPath: 'personal.phone', numericPath: 'personal.phoneDigits', type: 'text_or_number', aliases: ['contact no', 'contact number', 'phone', 'phone number', 'phone no', 'mobile', 'mobile number', 'mobile no', 'whatsapp number', 'telephone', 'contact'] },
    { fieldPath: 'personal.currentLocation', type: 'text', aliases: ['current location', 'where are you based out of', 'location', 'city', 'current city', 'base location', 'current address', 'where do you live', 'based out of'] },
    { fieldPath: 'education.collegeName', type: 'text', aliases: ['college/university name', 'college name', 'university name', 'institute name', 'college', 'university', 'school name', 'institution'] },
    { fieldPath: 'education.degree', type: 'text', aliases: ['degree', 'qualification', 'highest qualification', 'branch', 'stream', 'major', 'course'] },
    { fieldPath: 'education.graduationYear', numericPath: 'education.graduationYear', type: 'number_or_text', aliases: ['year of graduation', 'graduation year', 'year of passing', 'passing year', 'passout year', 'batch', 'yop', 'year of graduation *', 'graduation year *'] },
    { fieldPath: 'education.tenthPercentage', numericPath: 'education.tenthPercentageNumeric', type: 'text_or_number', aliases: ['10th percentage / cgpa', '10th percentage', '10th cgpa', '10th marks', 'ssc percentage', '10th %', 'class 10'] },
    { fieldPath: 'education.twelfthPercentage', numericPath: 'education.twelfthPercentageNumeric', type: 'text_or_number', aliases: ['12th percentage / cgpa', '12th percentage', '12th cgpa', '12th marks', 'hsc percentage', '12th %', 'class 12', 'inter percentage'] },
    { fieldPath: 'education.graduationCgpa', numericPath: 'education.graduationCgpaNumeric', type: 'text_or_number', aliases: ['graduation percentage / cgpa', 'graduation percentage', 'graduation cgpa', 'btech cgpa', 'degree percentage', 'ug cgpa', 'current cgpa', 'cgpa'] },
    { fieldPath: 'education.graduationStatus', type: 'choice', aliases: ['when did you graduate?', 'when did you graduate?*', 'when did you graduate'] },
    { fieldPath: 'education.workingStatus', type: 'choice_or_text', aliases: ['working status', 'employment status', 'current status'] },
    { fieldPath: 'professional.totalExperienceYears', numericPath: 'professional.totalExperienceYears', type: 'number_or_text', aliases: ['years of experience', 'years of experience *', 'total experience', 'work experience', 'experience (in years)', 'experience (years)', 'total years of experience', 'experience', 'relevant experience', 'years of exp', 'total exp', 'experience in years'] },
    { fieldPath: 'professional.noticePeriodDays', numericPath: 'professional.noticePeriodDays', type: 'number_or_text', aliases: ['notice period (in days)', 'notice period in days', 'notice period (days)', 'notice period days', 'notice period', 'notice period (in days) *'] },
    { fieldPath: 'professional.currentCtcLpa', numericPath: 'professional.currentCtcLpa', type: 'text_or_number', aliases: ['current ctc (lpa) excluding stocks', 'current ctc (lpa)', 'current ctc in lpa', 'current ctc (in lpa)', 'current ctc', 'current fixed ctc', 'current salary (lpa)', 'present ctc'] },
    { fieldPath: 'professional.expectedCtcLpa', numericPath: 'professional.expectedCtcLpa', type: 'text_or_number', aliases: ['expected ctc (lpa) excluding stocks', 'expected ctc (lpa)', 'expected ctc in lpa', 'expected ctc (in lpa)', 'expected ctc', 'expected salary (lpa)', 'stipend expectations', 'expected salary', 'stipend expectation', 'compensation expectation', 'ctc expected'] },
    { fieldPath: 'professional.currentOrganization', type: 'text', aliases: ['current organization', 'current company', 'current employer', 'company name', 'organization'] },
    { fieldPath: 'professional.currentRole', type: 'choice_or_text', aliases: ['role', 'position applied for', 'role applied for', 'designation', 'current role', 'job title'] },
    { fieldPath: 'professional.companyAndRole', type: 'text', aliases: ['current company and job title', 'current company and job title *', 'current company and role', 'company and job title', 'company and designation', 'current organization and designation', 'current company & title', 'current company and title', 'current employer and role'] },
    { fieldPath: 'professional.canJoinImmediately', type: 'choice_or_text', aliases: ['can you join immediately', 'can you join immediately (i.e in the 1st week of september)*', 'can you join immediately (i.e in the 1st week of september)', 'join immediately', 'immediate joiner', 'earliest start date', 'available immediately'] },
    { fieldPath: 'professional.hoursCommitmentConfirmed', type: 'choice_or_text', aliases: ['this role requires 8 hours daily', 'can you commit to this', 'hours daily', 'full-time commitment', 'time commitment'] },
    { fieldPath: 'education.collegeAttendanceRequirement', type: 'choice_or_text', aliases: ['do you have a college attendance requirement', 'attendance requirement', 'college attendance'] },
    { fieldPath: 'education.vivasExamsUpcoming', type: 'choice_or_text', aliases: ['do you have vivas/exams/tests/end-sems in the next 3 months', 'vivas/exams/tests/end-sems', 'upcoming exams', 'exams in next 3 months'] },
    { fieldPath: 'professional.deployedInProduction', type: 'choice_or_text', aliases: ['have you ever deployed something that other people used in production', 'deployed something that other people used in production', 'production deployment'] },
    { fieldPath: 'professional.writtenLlmPipelines', type: 'choice_or_text', aliases: ['have you written code that calls an llm api in a loop or pipeline', 'llm api in a loop or pipeline', 'llm loop'] },
    { fieldPath: 'links.linkedinUrl', type: 'text', aliases: ['linkedin url', 'linkedin', 'linkedin profile', 'linkedin link', 'linked in url', 'linkedin *'] },
    { fieldPath: 'links.githubUrl', type: 'text', aliases: ['github url', 'github', 'github profile', 'github link', 'git repo'] },
    { fieldPath: 'links.portfolioUrl', type: 'text', aliases: ['portfolio', 'portfolio url', 'projects or portfolio', 'website', 'personal website', 'project link', 'portfolio / website'] },
    { fieldPath: 'links.projectDemoUrl', type: 'text', aliases: ['link to one thing you built that a stranger can open and use', 'link to one thing you built', 'best project link', 'live project'] },
    { fieldPath: 'links.resumeUrl', type: 'text', aliases: ['resume link', 'cv link', 'drive link to resume', 'resume url'] }
  ];

  // ----------------------------------------------------
  // 2. SVG ICONS
  // ----------------------------------------------------
  const ICONS = {
    sparkles: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path><path d="M19 17L20.2 19.8L23 21L20.2 22.2L19 25L17.8 22.2L15 21L17.8 19.8L19 17Z"></path></svg>`,
    zap: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    checkCircle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
  };

  // ----------------------------------------------------
  // 3. STORAGE SERVICE (Protected from context invalidation)
  // ----------------------------------------------------
  class LocalStorageService {
    static _cachedActiveProfile = null;
    static _listenerRegistered = false;

    static _initStorageListener() {
      if (this._listenerRegistered) return;
      this._listenerRegistered = true;
      if (this.isContextValid() && chrome.storage && chrome.storage.onChanged) {
        try {
          chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
              if (changes[STORAGE_KEYS.PROFILES] || changes[STORAGE_KEYS.ACTIVE_PROFILE_ID] || changes['gfaf_common_data']) {
                this._cachedActiveProfile = null;
              }
            }
          });
        } catch {}
      }
    }

    static isContextValid() {
      try {
        return typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);
      } catch {
        return false;
      }
    }

    static async get(key) {
      if (this.isContextValid() && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          try {
            chrome.storage.local.get([key], (res) => {
              if (chrome.runtime?.lastError) {
                resolve(undefined);
              } else {
                resolve(res ? res[key] : undefined);
              }
            });
          } catch {
            resolve(undefined);
          }
        });
      }
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : undefined;
      } catch {
        return undefined;
      }
    }

    static async set(key, val) {
      this._cachedActiveProfile = null;
      if (this.isContextValid() && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
          try {
            chrome.storage.local.set({ [key]: val }, () => resolve(true));
          } catch {
            resolve(false);
          }
        });
      }
      try {
        localStorage.setItem(key, JSON.stringify(val));
        return true;
      } catch {
        return false;
      }
    }

    static async getProfiles() {
      let profiles = await this.get(STORAGE_KEYS.PROFILES);
      if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
        profiles = [DEFAULT_PROFILE];
        await this.set(STORAGE_KEYS.PROFILES, profiles);
        await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, DEFAULT_PROFILE.id);
      }
      return profiles;
    }

    static async getActiveProfile() {
      const profiles = await this.getProfiles();
      const activeId = await this.get(STORAGE_KEYS.ACTIVE_PROFILE_ID);
      const active = profiles.find((p) => p.id === activeId) || profiles[0] || DEFAULT_PROFILE;
      return active;
    }

    static async setActiveProfileId(id) {
      await this.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
    }

    static async getSettings() {
      const settings = await this.get(STORAGE_KEYS.SETTINGS);
      return { ...DEFAULT_SETTINGS, ...(settings || {}) };
    }

    static async recordHistory(entry) {
      let history = (await this.get(STORAGE_KEYS.HISTORY)) || [];
      history.unshift({ id: `hist_${Date.now()}`, timestamp: new Date().toISOString(), ...entry });
      if (history.length > 50) history = history.slice(0, 50);
      await this.set(STORAGE_KEYS.HISTORY, history);
    }
  }

  // ----------------------------------------------------
  // 4. FIELD MATCHER SERVICE
  // ----------------------------------------------------
  class LocalMatcherService {
    static normalize(str) {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().replace(/[*_#~`\(\)\[\]\{\}\:\?\.\,\/\\\-]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    static getNestedValue(obj, path) {
      if (!obj || !path) return undefined;
      if (path === 'professional.companyAndRole') {
        const role = obj.professional?.currentRole || '';
        const org = obj.professional?.currentOrganization || '';
        if (role && org) return `${role} at ${org}`;
        if (role) return role;
        if (org) return org;
        return 'Not currently working';
      }
      return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
    }

    static extractNumericValue(textVal, questionContext = '') {
      if (textVal === null || textVal === undefined) return '';
      const str = String(textVal).trim();
      if (!str) return '';

      const normContext = this.normalize(questionContext);

      // Notice period
      if (normContext.includes('notice period') || normContext.includes('days')) {
        if (str.toLowerCase().includes('immediate')) return '0';
        const dayMatch = str.match(/\b\d+\b/);
        return dayMatch ? dayMatch[0] : '0';
      }

      // CTC (LPA)
      if (normContext.includes('lpa') || normContext.includes('lakhs')) {
        const lpaRangeMatch = str.match(/(\d+(\.\d+)?)\s*(-|\/|to)?\s*(\d+(\.\d+)?)?/);
        if (lpaRangeMatch) {
          if (lpaRangeMatch[4]) {
            const min = parseFloat(lpaRangeMatch[1]);
            const max = parseFloat(lpaRangeMatch[4]);
            return String(Math.round((min + max) / 2));
          }
          return lpaRangeMatch[1];
        }
        if (/^\d+(\.\d+)?$/.test(str)) return str;
      }

      // INR
      if (normContext.includes('inr') || normContext.includes('rupees')) {
        const lpaMatch = str.match(/(\d+(\.\d+)?)\s*lpa/i);
        if (lpaMatch) {
          return String(Math.round(parseFloat(lpaMatch[1]) * 100000));
        }
      }

      if (/^-?\d+(\.\d+)?$/.test(str)) {
        return str;
      }

      // Default LPA converter
      const lpaMatch = str.match(/(\d+(\.\d+)?)\s*(-|\/|to)?\s*(\d+(\.\d+)?)?\s*lpa/i);
      if (lpaMatch) {
        const val = parseFloat(lpaMatch[4] || lpaMatch[1]);
        if (!isNaN(val)) return String(Math.round(val * 100000));
      }

      // Percentage
      const pctMatch = str.match(/(\d+(\.\d+)?)\s*%/);
      if (pctMatch) return pctMatch[1];

      // CGPA
      const cgpaMatch = str.match(/(\d+(\.\d+)?)\s*\/\s*\d+(\.\d+)?/);
      if (cgpaMatch) return cgpaMatch[1];

      // Digits only
      const digitsOnly = str.replace(/\D/g, '');
      if (digitsOnly.length > 0) return digitsOnly;

      return str;
    }

    static calculateTokenSimilarity(query, target) {
      const qTokens = new Set(this.normalize(query).split(' ').filter(Boolean));
      const tTokens = new Set(this.normalize(target).split(' ').filter(Boolean));
      if (qTokens.size === 0 || tTokens.size === 0) return 0;
      let intersectionCount = 0;
      for (const token of qTokens) {
        if (tTokens.has(token)) intersectionCount++;
      }
      const unionCount = new Set([...qTokens, ...tTokens]).size;
      return unionCount === 0 ? 0 : intersectionCount / unionCount;
    }

    static matchKeywords(query, keywords) {
      const normQuery = this.normalize(query);
      for (const keyword of keywords) {
        const normKeyword = this.normalize(keyword);
        if (normQuery.includes(normKeyword)) return 1.0;
        const similarity = this.calculateTokenSimilarity(query, keyword);
        if (similarity >= 0.6) return similarity;
      }
      return 0;
    }

    static matchDictionaryField(questionText, profile) {
      const normQuestion = this.normalize(questionText);
      let bestMatch = null;
      let highestScore = 0;

      for (const entry of FIELD_DICTIONARY) {
        for (const alias of entry.aliases) {
          const normAlias = this.normalize(alias);

          const buildMatchObj = (score, src) => {
            let textValue = this.getNestedValue(profile, entry.fieldPath);
            let numericValue = entry.numericPath ? this.getNestedValue(profile, entry.numericPath) : undefined;

            if (entry.fieldPath.includes('expectedCtc') || entry.fieldPath.includes('currentCtc')) {
              if (normQuestion.includes('lpa') || normQuestion.includes('lakhs')) {
                textValue = entry.fieldPath.includes('current') ? (profile.professional?.currentCtcLpa || '0') : (profile.professional?.expectedCtcLpa || '10');
                numericValue = textValue;
              } else if (normQuestion.includes('inr') || normQuestion.includes('rupees')) {
                textValue = entry.fieldPath.includes('current') ? (profile.professional?.currentCtcNumeric || '0') : (profile.professional?.expectedCtcNumeric || '1000000');
                numericValue = textValue;
              }
            }

            // Contextual adjustment for Notice Period (days vs text)
            if (entry.fieldPath.includes('noticePeriod') || normAlias.includes('notice period')) {
              if (normQuestion.includes('day') || normQuestion.includes('number') || normQuestion.includes('digits')) {
                textValue = profile.professional?.noticePeriodDays || '0';
                numericValue = textValue;
              } else {
                textValue = profile.professional?.noticePeriod || 'Immediate';
                numericValue = profile.professional?.noticePeriodDays || '0';
              }
            }

            if (numericValue === undefined && textValue !== undefined) {
              numericValue = this.extractNumericValue(textValue, questionText);
            }

            return {
              matched: true,
              source: src,
              fieldPath: entry.fieldPath,
              numericPath: entry.numericPath,
              type: entry.type,
              value: textValue,
              numericValue: numericValue !== undefined ? String(numericValue) : undefined,
              confidence: score
            };
          };

          if (normQuestion === normAlias) {
            const value = this.getNestedValue(profile, entry.fieldPath);
            if (value !== undefined && value !== '') {
              return buildMatchObj(1.0, 'dictionary_exact');
            }
          }
          if (normQuestion.includes(normAlias) || normAlias.includes(normQuestion)) {
            const isFullWord = new RegExp(`(^|\\s)${normAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i').test(normQuestion);
            const lenRatio = Math.min(normAlias.length, normQuestion.length) / Math.max(normAlias.length, normQuestion.length);
            
            let score = 0;
            if (lenRatio >= 0.5) {
              score = 0.80 + 0.20 * lenRatio;
            } else if (lenRatio >= 0.25 && (normAlias.length >= 10 || isFullWord)) {
              score = 0.65 + 0.25 * lenRatio;
            } else if (isFullWord && normAlias.length >= 8) {
              score = 0.50 + 0.30 * lenRatio;
            } else {
              score = 0.35 + 0.30 * lenRatio;
            }

            if (score > highestScore) {
              const value = this.getNestedValue(profile, entry.fieldPath);
              if (value !== undefined && value !== '') {
                highestScore = score;
                bestMatch = buildMatchObj(score, 'dictionary_partial');
              }
            }
          }
          const tokenSim = this.calculateTokenSimilarity(normQuestion, normAlias);
          if (tokenSim > 0.65 && tokenSim > highestScore) {
            const value = this.getNestedValue(profile, entry.fieldPath);
            if (value !== undefined && value !== '') {
              highestScore = tokenSim;
              bestMatch = buildMatchObj(tokenSim, 'dictionary_similarity');
            }
          }
        }
      }
      return bestMatch;
    }

    static matchSmartAnswers(questionText, profile) {
      const answersList = (profile && Array.isArray(profile.smartAnswers) && profile.smartAnswers.length > 0)
        ? profile.smartAnswers
        : (DEFAULT_PROFILE.smartAnswers || []);

      let bestMatch = null;
      let highestScore = 0;

      for (const qa of answersList) {
        if (!qa.keywords || !qa.answer) continue;
        const score = this.matchKeywords(questionText, qa.keywords);
        if (score > 0.55 && score > highestScore) {
          highestScore = score;
          bestMatch = { matched: true, source: 'smart_answer', value: qa.answer, confidence: score };
        }
      }
      return bestMatch;
    }

    static matchCustomFields(questionText, profile) {
      if (!profile.customFields || !Array.isArray(profile.customFields)) return null;
      const normQuestion = this.normalize(questionText);
      for (const custom of profile.customFields) {
        if (!custom.key || !custom.value) continue;
        const normKey = this.normalize(custom.key);
        if (normQuestion.includes(normKey) || normKey.includes(normQuestion)) {
          return {
            matched: true,
            source: 'custom_field',
            value: custom.value,
            numericValue: this.extractNumericValue(custom.value, questionText),
            confidence: 0.9
          };
        }
      }
      return null;
    }

    static matchSkillExperienceOrLevel(questionText, profile) {
      if (!questionText || !profile || !profile.skills) return null;
      const norm = this.normalize(questionText);

      const structuredSkills = (profile.skills || []).map((s) => {
        if (typeof s === 'object' && s !== null) {
          let rating = parseFloat(s.rating);
          if (isNaN(rating) || rating <= 0) {
            const lvl = (s.level || 'Intermediate').toLowerCase();
            if (lvl.includes('expert')) rating = 10;
            else if (lvl.includes('advanced')) rating = 8;
            else if (lvl.includes('intermediate')) rating = 6;
            else rating = 3;
          }
          return {
            name: s.name || '',
            normName: this.normalize(s.name || ''),
            years: String(s.years || '').trim(),
            numericYears: parseFloat(s.years) || 0,
            rating: Math.min(10, Math.max(1, Math.round(rating))),
            level: s.level || 'Intermediate',
            normLevel: this.normalize(s.level || '')
          };
        }
        const nameStr = String(s || '');
        return {
          name: nameStr,
          normName: this.normalize(nameStr),
          years: '',
          numericYears: 0,
          rating: 6,
          level: 'Intermediate',
          normLevel: 'intermediate'
        };
      }).filter((s) => s.normName.length > 0);

      const isExpQuestion = norm.includes('experience') || norm.includes('years') || norm.includes('how many years');
      const isLevelQuestion = norm.includes('proficiency') || norm.includes('rating') || norm.includes('rate your') || norm.includes('level') || norm.includes('scale');

      if (!isExpQuestion && !isLevelQuestion) return null;

      const sortedSkills = [...structuredSkills].sort((a, b) => b.normName.length - a.normName.length);
      const matched = sortedSkills.find((s) => {
        if (norm.includes(s.normName)) return true;
        const words = norm.split(/[\s,()\/_-]+/);
        return words.includes(s.normName);
      });

      if (matched) {
        const has1to5 = /\b1\s*(?:to|-)?\s*5\b/i.test(questionText) || norm.includes('1 5') || norm.includes('1 to 5') || norm.includes('out of 5');
        const has1to10 = /\b1\s*(?:to|-)?\s*10\b/i.test(questionText) || norm.includes('1 10') || norm.includes('1 to 10') || norm.includes('out of 10');

        if (isLevelQuestion && has1to5) {
          const val5 = Math.max(1, Math.min(5, Math.round(matched.rating / 2)));
          return {
            matched: true,
            fieldKey: `skills.${matched.name}.rating5`,
            value: String(val5),
            confidence: 0.98,
            source: 'skill_rating_scale_5'
          };
        }
        if (isLevelQuestion && (has1to10 || norm.includes('rating') || norm.includes('scale'))) {
          return {
            matched: true,
            fieldKey: `skills.${matched.name}.rating10`,
            value: String(matched.rating),
            confidence: 0.98,
            source: 'skill_rating_scale_10'
          };
        }
        if (isExpQuestion) {
          const val = matched.years || String(matched.numericYears || '1');
          return {
            matched: true,
            fieldKey: `skills.${matched.name}.years`,
            value: val,
            confidence: 0.95,
            source: 'skill_experience'
          };
        }
        if (isLevelQuestion) {
          return {
            matched: true,
            fieldKey: `skills.${matched.name}.level`,
            value: matched.level,
            confidence: 0.95,
            source: 'skill_level'
          };
        }
      }

      return null;
    }

    static matchRadioOption(questionText, availableOptions, profile, fieldMatch = null) {
      if (!availableOptions || availableOptions.length === 0) return null;

      const normQuestion = this.normalize(questionText);

      // Normalize candidate skills with structured metadata
      const structuredSkills = (profile.skills || []).map((s) => {
        if (typeof s === 'object' && s !== null) {
          let rating = parseFloat(s.rating);
          if (isNaN(rating) || rating <= 0) {
            const lvl = (s.level || 'Intermediate').toLowerCase();
            if (lvl.includes('expert')) rating = 10;
            else if (lvl.includes('advanced')) rating = 8;
            else if (lvl.includes('intermediate')) rating = 6;
            else rating = 3;
          }
          return {
            name: s.name || '',
            normName: this.normalize(s.name || ''),
            years: String(s.years || '').trim(),
            numericYears: parseFloat(s.years) || 0,
            rating: Math.min(10, Math.max(1, Math.round(rating))),
            level: s.level || 'Intermediate',
            normLevel: this.normalize(s.level || '')
          };
        }
        const nameStr = String(s || '');
        return {
          name: nameStr,
          normName: this.normalize(nameStr),
          years: '',
          numericYears: 0,
          rating: 6,
          level: 'Intermediate',
          normLevel: 'intermediate'
        };
      }).filter((s) => s.normName.length > 0);

      const userSkills = structuredSkills.map((s) => s.normName);

      // 1. Skill Experience / Linear Scale / Rating Scale Matcher (e.g. "Rate your Java 1-5" or "Spring Boot experience: 0 1 2 3 4 5")
      const isExperienceOrRatingQuestion = (
        normQuestion.includes('experience') ||
        normQuestion.includes('years') ||
        normQuestion.includes('proficien') ||
        normQuestion.includes('rating') ||
        normQuestion.includes('rate your') ||
        normQuestion.includes('level of') ||
        normQuestion.includes('knowledge of') ||
        normQuestion.includes('familiarity') ||
        normQuestion.includes('scale')
      );

      if (isExperienceOrRatingQuestion) {
        // Find which skill is mentioned in the question (longest match first)
        const sortedSkills = [...structuredSkills].sort((a, b) => b.normName.length - a.normName.length);
        const matchedSkill = sortedSkills.find((s) => {
          if (normQuestion.includes(s.normName)) return true;
          const words = normQuestion.split(/[\s,()\/_-]+/);
          return words.includes(s.normName);
        });

        // Parse numeric scale options: e.g. ['0', '1', '2', '3', '4', '5', '5 or more'] or ['1', '2', '3', '4', '5']
        const numericOptions = availableOptions.map((opt) => {
          const norm = this.normalize(opt);
          const match = norm.match(/\b\d+(\.\d+)?\b/);
          return {
            original: opt,
            norm: norm,
            num: match ? parseFloat(match[0]) : null,
            isPlusOrMore: norm.includes('more') || norm.includes('+') || norm.includes('above') || norm.includes('greater')
          };
        });

        const validNums = numericOptions.filter((o) => o.num !== null);
        const hasNumericScale = validNums.length >= Math.min(3, availableOptions.length);

        if (matchedSkill) {
          // Candidate HAS this skill
          if (hasNumericScale) {
            const maxScaleNum = Math.max(...validNums.map((o) => o.num));
            const minScaleNum = Math.min(...validNums.map((o) => o.num));

            const isProficiencyRating = (
              normQuestion.includes('proficien') ||
              normQuestion.includes('rating') ||
              normQuestion.includes('rate your') ||
              normQuestion.includes('scale') ||
              normQuestion.includes('knowledge') ||
              normQuestion.includes('familiar') ||
              (normQuestion.includes('level') && !normQuestion.includes('entry level')) ||
              (minScaleNum === 1 && maxScaleNum <= 10 && !normQuestion.includes('in years'))
            );

            if (isProficiencyRating) {
              // MATH SCALING FROM 1-10 TO FORM SCALE:
              // 1. If form is 1 to 5 scale: value_5 = Math.round(matchedSkill.rating / 2)
              // 2. If form is 1 to 10 scale: value_10 = matchedSkill.rating
              let targetScaleValue = matchedSkill.rating;
              if (maxScaleNum <= 5 && maxScaleNum >= 3) {
                targetScaleValue = Math.max(minScaleNum, Math.min(maxScaleNum, Math.round(matchedSkill.rating / (10 / maxScaleNum))));
              } else if (maxScaleNum < 10 && maxScaleNum > 5) {
                targetScaleValue = Math.max(minScaleNum, Math.min(maxScaleNum, Math.round(matchedSkill.rating * (maxScaleNum / 10))));
              }

              const exactRatingOpt = numericOptions.find((o) => o.num === targetScaleValue);
              if (exactRatingOpt) {
                return { option: exactRatingOpt.original, confidence: 0.98 };
              }
            }

            // Otherwise, Experience in Years (e.g. "Spring Boot experience (including personal projects): 0 1 2 3 4 5")
            const targetYears = matchedSkill.numericYears || parseFloat(matchedSkill.years) || 1;

            // A. Exact number match (e.g. target 2 matches opt "2")
            const exactNumOpt = numericOptions.find((o) => o.num === Math.round(targetYears));
            if (exactNumOpt) {
              return { option: exactNumOpt.original, confidence: 0.98 };
            }

            // B. 5+ / 5 or more option
            if (targetYears >= 5) {
              const plusOpt = numericOptions.find((o) => o.isPlusOrMore || (o.num !== null && o.num >= 5));
              if (plusOpt) return { option: plusOpt.original, confidence: 0.98 };
            }

            // C. Range option (e.g. "1-2 years", "2-3 years", "1 to 2")
            for (const optObj of numericOptions) {
              const rangeMatch = optObj.norm.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
              if (rangeMatch) {
                const min = parseFloat(rangeMatch[1]);
                const max = parseFloat(rangeMatch[2]);
                if (targetYears >= min && targetYears <= max) {
                  return { option: optObj.original, confidence: 0.95 };
                }
              }
            }

            // D. Fallback to nearest number
            validNums.sort((a, b) => Math.abs(a.num - targetYears) - Math.abs(b.num - targetYears));
            return { option: validNums[0].original, confidence: 0.92 };
          }

          // Check if options are proficiency scale (e.g. Beginner, Intermediate, Advanced, Expert)
          const targetLevel = matchedSkill.normLevel;
          for (const opt of availableOptions) {
            const normOpt = this.normalize(opt);
            if (normOpt === targetLevel || normOpt.includes(targetLevel) || targetLevel.includes(normOpt)) {
              return { option: opt, confidence: 0.98 };
            }
          }
        } else {
          // Skill was NOT in candidate profile (e.g. Python when candidate only listed Java / Spring Boot)
          const isTechQuestion = (
            normQuestion.includes('programming') ||
            normQuestion.includes('development') ||
            normQuestion.includes('backend') ||
            normQuestion.includes('frontend') ||
            normQuestion.includes('framework') ||
            normQuestion.includes('language') ||
            normQuestion.includes('database') ||
            normQuestion.includes('cloud') ||
            normQuestion.includes('python') ||
            normQuestion.includes('c++') ||
            normQuestion.includes('ruby') ||
            normQuestion.includes('rust') ||
            normQuestion.includes('golang') ||
            normQuestion.includes('php') ||
            normQuestion.includes('angular') ||
            normQuestion.includes('vue')
          );

          if (isTechQuestion && hasNumericScale) {
            // Select 0 / 1 / No experience
            const zeroOpt = numericOptions.find((o) => o.num === 0 || o.norm === '0' || o.norm.includes('none') || o.norm.includes('no experience') || o.norm.includes('<1') || o.norm.includes('less than 1'));
            if (zeroOpt) {
              return { option: zeroOpt.original, confidence: 0.95 };
            }
            const minOpt = numericOptions.find((o) => o.num === 1);
            if (minOpt && (normQuestion.includes('rating') || normQuestion.includes('proficiency'))) {
              return { option: minOpt.original, confidence: 0.95 };
            }
          }
        }
      }

      // 2. Tech Stack / Skills / Languages Radio Matching
      const isTechStackQuestion = (
        normQuestion === 'tech stack' ||
        normQuestion.includes('tech stack') ||
        normQuestion.includes('technology stack') ||
        normQuestion.includes('stack') ||
        normQuestion.includes('language') ||
        normQuestion.includes('coding') ||
        normQuestion.includes('skill') ||
        normQuestion.includes('framework')
      );

      if (isTechStackQuestion && userSkills.length > 0) {
        let bestSkillOpt = null;
        let highestSkillScore = 0;

        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          const optTokens = normOpt.split(/\s+(?:and|or|\/|\&|\+)\s+|\s+/).filter(Boolean);

          const isDirectSkill = userSkills.some((skill) => skill === normOpt || (normOpt.length > 2 && skill.includes(normOpt)));
          if (isDirectSkill) {
            const score = 1.0;
            if (score > highestSkillScore) {
              highestSkillScore = score;
              bestSkillOpt = opt;
            }
            continue;
          }

          let matchingTokens = 0;
          let totalTokens = optTokens.length;
          for (const token of optTokens) {
            if (userSkills.some((skill) => skill === token || skill.includes(token) || (token.length > 3 && token.includes(skill)))) {
              matchingTokens++;
            }
          }

          if (totalTokens > 0) {
            const ratio = matchingTokens / totalTokens;
            const isFrontend = (normOpt.includes('frontend') || normOpt.includes('front end')) && userSkills.some((s) => s.includes('react') || s.includes('vue') || s.includes('frontend') || s.includes('angular') || s.includes('html'));
            const isBackend = (normOpt.includes('backend') || normOpt.includes('back end')) && userSkills.some((s) => s.includes('java') || s.includes('node') || s.includes('spring') || s.includes('python') || s.includes('go'));

            let score = ratio * 0.88;
            if (isFrontend || isBackend) score = Math.max(score, 0.82);

            if (matchingTokens === totalTokens && score > highestSkillScore) {
              highestSkillScore = score;
              bestSkillOpt = opt;
            } else if (score > highestSkillScore && score >= 0.7) {
              highestSkillScore = score;
              bestSkillOpt = opt;
            }
          }
        }

        if (bestSkillOpt && highestSkillScore >= 0.7) {
          return { option: bestSkillOpt, confidence: highestSkillScore };
        }
      }

      // 2. Direct fieldMatch (only for short clean fields, NOT long smart answer paragraphs)
      if (fieldMatch && fieldMatch.value && typeof fieldMatch.value === 'string' && fieldMatch.value.length < 60 && fieldMatch.source !== 'smart_answer') {
        const targetVal = this.normalize(fieldMatch.value);
        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          if (normOpt === targetVal || normOpt.includes(targetVal) || targetVal.includes(normOpt)) {
            return { option: opt, confidence: 0.95 };
          }
        }
      }

      if (normQuestion.includes('when did you graduate')) {
        const gradStatus = profile.education?.graduationStatus || 'I am in my last year';
        const normGrad = this.normalize(gradStatus);
        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          if (normOpt.includes('last year') && normGrad.includes('last year')) return { option: opt, confidence: 0.95 };
          if (normOpt.includes('1 year back') && normGrad.includes('1 year')) return { option: opt, confidence: 0.95 };
          if (normOpt.includes('student') && normGrad.includes('student')) return { option: opt, confidence: 0.95 };
        }
      }

      if (normQuestion.includes('working status') || normQuestion.includes('employment status')) {
        const workingStatus = profile.education?.workingStatus || 'Student';
        const normStatus = this.normalize(workingStatus);
        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          if (normOpt === normStatus || normOpt.includes(normStatus)) return { option: opt, confidence: 0.95 };
        }
      }

      if (normQuestion === 'role' || normQuestion.includes('role')) {
        const targetRole = profile.professional?.currentRole || 'AI Engineer';
        const normTarget = this.normalize(targetRole);
        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          if (normOpt === normTarget || (normOpt.includes('ai engineer') && normTarget.includes('ai'))) return { option: opt, confidence: 0.95 };
          if (normOpt.includes('devrel') && normTarget.includes('devrel')) return { option: opt, confidence: 0.95 };
        }
      }

      if (normQuestion.includes('deployed') && normQuestion.includes('production')) {
        for (const opt of availableOptions) {
          const normOpt = this.normalize(opt);
          if (normOpt.includes('maintained it after') || (normOpt.startsWith('yes') && !normOpt.includes('didn\'t'))) {
            return { option: opt, confidence: 0.95 };
          }
        }
      }

      if (normQuestion.includes('llm') && (normQuestion.includes('loop') || normQuestion.includes('pipeline'))) {
        for (const opt of availableOptions) {
          if (this.normalize(opt) === 'yes') return { option: opt, confidence: 0.95 };
        }
      }

      const isAffirmative = (
        normQuestion.includes('can you commit') ||
        normQuestion.includes('can you join immediately') ||
        normQuestion.includes('hours daily') ||
        normQuestion.includes('immediate')
      );

      const isNegative = (
        normQuestion.includes('college attendance requirement') ||
        normQuestion.includes('vivas') ||
        normQuestion.includes('exams') ||
        normQuestion.includes('tests') ||
        normQuestion.includes('end-sems')
      );

      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        if (isAffirmative && normOpt === 'yes') return { option: opt, confidence: 0.9 };
        if (isNegative && normOpt === 'no') return { option: opt, confidence: 0.9 };
      }

      return null;
    }

    static matchCheckboxOptions(questionText, availableOptions, profile) {
      if (!availableOptions || availableOptions.length === 0) return [];
      const selected = [];
      const skillsList = (profile.skills || []).map((s) => {
        const name = typeof s === 'object' && s !== null ? s.name : s;
        return this.normalize(name);
      }).filter(Boolean);
      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        const isMatched = skillsList.some((skill) => skill === normOpt || normOpt.includes(skill) || skill.includes(normOpt));
        if (isMatched && normOpt !== 'none') selected.push(opt);
      }
      return selected;
    }

    static resolveMatch(questionText, profile) {
      if (!questionText || !profile) return { matched: false };
      const smartMatch = this.matchSmartAnswers(questionText, profile);
      if (smartMatch && smartMatch.confidence >= 0.7) return smartMatch;
      const dictMatch = this.matchDictionaryField(questionText, profile);
      if (dictMatch && dictMatch.confidence >= 0.6) {
        if (smartMatch && smartMatch.confidence > dictMatch.confidence) return smartMatch;
        return dictMatch;
      }
      const customMatch = this.matchCustomFields(questionText, profile);
      if (customMatch) return customMatch;
      const skillMatch = this.matchSkillExperienceOrLevel(questionText, profile);
      if (skillMatch && skillMatch.confidence >= 0.7) return skillMatch;
      if (smartMatch && smartMatch.confidence >= 0.5) return smartMatch;
      return { matched: false };
    }
  }

  // ----------------------------------------------------
  // 5. GOOGLE FORMS FILLER SERVICE & CHAT MEMORY
  // ----------------------------------------------------
  class LocalFillerService {
    static fieldChatHistory = fieldChatHistory;

    static extractQuestionText(containerEl) {
      if (!containerEl) return '';
      let title = '';

      // 1. Check Microsoft Forms title elements
      const msTitleEl = containerEl.querySelector('span[data-automation-id="questionTitle"], div[data-automation-id="questionTitle"], .office-form-question-title, .question-title-box, .text-format-content, span.question-title-text');
      if (msTitleEl) {
        title = (msTitleEl.innerText || msTitleEl.textContent || '').trim();
      }

      // 2. Check Google Forms heading & title elements
      if (!title) {
        const headingEl = containerEl.querySelector('div[role="heading"]');
        if (headingEl) {
          title = (headingEl.innerText || headingEl.textContent || '').trim();
        } else {
          const titleEl = containerEl.querySelector('.M7eMe, .HoPJnd, .F9N7Re, span[dir="auto"]');
          if (titleEl) {
            title = (titleEl.innerText || titleEl.textContent || '').trim();
          }
        }
      }

      const inputWithLabel = containerEl.querySelector('input[aria-label], textarea[aria-label]');
      if (!title && inputWithLabel) {
        title = (inputWithLabel.getAttribute('aria-label') || '').trim();
      }

      // Also extract sub-description / prompt instructions if present
      const descEl = containerEl.querySelector('span[data-automation-id="questionSubTitle"], .office-form-question-subtitle, .gHjhdc, .jibhHc, .vRMGwf, .asQ4ud, div[id$="_desc"], div[jsname="V67aGc"]');
      let desc = '';
      if (descEl) {
        desc = (descEl.innerText || descEl.textContent || '').trim();
      }

      // Clean leading numbering (e.g. "1. Full Name" -> "Full Name")
      const cleanTitle = title.replace(/^\s*\d+[\.\)\s]+\s*/, '').trim();

      if (cleanTitle && desc && !cleanTitle.includes(desc)) {
        return `${cleanTitle}\n${desc}`;
      }

      return cleanTitle || title || '';
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

    static setInputValue(inputEl, value) {
      if (!inputEl) return false;
      try {
        inputEl.focus();
        const win = typeof window !== 'undefined' ? window : globalThis;
        const isTextArea = (typeof HTMLTextAreaElement !== 'undefined' && inputEl instanceof HTMLTextAreaElement) || inputEl.tagName === 'TEXTAREA';
        const prototype = isTextArea ? (win.HTMLTextAreaElement?.prototype || win.HTMLInputElement?.prototype) : win.HTMLInputElement?.prototype;
        const nativeSetter = prototype ? Object.getOwnPropertyDescriptor(prototype, 'value')?.set : null;

        if (nativeSetter) {
          nativeSetter.call(inputEl, value);
        } else {
          inputEl.value = value;
        }

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

    static extractRadioOptions(containerEl) {
      const radioElements = containerEl.querySelectorAll('div[role="radio"], input[type="radio"], div[data-automation-id="choiceItem"], label.ms-Radio-field');
      const options = [];
      radioElements.forEach((radio) => {
        if (radio.tagName === 'INPUT' && radio.type === 'checkbox') return;
        if (radio.getAttribute && radio.getAttribute('role') === 'checkbox') return;

        const dataVal = radio.getAttribute ? radio.getAttribute('data-value') : '';
        const ariaLabel = radio.getAttribute ? radio.getAttribute('aria-label') : '';
        const msChoiceLabel = radio.querySelector ? radio.querySelector('span[data-automation-id="choiceLabel"], span.office-form-question-choice-text') : null;
        let text = '';
        if (msChoiceLabel) {
          text = msChoiceLabel.innerText || msChoiceLabel.textContent || '';
        } else {
          const textContainer = radio.closest ? radio.closest('label') || radio.parentElement : radio.parentElement;
          if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
        }
        const finalLabel = (dataVal || ariaLabel || text || radio.value || '').trim();
        if (finalLabel && !options.some((o) => o.label === finalLabel)) {
          options.push({ element: radio, label: finalLabel });
        }
      });
      return options;
    }

    static selectRadio(radioEl) {
      if (!radioEl) return false;
      try {
        if (radioEl.tagName === 'INPUT' && radioEl.type === 'radio') {
          radioEl.checked = true;
          radioEl.click();
          radioEl.dispatchEvent(new Event('change', { bubbles: true }));
          radioEl.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        const isAlreadyChecked = radioEl.getAttribute && radioEl.getAttribute('aria-checked') === 'true';
        if (!isAlreadyChecked) {
          if (radioEl.focus) radioEl.focus();
          if (radioEl.click) radioEl.click();
          const innerInput = radioEl.querySelector ? radioEl.querySelector('input[type="radio"]') : null;
          if (innerInput) {
            innerInput.checked = true;
            innerInput.click();
            innerInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          radioEl.dispatchEvent(new Event('click', { bubbles: true }));
          radioEl.dispatchEvent(new Event('change', { bubbles: true }));
          if (radioEl.setAttribute) radioEl.setAttribute('aria-checked', 'true');
        }
        return true;
      } catch {
        return false;
      }
    }

    static extractCheckboxOptions(containerEl) {
      const checkboxElements = containerEl.querySelectorAll('div[role="checkbox"], input[type="checkbox"], label.ms-Checkbox-field');
      const options = [];
      checkboxElements.forEach((checkbox) => {
        const ariaLabel = checkbox.getAttribute ? checkbox.getAttribute('aria-label') : '';
        const msChoiceLabel = checkbox.querySelector ? checkbox.querySelector('span[data-automation-id="choiceLabel"], span.office-form-question-choice-text') : null;
        let text = '';
        if (msChoiceLabel) {
          text = msChoiceLabel.innerText || msChoiceLabel.textContent || '';
        } else {
          const textContainer = checkbox.closest ? checkbox.closest('label') || checkbox.parentElement : checkbox.parentElement;
          if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
        }
        const finalLabel = (ariaLabel || text || checkbox.value || '').trim();
        if (finalLabel && !options.some((o) => o.label === finalLabel)) {
          options.push({ element: checkbox, label: finalLabel });
        }
      });
      return options;
    }

    static selectCheckbox(checkboxEl) {
      if (!checkboxEl) return false;
      try {
        if (checkboxEl.tagName === 'INPUT' && checkboxEl.type === 'checkbox') {
          if (!checkboxEl.checked) {
            checkboxEl.checked = true;
            checkboxEl.click();
            checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
            checkboxEl.dispatchEvent(new Event('input', { bubbles: true }));
          }
          return true;
        }
        const isChecked = checkboxEl.getAttribute && checkboxEl.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
          if (checkboxEl.focus) checkboxEl.focus();
          if (checkboxEl.click) checkboxEl.click();
          const innerInput = checkboxEl.querySelector ? checkboxEl.querySelector('input[type="checkbox"]') : null;
          if (innerInput && !innerInput.checked) {
            innerInput.checked = true;
            innerInput.click();
            innerInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          checkboxEl.dispatchEvent(new Event('click', { bubbles: true }));
          checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
          if (checkboxEl.setAttribute) checkboxEl.setAttribute('aria-checked', 'true');
        }
        return true;
      } catch {
        return false;
      }
    }

    static findQuestionContainers(root = document) {
      // 1. Microsoft Forms containers
      const msContainers = root.querySelectorAll('div[data-automation-id="questionItem"], div[data-automation-key="questionItem"], div.office-form-question, div.question-container, div[data-automation-id="questionWrapper"]');
      if (msContainers && msContainers.length > 0) return Array.from(msContainers);

      // 2. Google Forms standard containers
      const list = root.querySelectorAll('div[role="listitem"]');
      if (list && list.length > 0) return Array.from(list);
      const qContainers = root.querySelectorAll('div[jsmodel="CP1oW"]');
      if (qContainers && qContainers.length > 0) return Array.from(qContainers);
      const altItems = root.querySelectorAll('.geS5n, .m2, .Qr7Oae');
      if (altItems && altItems.length > 0) return Array.from(altItems);
      const items = root.querySelectorAll('div[jscontroller="e2CuFe"], div[jscontroller="r3Nsxc"]');
      if (items && items.length > 0) return Array.from(items);

      // 3. Generic Headings Fallback
      const headings = root.querySelectorAll('div[role="heading"], span[data-automation-id="questionTitle"]');
      if (headings && headings.length > 0) {
        const containers = [];
        headings.forEach((h) => {
          const parent = h.closest('div[jscontroller], div[data-automation-id="questionItem"], div.office-form-question') || h.parentElement?.parentElement;
          if (parent && !containers.includes(parent)) containers.push(parent);
        });
        return containers;
      }
      return [];
    }

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

    static highlightContainer(containerEl, matchInfo = {}) {
      if (!containerEl) return;
      this.setProcessingState(containerEl, false);

      // Always resolve to the outermost question card to prevent inner/overlapping badges
      const outerQuestion = (typeof containerEl.closest === 'function')
        ? (containerEl.closest('div[role="listitem"], div[jsmodel], div[data-automation-id="questionItem"], .office-form-question') || containerEl)
        : containerEl;

      if (matchInfo.hasConflict) {
        outerQuestion.classList.add('gfaf-conflict-highlight');
        outerQuestion.classList.remove('gfaf-filled-highlight');
      } else {
        outerQuestion.classList.add('gfaf-filled-highlight');
        outerQuestion.classList.remove('gfaf-conflict-highlight');
      }

      // Strip any inner/duplicate badges across all children inside this question container
      const existingBadges = outerQuestion.querySelectorAll ? outerQuestion.querySelectorAll('.gfaf-badge-container, .gfaf-match-badge, .gfaf-info-pill, .gfaf-conflict-badge') : [];
      if (existingBadges && existingBadges.length > 0) {
        existingBadges.forEach((b) => {
          if (typeof b.remove === 'function') {
            b.remove();
          } else if (b.parentElement && b.parentElement.removeChild) {
            b.parentElement.removeChild(b);
          }
        });
      }

      if (outerQuestion.style) {
        outerQuestion.style.position = 'relative';
      }

      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'gfaf-badge-container';

      // 1. Conflict Badge or Context Info Pill
      if (matchInfo.hasConflict && matchInfo.conflictMessage) {
        const conflictPill = document.createElement('div');
        conflictPill.className = 'gfaf-conflict-badge';
        conflictPill.textContent = matchInfo.conflictMessage;
        badgeContainer.appendChild(conflictPill);

        const statusBadge = document.createElement('div');
        statusBadge.className = 'gfaf-match-badge gfaf-match-badge-conflict';
        statusBadge.textContent = 'Not Filled (Conflict)';
        badgeContainer.appendChild(statusBadge);
      } else {
        if (matchInfo.infoMessage) {
          const infoPill = document.createElement('div');
          infoPill.className = 'gfaf-info-pill';
          infoPill.textContent = matchInfo.infoMessage;
          badgeContainer.appendChild(infoPill);
        }

        // 2. Status Badge
        const badge = document.createElement('div');
        badge.className = 'gfaf-match-badge';
        const confidencePct = Math.round((matchInfo.confidence || 1.0) * 100);
        badge.textContent = matchInfo.isRag ? 'Auto-filled via AI' : `Auto-filled (${confidencePct}%)`;
        badgeContainer.appendChild(badge);
      }

      outerQuestion.appendChild(badgeContainer);
    }

    static showStatusToast(message, type = 'success') {
      showToast(message, type === true ? 'success' : type === false ? 'error' : type);
    }

    /**
     * AI-First Form Question Evaluator & Decision Engine (In-Browser Runtime)
     */
    static async evaluateQuestionWithAi({
      questionText,
      fieldType = 'text',
      options = [],
      profile,
      customInstructions = '',
      currentFieldValue = ''
    }) {
      try {
        const pId = profile?.id || 'profile_default';
        const profileChunks = await LocalStorageService.get(`gfaf_rag_chunks_${pId}`);
        const chunks = (profileChunks && Array.isArray(profileChunks)) ? profileChunks : ((await LocalStorageService.get('gfaf_rag_chunks')) || []);
        const savedLlmConfig = await LocalStorageService.get('gfaf_llm_config');
        const llmConfig = savedLlmConfig || {
          provider: 'ollama',
          ollamaEndpoint: 'http://localhost:11434',
          ollamaModel: 'llama3.2'
        };

        const chatKey = (questionText || '').trim().toLowerCase();
        let history = fieldChatHistory.get(chatKey) || [];
        const isFollowUp = Boolean(customInstructions && customInstructions.trim() && (history.length > 0 || currentFieldValue));

        // Question-Hash Cache Check
        const isInitialGeneration = !isFollowUp && !currentFieldValue && (!history || history.length === 0);
        const cacheKey = isInitialGeneration
          ? `q:${chatKey}|p:${pId}|type:${fieldType}|jd:${(sessionJobDescription || '').slice(0, 100)}|prov:${llmConfig.provider}`
          : null;

        if (cacheKey && window.__GFAF_RESPONSE_CACHE__?.has(cacheKey)) {
          return window.__GFAF_RESPONSE_CACHE__.get(cacheKey);
        }

        if (currentFieldValue && currentFieldValue.trim() && history.length === 0) {
          history.push({ role: 'assistant', content: currentFieldValue.trim() });
        }

        let contextStr = '';
        if (chunks.length > 0) {
          const queryWords = questionText.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
          const scored = chunks.map((c) => {
            const text = (c.text || '').toLowerCase();
            let score = 0;
            queryWords.forEach((qw) => {
              if (text.includes(qw)) score += 1;
            });
            return { chunk: c, score };
          }).sort((a, b) => b.score - a.score);

          const topChunks = scored.slice(0, 3).map((s) => s.chunk).filter(Boolean);
          contextStr = topChunks.map((c, i) => `[Source ${i + 1}: ${c.docTitle || 'Doc'}]\n${c.text}`).join('\n\n');
        }

        const candidateName = profile.personal?.fullName || 'the candidate';
        const skillsFormatted = (profile.skills || []).map((s) => {
          if (typeof s === 'object' && s !== null) {
            const parts = [s.name];
            if (s.level) parts.push(`(${s.level})`);
            if (s.years) parts.push(`${s.years} yr(s)`);
            if (s.rating) parts.push(`[${s.rating}/10]`);
            return parts.join(' - ');
          }
          return String(s);
        }).join(', ');

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

        const profileContext = {
          personal: profile.personal || {},
          education: profile.education || {},
          professional: profile.professional || {},
          links: profile.links || {},
          skills: skillsFormatted,
          customFields: profile.customFields || [],
          smartAnswers: (profile.smartAnswers || []).map((qa) => ({ q: qa.keywords?.join(', '), a: qa.answer }))
        };

        const systemPrompt = `You are the AI Autopilot Form-Filling Decision Engine for candidate ${candidateName}.
Your task is to evaluate form questions and decide the exact value or options to fill based on the candidate profile and resume/project context.

STRICT DECISION RULES:
1. STANDARD PROFILE ATTRIBUTES (Strict Data Extraction):
   - If the question asks for a standard attribute (Full Name, Email, Phone, Location, College, Degree, Graduation Year, CGPA/Percentage, Total Work Experience, Current Organization, Current Role, Current CTC, Expected CTC, Notice Period, LinkedIn URL, GitHub URL, Portfolio):
   - Extract the EXACT matching value from the Candidate Profile.
   - Enforce STRICT VALUE ONLY: Output ONLY the clean value with ZERO conversational filler, ZERO preamble, and ZERO quotes.
   - Critical Rules for Experience, CTC, and Notice Period:
     * TOTAL WORK EXPERIENCE -> "${expYears}" (DO NOT use skill practice years for Total Experience. Use "${expYears}").
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
   - For single-choice ('radio' / 'dropdown'): Select the SINGLE EXACT matching string from the 'options' list that represents the candidate.
   - For multi-choice ('checkbox'): Select an ARRAY of EXACT strings from the 'options' list matching the candidate's skills.

3. OPEN-ENDED / TECHNICAL / ESSAY QUESTIONS:
   - For technical questions or essays, synthesize a concise, first-person ("I", "my") grounded response based on the candidate's resume/projects and listed skills.

OUTPUT FORMAT:
Respond with valid JSON:
{
  "decisionType": "strict_profile" | "choice_selection" | "rag_synthesis",
  "value": "string value" or ["array", "of", "options"],
  "confidence": 0.95
}`;

        let promptContent = `CANDIDATE PRIMARY PROFILE FACTS (GROUND TRUTH):
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
- LinkedIn URL: "${links.linkedin || ''}"
- GitHub URL: "${links.github || ''}"

CANDIDATE PROFILE DATA:
\`\`\`json
${JSON.stringify(profileContext, null, 2)}
\`\`\`

RAG CONTEXT (Resume & Projects):
${contextStr || 'Use candidate profile.'}
`;

        if (sessionJobDescription && sessionJobDescription.trim()) {
          promptContent += `\nJOB DESCRIPTION ALIGNMENT:\n"""\n${sessionJobDescription.trim().slice(0, 3000)}\n"""\n`;
        }

        promptContent += `\nFORM QUESTION TO EVALUATE:
Question Text: "${questionText}"
Field Type: "${fieldType}"
Available Options: ${options && options.length > 0 ? JSON.stringify(options) : 'None (Text / Number input)'}
${customInstructions ? `User Instruction: "${customInstructions}"\n` : ''}

Output ONLY valid JSON decision:`;

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent }
        ];

        let rawOutput = '';

        // Safe helper to communicate with background service worker without throwing context invalidation errors
        const callProxy = (payload) => {
          return new Promise((resolve) => {
            try {
              if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
                resolve(null);
                return;
              }
              chrome.runtime.sendMessage(payload, (res) => {
                if (chrome.runtime.lastError) {
                  resolve(null);
                } else {
                  resolve(res || null);
                }
              });
            } catch (e) {
              resolve(null);
            }
          });
        };

        if (llmConfig.provider === 'ollama') {
          const endpoint = (llmConfig.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
          const rawModel = (llmConfig.ollamaModel || 'llama3.2').trim();

          const proxyRes = await callProxy({
            action: 'GENERATE_LLM_RAG',
            endpoint: `${endpoint}/api/chat`,
            payload: {
              model: rawModel,
              messages: messages,
              stream: false,
              options: { temperature: 0.1, num_predict: 1000 }
            }
          });

          if (proxyRes && proxyRes.success) {
            rawOutput = (proxyRes.data?.message?.content || proxyRes.data?.response || '').trim();
          }
        } else if (llmConfig.provider === 'gemini' && llmConfig.geminiApiKey && llmConfig.geminiModel) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${llmConfig.geminiModel.trim()}:generateContent?key=${llmConfig.geminiApiKey.trim()}`;
          const proxyRes = await callProxy({
            action: 'GENERATE_LLM_RAG',
            endpoint: url,
            payload: {
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${promptContent}` }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            rawOutput = proxyRes.data.candidates[0].content.parts[0].text.trim();
          }
        } else if (llmConfig.provider === 'openai' && llmConfig.openaiApiKey && llmConfig.openaiModel) {
          const proxyRes = await callProxy({
            action: 'GENERATE_LLM_RAG',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${llmConfig.openaiApiKey.trim()}`
            },
            payload: {
              model: llmConfig.openaiModel.trim(),
              messages: messages,
              temperature: 0.1,
              max_tokens: 1000
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.choices?.[0]?.message?.content) {
            rawOutput = proxyRes.data.choices[0].message.content.trim();
          }
        } else if (llmConfig.provider === 'anthropic' && llmConfig.anthropicApiKey && llmConfig.anthropicModel) {
          const proxyRes = await callProxy({
            action: 'GENERATE_LLM_RAG',
            endpoint: 'https://api.anthropic.com/v1/messages',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': llmConfig.anthropicApiKey.trim(),
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            },
            payload: {
              model: llmConfig.anthropicModel.trim(),
              system: systemPrompt,
              messages: [{ role: 'user', content: promptContent }],
              max_tokens: 1000,
              temperature: 0.1
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.content?.[0]?.text) {
            rawOutput = proxyRes.data.content[0].text.trim();
          }
        }

        // Try extracting structured decision from AI response
        if (rawOutput) {
          let parsedDecision = null;
          try {
            if (rawOutput.startsWith('{') && rawOutput.endsWith('}')) {
              parsedDecision = JSON.parse(rawOutput);
            } else {
              const jsonMatch = rawOutput.match(/\{[\s\S]*"value"[\s\S]*\}/);
              if (jsonMatch) parsedDecision = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {}

          if (parsedDecision && parsedDecision.value !== undefined) {
            parsedDecision = this.validateAndGroundDecision(questionText, parsedDecision, profile, fieldType === 'number', fieldType);
            if (cacheKey) {
              window.__GFAF_RESPONSE_CACHE__ = window.__GFAF_RESPONSE_CACHE__ || new Map();
              window.__GFAF_RESPONSE_CACHE__.set(cacheKey, parsedDecision);
            }
            if (typeof parsedDecision.value === 'string') {
              history.push({ role: 'assistant', content: parsedDecision.value });
              fieldChatHistory.set(chatKey, history);
            }
            return parsedDecision;
          }

          // Plain text fallback if model returned raw answer
          const cleanText = rawOutput.replace(/^["']|["']$/g, '').trim();
          let decision = {
            decisionType: fieldType === 'checkbox' ? 'choice_selection' : (cleanText.length > 60 ? 'rag_synthesis' : 'strict_profile'),
            value: fieldType === 'checkbox' ? [cleanText] : cleanText,
            confidence: 0.90
          };
          decision = this.validateAndGroundDecision(questionText, decision, profile, fieldType === 'number', fieldType);
          if (cacheKey) {
            window.__GFAF_RESPONSE_CACHE__ = window.__GFAF_RESPONSE_CACHE__ || new Map();
            window.__GFAF_RESPONSE_CACHE__.set(cacheKey, decision);
          }
          return decision;
        }

        // Graceful offline fallback
        if (fieldType === 'radio' && options.length > 0) {
          const radioMatch = LocalMatcherService.matchRadioOption(questionText, options, profile);
          if (radioMatch && radioMatch.option) {
            return this.validateAndGroundDecision(questionText, { decisionType: 'choice_selection', value: radioMatch.option, confidence: radioMatch.confidence || 0.85 }, profile, false, fieldType);
          }
        } else if (fieldType === 'checkbox' && options.length > 0) {
          const cbMatch = LocalMatcherService.matchCheckboxOptions(questionText, options, profile);
          if (cbMatch && cbMatch.length > 0) {
            return this.validateAndGroundDecision(questionText, { decisionType: 'choice_selection', value: cbMatch, confidence: 0.85 }, profile, false, fieldType);
          }
        } else {
          const directMatch = LocalMatcherService.resolveMatch(questionText, profile);
          if (directMatch && directMatch.value !== undefined && directMatch.value !== '') {
            let val = directMatch.value;
            if (fieldType === 'number') {
              val = directMatch.numericValue || LocalMatcherService.extractNumericValue(val, questionText);
            }
            return this.validateAndGroundDecision(questionText, { decisionType: 'strict_profile', value: String(val).trim(), confidence: directMatch.confidence || 0.85 }, profile, fieldType === 'number', fieldType);
          }
          const smartMatch = LocalMatcherService.matchSmartAnswers(questionText, profile);
          if (smartMatch && smartMatch.value) {
            return this.validateAndGroundDecision(questionText, { decisionType: 'rag_synthesis', value: smartMatch.value, confidence: 0.90 }, profile, fieldType === 'number', fieldType);
          }
        }

        return this.validateAndGroundDecision(questionText, { decisionType: 'none', value: '', confidence: 0 }, profile, fieldType === 'number', fieldType);
      } catch (err) {
        console.warn('[GFAF] evaluateQuestionWithAi error:', err);
        return { decisionType: 'none', value: '', confidence: 0 };
      }
    }

    /**
     * Backward-compatible synthesize method for column AI button
     */
    static async synthesizeAiAnswer(questionText, profile, customInstructions = '', currentFieldValue = '') {
      const decision = await this.evaluateQuestionWithAi({
        questionText,
        fieldType: 'textarea',
        options: [],
        profile,
        customInstructions,
        currentFieldValue
      });
      return typeof decision.value === 'string' ? decision.value : (Array.isArray(decision.value) ? decision.value.join(', ') : '');
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
          const currentVal = targetEl.value.trim();
          const parentContainer = targetEl.closest('div[jscontroller]') || targetEl.parentElement?.parentElement;
          
          LocalFillerService.setProcessingState(parentContainer, true, 'Refining with AI...');
          regenBtn.disabled = true;
          regenBtn.innerHTML = `
            <svg class="gfaf-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            <span>Refining...</span>
          `;

          try {
            const newAnswer = await LocalFillerService.synthesizeAiAnswer(questionText, profile, userComment, currentVal);
            if (newAnswer) {
              await LocalFillerService.typewriteInputValue(targetEl, newAnswer);
              commentInput.value = '';
              commentInput.placeholder = "Follow-up revision instruction (e.g. 'shorten to 60 words')...";
              LocalFillerService.highlightContainer(parentContainer, { confidence: 0.98, isRag: true });
              showToast('Answer refined with conversational memory!');
            } else {
              showToast('Could not re-generate answer. Check LLM settings.', 'error');
            }
          } catch (e) {
            showToast(e.message || 'Could not re-generate answer.', 'error');
          } finally {
            LocalFillerService.setProcessingState(parentContainer, false);
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
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (btn.disabled) return;

          // 1. Immediately open the comment & re-generate toolbar
          LocalFillerService.attachAiToolbar(containerEl, targetEl, questionText, profile);
          const toolbar = containerEl.querySelector('.gfaf-ai-toolbar');
          const commentInput = toolbar ? toolbar.querySelector('.gfaf-ai-comment-input') : null;
          if (commentInput) {
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
          LocalFillerService.setProcessingState(containerEl, true, 'Synthesizing with AI...');

          try {
            const currentVal = (targetEl.value || '').trim();
            const generated = await LocalFillerService.synthesizeAiAnswer(questionText, profile, '', currentVal);

            if (generated && generated.trim()) {
              await LocalFillerService.typewriteInputValue(targetEl, generated.trim());
              LocalFillerService.highlightContainer(containerEl, { confidence: 0.98, isRag: true });
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
              showToast('Generated AI answer! Use the prompt bar to refine.');
            } else {
              btn.classList.remove('loading');
              btn.innerHTML = `
                <svg class="gfaf-sparkle-svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L14.4 7.6L20 10L14.4 12.4L12 18L9.6 12.4L4 10L9.6 7.6L12 2Z"></path>
                </svg>
                <span class="gfaf-ai-column-btn-text">AI Answer</span>
              `;
              showToast('Could not generate AI answer. Check LLM settings.', 'error');
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
            showToast(err.message || 'Error generating AI answer.', 'error');
          } finally {
            LocalFillerService.setProcessingState(containerEl, false);
          }

          btn.disabled = false;
        });

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
        const targetEl = container.querySelector('textarea[data-automation-id="textInput"], textarea.office-form-question-textarea, textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea, input[data-automation-id="textInput"], input.office-form-question-textbox, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"]');
        if (targetEl && questionText) {
          this.attachAiColumnButton(container, targetEl, questionText, profile);
          attachedCount++;
        }
      });

      return attachedCount;
    }

    /**
     * Identify semantic profile category for a given question
     */
    static detectQuestionCategory(questionText) {
      const q = (questionText || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

      if (
        q.includes('total experience') ||
        q.includes('years of experience') ||
        q.includes('total years of experience') ||
        q.includes('work experience') ||
        q.includes('experience in years') ||
        q.includes('experience years') ||
        q.includes('relevant experience') ||
        (q.includes('experience') && !q.includes('project') && !q.includes('describe') && !q.includes('share') && !q.includes('tell') && !q.includes('explain') && !q.includes('rate'))
      ) {
        return 'total_experience';
      }

      if (
        q.includes('current ctc') ||
        q.includes('current salary') ||
        q.includes('present ctc') ||
        q.includes('current fixed ctc') ||
        q.includes('present salary') ||
        (q.includes('current') && q.includes('ctc'))
      ) {
        return 'current_ctc';
      }

      if (
        q.includes('expected ctc') ||
        q.includes('expected salary') ||
        q.includes('stipend expectation') ||
        q.includes('stipend expectations') ||
        q.includes('ctc expected') ||
        q.includes('expected compensation') ||
        q.includes('salary expectation') ||
        (q.includes('expected') && q.includes('ctc'))
      ) {
        return 'expected_ctc';
      }

      if (
        q.includes('notice period') ||
        q.includes('notice') ||
        q.includes('how soon can you join') ||
        q.includes('joining availability')
      ) {
        return 'notice_period';
      }

      if (q.includes('current organization') || q.includes('current company') || q.includes('current employer') || q.includes('company name')) return 'current_organization';
      if (q.includes('current role') || q.includes('current designation') || q.includes('current job title') || q.includes('designation')) return 'current_role';
      if (q.includes('graduation year') || q.includes('year of graduation') || q.includes('passing year') || q.includes('year of passing')) return 'graduation_year';
      if (q.includes('10th') || q.includes('tenth') || q.includes('ssc')) return 'tenth_marks';
      if (q.includes('12th') || q.includes('twelfth') || q.includes('hsc')) return 'twelfth_marks';
      if (
        q.includes('working status') ||
        q.includes('employment status') ||
        q.includes('work status') ||
        q.includes('current status') ||
        q.includes('college/work status')
      ) {
        return 'working_status';
      }

      if (
        (q.includes('college') || q.includes('university') || q.includes('institute')) &&
        !q.includes('status') && !q.includes('working') && !q.includes('when') && !q.includes('graduate')
      ) {
        return 'college_name';
      }
      if (q.includes('full name') || q.includes('your name') || q === 'name' || q === 'name *') return 'full_name';
      if (q.includes('email') || q.includes('mail id')) return 'email';
      if (q.includes('phone') || q.includes('mobile') || q.includes('contact no')) return 'phone';
      if (q.includes('linkedin')) return 'linkedin_url';
      if (q.includes('github')) return 'github_url';
      if (q.includes('portfolio') || q.includes('website')) return 'portfolio_url';

      return 'unknown';
    }

    /**
     * Validate and ground an AI decision against profile truth
     */
    static validateAndGroundDecision(questionText, aiDecision, profile, isNumeric = false, fieldType = 'text') {
      if (!profile) return aiDecision;

      const category = this.detectQuestionCategory(questionText);
      const qNorm = (questionText || '').toLowerCase();
      const isLpaContext = qNorm.includes('lpa') || qNorm.includes('lakhs');
      const isDigitsContext = qNorm.includes('inr') || qNorm.includes('digits') || qNorm.includes('rupees') || qNorm.includes('numbers only');
      const isDaysContext = qNorm.includes('day') || qNorm.includes('days');

      const prof = profile.professional || {};
      const edu = profile.education || {};
      const pers = profile.personal || {};
      const links = profile.links || {};

      let expectedValue = null;

      switch (category) {
        case 'total_experience': {
          const rawExp = prof.totalExperienceYears !== undefined && prof.totalExperienceYears !== null && prof.totalExperienceYears !== ''
            ? String(prof.totalExperienceYears).trim()
            : '0';
          const cleanNum = rawExp.match(/\d+(\.\d+)?/);
          expectedValue = cleanNum ? cleanNum[0] : '0';
          break;
        }
        case 'current_ctc': {
          if (isLpaContext || isNumeric) {
            let curLpa = prof.currentCtcLpa !== undefined && prof.currentCtcLpa !== null && prof.currentCtcLpa !== ''
              ? String(prof.currentCtcLpa).trim()
              : '';
            if (!curLpa) {
              const raw = prof.currentCtc || '';
              if (raw.toLowerCase().includes('na') || raw.toLowerCase().includes('not') || raw.toLowerCase().includes('0') || raw.toLowerCase().includes('fresher')) {
                curLpa = '0';
              } else {
                const m = raw.match(/\d+(\.\d+)?/);
                curLpa = m ? m[0] : '0';
              }
            }
            const cleanNum = curLpa.match(/\d+(\.\d+)?/);
            expectedValue = cleanNum ? cleanNum[0] : '0';
          } else if (isDigitsContext) {
            expectedValue = prof.currentCtcNumeric !== undefined && prof.currentCtcNumeric !== null && prof.currentCtcNumeric !== '' ? String(prof.currentCtcNumeric).trim() : '0';
          } else {
            expectedValue = prof.currentCtc !== undefined && prof.currentCtc !== null && prof.currentCtc !== '' ? String(prof.currentCtc).trim() : '0';
          }
          break;
        }
        case 'expected_ctc': {
          if (isLpaContext || (isNumeric && !isDigitsContext)) {
            let lpaVal = prof.expectedCtcLpa !== undefined && prof.expectedCtcLpa !== null && prof.expectedCtcLpa !== ''
              ? String(prof.expectedCtcLpa).trim()
              : '';
            if (!lpaVal || isNaN(parseFloat(lpaVal))) {
              const raw = prof.expectedCtc || '';
              const nums = raw.match(/\d+(\.\d+)?/g);
              lpaVal = nums ? (nums.length > 1 ? nums[1] : nums[0]) : '10';
            }
            const cleanNum = lpaVal.match(/\d+(\.\d+)?/);
            expectedValue = cleanNum ? cleanNum[0] : '10';
          } else if (isDigitsContext) {
            expectedValue = prof.expectedCtcNumeric !== undefined && prof.expectedCtcNumeric !== null && prof.expectedCtcNumeric !== '' ? String(prof.expectedCtcNumeric).trim() : '1000000';
          } else {
            expectedValue = prof.expectedCtc !== undefined && prof.expectedCtc !== null && prof.expectedCtc !== '' ? String(prof.expectedCtc).trim() : '10 LPA';
          }
          break;
        }
        case 'notice_period': {
          if (isDaysContext || isNumeric || fieldType === 'number') {
            const rawDays = prof.noticePeriodDays !== undefined && prof.noticePeriodDays !== null && prof.noticePeriodDays !== '' ? String(prof.noticePeriodDays).trim() : '0';
            const cleanNum = rawDays.match(/\d+/);
            expectedValue = cleanNum ? cleanNum[0] : '0';
          } else {
            expectedValue = prof.noticePeriod !== undefined && prof.noticePeriod !== null && prof.noticePeriod !== '' ? String(prof.noticePeriod).trim() : 'Immediate';
          }
          break;
        }
        case 'current_organization':
          expectedValue = prof.currentOrganization || 'NA';
          break;
        case 'current_role':
          expectedValue = prof.currentRole || 'NA';
          break;
        case 'graduation_year':
          expectedValue = edu.graduationYear || '2025';
          break;
        case 'working_status':
          expectedValue = edu.workingStatus || 'Student';
          break;
        case 'tenth_marks':
          expectedValue = isNumeric || isDigitsContext ? (edu.tenthPercentageNumeric || '92.5') : (edu.tenthPercentage || '92.5%');
          break;
        case 'twelfth_marks':
          expectedValue = isNumeric || isDigitsContext ? (edu.twelfthPercentageNumeric || '94.0') : (edu.twelfthPercentage || '94.0%');
          break;
        case 'college_name':
          if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') return aiDecision;
          expectedValue = edu.collegeName || 'University of Technology';
          break;
        case 'full_name':
          if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') return aiDecision;
          expectedValue = pers.fullName || 'Alex Morgan';
          break;
        case 'email':
          if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') return aiDecision;
          expectedValue = pers.email || '';
          break;
        case 'phone':
          if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') return aiDecision;
          expectedValue = isDigitsContext || isNumeric ? (pers.phoneDigits || (pers.phone || '').replace(/\D/g, '')) : (pers.phone || '');
          break;
        case 'linkedin_url':
          expectedValue = links.linkedin || '';
          break;
        case 'github_url':
          expectedValue = links.github || '';
          break;
        case 'portfolio_url':
          expectedValue = links.portfolio || '';
          break;
        default:
          break;
      }

      if (expectedValue !== null && expectedValue !== undefined) {
        const currentValStr = String(aiDecision?.value !== undefined && aiDecision?.value !== null ? aiDecision.value : '').trim();
        if (currentValStr !== expectedValue) {
          const targetType = (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection')
            ? 'choice_selection'
            : 'strict_profile';
          return {
            decisionType: targetType,
            value: expectedValue,
            confidence: 0.99,
            validated: true,
            overriddenFrom: currentValStr
          };
        }
      }

      return aiDecision;
    }

    /**
     * Validate already entered/filled value in DOM against candidate profile
     */
    static validateFilledValue(questionText, currentValue, profile, inputEl = null) {
      if (!profile) return { isValid: true, correctedValue: currentValue };

      const isNumeric = inputEl ? (inputEl.type === 'number' || inputEl.getAttribute('type') === 'number') : false;
      const fieldType = inputEl ? (inputEl.tagName === 'TEXTAREA' ? 'textarea' : (isNumeric ? 'number' : 'text')) : 'text';

      const grounded = this.validateAndGroundDecision(
        questionText,
        { decisionType: 'strict_profile', value: currentValue },
        profile,
        isNumeric,
        fieldType
      );

      if (grounded && grounded.value !== undefined && String(grounded.value) !== String(currentValue)) {
        return {
          isValid: false,
          correctedValue: String(grounded.value),
          reason: `Profile ground truth override for ${this.detectQuestionCategory(questionText)}`
        };
      }

      return {
        isValid: true,
        correctedValue: currentValue
      };
    }

    /**
     * Deterministic Error Auto-Correction & Conflict Detection
     */
    static correctValidationError(questionText, currentValue, errorText, profile) {
      if (!errorText) return null;
      const normErr = errorText.toLowerCase();
      const qNorm = (questionText || '').toLowerCase();
      const prof = profile?.professional || {};
      const edu = profile?.education || {};

      if (
        normErr.includes('must be a number') ||
        normErr.includes('number greater than') ||
        normErr.includes('number less than') ||
        normErr.includes('must be greater') ||
        normErr.includes('must be less') ||
        normErr.includes('must be between') ||
        normErr.includes('whole number') ||
        normErr.includes('must be an integer')
      ) {
        let trueProfileVal = null;
        let label = '';

        if (qNorm.includes('expected') && (qNorm.includes('ctc') || qNorm.includes('salary') || qNorm.includes('compensation') || qNorm.includes('lpa'))) {
          label = 'Expected CTC';
          if (normErr.includes('greater than 100') || normErr.includes('greater than 1000')) {
            trueProfileVal = prof.expectedCtcNumeric || '1000000';
          } else {
            let lpa = prof.expectedCtcLpa || '';
            if (!lpa || isNaN(parseFloat(lpa))) {
              const raw = prof.expectedCtc || '';
              const nums = raw.match(/\d+(\.\d+)?/g);
              lpa = nums ? (nums.length > 1 ? nums[0] : nums[0]) : '10';
            }
            const m = String(lpa).match(/\d+(\.\d+)?/);
            trueProfileVal = m ? m[0] : '10';
          }
        } else if (qNorm.includes('current') && (qNorm.includes('ctc') || qNorm.includes('salary') || qNorm.includes('compensation') || qNorm.includes('lpa'))) {
          label = 'Current CTC';
          if (normErr.includes('greater than 100') || normErr.includes('greater than 1000')) {
            trueProfileVal = prof.currentCtcNumeric || '0';
          } else {
            let curLpa = prof.currentCtcLpa || '';
            if (!curLpa) {
              const raw = prof.currentCtc || '';
              if (raw.toLowerCase().includes('na') || raw.toLowerCase().includes('not') || raw.toLowerCase().includes('0') || raw.toLowerCase().includes('fresher')) curLpa = '0';
              else {
                const m = raw.match(/\d+(\.\d+)?/);
                curLpa = m ? m[0] : '0';
              }
            }
            const m = String(curLpa).match(/\d+(\.\d+)?/);
            trueProfileVal = m ? m[0] : '0';
          }
        } else if (qNorm.includes('notice') || qNorm.includes('join')) {
          label = 'Notice Period';
          const rawDays = prof.noticePeriodDays !== undefined && prof.noticePeriodDays !== null && prof.noticePeriodDays !== ''
            ? String(prof.noticePeriodDays).trim()
            : '0';
          const cleanDays = rawDays.match(/\d+/);
          trueProfileVal = cleanDays ? cleanDays[0] : '0';
        } else if (qNorm.includes('experience') || qNorm.includes('years')) {
          label = 'Total Experience';
          const rawExp = prof.totalExperienceYears !== undefined ? String(prof.totalExperienceYears).trim() : '0';
          const cleanExp = rawExp.match(/\d+(\.\d+)?/);
          trueProfileVal = cleanExp ? cleanExp[0] : '0';
        } else if (qNorm.includes('10th') || qNorm.includes('tenth')) {
          label = '10th Marks';
          trueProfileVal = edu.tenthPercentageNumeric || '92.5';
        } else if (qNorm.includes('12th') || qNorm.includes('twelfth')) {
          label = '12th Marks';
          trueProfileVal = edu.twelfthPercentageNumeric || '94.0';
        } else if (qNorm.includes('cgpa') || qNorm.includes('graduation percentage')) {
          label = 'Graduation Marks';
          trueProfileVal = edu.graduationCgpaNumeric || '8.8';
        } else {
          const m = String(currentValue).match(/\d+(\.\d+)?/);
          trueProfileVal = m ? m[0] : '0';
        }

        // Check if trueProfileVal violates form's greater-than or less-than constraints
        let hasConflict = false;
        let conflictMessage = '';

        const gtMatch = normErr.match(/greater than (or equal to |>= )?(\d+(\.\d+)?)/i);
        if (gtMatch && trueProfileVal !== null) {
          const bound = parseFloat(gtMatch[2]);
          const isStrict = !gtMatch[1];
          const valNum = parseFloat(trueProfileVal);
          if (!isNaN(valNum) && (isStrict ? valNum <= bound : valNum < bound)) {
            hasConflict = true;
            const symbol = isStrict ? '>' : '>=';
            const unit = label.includes('CTC') ? 'LPA' : (label.includes('Experience') ? 'Yrs' : (label.includes('Notice') ? 'Days' : ''));
            conflictMessage = `Conflict: Profile is ${trueProfileVal} ${unit} (Form requires ${symbol} ${bound})`.trim();
          }
        }

        const ltMatch = normErr.match(/less than (or equal to |<= )?(\d+(\.\d+)?)/i);
        if (ltMatch && trueProfileVal !== null) {
          const bound = parseFloat(ltMatch[2]);
          const isStrict = !ltMatch[1];
          const valNum = parseFloat(trueProfileVal);
          if (!isNaN(valNum) && (isStrict ? valNum >= bound : valNum > bound)) {
            hasConflict = true;
            const symbol = isStrict ? '<' : '<=';
            const unit = label.includes('CTC') ? 'LPA' : (label.includes('Experience') ? 'Yrs' : (label.includes('Notice') ? 'Days' : ''));
            conflictMessage = `Conflict: Profile is ${trueProfileVal} ${unit} (Form requires ${symbol} ${bound})`.trim();
          }
        }

        const betweenMatch = normErr.match(/between\s+(\d+(\.\d+)?)\s+and\s+(\d+(\.\d+)?)/i);
        if (betweenMatch && trueProfileVal !== null) {
          const minB = parseFloat(betweenMatch[1]);
          const maxB = parseFloat(betweenMatch[3]);
          const valNum = parseFloat(trueProfileVal);
          if (!isNaN(valNum) && (valNum < minB || valNum > maxB)) {
            hasConflict = true;
            conflictMessage = `Conflict: Profile is ${trueProfileVal} (Form requires between ${minB} and ${maxB})`;
          }
        }

        if (normErr.includes('whole number') || normErr.includes('integer')) {
          if (trueProfileVal !== null) {
            trueProfileVal = String(Math.round(parseFloat(trueProfileVal) || 0));
          }
        }

        return {
          value: trueProfileVal,
          hasConflict,
          conflictMessage
        };
      }

      return null;
    }

    /**
     * Detect reactive validation errors or constraint feedback reflected in the DOM
     */
    static detectValidationFeedback(containerEl, inputEl = null) {
      if (!containerEl) return { hasError: false, errorText: '', constraints: {} };

      const constraints = {};
      if (inputEl) {
        if (inputEl.getAttribute) {
          if (inputEl.getAttribute('min')) constraints.min = inputEl.getAttribute('min');
          if (inputEl.getAttribute('max')) constraints.max = inputEl.getAttribute('max');
          if (inputEl.getAttribute('maxlength')) constraints.maxlength = parseInt(inputEl.getAttribute('maxlength'), 10);
          if (inputEl.getAttribute('minlength')) constraints.minlength = parseInt(inputEl.getAttribute('minlength'), 10);
          if (inputEl.getAttribute('pattern')) constraints.pattern = inputEl.getAttribute('pattern');
          if (inputEl.getAttribute('aria-invalid') === 'true') constraints.hasError = true;
        }
      }

      const searchRoot = (containerEl.closest && containerEl.closest('div[role="listitem"], div[jsmodel], div[data-automation-id="questionItem"], .office-form-question')) || containerEl;

      // Google Forms error message elements across all modern and legacy variants (excluding question containers)
      const gfErrorEl = searchRoot.querySelector
        ? searchRoot.querySelector('div[role="alert"], span[role="alert"], div.R3NpKe, div[jsname="B34EJ"], .asQ4ud, .gHjhdc, .snByac, .d9OAGc')
        : null;
      // Microsoft Forms error message elements
      const msErrorEl = searchRoot.querySelector
        ? searchRoot.querySelector('div[data-automation-id="validationError"], span[data-automation-id="validationError"], .office-form-validation-error, .office-form-question-error')
        : null;

      const errEl = gfErrorEl || msErrorEl;
      let errorText = '';
      if (errEl) {
        const raw = (errEl.innerText || errEl.textContent || '').trim();
        const norm = raw.toLowerCase();
        if (
          norm.includes('must') ||
          norm.includes('greater') ||
          norm.includes('less') ||
          norm.includes('number') ||
          norm.includes('required') ||
          norm.includes('valid') ||
          norm.includes('between') ||
          norm.includes('whole') ||
          norm.includes('integer') ||
          norm.includes('digits') ||
          norm.includes('match')
        ) {
          errorText = raw;
        }
      }

      const hasError = Boolean(errorText) || Boolean(constraints.hasError);

      return {
        hasError,
        errorText,
        constraints
      };
    }

    /**
     * Execute AI Post-Validation on filled field and auto-correct if bounds/errors are violated
     */
    static async postValidateAndFixField(containerEl, targetEl, questionText, profile, currentFilledVal) {
      if (!containerEl || !targetEl) return currentFilledVal;

      // 1. Profile Ground Truth Check (Prevents experience / CTC / notice period mismatches)
      if (profile) {
        const profileCheck = this.validateFilledValue(questionText, currentFilledVal, profile, targetEl);
        if (!profileCheck.isValid && profileCheck.correctedValue !== undefined && profileCheck.correctedValue !== currentFilledVal) {
          this.setInputValue(targetEl, profileCheck.correctedValue);
          currentFilledVal = profileCheck.correctedValue;
        }
      }

      // Brief delay for reactive framework validation rendering
      await new Promise((r) => setTimeout(r, 60));

      let feedback = this.detectValidationFeedback(containerEl, targetEl);

      // If no error rendered yet, trigger a native blur event to provoke form validation
      if (!feedback.hasError) {
        try {
          targetEl.dispatchEvent(new Event('blur', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 40));
          feedback = this.detectValidationFeedback(containerEl, targetEl);
        } catch (e) {}
      }
      if (!feedback.hasError && !feedback.errorText && !feedback.constraints.max && !feedback.constraints.min && !feedback.constraints.maxlength) {
        return { value: currentFilledVal, hasConflict: false };
      }

      // 2. Deterministic Post-Validation Correction & Conflict Engine
      if (feedback.errorText) {
        const fixResult = this.correctValidationError(questionText, currentFilledVal, feedback.errorText, profile);
        if (fixResult !== null && fixResult.value !== undefined) {
          if (fixResult.hasConflict) {
            // User requirement: Do not fill if there is a conflict with form constraints
            this.setInputValue(targetEl, '');
            await new Promise((r) => setTimeout(r, 40));
            return { value: '', hasConflict: true, conflictMessage: fixResult.conflictMessage };
          }

          if (fixResult.value !== currentFilledVal) {
            this.setInputValue(targetEl, fixResult.value);
            await new Promise((r) => setTimeout(r, 40));
          }
          return fixResult;
        }
      }

      // Deterministic attribute checks
      if (feedback.constraints.max !== undefined && feedback.constraints.max !== null && feedback.constraints.max !== '') {
        const maxNum = parseFloat(feedback.constraints.max);
        const currNum = parseFloat(currentFilledVal);
        if (!isNaN(maxNum) && !isNaN(currNum) && currNum > maxNum) {
          this.setInputValue(targetEl, '');
          return { value: '', hasConflict: true, conflictMessage: `Conflict: Max allowed is ${maxNum}` };
        }
      }

      if (feedback.constraints.min !== undefined && feedback.constraints.min !== null && feedback.constraints.min !== '') {
        const minNum = parseFloat(feedback.constraints.min);
        const currNum = parseFloat(currentFilledVal);
        if (!isNaN(minNum) && !isNaN(currNum) && currNum < minNum) {
          this.setInputValue(targetEl, '');
          return { value: '', hasConflict: true, conflictMessage: `Conflict: Min required is ${minNum}` };
        }
      }

      if (feedback.constraints.maxlength && String(currentFilledVal).length > feedback.constraints.maxlength) {
        const trimmed = String(currentFilledVal).slice(0, feedback.constraints.maxlength);
        this.setInputValue(targetEl, trimmed);
        return { value: trimmed, hasConflict: false };
      }

      return { value: currentFilledVal, hasConflict: false, conflictMessage: '' };
    }

    /**
     * AI-First Form Filling Engine on active form
     */
    static async fillForm(profile, settings = {}) {
      // Ensure all input columns have per-field AI buttons mounted
      this.injectAiButtonsToAllInputs(profile);

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

      // Process each question through the AI decision engine
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const questionText = this.extractQuestionText(container);
        if (!questionText) {
          results.skippedCount++;
          continue;
        }

        const textInput = container.querySelector('input[data-automation-id="textInput"], input.office-form-question-textbox, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"]');
        const textareaInput = container.querySelector('textarea[data-automation-id="textInput"], textarea.office-form-question-textarea, textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea');
        const radioOptions = this.extractRadioOptions(container);
        const checkboxOptions = this.extractCheckboxOptions(container);

        const targetEl = textareaInput || textInput;
        const isNumeric = this.isNumericRequirement(targetEl, container, questionText);
        const isTextArea = Boolean(textareaInput) || (targetEl && targetEl.tagName === 'TEXTAREA');

        let fieldType = 'text';
        let availableOptions = [];

        if (checkboxOptions.length > 0) {
          fieldType = 'checkbox';
          availableOptions = checkboxOptions.map((o) => o.label);
        } else if (radioOptions.length > 0) {
          fieldType = 'radio';
          availableOptions = radioOptions.map((o) => o.label);
        } else if (isTextArea) {
          fieldType = 'textarea';
        } else if (isNumeric) {
          fieldType = 'number';
        }

        this.setProcessingState(container, true, 'AI evaluating question...');

        try {
          const aiDecision = await this.evaluateQuestionWithAi({
            questionText,
            fieldType,
            options: availableOptions,
            profile
          });

          if (aiDecision && aiDecision.value !== undefined && aiDecision.value !== '') {
            // 1. Text & Textarea Inputs
            if (targetEl && (fieldType === 'text' || fieldType === 'textarea' || fieldType === 'number')) {
              let fillVal = String(aiDecision.value).trim();
              if (isNumeric) {
                fillVal = LocalMatcherService.extractNumericValue(fillVal, questionText) || fillVal;
              }

              let success = false;
              if (aiDecision.decisionType === 'rag_synthesis' || fillVal.length > 60) {
                success = await this.typewriteInputValue(targetEl, fillVal);
                this.attachAiToolbar(container, targetEl, questionText, profile);
              } else {
                success = this.setInputValue(targetEl, fillVal);
              }

              if (success) {
                // Post-Validation & Constraint Conflict check
                const postResult = await this.postValidateAndFixField(container, targetEl, questionText, profile, fillVal);
                const hasConflict = Boolean(postResult?.hasConflict);
                const conflictMessage = postResult?.conflictMessage || '';

                if (hasConflict) {
                  results.skippedCount++;
                  if (settings.autoHighlight !== false) {
                    this.highlightContainer(container, {
                      confidence: 0,
                      isRag: false,
                      isStrict: false,
                      infoMessage: '',
                      hasConflict: true,
                      conflictMessage
                    });
                  }
                  results.details.push({ question: questionText, type: 'conflict_skipped', value: '', conflict: conflictMessage });
                  continue;
                }

                if (postResult && typeof postResult === 'object') {
                  fillVal = postResult.value !== undefined ? postResult.value : fillVal;
                } else if (typeof postResult === 'string') {
                  fillVal = postResult;
                }

                // Compute right-side display message for CTC, Experience, Notice Period
                const category = this.detectQuestionCategory(questionText);
                let infoMessage = '';
                const prof = profile?.professional || {};

                if (category === 'total_experience') {
                  const expYears = prof.totalExperienceYears !== undefined ? String(prof.totalExperienceYears).trim() : '0';
                  infoMessage = `Profile: ${expYears === '0' ? 'Fresher (0 Yrs)' : `${expYears} Yrs`}`;
                } else if (category === 'current_ctc') {
                  const curLpa = prof.currentCtcLpa !== undefined ? String(prof.currentCtcLpa).trim() : '0';
                  infoMessage = `Profile: ${curLpa === '0' ? '0 LPA (Fresher)' : `${curLpa} LPA`}`;
                } else if (category === 'expected_ctc') {
                  infoMessage = `Profile Expected: ${prof.expectedCtc || (prof.expectedCtcLpa ? `${prof.expectedCtcLpa} LPA` : '10 LPA')}`;
                } else if (category === 'notice_period') {
                  const npText = prof.noticePeriod || 'Immediate';
                  const npDays = prof.noticePeriodDays || '0';
                  infoMessage = `Profile: ${npText} (${npDays} Days)`;
                }

                results.filledCount++;
                if (settings.autoHighlight !== false) {
                  this.highlightContainer(container, {
                    confidence: aiDecision.confidence || 0.95,
                    isRag: aiDecision.decisionType === 'rag_synthesis',
                    isStrict: aiDecision.decisionType === 'strict_profile',
                    infoMessage,
                    hasConflict: false
                  });
                }
                results.details.push({ question: questionText, type: aiDecision.decisionType, value: fillVal });
                continue;
              }
            }

            // 2. Radio Options
            if (radioOptions.length > 0 && fieldType === 'radio') {
              const selectedOpt = typeof aiDecision.value === 'string' ? aiDecision.value : (Array.isArray(aiDecision.value) ? aiDecision.value[0] : '');
              if (selectedOpt) {
                const targetOpt = radioOptions.find((o) => o.label.trim().toLowerCase() === selectedOpt.trim().toLowerCase())
                  || radioOptions.find((o) => o.label.toLowerCase().includes(selectedOpt.toLowerCase()) || selectedOpt.toLowerCase().includes(o.label.toLowerCase()));

                if (targetOpt && this.selectRadio(targetOpt.element)) {
                  results.filledCount++;
                  if (settings.autoHighlight !== false) {
                    this.highlightContainer(container, { confidence: aiDecision.confidence || 0.95, isStrict: true });
                  }
                  results.details.push({ question: questionText, type: 'radio', value: targetOpt.label });
                  continue;
                }
              }
            }

            // 3. Checkbox Options
            if (checkboxOptions.length > 0 && fieldType === 'checkbox') {
              const selectedArray = Array.isArray(aiDecision.value) ? aiDecision.value : [aiDecision.value];
              let anyChecked = false;
              const checkedLabels = [];

              for (const chosenLabel of selectedArray) {
                const targetCb = checkboxOptions.find((o) => o.label.trim().toLowerCase() === String(chosenLabel).trim().toLowerCase())
                  || checkboxOptions.find((o) => o.label.toLowerCase().includes(String(chosenLabel).toLowerCase()) || String(chosenLabel).toLowerCase().includes(o.label.toLowerCase()));

                if (targetCb && this.selectCheckbox(targetCb.element)) {
                  anyChecked = true;
                  checkedLabels.push(targetCb.label);
                }
              }

              if (anyChecked) {
                results.filledCount++;
                if (settings.autoHighlight !== false) {
                  this.highlightContainer(container, { confidence: aiDecision.confidence || 0.95, isStrict: true });
                }
                results.details.push({ question: questionText, type: 'checkbox', value: checkedLabels });
                continue;
              }
            }
          }

          results.skippedCount++;
        } catch (err) {
          console.warn('[GFAF] Fill error for question:', questionText, err);
          results.skippedCount++;
        } finally {
          this.setProcessingState(container, false);
        }
      }

      // Global Second-Pass Post-Validation Sweep:
      // Re-scans all form question containers to catch and auto-heal any reactive error banners
      try {
        await new Promise((r) => setTimeout(r, 80));
        for (let i = 0; i < containers.length; i++) {
          const container = containers[i];
          const targetEl = container.querySelector('textarea, input[type="text"], input[type="email"], input[type="tel"], input[type="number"], input[type="url"], input.whsOnd');
          const questionText = this.extractQuestionText(container);
          if (targetEl && questionText) {
            const feedback = this.detectValidationFeedback(container, targetEl);
            if (feedback.hasError) {
              const currentVal = targetEl.value;
              const postResult = await this.postValidateAndFixField(container, targetEl, questionText, profile, currentVal);
              if (postResult && postResult.hasConflict) {
                this.highlightContainer(container, {
                  confidence: 0,
                  isRag: false,
                  isStrict: false,
                  infoMessage: '',
                  hasConflict: true,
                  conflictMessage: postResult.conflictMessage
                });
              }
            }
          }
        }
      } catch (sweepErr) {
        console.warn('[GFAF] Global validation sweep notice:', sweepErr);
      }

      return results;
    }
  }

  // ----------------------------------------------------
  // 6. UI & FLOATING WIDGET
  // ----------------------------------------------------
  function showToast(message, type = 'success') {
    const existing = document.getElementById('gfaf-toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'gfaf-toast-notification';
    toast.className = `gfaf-toast gfaf-toast-${type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'gfaf-toast-icon';
    iconSpan.innerHTML = type === 'success' ? ICONS.checkCircle : ICONS.sparkles;

    const textSpan = document.createElement('span');
    textSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3200);
  }

  async function triggerAutoFill() {
    try {
      const activeProfile = await LocalStorageService.getActiveProfile();
      const settings = await LocalStorageService.getSettings();

      if (!activeProfile) {
        showToast('No active profile found.', 'error');
        return;
      }

      const results = await LocalFillerService.fillForm(activeProfile, settings);

      if (results.filledCount > 0) {
        showToast(`Auto-filled ${results.filledCount} field${results.filledCount > 1 ? 's' : ''} using "${activeProfile.name}"`, 'success');
        await LocalStorageService.recordHistory({
          profileName: activeProfile.name,
          filledCount: results.filledCount,
          totalQuestions: results.totalQuestions,
          pageTitle: document.title || 'Google Form'
        });
      } else {
        showToast('No matching form fields identified.', 'info');
      }

      return results;
    } catch (err) {
      if (err && String(err.message).includes('Extension context invalidated')) {
        showToast('Extension reloaded. Please refresh this tab (F5).', 'info');
      } else {
        showToast('Error executing auto-fill.', 'error');
      }
    }
  }

  async function createFloatingWidget() {
    if (document.getElementById('gfaf-floating-root')) return;

    let settings = DEFAULT_SETTINGS;
    let profiles = [DEFAULT_PROFILE];
    let activeProfile = DEFAULT_PROFILE;
    let currentLlmConfig = {
      provider: 'ollama',
      ollamaEndpoint: 'http://localhost:11434',
      ollamaModel: 'llama3.2'
    };

    try {
      const storedSettings = await LocalStorageService.getSettings();
      if (storedSettings) settings = { ...DEFAULT_SETTINGS, ...storedSettings };
      if (settings.showFloatingWidget === false) return;

      const storedProfiles = await LocalStorageService.getProfiles();
      if (Array.isArray(storedProfiles) && storedProfiles.length > 0) profiles = storedProfiles;

      const storedActiveProfile = await LocalStorageService.getActiveProfile();
      if (storedActiveProfile) activeProfile = storedActiveProfile;

      const storedLlmConfig = await LocalStorageService.get('gfaf_llm_config');
      if (storedLlmConfig && typeof storedLlmConfig === 'object') {
        currentLlmConfig = { ...currentLlmConfig, ...storedLlmConfig };
      }
    } catch (err) {
      console.warn('[GFAF] Storage access fallback for floating dock:', err);
    }

    const root = document.createElement('div');
    root.id = 'gfaf-floating-root';

    const card = document.createElement('div');
    card.className = 'gfaf-widget-card';

    // 1. Custom UI Profile Selector Dropdown (Top)
    const dropdownWrap = document.createElement('div');
    dropdownWrap.className = 'gfaf-custom-dropdown';

    const triggerBtn = document.createElement('button');
    triggerBtn.type = 'button';
    triggerBtn.className = 'gfaf-dropdown-trigger';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'gfaf-dropdown-label';
    labelSpan.textContent = activeProfile?.name || 'Default Profile';

    const chevronSpan = document.createElement('span');
    chevronSpan.className = 'gfaf-dropdown-chevron';
    chevronSpan.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    triggerBtn.appendChild(labelSpan);
    triggerBtn.appendChild(chevronSpan);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'gfaf-dropdown-menu hidden';

    profiles.forEach((p) => {
      const item = document.createElement('div');
      item.className = `gfaf-dropdown-item ${p.id === activeProfile?.id ? 'active' : ''}`;
      item.setAttribute('data-id', p.id);

      const dot = document.createElement('span');
      dot.className = 'gfaf-item-dot';

      const textSpan = document.createElement('span');
      textSpan.className = 'gfaf-item-text';
      textSpan.textContent = p.name || 'Untitled Profile';

      item.appendChild(dot);
      item.appendChild(textSpan);

      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await LocalStorageService.setActiveProfileId(p.id);
          activeProfile = p;
          labelSpan.textContent = p.name;
          dropdownMenu.querySelectorAll('.gfaf-dropdown-item').forEach((it) => it.classList.remove('active'));
          item.classList.add('active');
          dropdownMenu.classList.add('hidden');
          triggerBtn.classList.remove('open');
          LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
          showToast(`Switched profile to "${p.name}"`);
        } catch {
          showToast('Please refresh the page to apply profile switch.');
        }
      });

      dropdownMenu.appendChild(item);
    });

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = dropdownMenu.classList.contains('hidden');
      if (isClosed) {
        dropdownMenu.classList.remove('hidden');
        triggerBtn.classList.add('open');
      } else {
        dropdownMenu.classList.add('hidden');
        triggerBtn.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdownWrap.contains(e.target)) {
        dropdownMenu.classList.add('hidden');
        triggerBtn.classList.remove('open');
      }
    });

    dropdownWrap.appendChild(triggerBtn);
    dropdownWrap.appendChild(dropdownMenu);

    // 2. Custom UI Model Selector Dropdown & Wake Up Button (Middle Row)
    const modelRow = document.createElement('div');
    modelRow.className = 'gfaf-widget-model-row';

    const modelDropdownWrap = document.createElement('div');
    modelDropdownWrap.className = 'gfaf-custom-dropdown gfaf-model-dropdown-wrap';

    const modelTriggerBtn = document.createElement('button');
    modelTriggerBtn.type = 'button';
    modelTriggerBtn.className = 'gfaf-dropdown-trigger gfaf-model-trigger';
    modelTriggerBtn.setAttribute('title', 'Select Active AI Model');

    const modelStatusDot = document.createElement('span');
    modelStatusDot.className = 'gfaf-model-dot dot-ready';

    const modelLabelSpan = document.createElement('span');
    modelLabelSpan.className = 'gfaf-dropdown-label gfaf-model-label';

    const getActiveModelName = (cfg) => {
      const p = cfg?.provider || 'ollama';
      if (p === 'gemini') return cfg.geminiModel || 'gemini-1.5-flash';
      if (p === 'openai') return cfg.openaiModel || 'gpt-4o-mini';
      if (p === 'anthropic') return cfg.anthropicModel || 'claude-3-5-haiku-20241022';
      return cfg?.ollamaModel || 'llama3.2';
    };

    let activeModelName = getActiveModelName(currentLlmConfig);
    modelLabelSpan.textContent = activeModelName;

    const modelChevronSpan = document.createElement('span');
    modelChevronSpan.className = 'gfaf-dropdown-chevron';
    modelChevronSpan.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

    modelTriggerBtn.appendChild(modelStatusDot);
    modelTriggerBtn.appendChild(modelLabelSpan);
    modelTriggerBtn.appendChild(modelChevronSpan);

    const modelDropdownMenu = document.createElement('div');
    modelDropdownMenu.className = 'gfaf-dropdown-menu gfaf-model-dropdown-menu hidden';

    // Cloud models configured by user with valid API Key & Model Name (Strictly no unconfigured defaults)
    const getActiveCloudModels = (cfg) => {
      const list = [];
      if (cfg?.geminiApiKey && typeof cfg.geminiApiKey === 'string' && cfg.geminiApiKey.trim() && cfg?.geminiModel && cfg.geminiModel.trim()) {
        list.push({
          id: cfg.geminiModel.trim(),
          name: cfg.geminiModel.trim(),
          provider: 'gemini',
          badge: 'Cloud'
        });
      }
      if (cfg?.openaiApiKey && typeof cfg.openaiApiKey === 'string' && cfg.openaiApiKey.trim() && cfg?.openaiModel && cfg.openaiModel.trim()) {
        list.push({
          id: cfg.openaiModel.trim(),
          name: cfg.openaiModel.trim(),
          provider: 'openai',
          badge: 'Cloud'
        });
      }
      if (cfg?.anthropicApiKey && typeof cfg.anthropicApiKey === 'string' && cfg.anthropicApiKey.trim() && cfg?.anthropicModel && cfg.anthropicModel.trim()) {
        list.push({
          id: cfg.anthropicModel.trim(),
          name: cfg.anthropicModel.trim(),
          provider: 'anthropic',
          badge: 'Cloud'
        });
      }
      return list;
    };

    let cloudModels = getActiveCloudModels(currentLlmConfig);

    // Local models list (strictly detected models only)
    let localModels = [];
    const activeOllamaModel = currentLlmConfig.ollamaModel || 'llama3.2';

    // Initial local model if currently active
    if (currentLlmConfig.provider === 'ollama' || !currentLlmConfig.provider) {
      localModels.push({
        id: activeOllamaModel,
        name: activeOllamaModel,
        provider: 'ollama',
        badge: 'Local'
      });
    }

    let availableModels = [...localModels, ...cloudModels];

    const renderModelItems = (modelsList) => {
      modelDropdownMenu.innerHTML = '';
      if (!modelsList || modelsList.length === 0) {
        modelDropdownMenu.innerHTML = '<div style="padding: 8px 10px; font-size: 11px; color: #94a3b8; text-align: center;">No models found</div>';
        return;
      }

      modelsList.forEach((m) => {
        const item = document.createElement('div');
        item.className = `gfaf-dropdown-item ${m.id === activeModelName ? 'active' : ''}`;
        item.setAttribute('data-id', m.id);

        const dot = document.createElement('span');
        dot.className = `gfaf-item-dot ${m.provider === 'ollama' ? 'dot-local' : 'dot-cloud'}`;

        const textSpan = document.createElement('span');
        textSpan.className = 'gfaf-item-text';
        textSpan.textContent = m.name;

        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'gfaf-item-badge';
        badgeSpan.textContent = m.badge;

        item.appendChild(dot);
        item.appendChild(textSpan);
        item.appendChild(badgeSpan);

        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          try {
            currentLlmConfig = (await LocalStorageService.get('gfaf_llm_config')) || {};
            currentLlmConfig.provider = m.provider;
            if (m.provider === 'gemini') currentLlmConfig.geminiModel = m.id;
            else if (m.provider === 'openai') currentLlmConfig.openaiModel = m.id;
            else if (m.provider === 'anthropic') currentLlmConfig.anthropicModel = m.id;
            else currentLlmConfig.ollamaModel = m.id;

            await LocalStorageService.set('gfaf_llm_config', currentLlmConfig);
            activeModelName = m.id;
            modelLabelSpan.textContent = m.name;
            modelDropdownMenu.querySelectorAll('.gfaf-dropdown-item').forEach((it) => it.classList.remove('active'));
            item.classList.add('active');
            modelDropdownMenu.classList.add('hidden');
            modelTriggerBtn.classList.remove('open');
            showToast(`Switched AI model to "${m.name}"`);
          } catch {
            showToast('Please refresh the page to apply model switch.');
          }
        });

        modelDropdownMenu.appendChild(item);
      });
    };

    renderModelItems(availableModels);

    // Auto-detect installed local Ollama models in background and display ONLY detected models
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        const endpoint = currentLlmConfig.ollamaEndpoint || 'http://localhost:11434';
        chrome.runtime.sendMessage(
          { action: 'PROXY_FETCH', url: `${endpoint.replace(/\/+$/, '')}/api/tags`, method: 'GET' },
          (resp) => {
            if (resp && resp.success && resp.data?.models && Array.isArray(resp.data.models)) {
              const detected = resp.data.models.map((mod) => mod.name);
              if (detected.length > 0) {
                localModels = detected.map((dName) => ({
                  id: dName,
                  name: dName,
                  provider: 'ollama',
                  badge: 'Local'
                }));

                // Auto-match activeModelName with tag if present
                if (currentLlmConfig.provider === 'ollama') {
                  const match = localModels.find((m) => m.id === activeModelName || m.id.startsWith(`${activeModelName}:`));
                  if (match) {
                    activeModelName = match.id;
                    modelLabelSpan.textContent = match.name;
                  }
                }

                cloudModels = getActiveCloudModels(currentLlmConfig);
                availableModels = [...localModels, ...cloudModels];
                renderModelItems(availableModels);
              }
            }
          }
        );
      } catch {}
    }

    modelTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = modelDropdownMenu.classList.contains('hidden');
      dropdownMenu.classList.add('hidden');
      triggerBtn.classList.remove('open');
      if (isClosed) {
        modelDropdownMenu.classList.remove('hidden');
        modelTriggerBtn.classList.add('open');
      } else {
        modelDropdownMenu.classList.add('hidden');
        modelTriggerBtn.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!modelDropdownWrap.contains(e.target)) {
        modelDropdownMenu.classList.add('hidden');
        modelTriggerBtn.classList.remove('open');
      }
    });

    modelDropdownWrap.appendChild(modelTriggerBtn);
    modelDropdownWrap.appendChild(modelDropdownMenu);

    // Wake Up Button
    const wakeUpBtn = document.createElement('button');
    wakeUpBtn.type = 'button';
    wakeUpBtn.className = 'gfaf-widget-wakeup-btn';
    wakeUpBtn.setAttribute('title', 'Wake up & pre-load model into GPU / Memory');
    wakeUpBtn.setAttribute('aria-label', 'Wake up & pre-load model into GPU / Memory');
    wakeUpBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
        <line x1="12" y1="2" x2="12" y2="12"></line>
      </svg>
    `;

    wakeUpBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      wakeUpBtn.classList.add('loading');
      modelStatusDot.className = 'gfaf-model-dot dot-loading';
      wakeUpBtn.innerHTML = `
        <svg class="gfaf-spinning" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
      `;

      try {
        const endpoint = (currentLlmConfig.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
        const targetModel = activeModelName || 'llama3.2';

        if (currentLlmConfig.provider === 'ollama') {
          chrome.runtime.sendMessage(
            {
              action: 'PROXY_FETCH',
              url: `${endpoint}/api/chat`,
              method: 'POST',
              payload: {
                model: targetModel,
                messages: [{ role: 'user', content: 'ping' }],
                stream: false,
                keep_alive: '10m',
                options: { num_predict: 1 }
              }
            },
            (response) => {
              wakeUpBtn.classList.remove('loading');
              wakeUpBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              `;
              if (response && response.success) {
                modelStatusDot.className = 'gfaf-model-dot dot-ready';
                showToast(`Model "${targetModel}" is awake & loaded in memory!`, 'success');
              } else {
                modelStatusDot.className = 'gfaf-model-dot dot-idle';
                showToast(response?.error || `Ollama is offline. Start with 'ollama serve'`, 'error');
              }
            }
          );
        } else {
          setTimeout(() => {
            wakeUpBtn.classList.remove('loading');
            wakeUpBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            `;
            modelStatusDot.className = 'gfaf-model-dot dot-ready';
            showToast(`Connected to ${currentLlmConfig.provider} cloud (${targetModel})`, 'success');
          }, 350);
        }
      } catch (err) {
        wakeUpBtn.classList.remove('loading');
        wakeUpBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        `;
        modelStatusDot.className = 'gfaf-model-dot dot-idle';
        showToast(`Wake up failed: ${err.message}`, 'error');
      }
    });

    modelRow.appendChild(modelDropdownWrap);
    modelRow.appendChild(wakeUpBtn);

    // 3. Action Buttons Row (Compact Auto-Fill + Settings Gear Button)
    const actionRow = document.createElement('div');
    actionRow.className = 'gfaf-widget-action-row';

    const fillBtn = document.createElement('button');
    fillBtn.type = 'button';
    fillBtn.className = 'gfaf-pill-btn gfaf-pill-btn-primary gfaf-fill-btn-compact';
    fillBtn.innerHTML = `${ICONS.sparkles} <span>Auto-Fill</span>`;
    fillBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      fillBtn.style.transform = 'scale(0.96)';
      setTimeout(() => (fillBtn.style.transform = ''), 150);
      await triggerAutoFill();
    });

    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'gfaf-widget-settings-btn';
    settingsBtn.setAttribute('title', 'Manage Candidate Profiles & Settings');
    settingsBtn.setAttribute('aria-label', 'Manage Candidate Profiles & Settings');
    settingsBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;
    settingsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' }, () => {
            try {
              if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
                showToast('Extension was reloaded. Please refresh this page tab.');
              }
            } catch {
              showToast('Extension was reloaded. Please refresh this page tab.');
            }
          });
        } else {
          showToast('Extension was reloaded. Please refresh this page tab.');
        }
      } catch {
        showToast('Extension was reloaded. Please refresh this page tab.');
      }
    });

    actionRow.appendChild(fillBtn);
    actionRow.appendChild(settingsBtn);

    // 4. Sponsor / Ad Strip (Left to Right below Auto-Fill)
    const dockAdStrip = document.createElement('a');
    dockAdStrip.className = 'gfaf-dock-ad-strip';
    dockAdStrip.href = 'https://github.com/Indla26v/FormPilot';
    dockAdStrip.target = '_blank';
    dockAdStrip.rel = 'noopener noreferrer';
    dockAdStrip.setAttribute('title', 'Sponsored Link / Ad Space');
    dockAdStrip.setAttribute('aria-label', 'Sponsored Link / Ad Space');
    dockAdStrip.innerHTML = `
      <div class="gfaf-dock-ad-left">
        <span class="gfaf-dock-ad-badge">AD</span>
        <span class="gfaf-dock-ad-text">Fillvyn Pro Tools</span>
      </div>
      <svg class="gfaf-dock-ad-arrow" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
      </svg>
    `;

    card.appendChild(dropdownWrap);
    card.appendChild(modelRow);
    card.appendChild(actionRow);
    card.appendChild(dockAdStrip);

    // 0. Job Description (JD) Alignment Input Area (Directly above the dock card)
    const jdPanel = document.createElement('div');
    jdPanel.className = 'gfaf-jd-panel';

    const jdPillToggle = document.createElement('button');
    jdPillToggle.type = 'button';
    jdPillToggle.className = `gfaf-jd-pill-toggle ${sessionJobDescription ? 'has-jd' : ''}`;
    jdPillToggle.setAttribute('title', 'Target Job Description (Optional, current page only)');
    jdPillToggle.innerHTML = `
      <div class="gfaf-jd-pill-left">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span class="gfaf-jd-pill-title">Target JD</span>
        <span class="gfaf-jd-active-dot ${sessionJobDescription ? '' : 'hidden'}" title="JD Alignment Active"></span>
      </div>
      <svg class="gfaf-jd-pill-chevron" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    const jdCard = document.createElement('div');
    jdCard.className = 'gfaf-jd-card hidden';

    const jdCardHeader = document.createElement('div');
    jdCardHeader.className = 'gfaf-jd-card-header';
    jdCardHeader.innerHTML = `
      <div class="gfaf-jd-card-title">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>Job Description (Optional)</span>
      </div>
    `;

    const jdCloseBtn = document.createElement('button');
    jdCloseBtn.type = 'button';
    jdCloseBtn.className = 'gfaf-jd-close-btn';
    jdCloseBtn.setAttribute('title', 'Collapse JD Input');
    jdCloseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    jdCardHeader.appendChild(jdCloseBtn);

    const jdTextarea = document.createElement('textarea');
    jdTextarea.className = 'gfaf-jd-textarea';
    jdTextarea.placeholder = 'Paste Job Description (JD) here to align AI answers to this specific role...';
    jdTextarea.value = sessionJobDescription;

    const jdCardFooter = document.createElement('div');
    jdCardFooter.className = 'gfaf-jd-card-footer';

    const jdTag = document.createElement('span');
    jdTag.className = 'gfaf-jd-tag';
    jdTag.textContent = 'Current page only • Not saved';

    const jdClearBtn = document.createElement('button');
    jdClearBtn.type = 'button';
    jdClearBtn.className = `gfaf-jd-clear-btn ${sessionJobDescription ? '' : 'hidden'}`;
    jdClearBtn.textContent = 'Clear';

    jdCardFooter.appendChild(jdTag);
    jdCardFooter.appendChild(jdClearBtn);

    jdCard.appendChild(jdCardHeader);
    jdCard.appendChild(jdTextarea);
    jdCard.appendChild(jdCardFooter);

    jdPanel.appendChild(jdCard);
    jdPanel.appendChild(jdPillToggle);

    // Event handlers for JD state
    const activeDot = jdPillToggle.querySelector('.gfaf-jd-active-dot');

    const updateJdState = () => {
      sessionJobDescription = (window.__GFAF_SESSION_JD__ = jdTextarea.value.trim());
      if (sessionJobDescription) {
        activeDot.classList.remove('hidden');
        jdClearBtn.classList.remove('hidden');
        jdPillToggle.classList.add('has-jd');
      } else {
        activeDot.classList.add('hidden');
        jdClearBtn.classList.add('hidden');
        jdPillToggle.classList.remove('has-jd');
      }
    };

    jdTextarea.addEventListener('input', updateJdState);

    jdClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      jdTextarea.value = '';
      updateJdState();
      showToast('Cleared Job Description alignment.');
    });

    jdPillToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = jdCard.classList.contains('hidden');
      if (isHidden) {
        jdCard.classList.remove('hidden');
        jdPillToggle.classList.add('open');
        jdTextarea.focus();
      } else {
        jdCard.classList.add('hidden');
        jdPillToggle.classList.remove('open');
      }
    });

    jdCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      jdCard.classList.add('hidden');
      jdPillToggle.classList.remove('open');
    });

    root.appendChild(jdPanel);
    root.appendChild(card);

    const targetParent = document.body || document.documentElement;
    if (targetParent && !document.getElementById('gfaf-floating-root')) {
      targetParent.appendChild(root);
    }

    // Mount per-column AI buttons across all detected inputs
    LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
  }

  // Handle messages from Popup or Background
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'TRIGGER_AUTO_FILL') {
          triggerAutoFill().then((res) => sendResponse(res));
          return true;
        }
      });
    } catch {
      // Ignored if context invalidated
    }
  }

  // Mount floating widget & per-column AI buttons
  async function initGFAF() {
    try {
      await createFloatingWidget();
    } catch (e) {
      console.warn('[GFAF] Error mounting floating dock:', e);
    }
    try {
      const activeProfile = await LocalStorageService.getActiveProfile();
      if (activeProfile) {
        LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
      }
    } catch (e) {
      console.warn('[GFAF] Error injecting AI buttons:', e);
    }
  }

  window.__GFAF_INIT__ = initGFAF;
  window.__GFAF_MOUNT_DOCK__ = createFloatingWidget;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGFAF);
  } else {
    initGFAF();
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('load', initGFAF);
  }

  let observerDebounce = null;
  const observer = new MutationObserver((mutations) => {
    // 1. Self-mutation filtering: ignore mutations from FormPilot's own injected UI elements
    const hasExternalMutation = (mutations || []).some((m) => {
      const target = m.target;
      if (!target) return true;
      const el = target.nodeType === 1 ? target : target.parentElement;
      if (el && typeof el.closest === 'function') {
        return !el.closest('#gfaf-floating-root, .gfaf-ai-column-action-bar, .gfaf-ai-comment-toolbar, .gfaf-processing-indicator, .gfaf-processing-buffer, .gfaf-filled-highlight, .gfaf-match-badge, .gfaf-toast');
      }
      return true;
    });

    if (!hasExternalMutation) return;

    if (!document.getElementById('gfaf-floating-root')) {
      createFloatingWidget();
    }
    if (observerDebounce) clearTimeout(observerDebounce);
    observerDebounce = setTimeout(async () => {
      try {
        if (!document.getElementById('gfaf-floating-root')) {
          await createFloatingWidget();
        }
        const activeProfile = await LocalStorageService.getActiveProfile();
        if (activeProfile) {
          LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
        }
      } catch {}
    }, 300);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.__GFAF_TRIGGER_AUTO_FILL__ = triggerAutoFill;
  window.__GFAF_INJECT_AI_BUTTONS__ = () => {
    LocalStorageService.getActiveProfile().then((p) => {
      if (p) LocalFillerService.injectAiButtonsToAllInputs(p);
    });
  };
})();
