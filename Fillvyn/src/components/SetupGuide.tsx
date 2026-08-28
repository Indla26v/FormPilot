'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Terminal, 
  Check, 
  Copy, 
  Chrome, 
  Cpu, 
  Download, 
  ArrowRight, 
  CheckCircle2, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function SetupGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [osTab, setOsTab] = useState<'windows' | 'mac' | 'linux'>('windows');

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getOsEnvInstructions = () => {
    switch (osTab) {
      case 'windows':
        return {
          title: 'Windows Setup (PowerShell / System Properties)',
          cmd: '[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")',
          note: 'Or press Win + R, run sysdm.cpl, click Environment Variables, add OLLAMA_ORIGINS = *, then restart Ollama.',
        };
      case 'mac':
        return {
          title: 'macOS Setup (Terminal / launchctl)',
          cmd: 'launchctl setenv OLLAMA_ORIGINS "*"',
          note: 'Run this in Terminal and restart the Ollama app from the menubar.',
        };
      case 'linux':
        return {
          title: 'Linux Setup (systemd service)',
          cmd: 'sudo systemctl edit ollama.service\n# Add:\n[Service]\nEnvironment="OLLAMA_ORIGINS=*"',
          note: 'Save the file and run sudo systemctl daemon-reload && sudo systemctl restart ollama.',
        };
    }
  };

  const osData = getOsEnvInstructions();

  return (
    <section id="quickstart" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background AI Mesh & Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/bg-setup.jpg"
          alt="AI Luminous Setup Guide Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fast 3-Minute Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How to Install & Configure Fillvyn
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Follow the quick steps below to load the Chrome Extension and connect your free local Ollama AI model.
          </p>
        </div>

        {/* Two Column Setup Layout: Step 1 Chrome & Step 2 Ollama */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Column 1: Chrome Extension Setup */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-8 border border-slate-200 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Chrome className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Step 1: Install in Chrome</h3>
                  <p className="text-xs text-slate-500 font-medium">Manifest V3 Developer Mode / Web Store</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div>
                    <span className="font-semibold text-slate-800">Open Extension Manager:</span>
                    <p className="text-slate-600 mt-0.5">Navigate to <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-700 border border-slate-200">chrome://extensions/</code> in Google Chrome, Edge, Brave, or Arc.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div>
                    <span className="font-semibold text-slate-800">Enable Developer Mode:</span>
                    <p className="text-slate-600 mt-0.5">Toggle the <strong className="text-slate-900">Developer mode</strong> switch in the top-right corner of the page.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div>
                    <span className="font-semibold text-slate-800">Load Unpacked Extension:</span>
                    <p className="text-slate-600 mt-0.5">Click <strong className="text-slate-900">Load unpacked</strong> and select the Fillvyn project directory.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">4</span>
                  <div>
                    <span className="font-semibold text-slate-800">Pin to Toolbar:</span>
                    <p className="text-slate-600 mt-0.5">Pin the Fillvyn icon to your browser bar and press <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[11px] text-indigo-700 border border-slate-200">Alt + Shift + F</code> on any Google Form!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/70 mt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Compatible with Chrome 100+, Brave, Edge, Opera, and Arc</span>
              </div>
            </div>
          </div>

          {/* Column 2: Local Ollama Terminal Setup */}
          <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-7 sm:p-8 text-white shadow-2xl flex flex-col justify-between border border-slate-800">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Step 2: Free Local Ollama Setup</h3>
                    <p className="text-xs text-slate-400 font-medium">100% Offline & Zero API Subscriptions</p>
                  </div>
                </div>

                {/* OS Switcher Pills */}
                <div className="inline-flex p-1 bg-slate-800 rounded-full border border-slate-700 text-[11px] self-start sm:self-auto">
                  {(['windows', 'mac', 'linux'] as const).map((os) => (
                    <button
                      key={os}
                      onClick={() => setOsTab(os)}
                      className={`px-3 py-1 rounded-full font-semibold transition-all capitalize ${
                        osTab === os ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {os}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2.1: Pull Model */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>A. Pull Recommended Lightweight Model</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Fast (3B Parameters)</span>
                </div>
                <div className="relative bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between">
                  <code>ollama pull llama3.2</code>
                  <button
                    onClick={() => copyToClipboard('ollama pull llama3.2', 1)}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 2.2: Enable Chrome Access */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>B. {osData.title}</span>
                  <span className="text-[10px] text-indigo-400 font-mono">CORS Origin</span>
                </div>
                <div className="relative bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-xs text-indigo-300 flex items-center justify-between">
                  <code className="break-all whitespace-pre-wrap">{osData.cmd}</code>
                  <button
                    onClick={() => copyToClipboard(osData.cmd, 2)}
                    className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
                    title="Copy command"
                  >
                    {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{osData.note}</p>
              </div>

              {/* Step 2.3: Test Connection */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>C. Detect in Fillvyn Options</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Open Fillvyn Options &rarr; <strong className="text-slate-200">AI & Local LLM Setup</strong> &rarr; Click <strong className="text-indigo-300">Detect Models</strong> &rarr; select <strong className="text-slate-200">llama3.2</strong>.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 mt-4 text-center">
              <span className="text-xs text-slate-400 font-mono">Default Endpoint: http://localhost:11434</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
