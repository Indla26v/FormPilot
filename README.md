# GFAF — Google Forms Auto-Filler & RAG AI Assistant

A smart, modern Manifest V3 Chrome Extension designed specifically for candidates, job seekers, and developers to auto-fill Google Forms. Features **instant profile matching**, **clean numeric vs text formatting**, and **Retrieval-Augmented Generation (RAG)** using your uploaded **Resume** and **GitHub Project `README.md` files** powered by **Local Ollama (100% Free & Offline)**, Google Gemini, OpenAI, or Claude.

---

## Key Features

### 1. RAG Knowledge Base & Dynamic Answer Synthesis
- **Resume Upload**: Upload resumes (`.pdf`, `.docx`, `.md`, `.txt`) to automatically chunk and index your work experience, metrics, and achievements.
- **1-Click GitHub Repository README Ingestion**: Paste any GitHub repo URL (e.g. `https://github.com/username/project`) to pull system architecture, performance stats, and engineering details into the local knowledge base.
- **Local Ollama Integration**: 100% free, 100% private offline generation (supports `llama3.2`, `deepseek-r1`, `mistral`, `phi3`).
- **Cloud LLM Support**: Strategy pattern support for Google Gemini, OpenAI (`gpt-4o-mini`), and Anthropic Claude.
- **Grounded Responses**: Generates truthful, first-person candidate answers for tough technical and essay questions (e.g. *"Explain the hardest bug you personally debugged"*, *"Describe your architecture"*).

### 2. Intelligent Numeric & Text Input Formatting
- **Expected CTC**: Fills `"7 - 12 LPA"` for standard text inputs, `"10"` for LPA-bounded inputs, and `"1000000"` for INR digit inputs.
- **Notice Period**: Fills `"Immediate"` for text fields and `"0"` for `Notice period (In days)` whole number fields.
- **Education & GPA**: Fills `"2025"` for graduation year, and pure numbers `"92.5"` / `"8.8"` for numeric percentages/CGPA.
- **Skills-Driven Tech Stack Matching**: Evaluates single-choice radio buttons against your configured skills list with 100% precision.

### 3. Modern Floating Assistant & Options Dashboard
- **In-Page Floating Pill Widget**: Minimalist 2-element vertical widget (Profile dropdown placed directly above Auto-Fill button).
- **Clean UI Standards**: Rounded corners, pill-shaped buttons, smooth transitions, and **strictly zero emojis** (using crisp SVG icons).
- **Multi-Profile Management**: Maintain multiple candidate profiles (e.g. *AI Engineer*, *Backend SDE*, *Full Stack*).
- **Import / Export**: Complete JSON backup and restore.

---

## How to Setup Local Ollama (Free & Offline)

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull a lightweight model:
   ```bash
   ollama pull llama3.2
   ```
3. Enable Chrome extension access:
   - On Windows: Add environment variable `OLLAMA_ORIGINS` with value `*` and restart Ollama.
4. In GFAF Options -> **AI & Local LLM Setup**:
   - Provider: `Ollama (Local Offline)`
   - Click **Detect Models** -> select `llama3.2` -> Click **Test Connection**.

---

## How to Install in Google Chrome

1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select `c:\Projects\GFAF`. If already loaded, click the circular **Reload** icon on the GFAF card.
4. Pin the GFAF extension to your toolbar.
5. Open your candidate dashboard to upload your Resume and add your GitHub Project READMEs!

---

## Running the Automated Test Suite

```bash
# Run benchmark matcher tests
node test/test-matcher.js

# Run DOM simulation tests
node test/test-dom-filler.js

# Run RAG document parser and GitHub README tests
node test/test-rag-parser.js

# Run RAG semantic chunking & hybrid BM25 retrieval tests
node test/test-rag-retrieval.js

# Run local Ollama RAG prompt generation test
node test/test-ollama-rag.js
```
