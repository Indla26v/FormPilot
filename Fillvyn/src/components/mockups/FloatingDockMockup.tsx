'use client';

import React, { useState } from 'react';
import { Sparkles, Power, Settings, ChevronDown, FileText, CheckCircle2, Zap } from 'lucide-react';

export default function FloatingDockMockup() {
  const [isJdOpen, setIsJdOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('Default Profile (Alex Morgan)');
  const [selectedModel, setSelectedModel] = useState('llama3.2:latest');
  const [isActive, setIsActive] = useState(true);
  const [isFilled, setIsFilled] = useState(false);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white relative select-none">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] rounded-2xl pointer-events-none"></div>

      {/* Floating Dock Wrapper */}
      <div className="relative z-10 w-full max-w-sm space-y-2">
        
        {/* Target JD Top Drawer */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
          <button
            onClick={() => setIsJdOpen(!isJdOpen)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Target Job Description (JD)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/60">
                {isJdOpen ? 'Expanded' : 'Collapsed'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isJdOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {isJdOpen && (
            <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-2 bg-slate-900/50">
              <p className="leading-relaxed">
                Senior Full Stack / AI Engineer position requiring Python, Next.js, LLM pipelines, and vector databases.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active JD Context injected into RAG queries</span>
              </div>
            </div>
          )}
        </div>

        {/* Main Dock Pill Container */}
        <div className="bg-slate-950 p-3.5 rounded-3xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/50 space-y-3">
          
          {/* Top Row: Profile Selector */}
          <div className="relative">
            <div className="bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{selectedProfile}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Middle Row: Model Selector & Power Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-900/90 px-3 py-2 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-mono font-semibold text-slate-200">{selectedModel}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              onClick={() => setIsActive(!isActive)}
              className={`p-2.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Toggle Assistant"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Row: Main Auto-Fill Button & Settings */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                setIsFilled(true);
                setTimeout(() => setIsFilled(false), 2500);
              }}
              className={`flex-1 py-3 px-4 rounded-full font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                isFilled
                  ? 'bg-emerald-600 shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-600/30'
              }`}
            >
              {isFilled ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Form Populated 100%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Fill Form</span>
                </>
              )}
            </button>

            <button
              className="p-3 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Open Options"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Keyboard shortcut caption */}
        <div className="text-center pt-2">
          <span className="text-[11px] text-slate-400 font-mono">
            Floating shortcut: <span className="text-indigo-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">Alt + Shift + F</span>
          </span>
        </div>

      </div>
    </div>
  );
}
