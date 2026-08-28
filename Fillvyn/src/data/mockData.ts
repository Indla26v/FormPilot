import { CandidateProfile, ShowcaseTab, SpecItem, FaqItem } from '../types';

export const PROFILES: CandidateProfile[] = [
  {
    id: 'ai-engineer',
    name: 'Alex Morgan',
    role: 'AI & Full Stack Engineer',
    email: 'alex.morgan.dev@example.com',
    phone: '+1 555-019-2834',
    location: 'San Francisco, CA',
    expectedCtc: {
      lpa: '14 - 18 LPA',
      numberOnly: '16',
      raw: '1600000',
    },
    noticePeriod: {
      text: 'Immediate',
      days: '0',
    },
    graduationYear: '2024',
    gpa: '8.9 / 10',
    skills: ['Python', 'TypeScript', 'Next.js', 'PyTorch', 'LangChain', 'FastAPI', 'PostgreSQL', 'Docker'],
    techSummary: 'Specialized in building end-to-end LLM pipelines, vector databases (Qdrant/Pinecone), and modern Next.js 14 full-stack applications with sub-100ms API response times.',
    debugStory: 'Diagnosed a memory leak in an Ollama streaming token buffer by analyzing Web Crypto memory dumps and batching V8 garbage collector passes, dropping P99 latency by 64% without dropping tokens.',
  },
  {
    id: 'backend-sde',
    name: 'Sarah Chen',
    role: 'Senior Backend Engineer',
    email: 'sarah.chen.code@example.com',
    phone: '+1 555-024-9102',
    location: 'Seattle, WA',
    expectedCtc: {
      lpa: '22 - 28 LPA',
      numberOnly: '25',
      raw: '2500000',
    },
    noticePeriod: {
      text: '15 Days',
      days: '15',
    },
    graduationYear: '2022',
    gpa: '9.2 / 10',
    skills: ['Go', 'Rust', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Kafka', 'Redis', 'PostgreSQL'],
    techSummary: 'High-throughput backend engineer experienced in event-driven microservices, Raft consensus algorithms, and ultra-low latency streaming services handling 50k req/sec.',
    debugStory: 'Resolved a cascading thread lock across distributed Raft consensus nodes by implementing non-blocking ring buffers and optimistic concurrency control.',
  },
];

export const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'floating-dock',
    title: 'In-Page Floating Assistant',
    tag: 'Workflow Accelerator',
    description: 'A discreet in-page floating widget that activates when Google Forms or Microsoft Forms load. Switch profiles, select local AI models, or inject a Job Description with zero tab switching.',
    features: [
      'Collapsible Target JD drawer for dynamic context injection',
      'Instant profile & LLM switcher right beside the Auto-Fill trigger',
      'Zero DOM disruption with isolated shadow-style styling',
      'Keyboard shortcut trigger: Alt + Shift + F',
    ],
  },
  {
    id: 'extension-popup',
    title: 'Quick Status Popup',
    tag: 'One-Click Trigger',
    description: 'Instant overview of current candidate profile, active form readiness detection, and direct access to full profile settings and answer customization.',
    features: [
      'Live "Google Form Ready" automatic DOM detection',
      'Active profile badge with quick candidate identity preview',
      'One-click Auto-Fill button with tactile visual feedback',
      'Direct navigation to multi-profile management',
    ],
  },
  {
    id: 'rag-knowledge-base',
    title: 'RAG Knowledge Base',
    tag: 'Truth-Grounded AI',
    description: 'Upload your Resume (.pdf, .docx, .md, .txt) and ingest public GitHub repository READMEs with 1 click to power factual, non-hallucinated answers for open-ended technical questions.',
    features: [
      'Local multi-format document parser with client-side chunking',
      '1-Click GitHub Repository README ingestion with direct URL parsing',
      'Hybrid BM25 and semantic keyword scoring for instant retrieval',
      'Accurate first-person technical synthesis grounded in your actual code',
    ],
  },
  {
    id: 'ai-llm-setup',
    title: 'Local Ollama & Cloud AI',
    tag: '100% Free & Offline',
    description: 'Run completely offline on your own machine using Ollama (llama3.2, deepseek-r1, phi3, mistral) for absolute privacy and zero API bills, or plug in Gemini, OpenAI, or Claude cloud keys.',
    features: [
      '1-Click Ollama local model detection and connection testing',
      'Zero telemetry and zero data retention for complete security',
      'Step-by-step OLLAMA_ORIGINS configuration helper for Windows, macOS, and Linux',
      'Plug-and-play Cloud strategy fallback (Google Gemini 1.5, OpenAI GPT-4o, Claude 3.5)',
    ],
  },
  {
    id: 'personal-details',
    title: 'Personal & Profile Manager',
    tag: 'Multi-Persona Storage',
    description: 'Granular control over personal contact data, formatted GPA/percentage scales, multi-tier CTC targets, notice periods, and custom form key-value overrides.',
    features: [
      'Support for multiple role profiles (e.g. AI Engineer, Full Stack, SDE-2)',
      'Intelligent field variations (Full name, First/Last name splits)',
      'AES-GCM-256 password encrypted profile exports and backups',
      'Custom form field matching rules for proprietary company questions',
    ],
  },
];

export const LOCAL_SPECS: SpecItem[] = [
  {
    tier: 'Entry-Level (Smooth CPU)',
    models: 'llama3.2:1b, llama3.2:3b, phi3:mini',
    cpu: 'Intel Core i5 (8th Gen+) / AMD Ryzen 5 3000+ / Apple M1',
    ram: '8 GB RAM',
    gpu: 'Integrated (Intel Iris Xe, AMD Radeon, Apple M1/M2)',
    storage: '10 GB SSD',
    badge: 'Best for 8GB Laptops',
  },
  {
    tier: 'Recommended (Fast & Sharp)',
    models: 'llama3.2:3b, mistral:7b, deepseek-r1:7b',
    cpu: 'Intel Core i7 (11th Gen+) / AMD Ryzen 7 5000+ / Apple Silicon M2/M3',
    ram: '16 GB RAM',
    gpu: 'NVIDIA GTX 1650 / RTX 3050 / RTX 4050+ (4-6 GB VRAM)',
    storage: '20 GB NVMe SSD',
    badge: 'Optimal Balance',
  },
  {
    tier: 'Power User (Heavy RAG)',
    models: 'llama3.1:8b, deepseek-r1:8b, qwen2.5:7b',
    cpu: 'Intel Core i7/i9 (12th Gen+) / AMD Ryzen 7/9 / Apple M-Pro/Max',
    ram: '16 GB – 32 GB RAM',
    gpu: 'NVIDIA RTX 3060 / 4060 / 4070+ (8 GB+ VRAM) or Apple Unified 16GB+',
    storage: '30 GB NVMe SSD',
    badge: 'Maximum Quality',
  },
];

export const CLOUD_SPECS: SpecItem[] = [
  {
    tier: 'Standard Cloud Mode',
    models: 'Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, Claude 3.5 Sonnet',
    cpu: 'Any Dual-Core Intel Core i3 / AMD Ryzen / Apple Silicon',
    ram: '4 GB – 8 GB RAM',
    gpu: 'No dedicated GPU required',
    storage: '100 MB free browser disk space',
    badge: 'Runs on Any PC',
  },
];

export const FAQS: FaqItem[] = [
  {
    category: 'Compatibility',
    question: 'Which form platforms does Fillvyn support?',
    answer: 'Fillvyn natively supports all Google Forms and Microsoft Forms (including forms.office.com and forms.cloud.microsoft). It dynamically inspects field containers, question titles, helper text, and input formats (radio pills, check boxes, short text, and multi-line essays).',
  },
  {
    category: 'Privacy & Security',
    question: 'Is my resume or candidate profile sent to external servers?',
    answer: 'No. When using Ollama Local Mode, 100% of the computation, indexing, and LLM text generation runs offline on your machine. Your API keys (if using Gemini/OpenAI/Claude) are stored in your browser local storage and never routed through any Fillvyn intermediate servers.',
  },
  {
    category: 'RAG & GitHub',
    question: 'How does GitHub README ingestion work?',
    answer: 'Simply paste any public GitHub repository link (e.g., https://github.com/username/repo) into the Knowledge Base settings. Fillvyn automatically fetches the raw README.md, parses the architecture and stack descriptions, chunks it locally, and indexes it for real-time retrieval.',
  },
  {
    category: 'Smart Formatting',
    question: 'How does Fillvyn handle strict numeric vs text fields (like CTC or Notice Period)?',
    answer: 'Fillvyn checks the input type, field length, and label constraints. If a field says "Expected CTC (in LPA)", it inputs "12". If it asks "Expected CTC" as text, it fills "10 - 14 LPA". If Notice Period is marked numeric days, it fills "0" instead of "Immediate".',
  },
  {
    category: 'Cost',
    question: 'Is Fillvyn free to use?',
    answer: 'Yes! Fillvyn is open-source and free to use. When paired with local Ollama or Google Gemini free tier API keys, you enjoy limitless automated form filling with zero recurring subscription fees.',
  },
];
