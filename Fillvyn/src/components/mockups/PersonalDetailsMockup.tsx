'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  User, 
  GraduationCap, 
  Briefcase, 
  Copy, 
  Plus, 
  CheckCircle2, 
  Award
} from 'lucide-react';

export default function PersonalDetailsMockup() {
  const [activeTab, setActiveTab] = useState<'personal' | 'education' | 'experience'>('personal');

  return (
    <div className="w-full h-full min-h-[420px] bg-slate-950 rounded-2xl text-white p-3.5 sm:p-5 flex flex-col justify-between border border-slate-800 text-xs select-none">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-xs sm:text-sm">
              {activeTab === 'personal' && 'Personal Details'}
              {activeTab === 'education' && 'Education & Post Graduation'}
              {activeTab === 'experience' && 'Experience & CTC'}
            </span>
            <p className="text-[10px] text-slate-400">
              {activeTab === 'personal' && 'Configure candidate identity, contact details, and location'}
              {activeTab === 'education' && 'Configure Undergraduate, Post Graduation, CGPA, and Passing Years'}
              {activeTab === 'experience' && 'Configure current employer, roles, notice period, and CTC'}
            </p>
          </div>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm transition-all">
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
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`p-1.5 rounded-xl text-left flex items-center gap-1.5 transition-all shrink-0 sm:shrink ${
                  activeTab === 'personal'
                    ? 'bg-indigo-950/70 text-indigo-300 font-semibold border border-indigo-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <User className="w-3 h-3 text-indigo-400" />
                <span className="truncate">Personal Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('education')}
                className={`p-1.5 rounded-xl text-left flex items-center gap-1.5 transition-all shrink-0 sm:shrink ${
                  activeTab === 'education'
                    ? 'bg-indigo-950/70 text-indigo-300 font-semibold border border-indigo-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <GraduationCap className="w-3 h-3 text-indigo-400" />
                <span className="truncate">Education & PG</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('experience')}
                className={`p-1.5 rounded-xl text-left flex items-center gap-1.5 transition-all shrink-0 sm:shrink ${
                  activeTab === 'experience'
                    ? 'bg-indigo-950/70 text-indigo-300 font-semibold border border-indigo-800/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Briefcase className="w-3 h-3 text-indigo-400" />
                <span className="truncate">Experience & CTC</span>
              </button>
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
          
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'personal' && (
            <>
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
            </>
          )}

          {/* TAB 2: EDUCATION & POST GRADUATION */}
          {activeTab === 'education' && (
            <>
              {/* 1. 10th & 12th Marks Card */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200">10th & 12th Schooling</span>
                  <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">10th School / Board</label>
                      <input
                        type="text"
                        readOnly
                        value="St. Xavier High School"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">10th Marks (Numeric)</label>
                      <input
                        type="text"
                        readOnly
                        value="92.5"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">12th School / College</label>
                      <input
                        type="text"
                        readOnly
                        value="National Junior College"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">12th Marks (Numeric)</label>
                      <input
                        type="text"
                        readOnly
                        value="94.0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Undergraduate Card */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200">Undergraduate / Graduation</span>
                  <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">Graduated (2025)</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block">College / University Name</label>
                    <input
                      type="text"
                      readOnly
                      value="University of Technology"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium text-[11px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Degree (Col 1)</label>
                      <input
                        type="text"
                        readOnly
                        value="B.S."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Branch / Major (Col 2)</label>
                      <input
                        type="text"
                        readOnly
                        value="Computer Science & Engineering"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Graduation Year</label>
                      <input
                        type="text"
                        readOnly
                        value="2025"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Graduation CGPA (Numeric)</label>
                      <input
                        type="text"
                        readOnly
                        value="8.8"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Post Graduation Card */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] font-bold text-indigo-200">Post Graduation / Master&apos;s</span>
                  </div>
                  <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2 py-0.5 rounded-full">Pursuing (2027)</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block">PG College / University Name</label>
                    <input
                      type="text"
                      readOnly
                      value="Stanford University"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium text-[11px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">PG Degree (Col 1)</label>
                      <input
                        type="text"
                        readOnly
                        value="M.S."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">PG Branch (Col 2)</label>
                      <input
                        type="text"
                        readOnly
                        value="Artificial Intelligence"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">PG End Year</label>
                      <input
                        type="text"
                        readOnly
                        value="2027"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">PG CGPA (Numeric)</label>
                      <input
                        type="text"
                        readOnly
                        value="3.9"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 3: EXPERIENCE & CTC */}
          {activeTab === 'experience' && (
            <>
              {/* Role & Experience */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-200">Current Role & Availability</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Current Organization</label>
                      <input
                        type="text"
                        readOnly
                        value="Acme Labs / Open Source Builder"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Role & Experience</label>
                      <input
                        type="text"
                        readOnly
                        value="AI Engineer (1 Year Exp)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation Card */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-200">Notice Period & CTC</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Notice Period (Days)</label>
                    <input
                      type="text"
                      readOnly
                      value="Immediate (0 Days)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Expected CTC</label>
                    <input
                      type="text"
                      readOnly
                      value="10 LPA (Rs. 10,00,000)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
