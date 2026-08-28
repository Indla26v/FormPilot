'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  User, 
  GraduationCap, 
  Briefcase, 
  Code2, 
  Link as LinkIcon, 
  Database, 
  Sliders, 
  Cpu, 
  Settings,
  Copy,
  Plus,
  Trash2
} from 'lucide-react';

export default function PersonalDetailsMockup() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="w-full h-full min-h-[380px] bg-slate-950 rounded-2xl text-white p-3.5 sm:p-5 flex flex-col justify-between border border-slate-800 text-xs select-none">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-xs sm:text-sm">Personal Details</span>
            <p className="text-[10px] text-slate-400">Configure candidate identity and contact information</p>
          </div>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm">
          <Save className="w-3 h-3" />
          <span>Save Profile</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Form Content */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 pt-3 flex-1 items-start">
        
        {/* Left Sidebar (Mini navigation) */}
        <div className="sm:col-span-4 space-y-2.5 sm:space-y-3 sm:border-r border-slate-800/80 sm:pr-3">
          <div className="space-y-1">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Candidate Info</div>
            <div className="flex sm:flex-col gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <div className="p-1.5 rounded-xl bg-indigo-950/70 text-indigo-300 font-semibold flex items-center gap-1.5 border border-indigo-800/60 shrink-0 sm:shrink">
                <User className="w-3 h-3 text-indigo-400" />
                <span className="truncate">Personal Details</span>
              </div>
              <div className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 flex items-center gap-1.5 hover:bg-slate-900 shrink-0 sm:shrink">
                <GraduationCap className="w-3 h-3" />
                <span className="truncate">Education & Marks</span>
              </div>
              <div className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 flex items-center gap-1.5 hover:bg-slate-900 shrink-0 sm:shrink">
                <Briefcase className="w-3 h-3" />
                <span className="truncate">Experience & CTC</span>
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1 hidden sm:block">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Role Profiles</div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Default Profile
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center justify-center gap-1">
                  <Copy className="w-2.5 h-2.5" /> Clone
                </button>
                <button className="flex-1 py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center justify-center gap-1">
                  <Plus className="w-2.5 h-2.5" /> New
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Cards */}
        <div className="sm:col-span-8 space-y-3 sm:pl-1">
          
          {/* Identity & Name Card */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-200">Identity & Name</div>
            <div className="space-y-1.5">
              <div>
                <label className="text-[10px] text-slate-400 block">Full Name / Candidate Name</label>
                <input
                  type="text"
                  readOnly
                  value="Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium text-[11px]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">First Name</label>
                  <input
                    type="text"
                    readOnly
                    value="Alex"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Last Name</label>
                  <input
                    type="text"
                    readOnly
                    value="Morgan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Location Card */}
          <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="text-[11px] font-bold text-slate-200">Contact & Location</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">Email Address</label>
                <input
                  type="text"
                  readOnly
                  value="alex.morgan.dev@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Phone Number</label>
                <input
                  type="text"
                  readOnly
                  value="+1 555 019 2834"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
