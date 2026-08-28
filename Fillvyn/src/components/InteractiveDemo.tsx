'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PROFILES } from '../data/mockData';
import { 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Cpu, 
  FileText, 
  Github, 
  Sliders, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Database,
  ArrowRight,
  Check,
  Code2,
  Terminal,
  Activity
} from 'lucide-react';

const JD_TEMPLATES = [
  {
    title: 'AI / LLM Engineer',
    text: 'Seeking an AI / Full Stack Engineer to build on-device RAG systems, integrate Ollama/Gemini models, and optimize vector retrieval latency.',
  },
  {
    title: 'Senior Backend SDE',
    text: 'Looking for a Senior Backend Developer proficient in Go, microservices, distributed Raft consensus, and sub-50ms API endpoints.',
  },
];

export default function InteractiveDemo() {
  const [selectedPlatform, setSelectedPlatform] = useState<'google' | 'microsoft'>('google');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('ai-engineer');
  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'gemini' | 'openai'>('ollama');
  
  const [isJdOpen, setIsJdOpen] = useState<boolean>(true);
  const [targetJdText, setTargetJdText] = useState<string>(JD_TEMPLATES[0].text);

  const [isFilling, setIsFilling] = useState<boolean>(false);
  const [filledFieldsCount, setFilledFieldsCount] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(-1);

  const totalFields = 8;
  const profile = PROFILES.find((p) => p.id === selectedProfileId) || PROFILES[0];

  const handleRunAutofill = () => {
    if (isFilling) return;
    setIsFilling(true);
    setFilledFieldsCount(0);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      setFilledFieldsCount(step);

      if (step >= totalFields) {
        clearInterval(interval);
        setIsFilling(false);
      }
    }, 140);
  };

  const handleReset = () => {
    setIsFilling(false);
    setFilledFieldsCount(0);
    setCurrentStep(-1);
  };

  const isFieldFilled = (stepIndex: number) => {
    return filledFieldsCount > stepIndex;
  };

  const isFieldActive = (stepIndex: number) => {
    return currentStep === stepIndex;
  };

  const getLatencyLabel = () => {
    switch (selectedProvider) {
      case 'ollama':
        return { text: '42ms Latency', badge: '100% Offline & Free' };
      case 'gemini':
        return { text: '110ms Latency', badge: 'Cloud API (Fast)' };
      case 'openai':
        return { text: '190ms Latency', badge: 'Cloud API' };
    }
  };

  const latency = getLatencyLabel();
  const progressPercent = Math.round((filledFieldsCount / totalFields) * 100);

  return (
    <section id="interactive-demo" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background AI Mesh & Ambient Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/bg-demo.jpg"
          alt="AI Luminous Live Demo Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider shadow-xs">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Experience Fillvyn in Action
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Test how Fillvyn dynamically detects field constraints, reformats numeric LPA and notice days, and synthesizes grounded RAG answers in real time.
          </p>
        </div>

        {/* Top Control Bar: Platform Selector & Live Progress */}
        <div className="mb-8 p-4 bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Platform Emulation Switcher */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Form:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200">
              <button
                onClick={() => setSelectedPlatform('google')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedPlatform === 'google'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Forms
              </button>
              <button
                onClick={() => setSelectedPlatform('microsoft')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedPlatform === 'microsoft'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Microsoft Forms
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="w-full sm:w-72 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span>Autofill Completion</span>
              </span>
              <span className={progressPercent === 100 ? 'text-emerald-600' : 'text-indigo-600'}>
                {filledFieldsCount} / {totalFields} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

        </div>

        {/* Main 2-Column Interactive Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Extension Floating Control Dock */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-white shadow-xl space-y-6">
              
              {/* Dock Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">Fillvyn Assistant Dock</h3>
                    <p className="text-[10px] text-slate-400 font-medium">In-Page Floating Controls</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800">
                  Ready
                </span>
              </div>

              {/* 1. Candidate Profile Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>1. Select Persona Profile</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Alt + Shift + F</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PROFILES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedProfileId(p.id);
                        if (filledFieldsCount > 0) handleReset();
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        selectedProfileId === p.id
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-xs'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.role}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedProfileId === p.id ? 'border-indigo-400 bg-indigo-600' : 'border-slate-700'
                      }`}>
                        {selectedProfileId === p.id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. AI Engine Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">2. AI Generation Engine</label>
                  <span className="text-[10px] text-emerald-400 font-mono">{latency.text}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedProvider('ollama')}
                    className={`p-2 rounded-2xl border text-center transition-all ${
                      selectedProvider === 'ollama'
                        ? 'border-emerald-500 bg-emerald-950/50 shadow-xs'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Ollama</div>
                    <div className="text-[9px] text-emerald-400 font-medium">Offline</div>
                  </button>

                  <button
                    onClick={() => setSelectedProvider('gemini')}
                    className={`p-2 rounded-2xl border text-center transition-all ${
                      selectedProvider === 'gemini'
                        ? 'border-indigo-500 bg-indigo-950/50 shadow-xs'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">Gemini</div>
                    <div className="text-[9px] text-indigo-300 font-medium">Flash 1.5</div>
                  </button>

                  <button
                    onClick={() => setSelectedProvider('openai')}
                    className={`p-2 rounded-2xl border text-center transition-all ${
                      selectedProvider === 'openai'
                        ? 'border-indigo-500 bg-indigo-950/50 shadow-xs'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">OpenAI</div>
                    <div className="text-[9px] text-slate-300 font-medium">GPT-4o</div>
                  </button>
                </div>
              </div>

              {/* 3. Target JD Context Drawer */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Target Job Description (JD)</span>
                  </label>
                  <button
                    onClick={() => setIsJdOpen(!isJdOpen)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {isJdOpen ? 'Hide Drawer' : 'Show Drawer'}
                  </button>
                </div>

                {isJdOpen && (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      {JD_TEMPLATES.map((tmpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setTargetJdText(tmpl.text)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors"
                        >
                          {tmpl.title}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={targetJdText}
                      onChange={(e) => setTargetJdText(e.target.value)}
                      rows={2}
                      className="w-full text-[11px] p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 focus:outline-indigo-500 leading-relaxed font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons (Pill-shaped) */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleRunAutofill}
                  disabled={isFilling}
                  className={`w-full py-3.5 px-6 rounded-full font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                    isFilling
                      ? 'bg-indigo-500 cursor-wait'
                      : filledFieldsCount === totalFields
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-600/40 animate-pulse'
                  }`}
                >
                  {isFilling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Synthesizing & Filling Fields...</span>
                    </>
                  ) : filledFieldsCount === totalFields ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Form 100% Filled & Verified</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Fill Form</span>
                    </>
                  )}
                </button>

                {filledFieldsCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Simulator</span>
                  </button>
                )}
              </div>

            </div>

            {/* Privacy Guarantee Card */}
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-slate-200 text-xs text-slate-600 space-y-2 shadow-sm">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Data Tracking</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                All resume chunks and candidate details are evaluated locally in memory. Zero external storage.
              </p>
            </div>
          </div>

          {/* Right Column: High-Fidelity Simulated Form */}
          <div className="lg:col-span-8">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              
              {/* Top Theme Accent Bar */}
              <div className={`h-3.5 transition-colors duration-300 ${
                selectedPlatform === 'google'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700'
                  : 'bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600'
              }`}></div>

              {/* Form Title & Description Card */}
              <div className="p-6 sm:p-8 border-b border-slate-100 space-y-2.5 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full">
                    {selectedPlatform === 'google' ? 'Google Forms Simulator' : 'Microsoft Forms Simulator'}
                  </span>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    DOM Auto-Detect: Active
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Senior Technical Engineering Questionnaire
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Notice how Fillvyn automatically formats notice periods to numeric days, normalizes LPA brackets, checks skill boxes, and performs RAG context retrieval.
                </p>
              </div>

              {/* Form Interactive Field List */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* 1. Candidate Full Name */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isFieldActive(0)
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                    : isFieldFilled(0)
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      1. Full Name / Candidate Name <span className="text-rose-500">*</span>
                    </label>
                    {isFieldFilled(0) && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Matched: Full Name
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={isFieldFilled(0) ? profile.name : ''}
                    placeholder="e.g. Alex Morgan"
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  />
                </div>

                {/* 2 & 3. Email Address & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(1)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(1)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      2. Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(1) ? profile.email : ''}
                      placeholder="name@example.com"
                      className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(2)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(2)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      3. Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(2) ? profile.phone : ''}
                      placeholder="+1 (555) 000-0000"
                      className="w-full text-xs font-mono font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>

                {/* 4 & 5. Smart Numeric vs Text Formatting (Notice Period & Expected CTC) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Notice Period (In days) - Strict whole digits */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(3)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(3)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">
                        4. Notice Period (In days) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                        Numeric Days
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">Requires pure integer days</p>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(3) ? profile.noticePeriod.days : ''}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                    {isFieldFilled(3) && (
                      <div className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Formatted: &ldquo;{profile.noticePeriod.text}&rdquo; &rarr; <strong>&ldquo;{profile.noticePeriod.days}&rdquo; (Days)</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Expected CTC (in LPA) - Bound number */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(4)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(4)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800">
                        5. Expected CTC (in LPA) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-full font-bold">
                        LPA Value
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-2">Requires pure LPA digit</p>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(4) ? profile.expectedCtc.numberOnly : ''}
                      placeholder="e.g. 16"
                      className="w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                    {isFieldFilled(4) && (
                      <div className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Formatted: &ldquo;{profile.expectedCtc.lpa}&rdquo; &rarr; <strong>&ldquo;{profile.expectedCtc.numberOnly}&rdquo; LPA</strong></span>
                      </div>
                    )}
                  </div>

                </div>

                {/* 6. Tech Stack & Skill Radio Pill Choice */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  isFieldActive(5)
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                    : isFieldFilled(5)
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-200 bg-white'
                }`}>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    6. Primary Domain & Technology Stack <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mb-3">Auto-evaluated from configured candidate skills</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {['Python & AI Pipelines', 'Golang / Microservices', 'React / Next.js', 'Mobile iOS / Android'].map((skill, idx) => {
                      const isSelected = isFieldFilled(5) && (
                        (selectedProfileId === 'ai-engineer' && idx === 0) ||
                        (selectedProfileId === 'backend-sde' && idx === 1)
                      );
                      return (
                        <div
                          key={skill}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                              : 'border-slate-200 text-slate-600 bg-slate-50'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                          </div>
                          <span className="text-[11px] truncate">{skill}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Graduation Year & GPA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(6)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(6)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      7. Graduation Year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(6) ? profile.graduationYear : ''}
                      placeholder="e.g. 2024"
                      className="w-full text-xs font-mono font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${
                    isFieldActive(6)
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-400/30'
                      : isFieldFilled(6)
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Cumulative GPA / Marks <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={isFieldFilled(6) ? profile.gpa : ''}
                      placeholder="e.g. 8.9 / 10"
                      className="w-full text-xs font-mono font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>

                {/* 8. RAG Synthesized Technical Challenge Question */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isFieldActive(7)
                    ? 'border-purple-500 bg-purple-50/40 ring-2 ring-purple-400/30'
                    : isFieldFilled(7)
                    ? 'border-purple-300 bg-purple-50/20'
                    : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      8. Describe a critical bug or architecture milestone you implemented <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      RAG Synthesized
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Truthfully synthesized from uploaded Resume and GitHub READMEs
                  </p>
                  
                  <div className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs leading-relaxed font-mono min-h-[84px]">
                    {isFieldFilled(7) ? (
                      <p>{profile.debugStory}</p>
                    ) : isFieldActive(7) ? (
                      <p className="text-purple-300 animate-pulse">
                        Querying BM25 chunk index... Synthesizing first-person factual answer with {selectedProvider.toUpperCase()}...
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">
                        Click &ldquo;Auto-Fill Form&rdquo; to watch Fillvyn synthesize a factual answer from your uploaded documents...
                      </p>
                    )}
                  </div>

                  {isFieldFilled(7) && (
                    <div className="mt-2.5 text-[11px] text-purple-700 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Retrieved Context: <strong>Alex_Morgan_Resume_2026.pdf (Section 3)</strong> + <strong>ai-voice-agent-pipeline/README.md</strong></span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
