const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = 'C:\\Projects\\GFAF';

// Convert images to base64 for embedding directly into HTML
function getBase64Image(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
  const data = fs.readFileSync(fullPath);
  return `data:image/png;base64,${data.toString('base64')}`;
}

const logoBase64 = getBase64Image('Fillvyn/public/images/fillvyn-logo.png');
const screen1Base64 = getBase64Image('Screenshot 2026-08-31 174233.png'); // Popup
const screen2Base64 = getBase64Image('Screenshot 2026-08-31 174248.png'); // Profile
const screen3Base64 = getBase64Image('Screenshot 2026-08-31 174303.png'); // AI Setup
const screen4Base64 = getBase64Image('Screenshot 2026-08-31 174743.png'); // Floating dock

const slides = [
  {
    filename: 'promo_1_1280x800.jpg',
    badge: '1-CLICK FORM FILLER',
    title: 'Instant AI Job Form Auto-Filler',
    subtitle: 'Automatically fills Google Forms & Microsoft Forms with Alt+Shift+F shortcut',
    contentHtml: `
      <div class="popup-showcase">
        <div class="glow-underlay"></div>
        <div class="mockup-card">
          <img src="${screen1Base64}" class="popup-img" alt="Popup UI" />
        </div>
      </div>
    `,
    customCss: `
      .popup-showcase {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 10px;
      }
      .glow-underlay {
        position: absolute;
        width: 480px;
        height: 480px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(56, 189, 248, 0.15) 50%, transparent 70%);
        filter: blur(40px);
        z-index: 1;
      }
      .mockup-card {
        position: relative;
        z-index: 2;
        padding: 10px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2);
        backdrop-filter: blur(16px);
      }
      .popup-img {
        width: 390px;
        height: auto;
        border-radius: 18px;
        display: block;
      }
    `
  },
  {
    filename: 'promo_2_1280x800.jpg',
    badge: 'CANDIDATE GROUND TRUTH',
    title: 'Smart Profile & Experience Matching',
    subtitle: 'Locks legal name, GPA, URLs, 0 Yrs fresher status & CTC without hallucinations',
    contentHtml: `
      <div class="browser-showcase">
        <div class="browser-frame">
          <div class="browser-header">
            <div class="dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="address-bar">fillvyn://options/profile</div>
          </div>
          <div class="browser-body">
            <img src="${screen2Base64}" class="browser-img" alt="Profile Settings" />
          </div>
        </div>
      </div>
    `,
    customCss: `
      .browser-showcase {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 15px;
      }
      .browser-frame {
        width: 1040px;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.15);
      }
      .browser-header {
        height: 38px;
        background: #1e293b;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .dots {
        display: flex;
        gap: 6px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .address-bar {
        background: rgba(15, 23, 42, 0.6);
        border-radius: 20px;
        padding: 3px 14px;
        font-size: 11px;
        color: #94a3b8;
        font-family: monospace;
      }
      .browser-body {
        max-height: 470px;
        overflow: hidden;
        display: flex;
      }
      .browser-img {
        width: 100%;
        height: auto;
        display: block;
      }
    `
  },
  {
    filename: 'promo_3_1280x800.jpg',
    badge: 'MULTI-LLM ENGINE',
    title: 'Grounded AI Answer Synthesis',
    subtitle: 'Seamlessly switch between Local Ollama (Offline), Gemini, OpenAI, or Claude',
    contentHtml: `
      <div class="browser-showcase">
        <div class="browser-frame">
          <div class="browser-header">
            <div class="dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="address-bar">fillvyn://options/ai-setup</div>
          </div>
          <div class="browser-body">
            <img src="${screen3Base64}" class="browser-img" alt="AI Setup" />
          </div>
        </div>
      </div>
    `,
    customCss: `
      .browser-showcase {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 15px;
      }
      .browser-frame {
        width: 1040px;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.85), 0 0 35px rgba(168, 85, 247, 0.15);
      }
      .browser-header {
        height: 38px;
        background: #1e293b;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .dots {
        display: flex;
        gap: 6px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .address-bar {
        background: rgba(15, 23, 42, 0.6);
        border-radius: 20px;
        padding: 3px 14px;
        font-size: 11px;
        color: #94a3b8;
        font-family: monospace;
      }
      .browser-body {
        max-height: 470px;
        overflow: hidden;
        display: flex;
      }
      .browser-img {
        width: 100%;
        height: auto;
        display: block;
      }
    `
  },
  {
    filename: 'promo_4_1280x800.jpg',
    badge: 'IN-PAGE ASSISTANT',
    title: 'Intelligent Floating Dock & JD Align',
    subtitle: 'Discrete on-screen pill widget with live Job Description tailoring and conflict checks',
    contentHtml: `
      <div class="dock-showcase">
        <div class="dock-left">
          <div class="feature-pill"><span class="pill-dot"></span> 1-Click Form Filling</div>
          <div class="feature-pill"><span class="pill-dot"></span> In-Session JD Alignment</div>
          <div class="feature-pill"><span class="pill-dot"></span> Real-Time Error Conflict Guard</div>
          <div class="feature-pill"><span class="pill-dot"></span> Multi-Profile Quick Switcher</div>
        </div>
        <div class="dock-center">
          <div class="glow-underlay-dock"></div>
          <div class="dock-card">
            <img src="${screen4Base64}" class="dock-img" alt="Floating Widget" />
          </div>
        </div>
      </div>
    `,
    customCss: `
      .dock-showcase {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        margin-top: 25px;
      }
      .dock-left {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .feature-pill {
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 600;
        color: #f1f5f9;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      }
      .pill-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #38bdf8;
        box-shadow: 0 0 10px #38bdf8;
      }
      .dock-center {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .glow-underlay-dock {
        position: absolute;
        width: 420px;
        height: 380px;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%);
        filter: blur(40px);
        z-index: 1;
      }
      .dock-card {
        position: relative;
        z-index: 2;
        padding: 14px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 28px;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
      }
      .dock-img {
        width: 440px;
        height: auto;
        border-radius: 20px;
        display: block;
      }
    `
  }
];

// Generate HTML template for a slide
function createHtml(slide) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      width: 1280px;
      height: 800px;
      overflow: hidden;
      background: radial-gradient(ellipse at 50% -10%, #1e1b4b 0%, #0f172a 55%, #030712 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 40px 48px;
      position: relative;
    }
    /* Subtle background grid */
    body::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
      pointer-events: none;
    }
    .header-section {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 10;
      margin-bottom: 8px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      padding: 6px 18px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      color: #818cf8;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .brand-logo-mini {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
    .main-title {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.8px;
      line-height: 1.2;
      background: linear-gradient(135deg, #ffffff 30%, #93c5fd 70%, #c084fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .main-subtitle {
      font-size: 16px;
      font-weight: 400;
      color: #94a3b8;
      max-width: 800px;
    }
    ${slide.customCss}
  </style>
</head>
<body>
  <div class="header-section">
    <div class="brand-pill">
      <img src="${logoBase64}" class="brand-logo-mini" alt="Logo" />
      <span>${slide.badge}</span>
    </div>
    <h1 class="main-title">${slide.title}</h1>
    <p class="main-subtitle">${slide.subtitle}</p>
  </div>
  ${slide.contentHtml}
</body>
</html>`;
}

// Write HTML files and take screenshots with Headless Chrome
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

slides.forEach((slide, idx) => {
  const htmlContent = createHtml(slide);
  const htmlPath = path.join(projectRoot, `temp_slide_${idx + 1}.html`);
  const outPngPath = path.join(projectRoot, `temp_slide_${idx + 1}.png`);
  const outJpgPath = path.join(projectRoot, slide.filename);
  
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  
  // Use headless chrome to snapshot 1280x800
  const cmd = `"${chromePath}" --headless=new --disable-gpu --window-size=1280,800 --hide-scrollbars --screenshot="${outPngPath}" "file:///${htmlPath.replace(/\\\\/g, '/')}"`;
  console.log(`Generating Slide ${idx + 1}...`);
  execSync(cmd);
  
  // Clean up HTML
  if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
});

console.log('Finished rendering promo slides!');
