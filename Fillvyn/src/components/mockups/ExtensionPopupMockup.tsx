'use client';

import React, { useState } from 'react';
import { Sparkles, Settings, ChevronDown, CheckCircle2, Zap } from 'lucide-react';

export default function ExtensionPopupMockup() {
  const [isFilled, setIsFilled] = useState(false);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white relative select-none">
      {/* Mock Browser Header & Chrome Extension Popup Frame */}
      <div className="w-full max-w-[340px] bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl p-5 space-y-4">
        
        {/* Header: Brand & Ready Pill */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Fillvyn</div>
              <div className="text-[10px] text-slate-400 font-medium">Forms Auto-Filler</div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Google Form Ready</span>
          </div>
        </div>

        {/* Primary Auto-Fill Action */}
        <div className="space-y-1.5 text-center">
          <button
            onClick={() => {
              setIsFilled(true);
              setTimeout(() => setIsFilled(false), 2500);
            }}
            className={`w-full py-3.5 px-5 rounded-full font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
              isFilled
                ? 'bg-emerald-600 shadow-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-600/40'
            }`}
          >
            {isFilled ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Form Auto-Filled 100%</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Auto-Fill Form</span>
              </>
            )}
          </button>
          <div className="text-[10px] text-slate-400 font-mono">
            Shortcut: <span className="text-slate-300">Alt</span> + <span className="text-slate-300">Shift</span> + <span className="text-slate-300">F</span>
          </div>
        </div>

        {/* Active Profile Info Card */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Profile</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
              <span>Default Profile</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Candidate</span>
              <span className="font-semibold text-slate-100">Alex Morgan</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Email</span>
              <span className="font-medium text-slate-200">alex.morgan.dev@example.com</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Phone</span>
              <span className="font-mono text-slate-200">+1 555-019-2834</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Target Role</span>
              <span className="font-semibold text-indigo-400">AI & Full Stack Engineer</span>
            </div>
          </div>
        </div>

        {/* Bottom Options Trigger */}
        <button className="w-full py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Manage Profiles & Answers</span>
        </button>

      </div>
    </div>
  );
}
