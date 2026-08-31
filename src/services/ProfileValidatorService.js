/**
 * ProfileValidatorService
 * Implements Single Responsibility Principle (SRP) for validating and grounding
 * AI form field decisions and filled DOM values against candidate profile ground truth.
 * Prevents hallucinations on Experience, Current/Expected CTC, Notice Period, and standard attributes.
 */

export class ProfileValidatorService {
  /**
   * Normalize text for semantic comparison
   */
  static normalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Identify semantic profile category for a given question
   */
  static detectQuestionCategory(questionText) {
    const q = this.normalize(questionText);

    // 1. Total Experience
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

    // 2. Current CTC
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

    // 3. Expected CTC / Stipend
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

    // 4. Notice Period
    if (
      q.includes('notice period') ||
      q.includes('notice') ||
      q.includes('how soon can you join') ||
      q.includes('joining availability') ||
      q.includes('availability to join')
    ) {
      return 'notice_period';
    }

    // 5. Current Organization / Employer
    if (
      q.includes('current organization') ||
      q.includes('current company') ||
      q.includes('current employer') ||
      q.includes('company name')
    ) {
      return 'current_organization';
    }

    // 6. Current Role / Designation
    if (
      q.includes('current role') ||
      q.includes('current designation') ||
      q.includes('current job title') ||
      q.includes('designation')
    ) {
      return 'current_role';
    }

    // 7. Graduation Year
    if (
      (q.includes('graduation year') ||
      q.includes('year of graduation') ||
      q.includes('passing year') ||
      q.includes('year of passing') ||
      q.includes('batch')) &&
      !q.includes('when did you graduate')
    ) {
      return 'graduation_year';
    }

    // 8. 10th Percentage / Marks
    if (
      q.includes('10th') ||
      q.includes('tenth') ||
      q.includes('ssc') ||
      q.includes('matriculation')
    ) {
      return 'tenth_marks';
    }

    // 9. 12th Percentage / Marks
    if (
      q.includes('12th') ||
      q.includes('twelfth') ||
      q.includes('hsc') ||
      q.includes('intermediate')
    ) {
      return 'twelfth_marks';
    }

    // 10. College Name (Exclude status / choices questions like "college/work status")
    if (
      (q.includes('college') ||
      q.includes('university') ||
      q.includes('institute')) &&
      !q.includes('status') &&
      !q.includes('working') &&
      !q.includes('when') &&
      !q.includes('graduate')
    ) {
      return 'college_name';
    }

    // 11. Working / Employment Status
    if (
      q.includes('working status') ||
      q.includes('employment status') ||
      q.includes('work status') ||
      q.includes('current status') ||
      q.includes('college/work status')
    ) {
      return 'working_status';
    }

    // 12. Full Name
    if (
      q.includes('full name') ||
      q.includes('your name') ||
      q.includes('candidate name') ||
      q === 'name' ||
      q === 'name *'
    ) {
      return 'full_name';
    }

    // 12. Email
    if (
      q.includes('email') ||
      q.includes('e mail') ||
      q.includes('mail id')
    ) {
      return 'email';
    }

    // 13. Phone
    if (
      q.includes('phone') ||
      q.includes('mobile') ||
      q.includes('contact no') ||
      q.includes('contact number') ||
      q.includes('whatsapp')
    ) {
      return 'phone';
    }

    // 14. LinkedIn URL
    if (
      q.includes('linkedin')
    ) {
      return 'linkedin_url';
    }

    // 15. GitHub URL
    if (
      q.includes('github')
    ) {
      return 'github_url';
    }

    // 16. Portfolio URL
    if (
      q.includes('portfolio') ||
      q.includes('website')
    ) {
      return 'portfolio_url';
    }

    return 'unknown';
  }

  /**
   * Validate and ground an AI-generated decision against candidate profile truth
   */
  static validateAndGroundDecision(questionText, aiDecision, profile, isNumeric = false, fieldType = 'text') {
    if (!profile) return aiDecision;

    const category = this.detectQuestionCategory(questionText);
    const qNorm = this.normalize(questionText);
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
          expectedValue = prof.currentCtcNumeric !== undefined && prof.currentCtcNumeric !== null && prof.currentCtcNumeric !== ''
            ? String(prof.currentCtcNumeric).trim()
            : '0';
        } else {
          expectedValue = prof.currentCtc !== undefined && prof.currentCtc !== null && prof.currentCtc !== ''
            ? String(prof.currentCtc).trim()
            : '0';
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
          expectedValue = prof.expectedCtcNumeric !== undefined && prof.expectedCtcNumeric !== null && prof.expectedCtcNumeric !== ''
            ? String(prof.expectedCtcNumeric).trim()
            : '1000000';
        } else {
          expectedValue = prof.expectedCtc !== undefined && prof.expectedCtc !== null && prof.expectedCtc !== ''
            ? String(prof.expectedCtc).trim()
            : '10 LPA';
        }
        break;
      }

      case 'notice_period': {
        if (isDaysContext || isNumeric || fieldType === 'number') {
          const rawDays = prof.noticePeriodDays !== undefined && prof.noticePeriodDays !== null && prof.noticePeriodDays !== ''
            ? String(prof.noticePeriodDays).trim()
            : '0';
          const cleanNum = rawDays.match(/\d+/);
          expectedValue = cleanNum ? cleanNum[0] : '0';
        } else {
          expectedValue = prof.noticePeriod !== undefined && prof.noticePeriod !== null && prof.noticePeriod !== ''
            ? String(prof.noticePeriod).trim()
            : 'Immediate';
        }
        break;
      }

      case 'current_organization': {
        expectedValue = prof.currentOrganization !== undefined && prof.currentOrganization !== null && prof.currentOrganization !== ''
          ? String(prof.currentOrganization).trim()
          : 'NA';
        break;
      }

      case 'current_role': {
        expectedValue = prof.currentRole !== undefined && prof.currentRole !== null && prof.currentRole !== ''
          ? String(prof.currentRole).trim()
          : 'NA';
        break;
      }

      case 'graduation_year': {
        expectedValue = edu.graduationYear !== undefined && edu.graduationYear !== null && edu.graduationYear !== ''
          ? String(edu.graduationYear).trim()
          : '2025';
        break;
      }

      case 'tenth_marks': {
        if (isNumeric || isDigitsContext) {
          expectedValue = edu.tenthPercentageNumeric !== undefined && edu.tenthPercentageNumeric !== null && edu.tenthPercentageNumeric !== ''
            ? String(edu.tenthPercentageNumeric).trim()
            : '92.5';
        } else {
          expectedValue = edu.tenthPercentage || edu.tenthPercentageNumeric || '92.5%';
        }
        break;
      }

      case 'twelfth_marks': {
        if (isNumeric || isDigitsContext) {
          expectedValue = edu.twelfthPercentageNumeric !== undefined && edu.twelfthPercentageNumeric !== null && edu.twelfthPercentageNumeric !== ''
            ? String(edu.twelfthPercentageNumeric).trim()
            : '94.0';
        } else {
          expectedValue = edu.twelfthPercentage || edu.twelfthPercentageNumeric || '94.0%';
        }
        break;
      }

      case 'working_status': {
        expectedValue = edu.workingStatus || 'Student';
        break;
      }

      case 'college_name': {
        if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') {
          return aiDecision;
        }
        expectedValue = edu.collegeName || 'University of Technology';
        break;
      }

      case 'full_name': {
        if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') {
          return aiDecision;
        }
        expectedValue = pers.fullName || 'Alex Morgan';
        break;
      }

      case 'email': {
        if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') {
          return aiDecision;
        }
        expectedValue = pers.email || '';
        break;
      }

      case 'phone': {
        if (fieldType === 'radio' || fieldType === 'checkbox' || aiDecision?.decisionType === 'choice_selection') {
          return aiDecision;
        }
        expectedValue = isDigitsContext || isNumeric ? (pers.phoneDigits || (pers.phone || '').replace(/\D/g, '')) : (pers.phone || '');
        break;
      }

      case 'linkedin_url': {
        expectedValue = links.linkedin || '';
        break;
      }

      case 'github_url': {
        expectedValue = links.github || '';
        break;
      }

      case 'portfolio_url': {
        expectedValue = links.portfolio || '';
        break;
      }

      default:
        break;
    }

    if (expectedValue !== null && expectedValue !== undefined) {
      // If AI returned a hallucinated value or wrong number, override with strictly validated profile ground truth
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
   * Auto-correct an invalid field based on reactive form validation error text and profile
   */
  static correctValidationError(questionText, currentValue, errorText, profile) {
    if (!errorText) return null;
    const normErr = errorText.toLowerCase();
    const qNorm = (questionText || '').toLowerCase();
    const prof = profile?.professional || {};
    const edu = profile?.education || {};

    // 1. Number requirements ("Must be a number", "Must be a number greater than X", etc.)
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
}
