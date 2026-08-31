'use client';

import React from 'react';
import { CandidateProfile } from '../types';
import { Sparkles, Check, CheckCircle2, MoreHorizontal, ShieldCheck } from 'lucide-react';

interface MicrosoftFormSimulatorProps {
  profile: CandidateProfile;
  filledFieldsCount: number;
  currentStep: number;
  selectedProvider: 'ollama' | 'gemini' | 'openai';
  onFillSingleField?: (index: number) => void;
  onRunAutofill: () => void;
}

export default function MicrosoftFormSimulator({
  profile,
  filledFieldsCount,
  currentStep,
  selectedProvider,
  onFillSingleField,
  onRunAutofill,
}: MicrosoftFormSimulatorProps) {
  const isFilled = (stepIndex: number) => filledFieldsCount > stepIndex;
  const isActive = (stepIndex: number) => currentStep === stepIndex;

  return (
    <div className="bg-gradient-to-b from-[#e8f1f5] via-[#f0f6f9] to-[#e4eef4] p-3 sm:p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 font-sans text-slate-800">
      
      {/* Microsoft Forms Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Form Title & Top Controls */}
        <div className="border-b border-slate-100 pb-5 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Software &amp; AI Systems Engineer Job Application Form
            </h3>
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors shrink-0"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div>
            <span className="text-xs text-rose-600 font-semibold">* Required</span>
          </div>
        </div>

        {/* Section 1 Header */}
        <div className="space-y-1">
          <h4 className="text-base font-bold text-slate-800">
            Personal &amp; Contact Details
          </h4>
          <p className="text-xs text-slate-500">
            Provide your contact details accurately so the hiring team can identify you and communicate next steps.
          </p>
        </div>

        {/* 1. Full Name */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(0) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              1. Full Name <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Enter your full legal name exactly as it appears on your passport, government ID, or official academic records.
            </p>
            {isActive(0) && (
              <span className="text-[11px] text-teal-700 font-medium block animate-pulse">
                AI Reading column &amp; checking strict candidate name...
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={isFilled(0) ? profile.name : ''}
              placeholder={isFilled(0) ? '' : 'Enter your answer'}
              className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isFilled(0) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>AI Verified &bull; Strict Value</span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(0)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(0)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(0) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* 2. Email Address */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(1) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              2. Email Address <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Use an email address you actively monitor. Our recruitment team may use this address for all candidate communication.
            </p>
            {isActive(1) && (
              <span className="text-[11px] text-teal-700 font-medium block animate-pulse">
                AI Reading column &amp; verifying strict email...
              </span>
            )}
          </div>
          
          <input
            type="text"
            readOnly
            value={isFilled(1) ? profile.email : ''}
            placeholder={isFilled(1) ? '' : 'Please enter an email'}
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
          />

          <div className="flex items-center justify-between pt-1">
            {isFilled(1) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>AI Verified &bull; Strict Email</span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(1)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(1)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(1) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* 3. Mobile Number */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(2) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              3. Mobile / Phone Number <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Include international country code for candidate contact.
            </p>
            {isActive(2) && (
              <span className="text-[11px] text-teal-700 font-medium block animate-pulse">
                AI Reading column &amp; verifying strict phone...
              </span>
            )}
          </div>
          
          <input
            type="text"
            readOnly
            value={isFilled(2) ? profile.phone : ''}
            placeholder={isFilled(2) ? '' : 'Enter your answer'}
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all"
          />

          <div className="flex items-center justify-between pt-1">
            {isFilled(2) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>AI Verified &bull; Strict Phone</span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(2)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(2)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(2) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* Section 2 Header */}
        <div className="border-t border-slate-100 pt-5 space-y-1">
          <h4 className="text-base font-bold text-slate-800">
            Availability &amp; Technical Qualifications
          </h4>
          <p className="text-xs text-slate-500">
            Notice period constraints, expected compensation, and engineering background.
          </p>
        </div>

        {/* 4. Notice Period */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(3) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              4. Notice Period (In days) <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Provide integer number of days (e.g., 0 for Immediate).
            </p>
            {isActive(3) && (
              <span className="text-[11px] text-teal-700 font-medium block animate-pulse">
                AI Reading column &amp; enforcing strict integer days...
              </span>
            )}
          </div>
          
          <input
            type="text"
            readOnly
            value={isFilled(3) ? profile.noticePeriod.days : ''}
            placeholder={isFilled(3) ? '' : 'Enter your answer'}
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all font-semibold"
          />

          <div className="flex items-center justify-between pt-1">
            {isFilled(3) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>AI Verified Strict Value: <strong>&ldquo;{profile.noticePeriod.days}&rdquo; (Days)</strong></span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(3)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(3)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(3) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* 5. Expected CTC */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(4) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              5. Expected CTC (in LPA) <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Numeric LPA representation.
            </p>
            {isActive(4) && (
              <span className="text-[11px] text-teal-700 font-medium block animate-pulse">
                AI Reading column &amp; enforcing strict LPA digit...
              </span>
            )}
          </div>
          
          <input
            type="text"
            readOnly
            value={isFilled(4) ? profile.expectedCtc.numberOnly : ''}
            placeholder={isFilled(4) ? '' : 'Enter your answer'}
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none transition-all font-semibold"
          />

          <div className="flex items-center justify-between pt-1">
            {isFilled(4) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>AI Verified Strict Value: <strong>&ldquo;{profile.expectedCtc.numberOnly}&rdquo; LPA</strong></span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(4)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(4)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(4) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* 6. Primary Domain (Microsoft Forms Radio style) */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(5) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              6. Primary Technical Domain <span className="text-rose-600">*</span>
            </label>
          </div>

          <div className="space-y-2 pt-1">
            {[
              { label: 'Java 21, Spring Boot & Distributed Enterprise Microservices', key: 'java-springboot' },
              { label: 'Python, PyTorch & Local RAG AI Pipeline Development', key: 'python-aiml' },
              { label: 'Next.js 14, React & TypeScript Full Stack', key: 'fullstack-nextjs' },
              { label: 'Cloud Infrastructure & Kubernetes DevOps', key: 'devops' }
            ].map((option) => {
              const isSelected = isFilled(5) && (
                profile.id === option.key ||
                (profile.id === 'java-springboot' && option.key === 'java-springboot')
              );
              return (
                <div
                  key={option.label}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 font-semibold text-teal-950 shadow-2xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-teal-600 bg-teal-600' : 'border-slate-400'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span className="text-xs sm:text-sm">{option.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => onFillSingleField?.(5)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(5)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(5) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* 7. Critical Architecture Achievement (RAG Grounded) */}
        <div className={`space-y-2 transition-all p-3 rounded-xl ${
          isActive(7) ? 'bg-teal-50/50 ring-1 ring-teal-500' : ''
        }`}>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-900 block">
              7. Critical Production Milestone or Bug Debugged (RAG Grounded) <span className="text-rose-600">*</span>
            </label>
            <p className="text-xs italic text-slate-500">
              Synthesized directly from your verified Resume and GitHub repositories.
            </p>
          </div>

          <div className="rounded-md border border-slate-300 bg-white p-3 min-h-[72px] text-xs text-slate-800">
            {isFilled(7) ? (
              <p className="leading-relaxed font-normal">{profile.debugStory}</p>
            ) : isActive(7) ? (
              <p className="text-teal-700 animate-pulse font-medium">
                Evaluating vector chunks... Generating response via {selectedProvider.toUpperCase()}...
              </p>
            ) : (
              <span className="text-slate-400">Enter your answer</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            {isFilled(7) ? (
              <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                <span>Context: <strong>{profile.resumeFile || `${profile.name.replace(' ', '_')}_Resume.pdf`}</strong></span>
              </div>
            ) : <div></div>}

            <button
              onClick={() => onFillSingleField?.(7)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(7)
                  ? 'bg-teal-100/80 text-teal-800 border border-teal-300'
                  : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-xs active:scale-95'
              }`}
            >
              {isFilled(7) ? <Check className="w-3 h-3 text-teal-700" /> : <Sparkles className="w-3 h-3 text-teal-700" />}
              <span>AI Answer</span>
            </button>
          </div>
        </div>

        {/* Microsoft Forms Submit */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <button
            onClick={onRunAutofill}
            className="px-8 py-2.5 rounded-full bg-[#008272] hover:bg-[#006e60] active:scale-95 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Submit / Autofill</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Microsoft Forms Secured</span>
          </div>
        </div>

      </div>

      {/* Microsoft Forms Footer */}
      <div className="text-center text-xs text-slate-500 pt-2 pb-1 space-y-1">
        <p>This form is protected by Microsoft Forms Anti-Spam protection.</p>
        <p className="font-semibold text-slate-600">Powered by Microsoft Forms</p>
      </div>

    </div>
  );
}
