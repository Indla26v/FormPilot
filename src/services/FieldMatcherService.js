/**
 * FieldMatcherService - Intelligent Semantic, Fuzzy, and Text/Numeric Matching Engine
 * Follows Open/Closed Principle (OCP) and Single Responsibility Principle (SRP).
 */

import { FIELD_DICTIONARY } from '../utils/constants.js';

export class FieldMatcherService {
  /**
   * Normalize text string for resilient matching
   */
  static normalize(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .replace(/[*_#~`\(\)\[\]\{\}\:\?\.\,\/\\\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Safely retrieve a nested value using dot notation
   */
  static getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    if (path.startsWith('links.')) {
      const linkKey = path.split('.')[1];
      const links = obj.links || {};
      if (linkKey === 'githubUrl' || linkKey === 'github') return links.githubUrl || links.github || links.gitHub || '';
      if (linkKey === 'linkedinUrl' || linkKey === 'linkedin') return links.linkedinUrl || links.linkedin || links.linkedIn || '';
      if (linkKey === 'portfolioUrl' || linkKey === 'portfolio') return links.portfolioUrl || links.portfolio || links.website || links.personalWebsite || '';
      if (linkKey === 'projectDemoUrl' || linkKey === 'projectDemo') return links.projectDemoUrl || links.projectDemo || links.demoUrl || '';
      if (linkKey === 'resumeUrl' || linkKey === 'resume') return links.resumeUrl || links.resume || links.cvUrl || '';
    }
    if (path === 'skills' && Array.isArray(obj.skills)) {
      return obj.skills.map((s) => (typeof s === 'object' && s !== null ? s.name : s)).filter(Boolean).join(', ');
    }
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

  /**
   * Calculate Jaccard similarity between two token sets
   */
  static calculateTokenSimilarity(query, target) {
    const qTokens = new Set(this.normalize(query).split(' ').filter(Boolean));
    const tTokens = new Set(this.normalize(target).split(' ').filter(Boolean));

    if (qTokens.size === 0 || tTokens.size === 0) return 0;

    let intersectionCount = 0;
    for (const token of qTokens) {
      if (tTokens.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = new Set([...qTokens, ...tTokens]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
  }

  /**
   * Check if query contains any of the keywords or high token overlap
   */
  static matchKeywords(query, keywords) {
    const normQuery = this.normalize(query);
    for (const keyword of keywords) {
      const normKeyword = this.normalize(keyword);
      if (normQuery.includes(normKeyword)) {
        return 1.0;
      }
      const similarity = this.calculateTokenSimilarity(query, keyword);
      if (similarity >= 0.6) {
        return similarity;
      }
    }
    return 0;
  }

  /**
   * Extract or convert a string to pure numeric format intelligently based on context
   */
  static extractNumericValue(textVal, questionContext = '') {
    if (textVal === null || textVal === undefined) return '';
    const str = String(textVal).trim();
    if (!str) return '';

    const normContext = this.normalize(questionContext);

    // If context is Notice Period (in days)
    if (normContext.includes('notice period') || normContext.includes('days')) {
      if (str.toLowerCase().includes('immediate')) return '0';
      const dayMatch = str.match(/\b\d+\b/);
      return dayMatch ? dayMatch[0] : '0';
    }

    // If context is in LPA e.g. "Expected CTC (LPA)"
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

    // If context is in INR or whole rupees
    if (normContext.includes('inr') || normContext.includes('rupees')) {
      const lpaMatch = str.match(/(\d+(\.\d+)?)\s*lpa/i);
      if (lpaMatch) {
        return String(Math.round(parseFloat(lpaMatch[1]) * 100000));
      }
    }

    // If already pure digits or decimal number
    if (/^-?\d+(\.\d+)?$/.test(str)) {
      return str;
    }

    // Handle LPA without context: e.g. "7 - 12 LPA" -> 1000000
    const lpaMatch = str.match(/(\d+(\.\d+)?)\s*(-|\/|to)?\s*(\d+(\.\d+)?)?\s*lpa/i);
    if (lpaMatch) {
      const val = parseFloat(lpaMatch[4] || lpaMatch[1]);
      if (!isNaN(val)) {
        return String(Math.round(val * 100000));
      }
    }

    // Handle Percentage e.g. "92.5%" -> 92.5
    const pctMatch = str.match(/(\d+(\.\d+)?)\s*%/);
    if (pctMatch) {
      return pctMatch[1];
    }

    // Handle CGPA e.g. "8.8 / 10" -> 8.8
    const cgpaMatch = str.match(/(\d+(\.\d+)?)\s*\/\s*\d+(\.\d+)?/);
    if (cgpaMatch) {
      return cgpaMatch[1];
    }

    // Strip non-digits for phone numbers
    const digitsOnly = str.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      return digitsOnly;
    }

    return str;
  }

  /**
   * Match question text to standard profile dictionary
   */
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

          // Contextual adjustment for CTC with (LPA) vs (INR)
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
            confidence: score,
            aliasMatched: alias
          };
        };

        // Exact match
        if (normQuestion === normAlias) {
          const value = this.getNestedValue(profile, entry.fieldPath);
          if (value !== undefined && value !== '') {
            return buildMatchObj(1.0, 'dictionary_exact');
          }
        }

        // Substring / Inclusion match
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

        // Token similarity match
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

  /**
   * Match question text to profile Smart Answers
   */
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
        bestMatch = {
          matched: true,
          source: 'smart_answer',
          id: qa.id,
          type: 'text',
          value: qa.answer,
          confidence: score
        };
      }
    }

    return bestMatch;
  }

  /**
   * Match question text to Custom Key-Value fields
   */
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
          type: 'text',
          value: custom.value,
          numericValue: this.extractNumericValue(custom.value, questionText),
          confidence: 0.9
        };
      }
    }

    return null;
  }

  /**
   * Match skill-specific experience or proficiency for direct text/numeric inputs
   */
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

  /**
   * Select best matching option for Radio / Single choice groups
   */
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

    // 2. Tech Stack / Language / Framework Selection Radio Matching
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

        // Check if this option is a direct single skill in candidate's skills
        const isDirectSkill = userSkills.some((skill) => skill === normOpt || (normOpt.length > 2 && skill.includes(normOpt)));
        if (isDirectSkill) {
          const score = 1.0;
          if (score > highestSkillScore) {
            highestSkillScore = score;
            bestSkillOpt = opt;
          }
          continue;
        }

        // Multi-token evaluation (e.g. "Java and python")
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

          // An option that matches 100% of candidate skills in it is superior to one containing skills candidate lacks
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

    // 3. Graduation status
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

    // 4. Working status
    if (normQuestion.includes('working status') || normQuestion.includes('employment status')) {
      const workingStatus = profile.education?.workingStatus || 'Student';
      const normStatus = this.normalize(workingStatus);
      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        if (normOpt === normStatus || normOpt.includes(normStatus)) return { option: opt, confidence: 0.95 };
      }
    }

    // 5. Role selection
    const roleMatch = this.matchRoleOrPositionOption(questionText, availableOptions, profile);
    if (roleMatch) {
      return roleMatch;
    }

    if (normQuestion === 'role' || normQuestion.includes('role')) {
      const targetRole = profile.professional?.currentRole || 'AI Engineer';
      const normTarget = this.normalize(targetRole);
      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        if (normOpt === normTarget || (normOpt.includes('ai engineer') && normTarget.includes('ai'))) {
          return { option: opt, confidence: 0.95 };
        }
        if (normOpt.includes('devrel') && normTarget.includes('devrel')) {
          return { option: opt, confidence: 0.95 };
        }
      }
    }

    // 6. Production deployment
    if (normQuestion.includes('deployed') && normQuestion.includes('production')) {
      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        if (normOpt.includes('maintained it after') || (normOpt.startsWith('yes') && !normOpt.includes('didn\'t'))) {
          return { option: opt, confidence: 0.95 };
        }
      }
    }

    // 7. LLM in loop
    if (normQuestion.includes('llm') && (normQuestion.includes('loop') || normQuestion.includes('pipeline'))) {
      for (const opt of availableOptions) {
        if (this.normalize(opt) === 'yes') return { option: opt, confidence: 0.95 };
      }
    }

    // 8. Affirmative / Negative heuristics
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

  /**
   * Intelligently match Role / Position choices grounded by candidate's totalExperienceYears & target role
   */
  static matchRoleOrPositionOption(questionText, availableOptions, profile) {
    if (!availableOptions || availableOptions.length === 0) return null;

    const normQ = this.normalize(questionText);
    const isRoleQ = (
      normQ.includes('which role') ||
      normQ.includes('role are you applying') ||
      normQ.includes('applying for') ||
      normQ.includes('position applying') ||
      normQ.includes('job role') ||
      normQ.includes('target role') ||
      normQ.includes('select role') ||
      normQ === 'role' ||
      normQ === 'role *' ||
      normQ === 'position' ||
      normQ === 'position *'
    );

    if (!isRoleQ) return null;

    const prof = profile?.professional || {};
    const rawExpYears = parseFloat(prof.totalExperienceYears !== undefined ? String(prof.totalExperienceYears).trim() : '0') || 0;
    const targetRole = this.normalize(prof.currentRole || 'ai backend software engineer');
    const skillsList = (profile?.skills || []).map((s) => {
      const name = typeof s === 'object' && s !== null ? s.name : s;
      return this.normalize(name);
    }).filter(Boolean);

    let bestOpt = null;
    let highestScore = -1;

    for (const opt of availableOptions) {
      const normOpt = this.normalize(opt);
      let score = 0;

      // 1. Experience Range Compatibility
      const isSeniorOpt = normOpt.includes('senior') || normOpt.includes('3+') || normOpt.includes('3 5') || normOpt.includes('5+') || normOpt.includes('lead') || normOpt.includes('staff');
      const isJuniorOpt = normOpt.includes('junior') || normOpt.includes('0 2') || normOpt.includes('0-2') || normOpt.includes('0 1') || normOpt.includes('1 3') || normOpt.includes('fresher') || normOpt.includes('intern') || normOpt.includes('entry level');

      if (rawExpYears <= 2) {
        if (isSeniorOpt && !isJuniorOpt) {
          // Ineligible for senior role tier when candidate has <=2 years experience
          continue;
        }
        if (isJuniorOpt) score += 50;
      } else {
        if (isJuniorOpt && !isSeniorOpt) {
          score += 10;
        }
        if (isSeniorOpt) score += 50;
      }

      // 2. Role & Tech Alignment
      if (normOpt.includes(targetRole) || targetRole.includes(normOpt)) {
        score += 30;
      }
      if ((normOpt.includes('ai') || normOpt.includes('ml')) && (targetRole.includes('ai') || skillsList.some((s) => s.includes('ai') || s.includes('llm') || s.includes('python')))) {
        score += 20;
      }
      if (normOpt.includes('backend') && (targetRole.includes('backend') || skillsList.some((s) => s.includes('java') || s.includes('node') || s.includes('spring') || s.includes('backend') || s.includes('sql')))) {
        score += 20;
      }
      if (normOpt.includes('frontend') && (targetRole.includes('frontend') || skillsList.some((s) => s.includes('react') || s.includes('vue') || s.includes('angular') || s.includes('frontend')))) {
        score += 20;
      }
      if (normOpt.includes('full stack') || normOpt.includes('fullstack')) {
        score += 15;
      }

      if (score > highestScore) {
        highestScore = score;
        bestOpt = opt;
      }
    }

    if (bestOpt && highestScore > 0) {
      return { option: bestOpt, confidence: 0.95 };
    }

    return null;
  }

  /**
   * Determine which Checkboxes to select
   */
  static matchCheckboxOptions(questionText, availableOptions, profile) {
    if (!availableOptions || availableOptions.length === 0) return [];

    const normQ = this.normalize(questionText);

    // 1. Role or Position question formatted as checkboxes in Google Forms
    const roleMatch = this.matchRoleOrPositionOption(questionText, availableOptions, profile);
    if (roleMatch && roleMatch.option) {
      return [roleMatch.option];
    }

    // 2. Affirmative / Negative choice checkboxes
    const isAffirmative = (
      normQ.includes('can you commit') ||
      normQ.includes('can you join immediately') ||
      normQ.includes('hours daily') ||
      normQ.includes('immediate')
    );
    const isNegative = (
      normQ.includes('college attendance requirement') ||
      normQ.includes('vivas') ||
      normQ.includes('exams') ||
      normQ.includes('tests') ||
      normQ.includes('end-sems')
    );
    if (isAffirmative || isNegative) {
      for (const opt of availableOptions) {
        const normOpt = this.normalize(opt);
        if (isAffirmative && normOpt === 'yes') return [opt];
        if (isNegative && normOpt === 'no') return [opt];
      }
    }

    // 3. Technical Skills Multi-Choice Checkboxes
    const selectedOptions = [];
    const skillsList = (profile?.skills || []).map((s) => {
      const name = typeof s === 'object' && s !== null ? s.name : s;
      return this.normalize(name);
    }).filter(Boolean);

    for (const opt of availableOptions) {
      const normOpt = this.normalize(opt);
      const isMatched = skillsList.some((skill) => {
        if (!skill || skill.length < 2) return false;
        if (normOpt === skill) return true;
        const optWords = normOpt.split(/[\s,()\/_-]+/);
        return optWords.includes(skill) || (normOpt.includes(skill) && skill.length >= 4);
      });
      if (isMatched && normOpt !== 'none') {
        selectedOptions.push(opt);
      }
    }

    return selectedOptions;
  }

  /**
   * Primary resolver matching question text to active profile
   */
  static resolveMatch(questionText, profile) {
    if (!questionText || !profile) {
      return { matched: false, reason: 'Missing question text or profile' };
    }

    // 1. Check Standard Dictionary Fields
    const dictMatch = this.matchDictionaryField(questionText, profile);
    if (dictMatch && dictMatch.confidence >= 0.6) {
      return dictMatch;
    }

    // 2. Check Custom Profile Fields
    const customMatch = this.matchCustomFields(questionText, profile);
    if (customMatch) {
      return customMatch;
    }

    // 3. Check Skill-specific Experience / Proficiency questions (e.g. "Spring Boot experience")
    const skillMatch = this.matchSkillExperienceOrLevel(questionText, profile);
    if (skillMatch && skillMatch.confidence >= 0.7) {
      return skillMatch;
    }

    return { matched: false, confidence: 0 };
  }
}
