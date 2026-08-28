# Fillvyn — AI Forms Auto-Filler & RAG Assistant (Google Forms & Microsoft Forms)

A smart, modern Manifest V3 Chrome Extension designed specifically for candidates, job seekers, and developers to auto-fill **Google Forms** and **Microsoft Forms (`forms.cloud.microsoft`, `forms.office.com`)**. Features **instant profile matching**, **clean numeric vs text formatting**, **Job Description (JD) target alignment**, and **Retrieval-Augmented Generation (RAG)** using your uploaded **Resume** and **GitHub Project `README.md` files** powered by **Local Ollama (100% Free & Offline)**, Google Gemini, OpenAI, or Claude.

---

## Key Features

### 1. RAG Knowledge Base & Dynamic Answer Synthesis
- **Resume Upload**: Upload resumes (`.pdf`, `.docx`, `.md`, `.txt`) to automatically chunk and index your work experience, metrics, and achievements.
- **1-Click GitHub Repository README Ingestion**: Paste any GitHub repo URL (e.g. `https://github.com/username/project`) to pull system architecture, performance stats, and engineering details into the local knowledge base.
- **Job Description (JD) Target Alignment**: Live in-session JD input drawer above the dock aligns all synthesized answers to specific job criteria without persisting JD data.
- **Local Ollama Integration**: 100% free, 100% private offline generation (supports `llama3.2`, `deepseek-r1`, `mistral`, `phi3`).
- **Cloud LLM Support**: Strategy pattern support for Google Gemini, OpenAI (`gpt-4o-mini`), and Anthropic Claude.
- **Grounded Responses**: Generates truthful, first-person candidate answers for tough technical and essay questions (e.g. *"Explain the hardest bug you personally debugged"*, *"Describe your architecture"*).

### 2. Intelligent Numeric & Text Input Formatting
- **Expected CTC**: Fills `"7 - 12 LPA"` for standard text inputs, `"10"` for LPA-bounded inputs, and `"1000000"` for INR digit inputs.
- **Notice Period**: Fills `"Immediate"` for text fields and `"0"` for `Notice period (In days)` whole number fields.
- **Education & GPA**: Fills `"2025"` for graduation year, and pure numbers `"92.5"` / `"8.8"` for numeric percentages/CGPA.
- **Skills-Driven Tech Stack Matching**: Evaluates single-choice radio buttons and checkboxes against your configured skills list with 100% precision.

### 3. Modern Floating Assistant & Options Dashboard
- **In-Page Floating Dock Widget**: Minimalist profile dropdown placed directly beside the Auto-Fill button, with an optional Job Description drawer.
- **Clean UI Standards**: Rounded corners, pill-shaped buttons, smooth transitions, and **strictly zero emojis** (using crisp SVG icons).
- **Multi-Profile Management**: Maintain multiple candidate profiles (e.g. *AI Engineer*, *Backend SDE*, *Full Stack*).
- **Security & Encryption**: Web Crypto API AES-GCM-256 password-protected backup exports, anti-XSS sanitization, anti-SSRF host allowlists, and API key redaction.

---

## System Requirements & Laptop Specifications

Depending on whether you use **Cloud AI / Profile Matching** or **Local Offline Ollama**, the recommended laptop specifications are as follows:

### 1. Standard Mode / Cloud AI (Gemini, OpenAI, Claude, Rule Matching)
The extension itself is extremely lightweight and runs smoothly in Google Chrome on almost any laptop or desktop.

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Processor (CPU)** | Dual-Core Intel Core i3 / AMD Ryzen 3 | Quad-Core Intel Core i5 / AMD Ryzen 5 / Apple Silicon M1+ |
| **RAM** | 4 GB | 8 GB or higher |
| **Storage** | 100 MB free disk space | 500 MB SSD |
| **Operating System** | Windows 10/11, macOS 11+, Linux | Windows 11 / macOS latest / Ubuntu 22.04+ |
| **Browser** | Google Chrome 100+, Edge, Brave, Arc | Latest Google Chrome / Chromium-based browser |
| **Internet** | Required for Cloud APIs (Gemini/OpenAI) | Stable broadband connection |

---

### 2. Local AI & Offline Mode (Ollama On-Device LLMs)
If you run **Local Ollama** models (such as `llama3.2`, `deepseek-r1`, `phi3`, `mistral`) completely offline on your laptop:

| Specification Tier | Target Models | CPU | RAM | GPU / VRAM | Free SSD Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Entry-Level (Smooth CPU)** | `llama3.2:1b`, `llama3.2:3b`, `phi3:mini` | Intel i5 (8th Gen+) / AMD Ryzen 5 (3000+) / Apple M1 | 8 GB | Integrated (Intel Iris Xe, AMD Radeon, or Apple M1/M2) | 10 GB SSD |
| **Recommended (Fast / High Quality)** | `llama3.2:3b`, `mistral:7b`, `deepseek-r1:7b` | Intel i7 (11th Gen+) / AMD Ryzen 7 (5000+) / Apple Silicon M-Series | 16 GB | NVIDIA GTX 1650 / RTX 3050 / RTX 4050+ (4 GB - 6 GB VRAM) | 20 GB NVMe SSD |
| **Power User / Heavy RAG** | `llama3.1:8b`, `deepseek-r1:8b`, `qwen2.5:7b` | Intel Core i7/i9 (12th Gen+) / AMD Ryzen 7/9 / Apple M-Pro/Max | 16 GB – 32 GB | NVIDIA RTX 3060 / 4060 / 4070+ (8 GB+ VRAM) or Apple Unified 16GB+ | 30 GB NVMe SSD |

> [!TIP]
> For everyday laptops with 8 GB RAM and no dedicated GPU, **`llama3.2:3b`** or **`llama3.2:1b`** provides instant generation speeds with minimal memory footprint! If you prefer zero local resource usage, simply use the built-in **Google Gemini 1.5 Flash** or **OpenAI GPT-4o-mini** cloud options.

---

## How to Setup Local Ollama (Free & Offline)

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull a lightweight model:
   ```bash
   ollama pull llama3.2
   ```
3. Enable Chrome extension access:
   - On Windows: Add environment variable `OLLAMA_ORIGINS` with value `*` and restart Ollama.
4. In Fillvyn Options -> **AI & Local LLM Setup**:
   - Provider: `Ollama (Local Offline)`
   - Click **Detect Models** -> select `llama3.2` -> Click **Test Connection**.

---

## How to Install in Google Chrome

1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select `c:\Projects\GFAF`. If already loaded, click the circular **Reload** icon on the Fillvyn card.
4. Pin the Fillvyn extension to your toolbar.
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
