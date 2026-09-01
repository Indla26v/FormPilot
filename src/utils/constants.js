/**
 * Constants and Default Profile Definitions for Google Forms Auto Filler
 */

export const STORAGE_KEYS = {
  PROFILES: 'gfaf_profiles',
  ACTIVE_PROFILE_ID: 'gfaf_active_profile_id',
  COMMON_DATA: 'gfaf_common_data',
  SETTINGS: 'gfaf_settings',
  HISTORY: 'gfaf_fill_history',
  DOCS: 'gfaf_rag_documents',
  CHUNKS: 'gfaf_rag_chunks',
  getRagDocsKey: (profileId = 'default') => `gfaf_rag_docs_${profileId || 'default'}`,
  getRagChunksKey: (profileId = 'default') => `gfaf_rag_chunks_${profileId || 'default'}`
};

export const DEFAULT_SETTINGS = {
  autoHighlight: true,
  autoFillRadioCheckboxes: true,
  showFloatingWidget: true,
  notificationDurationMs: 3000,
  confidenceThreshold: 0.55
};

export const DEFAULT_COMMON_DATA = {
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
    // 1. 10th & 12th Schooling
    tenthSchoolName: 'St. Xavier High School',
    tenthPercentageNumeric: '92.5',
    twelfthSchoolName: 'National Junior College',
    twelfthPercentageNumeric: '94.0',

    // 2. Undergraduate / Graduation
    collegeName: 'University of Technology',
    degree: 'B.S.',
    branch: 'Computer Science & Engineering',
    graduationYear: '2025',
    graduationCgpaNumeric: '8.8',
    graduationStatus: 'I am in my last year',
    workingStatus: 'Student',

    // 3. Post Graduation / Master's Details
    pgCollegeName: '',
    pgDegree: '',
    pgBranch: '',
    pgGraduationYear: '',
    pgGraduationStatus: '',
    pgCgpaNumeric: ''
  },
  professional: {
    currentOrganization: 'Acme Labs / Open Source Builder',
    currentRole: 'AI & Full Stack Engineer',
    totalExperienceYears: '1',
    noticePeriod: 'Immediate',
    noticePeriodDays: '0', // 0 for immediate joiners, 15, 30, etc.
    canJoinImmediately: 'Yes',
    hoursCommitmentConfirmed: 'Yes',
    currentCtc: '0',
    currentCtcLpa: '0', // In LPA scale (e.g. 0, 5, 10)
    currentCtcNumeric: '0',
    expectedCtc: '7 - 12 LPA',
    expectedCtcLpa: '10', // In LPA scale (e.g. 10)
    expectedCtcNumeric: '1000000',
    stipendExpectation: 'Rs. 40,000 - 60,000 / month',
    stipendExpectationNumeric: '50000'
  }
};

export const DEFAULT_PROFILE = {
  id: 'profile_default',
  name: 'Default Profile',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // Personal Details
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

  // Education Details
  education: {
    // 1. 10th & 12th Schooling
    tenthSchoolName: 'St. Xavier High School',
    tenthPercentageNumeric: '92.5',
    twelfthSchoolName: 'National Junior College',
    twelfthPercentageNumeric: '94.0',

    // 2. Undergraduate / Graduation
    collegeName: 'University of Technology',
    degree: 'B.S.',
    branch: 'Computer Science & Engineering',
    graduationYear: '2025',
    graduationCgpaNumeric: '8.8',
    graduationStatus: 'I am in my last year',
    workingStatus: 'Student',

    // 3. Post Graduation / Master's Details
    pgCollegeName: '',
    pgDegree: '',
    pgBranch: '',
    pgGraduationYear: '',
    pgGraduationStatus: '',
    pgCgpaNumeric: ''
  },

  // Professional & Experience Details
  professional: {
    currentOrganization: 'Acme Labs / Open Source Builder',
    currentRole: 'AI & Full Stack Engineer',
    totalExperienceYears: '1',
    noticePeriod: 'Immediate',
    noticePeriodDays: '0', // 0 for immediate joiners, 15, 30, etc.
    canJoinImmediately: 'Yes',
    hoursCommitmentConfirmed: 'Yes',
    currentCtc: '0',
    currentCtcLpa: '0', // In LPA scale (e.g. 0, 5, 10)
    currentCtcNumeric: '0',
    expectedCtc: '7 - 12 LPA',
    expectedCtcLpa: '10', // In LPA scale (e.g. 10)
    expectedCtcNumeric: '1000000',
    stipendExpectation: 'Rs. 40,000 - 60,000 / month',
    stipendExpectationNumeric: '50000'
  },

  // Social & Portfolio Links
  links: {
    linkedinUrl: 'https://www.linkedin.com/in/alex-morgan-dev',
    githubUrl: 'https://github.com/alex-morgan-dev',
    portfolioUrl: 'https://alexmorgan.dev',
    projectDemoUrl: 'https://github.com/alex-morgan-dev/ai-voice-agent-pipeline',
    resumeUrl: 'https://drive.google.com/file/d/1a2b3c4d5e-sample-resume/view'
  },

  // Skills & Stacks
  skills: [
    'Next js',
    'Next.js',
    'FastAPI',
    'Python',
    'TypeScript',
    'Postgres',
    'PostgreSQL',
    'Docker',
    'AWS',
    'LangChain',
    'OpenAI',
    'Anthropic',
    'Gemini',
    'Opensource/Local',
    'LangChain/LlamaIndex',
    'voice APIs',
    'N8N',
    'Vector DBs'
  ],

  // Generic key-value custom fields
  customFields: [
    { key: 'Role Interested', value: 'AI Engineer / Forward Deployed Engineer' },
    { key: 'Preferred Work Mode', value: 'Remote' }
  ]
};

/**
 * Common field aliases and heuristic definitions for semantic matching
 */
export const FIELD_DICTIONARY = [
  // Full Name
  {
    fieldPath: 'personal.fullName',
    type: 'text',
    aliases: [
      'full name', 'candidate name', 'your name', 'applicant name', 'name *', 'name*', 'name',
      'first and last name', 'enter your name'
    ]
  },
  // First Name
  {
    fieldPath: 'personal.firstName',
    type: 'text',
    aliases: ['first name', 'given name', 'forename']
  },
  // Last Name
  {
    fieldPath: 'personal.lastName',
    type: 'text',
    aliases: ['last name', 'surname', 'family name']
  },
  // Email
  {
    fieldPath: 'personal.email',
    type: 'text',
    aliases: [
      'email', 'email id', 'email address', 'e-mail', 'mail id', 'contact email', 'email*'
    ]
  },
  // Phone / Contact
  {
    fieldPath: 'personal.phone',
    numericPath: 'personal.phoneDigits',
    type: 'text_or_number',
    aliases: [
      'contact no', 'contact number', 'phone', 'phone number', 'phone no', 'mobile',
      'mobile number', 'mobile no', 'whatsapp number', 'telephone', 'contact'
    ]
  },
  // Location
  {
    fieldPath: 'personal.currentLocation',
    type: 'text',
    aliases: [
      'current location', 'where are you based out of', 'location', 'city', 'current city',
      'base location', 'current address', 'where do you live', 'based out of'
    ]
  },
  // 10th School / Board Name
  {
    fieldPath: 'education.tenthSchoolName',
    type: 'text',
    aliases: [
      '10th school name', '10th school', 'ssc school', '10th institution', 'class 10 school',
      'matriculation school', '10th board school name', 'school name (10th)', '10th school/institute'
    ]
  },
  // 10th Numeric Percentage / Marks
  {
    fieldPath: 'education.tenthPercentageNumeric',
    numericPath: 'education.tenthPercentageNumeric',
    type: 'number_or_text',
    aliases: [
      '10th percentage / cgpa', '10th percentage', '10th cgpa', '10th marks', 'ssc percentage',
      '10th %', 'class 10', '10th marks (in %)', '10th gpa'
    ]
  },
  // 12th / Junior College Name
  {
    fieldPath: 'education.twelfthSchoolName',
    type: 'text',
    aliases: [
      '12th school name', '12th college name', 'junior college name', 'intermediate college name',
      '12th school', '12th college', 'inter college', 'hsc school', 'class 12 school',
      '12th institution', 'school name (12th)'
    ]
  },
  // 12th Numeric Percentage / Marks
  {
    fieldPath: 'education.twelfthPercentageNumeric',
    numericPath: 'education.twelfthPercentageNumeric',
    type: 'number_or_text',
    aliases: [
      '12th percentage / cgpa', '12th percentage', '12th cgpa', '12th marks', 'hsc percentage',
      '12th %', 'class 12', 'inter percentage', '12th marks (in %)', '12th gpa'
    ]
  },
  // College / University
  {
    fieldPath: 'education.collegeName',
    type: 'text',
    aliases: [
      'college/university name', 'college name', 'university name', 'institute name',
      'college', 'university', 'school name', 'institution', 'ug college'
    ]
  },
  // Degree (e.g. B.Tech, B.E., B.S., BCA)
  {
    fieldPath: 'education.degree',
    type: 'text',
    aliases: [
      'degree', 'ug degree', 'bachelor degree', 'graduation degree', 'undergraduate degree',
      'course', 'undergraduate course', 'degree name'
    ]
  },
  // Branch / Specialization (e.g. CSE, IT, AI & ML)
  {
    fieldPath: 'education.branch',
    type: 'text',
    aliases: [
      'branch', 'stream', 'major', 'specialization', 'department', 'engineering branch',
      'ug branch', 'discipline', 'field of study'
    ]
  },
  // Combined Degree & Branch
  {
    fieldPath: 'education.degreeAndBranch',
    type: 'text',
    aliases: [
      'degree & branch', 'degree & stream', 'qualification', 'highest qualification',
      'degree and branch', 'degree and stream', 'degree / stream', 'degree / branch'
    ]
  },
  // Year of Graduation (Numeric 4-digit Year)
  {
    fieldPath: 'education.graduationYear',
    numericPath: 'education.graduationYear',
    type: 'number_or_text',
    aliases: [
      'year of graduation', 'graduation year', 'year of passing', 'passing year', 'passout year',
      'batch', 'yop', 'year of graduation *', 'graduation year *', 'ug passing year', 'ug end year'
    ]
  },
  // Graduation Numeric CGPA / Percentage
  {
    fieldPath: 'education.graduationCgpaNumeric',
    numericPath: 'education.graduationCgpaNumeric',
    type: 'number_or_text',
    aliases: [
      'graduation percentage / cgpa', 'graduation percentage', 'graduation cgpa', 'btech cgpa',
      'degree percentage', 'ug cgpa', 'current cgpa', 'cgpa', 'graduation gpa', 'overall cgpa'
    ]
  },
  // Graduation Status (Radio choice: "When did you graduate?")
  {
    fieldPath: 'education.graduationStatus',
    type: 'choice',
    aliases: [
      'when did you graduate?', 'when did you graduate?*', 'when did you graduate'
    ],
    defaultChoice: 'I am in my last year'
  },
  // Post Graduation College / University
  {
    fieldPath: 'education.pgCollegeName',
    type: 'text',
    aliases: [
      'post graduation college', 'pg college name', 'post graduate university', 'masters college',
      'masters university', 'pg institute', 'post graduation institute', 'post-graduation college',
      'post graduation university', 'mtech college', 'mba college', 'ms college', 'mca college'
    ]
  },
  // Post Graduation Degree (e.g. M.S., M.Tech, MBA, MCA)
  {
    fieldPath: 'education.pgDegree',
    type: 'text',
    aliases: [
      'post graduation degree', 'pg degree', 'masters degree', 'post graduate course',
      'pg course', 'm.tech degree', 'm.s. degree', 'mba degree', 'mca degree', 'masters course'
    ]
  },
  // Post Graduation Branch / Specialization
  {
    fieldPath: 'education.pgBranch',
    type: 'text',
    aliases: [
      'post graduation branch', 'pg branch', 'post graduation specialization', 'pg specialization',
      'masters specialization', 'pg stream', 'post graduation stream', 'masters branch'
    ]
  },
  // Combined Post Graduation Degree & Branch
  {
    fieldPath: 'education.pgDegreeAndBranch',
    type: 'text',
    aliases: [
      'post graduation degree & branch', 'pg degree & specialization', 'masters degree & specialization',
      'post graduate qualification', 'pg qualification'
    ]
  },
  // Post Graduation Passing / End Year
  {
    fieldPath: 'education.pgGraduationYear',
    numericPath: 'education.pgGraduationYear',
    type: 'number_or_text',
    aliases: [
      'post graduation year', 'pg graduation year', 'post graduation passing year', 'pg passing year',
      'pg year of passing', 'pg passout year', 'masters graduation year', 'masters passing year',
      'post graduation end year', 'pg end year', 'year of post graduation'
    ]
  },
  // Post Graduation Numeric CGPA / Percentage
  {
    fieldPath: 'education.pgCgpaNumeric',
    numericPath: 'education.pgCgpaNumeric',
    type: 'number_or_text',
    aliases: [
      'post graduation cgpa', 'pg cgpa', 'masters cgpa', 'post graduation percentage',
      'pg percentage', 'post graduation marks', 'pg marks', 'masters percentage', 'post graduation gpa',
      'pg gpa', 'masters grade', 'pg grade'
    ]
  },
  // Post Graduation Status
  {
    fieldPath: 'education.pgGraduationStatus',
    type: 'choice_or_text',
    aliases: [
      'post graduation status', 'pg status', 'are you pursuing post graduation', 'masters status'
    ]
  },
  // Working Status
  {
    fieldPath: 'education.workingStatus',
    type: 'choice_or_text',
    aliases: [
      'working status', 'employment status', 'current status'
    ],
    defaultChoice: 'Student'
  },
  // Years of Experience
  {
    fieldPath: 'professional.totalExperienceYears',
    numericPath: 'professional.totalExperienceYears',
    type: 'number_or_text',
    aliases: [
      'years of experience', 'years of experience *', 'total experience', 'work experience',
      'experience (in years)', 'experience (years)', 'total years of experience', 'experience',
      'relevant experience', 'years of exp', 'total exp', 'experience in years'
    ]
  },
  // Notice Period (In days)
  {
    fieldPath: 'professional.noticePeriodDays',
    numericPath: 'professional.noticePeriodDays',
    type: 'number_or_text',
    aliases: [
      'notice period (in days)', 'notice period in days', 'notice period (days)',
      'notice period days', 'notice period', 'notice period (in days) *'
    ]
  },
  // Current CTC (LPA)
  {
    fieldPath: 'professional.currentCtcLpa',
    numericPath: 'professional.currentCtcLpa',
    type: 'text_or_number',
    aliases: [
      'current ctc (lpa) excluding stocks', 'current ctc (lpa)', 'current ctc in lpa',
      'current ctc (in lpa)', 'current ctc', 'current fixed ctc', 'current salary (lpa)', 'present ctc'
    ]
  },
  // Expected CTC (LPA)
  {
    fieldPath: 'professional.expectedCtcLpa',
    numericPath: 'professional.expectedCtcLpa',
    type: 'text_or_number',
    aliases: [
      'expected ctc (lpa) excluding stocks', 'expected ctc (lpa)', 'expected ctc in lpa',
      'expected ctc (in lpa)', 'expected ctc', 'expected salary (lpa)', 'stipend expectations',
      'expected salary', 'stipend expectation', 'compensation expectation', 'ctc expected'
    ]
  },
  // Current Organization / Company
  {
    fieldPath: 'professional.currentOrganization',
    type: 'text',
    aliases: [
      'current organization', 'current company', 'current employer', 'company name', 'organization'
    ]
  },
  // Current Role / Title / Role Selection
  {
    fieldPath: 'professional.currentRole',
    type: 'choice_or_text',
    aliases: [
      'role', 'position applied for', 'role applied for', 'designation', 'current role', 'job title'
    ]
  },
  // Current Company and Job Title (Combined)
  {
    fieldPath: 'professional.companyAndRole',
    type: 'text',
    aliases: [
      'current company and job title', 'current company and job title *', 'current company and role',
      'company and job title', 'company and designation', 'current organization and designation',
      'current company & title', 'current company and title', 'current employer and role'
    ]
  },
  // Immediate Joiner / Availability (Yes/No)
  {
    fieldPath: 'professional.canJoinImmediately',
    type: 'choice_or_text',
    aliases: [
      'can you join immediately', 'can you join immediately (i.e in the 1st week of september)*',
      'can you join immediately (i.e in the 1st week of september)', 'join immediately',
      'immediate joiner', 'earliest start date', 'available immediately'
    ],
    defaultChoice: 'Yes'
  },
  // Commitment Confirmation
  {
    fieldPath: 'professional.hoursCommitmentConfirmed',
    type: 'choice_or_text',
    aliases: [
      'this role requires 8 hours daily', 'can you commit to this', 'hours daily',
      'full-time commitment', 'time commitment'
    ],
    defaultChoice: 'Yes'
  },
  // Technical Skills / Stack Text
  {
    fieldPath: 'skills',
    type: 'text',
    aliases: [
      'skills', 'technical skills', 'key skills', 'tech stack', 'coding stack',
      'tools and technologies', 'technologies', 'what coding stack tool do you understand',
      'stack tool do you understand', 'what coding stack', 'coding stack tool do you understand'
    ]
  },
  // LinkedIn URL
  {
    fieldPath: 'links.linkedinUrl',
    type: 'text',
    aliases: [
      'linkedin url', 'linkedin', 'linkedin profile', 'linkedin link', 'linked in url', 'linkedin *'
    ]
  },
  // GitHub URL
  {
    fieldPath: 'links.githubUrl',
    type: 'text',
    aliases: [
      'github url', 'github', 'github profile', 'github link', 'git repo'
    ]
  },
  // Portfolio / Projects
  {
    fieldPath: 'links.portfolioUrl',
    type: 'text',
    aliases: [
      'portfolio', 'portfolio url', 'projects or portfolio', 'website', 'personal website',
      'project link', 'portfolio / website'
    ]
  },
  // Specific Project Link / Repo
  {
    fieldPath: 'links.projectDemoUrl',
    type: 'text',
    aliases: [
      'link to one thing you built that a stranger can open and use',
      'link to one thing you built',
      'best project link',
      'live project'
    ]
  },
  // Resume Link (for text inputs)
  {
    fieldPath: 'links.resumeUrl',
    type: 'text',
    aliases: [
      'resume link', 'cv link', 'drive link to resume', 'resume url'
    ]
  }
];
