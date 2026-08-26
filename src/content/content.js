/**
 * Content Script for Google Forms Auto Filler (GFAF)
 * Self-contained, robust, zero-dependency, immune to page CSP and extension context invalidation.
 */

(function () {
  'use strict';

  // Prevent double injection
  if (window.__GFAF_CONTENT_INJECTED__) {
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
      return profiles.find((p) => p.id === activeId) || profiles[0] || DEFAULT_PROFILE;
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
      if (!profile.smartAnswers || !Array.isArray(profile.smartAnswers)) return null;
      let bestMatch = null;
      let highestScore = 0;

      for (const qa of profile.smartAnswers) {
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
      const headingEl = containerEl.querySelector('div[role="heading"]');
      if (headingEl) {
        title = (headingEl.innerText || headingEl.textContent || '').trim();
      } else {
        const titleEl = containerEl.querySelector('.M7eMe, .HoPJnd, .F9N7Re, span[dir="auto"]');
        if (titleEl) {
          title = (titleEl.innerText || titleEl.textContent || '').trim();
        }
      }

      const inputWithLabel = containerEl.querySelector('input[aria-label], textarea[aria-label]');
      if (!title && inputWithLabel) {
        title = (inputWithLabel.getAttribute('aria-label') || '').trim();
      }

      // Also extract sub-description / prompt instructions if present in Google Form
      const descEl = containerEl.querySelector('.gHjhdc, .jibhHc, .vRMGwf, .asQ4ud, div[id$="_desc"], div[jsname="V67aGc"]');
      let desc = '';
      if (descEl) {
        desc = (descEl.innerText || descEl.textContent || '').trim();
      }

      if (title && desc && !title.includes(desc)) {
        return `${title}\n${desc}`;
      }

      return title || '';
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

    static extractRadioOptions(containerEl) {
      const radioElements = containerEl.querySelectorAll('div[role="radio"]');
      const options = [];
      radioElements.forEach((radio) => {
        const dataVal = radio.getAttribute('data-value');
        const ariaLabel = radio.getAttribute('aria-label');
        let text = '';
        const textContainer = radio.closest('label') || radio.parentElement;
        if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
        const finalLabel = (dataVal || ariaLabel || text || '').trim();
        if (finalLabel) options.push({ element: radio, label: finalLabel });
      });
      return options;
    }

    static selectRadio(radioEl) {
      if (!radioEl) return false;
      try {
        const isAlreadyChecked = radioEl.getAttribute('aria-checked') === 'true';
        if (!isAlreadyChecked) {
          radioEl.focus();
          radioEl.click();
          radioEl.dispatchEvent(new Event('click', { bubbles: true }));
          radioEl.dispatchEvent(new Event('change', { bubbles: true }));
          radioEl.setAttribute('aria-checked', 'true');
        }
        return true;
      } catch {
        return false;
      }
    }

    static extractCheckboxOptions(containerEl) {
      const checkboxElements = containerEl.querySelectorAll('div[role="checkbox"]');
      const options = [];
      checkboxElements.forEach((checkbox) => {
        const ariaLabel = checkbox.getAttribute('aria-label');
        let text = '';
        const textContainer = checkbox.closest('label') || checkbox.parentElement;
        if (textContainer) text = textContainer.innerText || textContainer.textContent || '';
        const finalLabel = (ariaLabel || text || '').trim();
        if (finalLabel) options.push({ element: checkbox, label: finalLabel });
      });
      return options;
    }

    static selectCheckbox(checkboxEl) {
      if (!checkboxEl) return false;
      try {
        const isChecked = checkboxEl.getAttribute('aria-checked') === 'true';
        if (!isChecked) {
          checkboxEl.focus();
          checkboxEl.click();
          checkboxEl.dispatchEvent(new Event('click', { bubbles: true }));
          checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
          checkboxEl.setAttribute('aria-checked', 'true');
        }
        return true;
      } catch {
        return false;
      }
    }

    static findQuestionContainers(root = document) {
      const list = root.querySelectorAll('div[role="listitem"]');
      if (list && list.length > 0) return Array.from(list);
      const qContainers = root.querySelectorAll('div[jsmodel="CP1oW"]');
      if (qContainers && qContainers.length > 0) return Array.from(qContainers);
      const altItems = root.querySelectorAll('.geS5n, .m2, .Qr7Oae');
      if (altItems && altItems.length > 0) return Array.from(altItems);
      const items = root.querySelectorAll('div[jscontroller="e2CuFe"], div[jscontroller="r3Nsxc"]');
      if (items && items.length > 0) return Array.from(items);
      const headings = root.querySelectorAll('div[role="heading"]');
      if (headings && headings.length > 0) {
        const containers = [];
        headings.forEach((h) => {
          const parent = h.closest('div[jscontroller]') || h.parentElement?.parentElement;
          if (parent && !containers.includes(parent)) containers.push(parent);
        });
        return containers;
      }
      return [];
    }

    static highlightContainer(containerEl, matchInfo) {
      if (!containerEl) return;
      containerEl.classList.add('gfaf-filled-highlight');
      let badge = containerEl.querySelector('.gfaf-match-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'gfaf-match-badge';
        if (containerEl.style) {
          containerEl.style.position = 'relative';
        }
        containerEl.appendChild(badge);
      }
      const confidencePct = Math.round((matchInfo.confidence || 1.0) * 100);
      badge.textContent = matchInfo.isRag ? 'Auto-filled via AI' : `Auto-filled (${confidencePct}%)`;
    }

    static showStatusToast(message, type = 'success') {
      showToast(message, type === true ? 'success' : type === false ? 'error' : type);
    }

    static async synthesizeAiAnswer(questionText, profile, customInstructions = '', currentFieldValue = '') {
      try {
        const chunks = (await LocalStorageService.get('gfaf_rag_chunks')) || [];
        const savedLlmConfig = await LocalStorageService.get('gfaf_llm_config');
        const llmConfig = savedLlmConfig || {
          provider: 'ollama',
          ollamaEndpoint: 'http://localhost:11434',
          ollamaModel: 'llama3.2'
        };

        const chatKey = (questionText || '').trim().toLowerCase();
        let history = fieldChatHistory.get(chatKey) || [];

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

        const skillsFormatted = (profile.skills || []).map((s) => {
          if (typeof s === 'object' && s !== null) {
            const parts = [s.name];
            if (s.level) parts.push(`(${s.level})`);
            if (s.years) parts.push(`${s.years} yr(s)`);
            return parts.join(' - ');
          }
          return String(s);
        }).join(', ');

        if (!contextStr) {
          contextStr = `Candidate Skills: ${skillsFormatted}\nCurrent Role: ${profile.professional?.currentRole || 'Software Engineer'}\nExperience: ${profile.professional?.totalExperienceYears || '1'} year(s)\nEducation: ${profile.education?.degree || 'B.Tech'} from ${profile.education?.collegeName || 'University'}`;
        }

        const candidateName = profile.personal?.fullName || 'the candidate';
        const systemPrompt = `You are ${candidateName}, a real software engineer filling out an application form question.
Answer in the first person ("I", "my").

HUMANIZED WRITING STYLE & TONE:
1. Write naturally, authentically, and conversationally, exactly as a human developer would write in a job application.
2. Avoid AI cliches and buzzwords (e.g. do NOT use words like "delve", "spearhead", "testament", "tapestry", "in today's fast-paced landscape", "thrilled to", or generic textbook explanations).
3. Be direct, clear, and practical. Jump straight into the explanation without throat-clearing intros or fluffy conclusions.
4. Ground your response in real implementation decisions, technical tools, and actual problem-solving.
5. Strictly adhere to any word count or constraint in the prompt.
6. Do NOT include markdown code block envelopes, preamble (e.g. "Here is my answer:"), or emojis. Output ONLY the clean, raw text ready to be pasted directly into the form.`;

        const isFollowUp = Boolean(customInstructions && customInstructions.trim() && (history.length > 0 || currentFieldValue));
        if (customInstructions && customInstructions.trim()) {
          history.push({ role: 'user', content: customInstructions.trim() });
        }

        let baseContextPrompt = `Candidate Profile:
Name: ${candidateName}
Skills: ${skillsFormatted}
Experience Context:
${contextStr}

Question:
"${questionText}"`;

        // Inject session-scoped Job Description alignment if provided on current page
        if (sessionJobDescription && sessionJobDescription.trim()) {
          const sanitizedJd = sessionJobDescription.trim().slice(0, 3500);
          baseContextPrompt += `\n\nTARGET JOB DESCRIPTION / ROLE REQUIREMENTS (Session Alignment):
"""
${sanitizedJd}
"""
ALIGNMENT DIRECTIVE:
Directly tailor and align the candidate's matching experience, technologies, and skills to address the key qualifications and keywords in the Job Description above, while remaining completely truthful to candidate profile facts.`;
        }

        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: baseContextPrompt }
        ];

        if (history.length > 0) {
          history.forEach((turn) => {
            if (turn.role === 'user') {
              messages.push({
                role: 'user',
                content: `[REVISION INSTRUCTION]: ${turn.content}\nPlease update the previous draft to incorporate this.`
              });
            } else if (turn.role === 'assistant') {
              messages.push({
                role: 'assistant',
                content: turn.content
              });
            }
          });
        }

        let singlePrompt = `${baseContextPrompt}\n\n`;
        if (isFollowUp) {
          const prevAnswer = currentFieldValue || (history.filter((h) => h.role === 'assistant').pop()?.content) || '';
          singlePrompt += `[CURRENT ANSWER IN FORM]:\n"${prevAnswer}"\n\n[USER REVISION COMMENT]:\n"${customInstructions}"\n\n[REVISION HISTORY CONTEXT]:\n${history.map((h, i) => `${h.role === 'user' ? 'User Instruction' : 'Generated Answer'}: ${h.content}`).join('\n')}\n\nTask: Revise the previous answer incorporating the user's instructions and Job Description alignment while keeping it authentic and grounded in the candidate profile.\nAnswer:`;
        } else {
          singlePrompt += `${customInstructions ? `USER FEEDBACK / INSTRUCTIONS:\n"${customInstructions}"\n\n` : ''}Answer:`;
        }

        let generatedAnswer = '';

        if (llmConfig.provider === 'ollama') {
          const endpoint = (llmConfig.ollamaEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
          const proxyRes = await new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                action: 'GENERATE_LLM_RAG',
                endpoint: `${endpoint}/api/chat`,
                payload: {
                  model: llmConfig.ollamaModel || 'llama3.2',
                  messages: messages,
                  stream: false,
                  options: {
                    temperature: 0.3,
                    num_predict: 400
                  }
                }
              }, (r) => resolve(r));
            } else {
              resolve(null);
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.message?.content) {
            generatedAnswer = proxyRes.data.message.content.trim();
          }
        } else if (llmConfig.provider === 'gemini' && llmConfig.geminiApiKey) {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${llmConfig.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${llmConfig.geminiApiKey}`;
          const proxyRes = await new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                action: 'GENERATE_LLM_RAG',
                endpoint: url,
                payload: {
                  contents: [{ parts: [{ text: `${systemPrompt}\n\n${singlePrompt}` }] }]
                }
              }, (r) => resolve(r));
            } else {
              resolve(null);
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            generatedAnswer = proxyRes.data.candidates[0].content.parts[0].text.trim();
          }
        } else if (llmConfig.provider === 'openai' && llmConfig.openaiApiKey) {
          const proxyRes = await new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
              chrome.runtime.sendMessage({
                action: 'GENERATE_LLM_RAG',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${llmConfig.openaiApiKey}`
                },
                payload: {
                  model: llmConfig.openaiModel || 'gpt-4o-mini',
                  messages: messages
                }
              }, (r) => resolve(r));
            } else {
              resolve(null);
            }
          });

          if (proxyRes && proxyRes.success && proxyRes.data?.choices?.[0]?.message?.content) {
            generatedAnswer = proxyRes.data.choices[0].message.content.trim();
          }
        }

        if (generatedAnswer) {
          history.push({ role: 'assistant', content: generatedAnswer });
          fieldChatHistory.set(chatKey, history);
        }

        return generatedAnswer;
      } catch (err) {
        console.warn('[GFAF] synthesizeAiAnswer error:', err);
        return '';
      }
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
          regenBtn.disabled = true;
          regenBtn.innerHTML = `
            <svg class="gfaf-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
            </svg>
            <span>Refining...</span>
          `;

          const newAnswer = await LocalFillerService.synthesizeAiAnswer(questionText, profile, userComment, currentVal);
          if (newAnswer) {
            LocalFillerService.setInputValue(targetEl, newAnswer);
            commentInput.value = '';
            commentInput.placeholder = "Follow-up revision instruction (e.g. 'shorten to 60 words')...";
            showToast('Answer refined with conversational memory!');
          } else {
            showToast('Could not re-generate answer.', 'error');
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

          try {
            const currentVal = (targetEl.value || '').trim();
            const generated = await LocalFillerService.synthesizeAiAnswer(questionText, profile, '', currentVal);

            if (generated && generated.trim()) {
              LocalFillerService.setInputValue(targetEl, generated.trim());
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
            showToast('Error generating AI answer.', 'error');
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
        const targetEl = container.querySelector('textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea, input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
        if (targetEl && questionText) {
          this.attachAiColumnButton(container, targetEl, questionText, profile);
          attachedCount++;
        }
      });

      return attachedCount;
    }

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

      const unfilledOpenEnded = [];

      // ====================================================
      // PASS 1: Fill All Default / Profile / Smart Q&A Answers FIRST
      // ====================================================
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const questionText = this.extractQuestionText(container);
        if (!questionText) {
          results.skippedCount++;
          continue;
        }

        const textInput = container.querySelector('input.whsOnd, input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
        const textareaInput = container.querySelector('textarea.KHxj8b, textarea[jsname="YPqjbf"], textarea');
        const radioOptions = this.extractRadioOptions(container);
        const checkboxOptions = this.extractCheckboxOptions(container);

        // 1. Text / Number Inputs
        if (textInput || textareaInput) {
          const targetEl = textareaInput || textInput;
          const isNumeric = this.isNumericRequirement(targetEl, container, questionText);
          const isOpenEnded = !isNumeric && this.isOpenEndedQuestion(questionText, targetEl);

          // Fast direct match for standard profile details & smart Q&A answers first
          const directMatch = LocalMatcherService.resolveMatch(questionText, profile);
          if (directMatch && directMatch.matched && directMatch.value !== undefined && directMatch.confidence >= 0.70) {
            let finalValue = directMatch.value;
            if (isNumeric) {
              finalValue = directMatch.numericValue || LocalMatcherService.extractNumericValue(directMatch.value, questionText);
            }

            const success = this.setInputValue(targetEl, String(finalValue));
            if (success) {
              results.filledCount++;
              if (settings.autoHighlight !== false) this.highlightContainer(container, directMatch);
              results.details.push({ question: questionText, type: 'text', value: finalValue });
              continue;
            }
          }

          // If no default match found, mark as candidate for AI synthesis
          if (isOpenEnded || targetEl.tagName === 'TEXTAREA' || questionText.length > 30) {
            unfilledOpenEnded.push({ container, targetEl, questionText });
          }
        }

        // 2. Radio Options
        if (radioOptions.length > 0) {
          const optionLabels = radioOptions.map((o) => o.label);
          const textMatch = LocalMatcherService.resolveMatch(questionText, profile);
          const radioMatch = LocalMatcherService.matchRadioOption(questionText, optionLabels, profile, textMatch);
          if (radioMatch && radioMatch.option) {
            const targetOpt = radioOptions.find((o) => o.label === radioMatch.option);
            if (targetOpt) {
              const success = this.selectRadio(targetOpt.element);
              if (success) {
                results.filledCount++;
                if (settings.autoHighlight !== false) this.highlightContainer(container, radioMatch);
                results.details.push({ question: questionText, type: 'radio', value: radioMatch.option });
                continue;
              }
            }
          }
        }

        // 3. Checkbox Options
        if (checkboxOptions.length > 0) {
          const optionLabels = checkboxOptions.map((o) => o.label);
          const selectedLabels = LocalMatcherService.matchCheckboxOptions(questionText, optionLabels, profile);
          if (selectedLabels.length > 0) {
            let anyChecked = false;
            for (const label of selectedLabels) {
              const targetCb = checkboxOptions.find((o) => o.label === label);
              if (targetCb && this.selectCheckbox(targetCb.element)) anyChecked = true;
            }
            if (anyChecked) {
              results.filledCount++;
              if (settings.autoHighlight !== false) this.highlightContainer(container, { confidence: 0.95 });
              results.details.push({ question: questionText, type: 'checkbox', value: selectedLabels });
              continue;
            }
          }
        }
      }

      // ====================================================
      // PASS 2: Synthesize AI Answers ONLY For Remaining Empty Open-Ended Questions
      // ====================================================
      for (const item of unfilledOpenEnded) {
        const { container, targetEl, questionText } = item;
        if (!targetEl.value || !targetEl.value.trim()) {
          const generatedAnswer = await this.synthesizeAiAnswer(questionText, profile);
          if (generatedAnswer && generatedAnswer.trim()) {
            const success = this.setInputValue(targetEl, generatedAnswer.trim());
            if (success) {
              results.filledCount++;
              if (settings.autoHighlight !== false) {
                this.highlightContainer(container, { confidence: 0.98, isRag: true });
              }
              this.attachAiToolbar(container, targetEl, questionText, profile);
              results.details.push({ question: questionText, type: 'rag_ai', value: generatedAnswer.trim() });
            }
          }
        }
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

    try {
      settings = await LocalStorageService.getSettings();
      if (settings.showFloatingWidget === false) return;

      profiles = await LocalStorageService.getProfiles();
      activeProfile = await LocalStorageService.getActiveProfile();
    } catch {
      // Fallback gracefully if extension was reloaded in background
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

    // 2. Action Buttons Row (Compact Auto-Fill + Settings Gear Button)
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
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
              const optionsUrl = chrome.runtime.getURL ? chrome.runtime.getURL('src/options/options.html') : null;
              if (optionsUrl) window.open(optionsUrl, '_blank');
            }
          });
        } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          window.open(chrome.runtime.getURL('src/options/options.html'), '_blank');
        }
      } catch (err) {
        if (err && err.message && err.message.includes('Extension context invalidated')) {
          showToast('Extension reloaded. Please refresh this page tab.');
        } else {
          console.warn('[GFAF] Open options error:', err);
        }
      }
    });

    actionRow.appendChild(fillBtn);
    actionRow.appendChild(settingsBtn);

    card.appendChild(dropdownWrap);
    card.appendChild(actionRow);

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

    document.body.appendChild(root);

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
    await createFloatingWidget();
    try {
      const activeProfile = await LocalStorageService.getActiveProfile();
      if (activeProfile) {
        LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
      }
    } catch {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGFAF);
  } else {
    initGFAF();
  }

  let observerDebounce = null;
  const observer = new MutationObserver(() => {
    if (!document.getElementById('gfaf-floating-root')) {
      createFloatingWidget();
    }
    if (observerDebounce) clearTimeout(observerDebounce);
    observerDebounce = setTimeout(async () => {
      try {
        const activeProfile = await LocalStorageService.getActiveProfile();
        if (activeProfile) {
          LocalFillerService.injectAiButtonsToAllInputs(activeProfile);
        }
      } catch {}
    }, 400);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.__GFAF_TRIGGER_AUTO_FILL__ = triggerAutoFill;
  window.__GFAF_INJECT_AI_BUTTONS__ = () => {
    LocalStorageService.getActiveProfile().then((p) => {
      if (p) LocalFillerService.injectAiButtonsToAllInputs(p);
    });
  };
})();
