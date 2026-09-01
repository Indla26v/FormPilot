export const SITE_CONFIG = {
  name: 'Fillvyn',
  tagline: 'AI Forms Auto-Filler',
  description:
    'Smart Chrome Extension for Google Forms and Microsoft Forms with Local Offline Ollama RAG and privacy-first synthesis.',
  chromeExtensionUrl:
    process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL ||
    'https://chromewebstore.google.com/detail/fillvyn-ai-forms-auto-fil/jcemhdibdeekkkjeoenokjlhcfjkhinf',
  supportEmail: 'fillvyn.support@gmail.com',
  links: {
    ollamaDocs: 'https://ollama.com',
    privacyPolicy: '/privacy',
    feedback: '/feedback',
    contact: '/contact',
  },
} as const;
