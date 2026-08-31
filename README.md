# Fillvyn — AI-First Forms Auto-Filler & RAG Assistant (Google Forms & Microsoft Forms)

A smart, modern Manifest V3 Chrome Extension designed specifically for candidates, job seekers, and developers to auto-fill **Google Forms** and **Microsoft Forms (`forms.cloud.microsoft`, `forms.office.com`)**. Built on an **AI-first decision pipeline**, **dynamic RAG knowledge base**, **profile ground truth guard**, **reactive post-validation**, and **automated constraint conflict detection**.

Powered by **Local Ollama (100% Free & Offline)**, Google Gemini, OpenAI, or Claude.

---

## Core Architectural Pillars

```
+-----------------------------------------------------------------------------------+
|                           AI-FIRST FORM FILLING PIPELINE                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ 1. DOM Scan & Context Extraction ]                                             |
|      - Scans question containers, inputs, textareas, radios, checkboxes.           |
|      - Detects required formats (numeric, scale, currency, character bounds).    |
|                                                                                   |
|  [ 2. AI Decision Engine (LLM + RAG + Profile Ground Truth) ]                     |
|      - Dispatches question + candidate facts + vector RAG chunks to LLM.          |
|      - Strict Profile Matching: Legal name, email, phone, location, GPA, URLs.     |
|      - Choice Classification: Evaluates radios and checkboxes against skills.     |
|      - Grounded Essay Synthesis: First-person technical project explanations.     |
|                                                                                   |
|  [ 3. Profile Ground Truth & Anti-Hallucination Guard ]                          |
|      - Enforces candidate ground truth (Fresher = 0 Yrs, 0 LPA, Immediate = 0 D). |
|      - Prevents LLM from confusing skill years with total work experience.        |
|                                                                                   |
|  [ 4. Native DOM Dispatch & Typewriter Simulation ]                               |
|      - Triggers complete native event loop: focus -> input -> change -> blur.     |
|      - Typewriter animation for long-form answers and essays.                     |
|                                                                                   |
|  [ 5. Reactive Post-Validation & Constraint Conflict Engine ]                     |
|      - Inspects reactive Google/MS Forms error alerts & HTML5 bounds.             |
|      - Resolves format errors (e.g. "7-10LPA" -> pure number "10").               |
|      - Resolves notice period text ("Immediate") to numeric days ("0").           |
|      - CONFLICT POLICY (DO NOT FILL): If form strictly contradicts profile        |
|        (e.g. Profile is 0 Yrs / 0 LPA / 0 Days, but Form requires > 1 or > 0):    |
|        * Never fabricates fake numbers (no setting 2 for 0).                      |
|        * Clears input (leaves empty).                                             |
|        * Highlights card with amber border (.gfaf-conflict-highlight).            |
|        * Renders conflict pill: "Conflict: Profile is 0 Yrs (Form requires > 1)". |
|        * Sets status badge: "Not Filled (Conflict)".                              |
|                                                                                   |
|  [ 6. Global Second-Pass Validation Sweep ]                                       |
|      - Re-checks all questions across the page to ensure zero lingering errors.   |
+-----------------------------------------------------------------------------------+
```

---

## Key Features

### 1. AI-First Decision Pipeline & Grounded Synthesis
- **AI Decision Engine**: Every form question is evaluated by an LLM to decide the exact value, choice selection, or essay response.
- **RAG Knowledge Base**: Upload your Resume (`.pdf`, `.docx`, `.md`, `.txt`) and ingest GitHub repository READMEs with 1-click to auto-synthesize factual, first-person project descriptions and system architecture details.
- **Job Description (JD) Target Alignment**: Live in-session JD input drawer aligns synthesized answers to specific job criteria without persisting JD data.
- **Multi-Provider Support**: Switch seamlessly between **Local Ollama** (100% offline & private), **Google Gemini**, **OpenAI GPT-4o-mini**, and **Anthropic Claude**.

### 2. Profile Ground Truth Guard (Zero Hallucinations)
- **Honest Candidate Data**: Total experience, current CTC, and notice period are strictly locked to candidate facts:
  - **Total Experience**: `0` (Fresher / Student)
  - **Current CTC**: `0` (0 LPA / Fresher)
  - **Notice Period**: `Immediate` (Text) or `0` (Numeric Days)
  - **Expected CTC**: `7 - 10 LPA` (Text) or `10` (Numeric LPA)
- **Anti-Confusion Filter**: Prevents the AI from accidentally using skill proficiency years (e.g., *2 years of Python*) as total professional work experience.

### 3. Constraint Conflict Engine (Do Not Fill on Conflict)
- **No Fabricated Data**: If a Google Form or Microsoft Form enforces an arbitrary validation rule (e.g., `Must be a number greater than 1`) that contradicts the candidate's actual profile (`0` Yrs / `0` LPA):
  - The engine **refuses to invent fake data** (no bumping `0` to `2`).
  - **Clears the field** and leaves it empty.
  - Highlights the container in amber (`.gfaf-conflict-highlight`).
  - Displays a prominent **Conflict Badge** on the right side:
    - `Conflict: Profile is 0 Yrs (Form requires > 1)`
    - `Conflict: Profile is 0 LPA (Form requires > 1)`
    - `Conflict: Profile is 0 Days (Form requires > 0)`
  - Displays status pill: `Not Filled (Conflict)`.

### 4. Right-Side Information & Context Badges
- **Context Info Pills**: Displays candidate profile facts on the top-right of question cards:
  - Total Experience: `Profile: Fresher (0 Yrs)`
  - Current CTC: `Profile: 0 LPA (Fresher)`
  - Expected CTC: `Profile Expected: 7 - 10 LPA`
  - Notice Period: `Profile: Immediate (0 Days)`
- **Auto-Fill Status**: Displays `Auto-filled (100%)` or `Auto-filled via AI` with clean pill-shaped styling.

### 5. Modern UI & Floating Assistant
- **In-Page Floating Dock Widget**: Minimalist profile switcher, auto-fill trigger, and collapsible JD drawer.
- **Per-Question AI Answer Buttons**: Discrete, modern pill buttons for individual column generation.
- **Clean Aesthetic Standards**: Dynamic rounded corners, pill-shaped buttons, glassmorphism accents, and **strictly zero emojis** (using clean SVG icons).
- **Security & Privacy**: Client-side AES-GCM-256 encrypted backups, host allowlists, and complete local processing options.

---

## System Requirements

### 1. Cloud Mode (Gemini, OpenAI, Claude, Local Matcher)
The extension is ultra-lightweight and runs smoothly in Google Chrome on any standard machine.

| Component | Minimum Specification | Recommended Specification |
| :--- | :--- | :--- |
| **Processor (CPU)** | Dual-Core Intel Core i3 / AMD Ryzen 3 | Quad-Core Intel Core i5 / AMD Ryzen 5 / Apple Silicon M1+ |
| **RAM** | 4 GB | 8 GB or higher |
| **Storage** | 100 MB free disk space | 500 MB SSD |
| **Browser** | Google Chrome 100+, Edge, Brave, Arc | Latest Google Chrome / Chromium-based browser |

---

### 2. Local AI Mode (Ollama Offline LLMs)
If running local on-device models (`llama3.2`, `deepseek-r1`, `mistral`, `phi3`):

| Specification Tier | Target Models | CPU | RAM | GPU / VRAM | Free SSD Storage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Entry-Level (CPU)** | `llama3.2:1b`, `llama3.2:3b`, `phi3:mini` | Intel i5 (8th Gen+) / Ryzen 5 (3000+) / Apple M1 | 8 GB | Integrated (Iris Xe, AMD Radeon, M1/M2) | 10 GB SSD |
| **Recommended (Fast)** | `llama3.2:3b`, `mistral:7b`, `deepseek-r1:7b` | Intel i7 (11th Gen+) / Ryzen 7 (5000+) / Apple Silicon | 16 GB | NVIDIA GTX 1650 / RTX 3050+ (4 GB - 6 GB VRAM) | 20 GB NVMe SSD |
| **Power User (Heavy RAG)** | `llama3.1:8b`, `deepseek-r1:8b`, `qwen2.5:7b` | Intel Core i7/i9 (12th Gen+) / Ryzen 7/9 / Apple M-Pro | 16 GB – 32 GB | NVIDIA RTX 3060 / 4060+ (8 GB+ VRAM) or Apple Unified 16GB+ | 30 GB NVMe SSD |

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

## Installation in Google Chrome

1. Navigate to `chrome://extensions/` in Google Chrome.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the extension directory (`c:\Projects\GFAF`).
4. Pin the extension to your Chrome toolbar.
5. Open your Options page to configure your Profile, upload your Resume, and connect your GitHub projects!

---

## Automated Test Suites

Run the automated test suites from the project root:

```bash
# Test AI Post-Validation & Constraint Conflict Engine
node test/test-post-validation.js

# Test Profile Ground Truth Guard & Anti-Hallucination
node test/test-profile-validation-guard.js

# Test AI-First Form Decision & Filling Pipeline
node test/test-ai-first-form-filler.js

# Test Benchmark Matcher
node test/test-matcher.js

# Test Full DOM Simulation
node test/test-dom-filler.js

# Test RAG Document Parser & GitHub Ingestion
node test/test-rag-parser.js

# Test RAG Semantic Retrieval & Chunking
node test/test-rag-retrieval.js
```

---

## License

MIT License — free for personal, candidate, and commercial use.
