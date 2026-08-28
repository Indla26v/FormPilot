'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  FileText, 
  Github, 
  Zap, 
  Layers, 
  Terminal, 
  Play
} from 'lucide-react';

export default function HeroSection() {
  const [filled, setFilled] = useState(false);
  const [activeModel, setActiveModel] = useState('llama3.2:3b (Local)');

  const handleSimulateFill = () => {
    setFilled(true);
    setTimeout(() => {
      // Auto-reset after a few seconds for loop effect
    }, 4000);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-white">
      {/* Background AI Mesh & Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/hero-bg.jpg"
          alt="AI Luminous Mesh Background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white"></div>
      </div>

      {/* Decorative Radial Ambient Lights */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-3xl rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Top Pill Notification Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-semibold shadow-xs hover:bg-indigo-100/80 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Version 2.0 Released</span>
            <span className="text-indigo-300">•</span>
            <span className="flex items-center gap-1 text-indigo-700">
              Offline RAG & GitHub Ingestion
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Fill Forms in Seconds with{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Local RAG & AI Precision
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            The private, intelligent browser assistant engineered for developers and job seekers. Auto-fill <strong className="text-slate-900 font-semibold">Google Forms</strong> and <strong className="text-slate-900 font-semibold">Microsoft Forms</strong> with tailored answers synthesized directly from your <strong className="text-slate-900 font-semibold">Resume</strong> and <strong className="text-slate-900 font-semibold">GitHub READMEs</strong> using on-device Ollama or Cloud LLMs.
          </p>

          {/* CTA Button Group (Pill-shaped, Modern Clean UI) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-2 max-w-md sm:max-w-none mx-auto">
            <a
              href="#quickstart"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-500/25 rounded-full transition-all group"
            >
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Install Fillvyn Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#interactive-demo"
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-95 border border-slate-300 shadow-sm rounded-full transition-all"
            >
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" />
              <span>Try Live Simulator</span>
            </a>
          </div>

          {/* Trust Highlights Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Offline & Private (Ollama)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span>Instant DOM Auto-Fill</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Smart LPA & Notice Formatter</span>
            </div>
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-700" />
              <span>1-Click README Ingest</span>
            </div>
          </div>
        </div>

        {/* Dynamic Interactive Hero Mockup Card */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="relative p-2 sm:p-3 rounded-3xl bg-gradient-to-b from-slate-200/80 via-white to-slate-100 border border-slate-200 shadow-2xl">
            {/* Window Topbar */}
            <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-inner">
              {/* Browser simulated bar */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-xs font-mono text-slate-400 hidden sm:inline">
                    docs.google.com/forms/d/e/1FAIpQLSc.../viewform
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Google Form Ready
                  </span>
                </div>
              </div>

              {/* Grid content: simulated Google Form on left, Floating Extension Widget on right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Simulated Google Form inputs */}
                <div className="md:col-span-7 space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-semibold text-slate-200">Senior AI / Full Stack Engineer Application</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Please provide your technical background and expected compensation.</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Candidate Full Name *</label>
                      <input
                        type="text"
                        readOnly
                        value={filled ? 'Alex Morgan' : ''}
                        placeholder={filled ? '' : 'Waiting for autofill...'}
                        className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-slate-100 transition-all ${
                          filled ? 'border-emerald-500 bg-emerald-950/20 font-medium' : 'border-slate-800 text-slate-500'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Notice Period (In days) *</label>
                        <input
                          type="text"
                          readOnly
                          value={filled ? '0' : ''}
                          placeholder={filled ? '' : 'e.g. 0'}
                          className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-slate-100 transition-all ${
                            filled ? 'border-emerald-500 bg-emerald-950/20 font-mono font-medium' : 'border-slate-800 text-slate-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Numeric day formatting</span>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1 font-medium">Expected CTC (in LPA) *</label>
                        <input
                          type="text"
                          readOnly
                          value={filled ? '16' : ''}
                          placeholder={filled ? '' : 'e.g. 16'}
                          className={`w-full px-3 py-2 rounded-lg bg-slate-900 border text-slate-100 transition-all ${
                            filled ? 'border-emerald-500 bg-emerald-950/20 font-mono font-medium' : 'border-slate-800 text-slate-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">LPA-bounded numeric value</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-medium">Technical Deep Dive (RAG Synthesized) *</label>
                      <div
                        className={`w-full p-2.5 rounded-lg bg-slate-900 border min-h-[64px] text-slate-200 text-[11px] leading-relaxed transition-all ${
                          filled ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 text-slate-500'
                        }`}
                      >
                        {filled
                          ? 'Diagnosed an Ollama streaming token buffer leak via Web Crypto memory snapshots, dropping P99 latency by 64% without dropping tokens.'
                          : 'RAG will synthesize factual answers from your uploaded Resume and GitHub READMEs...'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fillvyn Floating Assistant Dock Preview */}
                <div className="md:col-span-5 bg-slate-900/95 p-4 rounded-2xl border border-indigo-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-bold tracking-tight text-white">Fillvyn Assistant</span>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      Alt + Shift + F
                    </span>
                  </div>

                  {/* Profile Dropdown */}
                  <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700">
                    <div className="text-[10px] font-medium text-slate-400 mb-0.5">Active Profile</div>
                    <div className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                      <span>Default Profile (Alex Morgan)</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded">Active</span>
                    </div>
                  </div>

                  {/* LLM Engine Selection */}
                  <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700">
                    <div className="text-[10px] font-medium text-slate-400 mb-0.5">Model Engine</div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{activeModel}</span>
                    </div>
                  </div>

                  {/* Interactive Button */}
                  <button
                    onClick={handleSimulateFill}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md ${
                      filled
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 animate-pulse'
                    }`}
                  >
                    {filled ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Form Auto-Filled 100%</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Click to Auto-Fill Form</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    {filled ? (
                      <button
                        onClick={() => setFilled(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                      >
                        Reset Demo
                      </button>
                    ) : (
                      <p className="text-[10px] text-slate-400">Click the button above to test instantaneous DOM autofill</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
