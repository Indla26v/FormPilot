import { SecurityGuardService } from '../security/SecurityGuardService.js';

export class DocumentParserService {
  /**
   * Clean and normalize raw document text
   */
  static cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .slice(0, 500000)
      .trim();
  }

  /**
   * Parse text from a local File object (.txt, .md, .pdf, .docx)
   */
  static async parseFile(file) {
    // 1. Strict metadata validation
    const fileMeta = SecurityGuardService.validateDocumentFile(file);
    const fileName = fileMeta.sanitizedName;
    const extension = fileMeta.extension;

    // 2. Read buffer and perform magic-byte verification
    const buffer = await file.arrayBuffer();
    SecurityGuardService.validateDocumentFile(file, buffer);

    // Plain text / Markdown
    if (extension === 'txt' || extension === 'md' || extension === 'markdown') {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const content = decoder.decode(buffer);
      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: fileName,
        type: extension === 'md' ? 'markdown' : 'text',
        source: 'file_upload',
        fileName: fileName,
        content: this.cleanText(content),
        createdAt: new Date().toISOString()
      };
    }

    // PDF files: Extract readable text streams
    if (extension === 'pdf') {
      const extractedText = await this.extractTextFromPdfArrayBuffer(buffer);
      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: fileName,
        type: 'pdf',
        source: 'resume_pdf',
        fileName: fileName,
        content: this.cleanText(extractedText || `Resume PDF: ${fileName}`),
        createdAt: new Date().toISOString()
      };
    }

    // Fallback: decode text
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const raw = decoder.decode(buffer);
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: fileName,
      type: 'text',
      source: 'file_upload',
      fileName: fileName,
      content: this.cleanText(raw),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Lightweight text extractor for PDF array buffer without heavy external binaries
   */
  static async extractTextFromPdfArrayBuffer(buffer) {
    try {
      const uint8 = new Uint8Array(buffer);
      let text = '';

      // Scan for stream and text objects (BT ... ET) or plain string streams
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawString = decoder.decode(uint8);

      // Extract text inside PDF parentheses ( ... ) Tj / ' / "
      const regex = /\((.*?)\)\s*(?:Tj|'|TJ)/gs;
      let match;
      const fragments = [];

      while ((match = regex.exec(rawString)) !== null) {
        let fragment = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        
        if (fragment.trim()) {
          fragments.push(fragment);
        }
      }

      if (fragments.length > 0) {
        text = fragments.join(' ');
      } else {
        // Fallback: extract ASCII words
        const asciiMatches = rawString.match(/[A-Za-z0-9\.\,\:\-\_\/\@\+\#]{3,}/g);
        if (asciiMatches && asciiMatches.length > 20) {
          text = asciiMatches.join(' ');
        }
      }

      return text || 'Extracted PDF document text';
    } catch (err) {
      console.warn('[GFAF] PDF extraction fallback:', err);
      return '';
    }
  }

  /**
   * Parse GitHub repository URL and fetch its README.md
   * Example input: https://github.com/alex-morgan-dev/ai-voice-agent-pipeline
   */
  static async fetchGitHubReadme(repoUrl) {
    // Strict URL & Host validation
    const { owner, repo, cleanRepoName, canonicalUrl } = SecurityGuardService.validateGitHubUrl(repoUrl);

    const branches = ['HEAD', 'main', 'master'];
    let readmeText = '';

    for (const branch of branches) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 0) {
            readmeText = text.slice(0, 500000);
            break;
          }
        }
      } catch (e) {
        // Continue trying fallback branches
      }
    }

    if (!readmeText) {
      // Try lowercase variations
      for (const branch of ['main', 'master']) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`;
        try {
          const res = await fetch(rawUrl);
          if (res.ok) {
            const text = await res.text();
            if (text && text.length > 0) {
              readmeText = text.slice(0, 500000);
              break;
            }
          }
        } catch {}
      }
    }

    if (!readmeText) {
      throw new Error(`Could not locate README.md in GitHub repository "${owner}/${repo}". Please ensure repository is public.`);
    }

    return {
      id: `gh_${owner}_${repo}_${Date.now()}`,
      title: `${cleanRepoName} (GitHub README)`,
      type: 'github_readme',
      source: 'github',
      repoUrl: canonicalUrl,
      owner: owner,
      repo: repo,
      content: this.cleanText(readmeText),
      createdAt: new Date().toISOString()
    };
  }
}
