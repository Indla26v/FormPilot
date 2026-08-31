export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'radio' | 'textarea';
  placeholder?: string;
  options?: string[];
  helpText?: string;
  value: string;
  formattedOutput?: string;
  sourceNote?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  role: string;
  domainTitle: string;
  email: string;
  phone: string;
  location: string;
  expectedCtc: {
    lpa: string;
    numberOnly: string;
    raw: string;
  };
  noticePeriod: {
    text: string;
    days: string;
  };
  graduationYear: string;
  gpa: string;
  skills: string[];
  techSummary: string;
  debugStory: string;
  resumeFile?: string;
}

export interface ShowcaseTab {
  id: string;
  title: string;
  tag: string;
  description: string;
  features: string[];
}

export interface SpecItem {
  tier: string;
  models: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
  badge?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}
