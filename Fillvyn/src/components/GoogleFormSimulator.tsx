'use client';

import React from 'react';
import { CandidateProfile } from '../types';
import { Sparkles, Check, CheckCircle2, Cloud, HelpCircle } from 'lucide-react';

interface GoogleFormSimulatorProps {
  profile: CandidateProfile;
  filledFieldsCount: number;
  currentStep: number;
  selectedProvider: 'ollama' | 'gemini' | 'openai';
  onFillSingleField?: (index: number) => void;
  onRunAutofill: () => void;
}

export default function GoogleFormSimulator({
  profile,
  filledFieldsCount,
  currentStep,
  selectedProvider,
  onFillSingleField,
  onRunAutofill,
}: GoogleFormSimulatorProps) {
  const isFilled = (stepIndex: number) => filledFieldsCount > stepIndex;
  const isActive = (stepIndex: number) => currentStep === stepIndex;

  return (
    <div className="bg-[#ede7f6] p-3 sm:p-6 rounded-3xl border border-purple-100 shadow-xl space-y-3 font-sans text-slate-800">
      
      {/* 1. Google Forms Top Header Card */}
      <div className="bg-white rounded-xl border border-[#dadce0] shadow-xs overflow-hidden">
        {/* Purple top bar */}
        <div className="h-2.5 bg-[#673ab7]"></div>
        
        <div className="p-5 sm:p-7 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl font-medium text-[#202124] tracking-tight">
              AI &amp; Full Stack SDE Application
            </h3>
            <p className="text-xs sm:text-sm text-[#3c4043] leading-relaxed">
              Join our engineering team to work on <strong className="font-semibold text-[#202124]">real-world AI products, automation, and production systems</strong>. If you love building, solving problems, and taking ownership from Day 1, we&apos;d love to hear from you!
            </p>
          </div>

          <div className="border-t border-[#dadce0] pt-3.5 space-y-2 text-xs text-[#5f6368]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#202124]">{profile.email}</span>
                <button
                  type="button"
                  className="text-[#1a73e8] underline font-medium hover:text-[#1557b0] cursor-pointer"
                >
                  Switch account
                </button>
              </div>
              <div className="flex items-center gap-1 text-[#5f6368]" title="Form auto-saving to cloud">
                <Cloud className="w-4 h-4 text-[#5f6368]" />
              </div>
            </div>
            <p className="text-[11px] text-[#70757a]">
              The name, email, and photo associated with your Google account will be recorded when you upload files and submit this form
            </p>
          </div>

          <div className="pt-1">
            <span className="text-xs text-[#d93025] font-medium">* Indicates required question</span>
          </div>
        </div>
      </div>

      {/* 2. Question Card: Full Name */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(0)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(0)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <label className="text-sm font-medium text-[#202124]">
              Full Name <span className="text-[#d93025]">*</span>
            </label>
            {isActive(0) && (
              <span className="text-[11px] text-[#673ab7] font-medium block animate-pulse mt-0.5">
                AI Reading column &amp; verifying strict value...
              </span>
            )}
          </div>
          <button
            onClick={() => onFillSingleField?.(0)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(0)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(0) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="pt-2">
          <input
            type="text"
            readOnly
            value={isFilled(0) ? profile.name : ''}
            placeholder={isFilled(0) ? '' : 'Your answer'}
            className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7] font-normal"
          />
        </div>

        {isFilled(0) && (
          <div className="text-[11px] text-[#673ab7] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-[#673ab7]" />
            <span>AI Verified &bull; Strict Value</span>
          </div>
        )}
      </div>

      {/* 3. Question Card: Email Address */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(1)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(1)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <label className="text-sm font-medium text-[#202124]">
              Email Address <span className="text-[#d93025]">*</span>
            </label>
            {isActive(1) && (
              <span className="text-[11px] text-[#673ab7] font-medium block animate-pulse mt-0.5">
                AI Reading column &amp; checking profile email...
              </span>
            )}
          </div>
          <button
            onClick={() => onFillSingleField?.(1)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(1)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(1) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="pt-2">
          <input
            type="text"
            readOnly
            value={isFilled(1) ? profile.email : ''}
            placeholder={isFilled(1) ? '' : 'Your answer'}
            className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7] font-normal"
          />
        </div>

        {isFilled(1) && (
          <div className="text-[11px] text-[#673ab7] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-[#673ab7]" />
            <span>AI Verified &bull; Strict Email</span>
          </div>
        )}
      </div>

      {/* 4. Question Card: Phone Number */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(2)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(2)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <label className="text-sm font-medium text-[#202124]">
              Phone / Mobile Number <span className="text-[#d93025]">*</span>
            </label>
            {isActive(2) && (
              <span className="text-[11px] text-[#673ab7] font-medium block animate-pulse mt-0.5">
                AI Reading column &amp; checking profile phone...
              </span>
            )}
          </div>
          <button
            onClick={() => onFillSingleField?.(2)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(2)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(2) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="pt-2">
          <input
            type="text"
            readOnly
            value={isFilled(2) ? profile.phone : ''}
            placeholder={isFilled(2) ? '' : 'Your answer'}
            className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7] font-normal"
          />
        </div>

        {isFilled(2) && (
          <div className="text-[11px] text-[#673ab7] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3 text-[#673ab7]" />
            <span>AI Verified &bull; Strict Phone</span>
          </div>
        )}
      </div>

      {/* 5. Question Card: Notice Period & Expected CTC (Formatted numeric values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Notice Period */}
        <div className={`bg-white rounded-xl p-5 border shadow-xs space-y-3 transition-all ${
          isActive(3)
            ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
            : isFilled(3)
            ? 'border-[#c8b7e8]'
            : 'border-[#dadce0]'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm font-medium text-[#202124] block">
                Notice Period (In days) <span className="text-[#d93025]">*</span>
              </label>
              <span className="text-[11px] text-[#70757a]">AI strict numeric integer</span>
            </div>
            <button
              onClick={() => onFillSingleField?.(3)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(3)
                  ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                  : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
              }`}
            >
              {isFilled(3) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
              <span>AI Answer</span>
            </button>
          </div>

          <div className="pt-1">
            <input
              type="text"
              readOnly
              value={isFilled(3) ? profile.noticePeriod.days : ''}
              placeholder={isFilled(3) ? '' : 'Your answer'}
              className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7] font-semibold"
            />
          </div>

          {isFilled(3) && (
            <div className="text-[11px] text-[#673ab7] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#673ab7]" />
              <span>AI Verified Strict Value: <strong>&ldquo;{profile.noticePeriod.days}&rdquo; (Days)</strong></span>
            </div>
          )}
        </div>

        {/* Expected CTC */}
        <div className={`bg-white rounded-xl p-5 border shadow-xs space-y-3 transition-all ${
          isActive(4)
            ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
            : isFilled(4)
            ? 'border-[#c8b7e8]'
            : 'border-[#dadce0]'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <label className="text-sm font-medium text-[#202124] block">
                Expected CTC (in LPA) <span className="text-[#d93025]">*</span>
              </label>
              <span className="text-[11px] text-[#70757a]">AI strict LPA digit</span>
            </div>
            <button
              onClick={() => onFillSingleField?.(4)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isFilled(4)
                  ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                  : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
              }`}
            >
              {isFilled(4) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
              <span>AI Answer</span>
            </button>
          </div>

          <div className="pt-1">
            <input
              type="text"
              readOnly
              value={isFilled(4) ? profile.expectedCtc.numberOnly : ''}
              placeholder={isFilled(4) ? '' : 'Your answer'}
              className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7] font-semibold"
            />
          </div>

          {isFilled(4) && (
            <div className="text-[11px] text-[#673ab7] bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#673ab7]" />
              <span>AI Verified Strict Value: <strong>&ldquo;{profile.expectedCtc.numberOnly}&rdquo; LPA</strong></span>
            </div>
          )}
        </div>

      </div>

      {/* 6. Question Card: Primary Technology Stack (Google Form Radio Buttons) */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(5)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(5)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <label className="text-sm font-medium text-[#202124]">
            Primary Domain & Technology Stack <span className="text-[#d93025]">*</span>
          </label>
          <button
            onClick={() => onFillSingleField?.(5)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(5)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(5) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="pt-2 space-y-3">
          {[
            { label: 'Java 21, Spring Boot 3 & Enterprise Microservices', key: 'java-springboot' },
            { label: 'Python, LLMs & On-Device RAG Pipelines', key: 'python-aiml' },
            { label: 'Next.js 14, React & TypeScript Full Stack', key: 'fullstack-nextjs' },
            { label: 'Cloud Infrastructure & DevOps (Docker/K8s)', key: 'devops' }
          ].map((skillOption) => {
            const isSelected = isFilled(5) && (
              profile.id === skillOption.key ||
              (profile.id === 'java-springboot' && skillOption.key === 'java-springboot')
            );
            return (
              <div key={skillOption.label} className="flex items-center gap-3 cursor-pointer select-none">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-[#673ab7]' : 'border-[#5f6368]'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#673ab7]"></div>}
                </div>
                <span className={`text-sm ${isSelected ? 'text-[#202124] font-medium' : 'text-[#3c4043]'}`}>
                  {skillOption.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Question Card: Graduation Year & GPA */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(6)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(6)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <label className="text-sm font-medium text-[#202124]">
            Graduation Year & Cumulative Marks / GPA <span className="text-[#d93025]">*</span>
          </label>
          <button
            onClick={() => onFillSingleField?.(6)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(6)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(6) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <span className="text-xs text-[#70757a] block mb-1">Graduation Year</span>
            <input
              type="text"
              readOnly
              value={isFilled(6) ? profile.graduationYear : ''}
              placeholder={isFilled(6) ? '' : 'Your answer'}
              className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7]"
            />
          </div>
          <div>
            <span className="text-xs text-[#70757a] block mb-1">Cumulative GPA / Percentage</span>
            <input
              type="text"
              readOnly
              value={isFilled(6) ? profile.gpa : ''}
              placeholder={isFilled(6) ? '' : 'Your answer'}
              className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] placeholder-[#70757a] bg-transparent focus:outline-none focus:border-[#673ab7]"
            />
          </div>
        </div>
      </div>

      {/* 8. Question Card: RAG Synthesized Critical Bug / Architecture Milestone */}
      <div className={`bg-white rounded-xl p-5 sm:p-6 border shadow-xs space-y-3 transition-all ${
        isActive(7)
          ? 'border-l-4 border-l-[#673ab7] border-[#dadce0] ring-2 ring-purple-200'
          : isFilled(7)
          ? 'border-[#c8b7e8]'
          : 'border-[#dadce0]'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <label className="text-sm font-medium text-[#202124] leading-snug">
            Describe a critical bug or architecture milestone you implemented <span className="text-[#d93025]">*</span>
          </label>
          <button
            onClick={() => onFillSingleField?.(7)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              isFilled(7)
                ? 'bg-purple-100/70 text-[#673ab7] border border-purple-200'
                : 'bg-[#f3e8fd] text-[#673ab7] border border-[#e1bee7] hover:bg-[#ebd4fc] shadow-xs active:scale-95'
            }`}
          >
            {isFilled(7) ? <Check className="w-3 h-3 text-[#673ab7]" /> : <Sparkles className="w-3 h-3 text-[#673ab7]" />}
            <span>AI Answer</span>
          </button>
        </div>

        <div className="pt-2">
          <div className="w-full pb-2 border-b border-[#dadce0] text-sm text-[#202124] bg-transparent min-h-[60px]">
            {isFilled(7) ? (
              <p className="leading-relaxed text-[#202124]">{profile.debugStory}</p>
            ) : isActive(7) ? (
              <p className="text-[#673ab7] animate-pulse">
                Querying BM25 chunk index... Synthesizing answer with {selectedProvider.toUpperCase()}...
              </p>
            ) : (
              <span className="text-[#70757a]">Your answer</span>
            )}
          </div>
        </div>

        {isFilled(7) && (
          <div className="text-[11px] text-[#673ab7] bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#673ab7]" />
            <span>Retrieved Context: <strong>{profile.resumeFile || `${profile.name.replace(' ', '_')}_Resume.pdf`}</strong> + <strong>GitHub Repo Context</strong></span>
          </div>
        )}
      </div>

      {/* Google Forms Bottom Controls & Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 px-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onRunAutofill}
            className="px-7 py-2.5 rounded-full bg-[#673ab7] hover:bg-[#5e35b1] active:scale-95 text-white font-medium text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Submit / Autofill</span>
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-full text-[#673ab7] hover:bg-purple-100/60 text-xs font-medium transition-colors"
          >
            Clear form
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5f6368]">
          <HelpCircle className="w-4 h-4 text-[#70757a]" />
          <span>Never submit passwords through Google Forms.</span>
        </div>
      </div>

      {/* Google Forms Disclaimer Footer */}
      <div className="text-center pt-4 pb-2 text-xs text-[#70757a] space-y-1">
        <p>This content is neither created nor endorsed by Google.</p>
        <p className="font-medium text-[#5f6368]">Google Forms</p>
      </div>

    </div>
  );
}
