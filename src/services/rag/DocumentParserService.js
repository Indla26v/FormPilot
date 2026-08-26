/**
 * DocumentParserService - Parses Resume files, Text, Markdown, and GitHub READMEs
 * Follows Single Responsibility Principle (SRP).
 */

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
      .trim();
  }

  /**
   * Parse text from a local File object (.txt, .md, .pdf)
   */
  static async parseFile(file) {
    if (!file) throw new Error('No file provided');

    const fileName = file.name || 'document';
    const extension = fileName.split('.').pop()?.toLowerCase();

    // Plain text / Markdown
    if (extension === 'txt' || extension === 'md' || extension === 'markdown' || extension === 'json') {
      const content = await file.text();
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
      const buffer = await file.arrayBuffer();
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

    // Fallback: read as text
    const raw = await file.text();
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
      let inTextObject = false;

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
    if (!repoUrl) throw new Error('Repository URL is required');

    // Extract owner and repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\#\?]+)/i);
    if (!match) {
      throw new Error('Invalid GitHub URL. Format: https://github.com/owner/repo');
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, '');
    const cleanRepoName = repo;

    const branches = ['HEAD', 'main', 'master'];
    let readmeText = '';
    let fetchedUrl = '';

    for (const branch of branches) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) {
          readmeText = await res.text();
          fetchedUrl = rawUrl;
          break;
        }
      } catch (e) {
        // Continue trying fallback branches
      }
    }

    if (!readmeText) {
      // Try uppercase / lowercase variations
      for (const branch of ['main', 'master']) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/readme.md`;
        try {
          const res = await fetch(rawUrl);
          if (res.ok) {
            readmeText = await res.text();
            fetchedUrl = rawUrl;
            break;
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
      repoUrl: `https://github.com/${owner}/${repo}`,
      owner: owner,
      repo: repo,
      content: this.cleanText(readmeText),
      createdAt: new Date().toISOString()
    };
  }
}
