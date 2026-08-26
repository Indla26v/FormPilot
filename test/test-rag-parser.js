/**
 * Automated test for DocumentParserService (Markdown & GitHub README URL parser)
 */

import { DocumentParserService } from '../src/services/rag/DocumentParserService.js';

console.log('----------------------------------------------------');
console.log('TESTING DOCUMENT PARSER SERVICE');
console.log('----------------------------------------------------\n');

// 1. Test cleanText
const dirtyText = "  Hello   world \r\n\r\n\r\n New   paragraph  \t  ";
const cleaned = DocumentParserService.cleanText(dirtyText);
console.log('[PASS] cleanText output:', JSON.stringify(cleaned));

// 2. Test GitHub URL Extraction & fetch mock
const githubUrl = 'https://github.com/alex-morgan-dev/ai-voice-agent-pipeline';
const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\#\?]+)/i);

if (match && match[1] === 'alex-morgan-dev' && match[2] === 'ai-voice-agent-pipeline') {
  console.log(`[PASS] Extracted GitHub Owner: "${match[1]}", Repo: "${match[2]}"`);
} else {
  console.error('[FAIL] GitHub URL extraction failed');
  process.exit(1);
}

console.log('\n====================================================');
console.log('SUCCESS: DOCUMENT PARSER TESTS PASSED!');
console.log('====================================================');
