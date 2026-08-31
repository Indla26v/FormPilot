'use client';

import React from 'react';
import Image from 'next/image';
import { 
  Sparkles, 
  Cpu, 
  FileText, 
  Github, 
  Lock, 
  Zap, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Binary
} from 'lucide-react';

const FEATURES = [
  {
    icon: Database,
    title: 'RAG Knowledge Base & Truth Synthesis',
    description: 'Upload your resume (.pdf, .docx, .md, .txt) and ingest GitHub repository READMEs with 1 click. Generates factual, first-person answers for complex open-ended technical questions.',
    tag: 'Anti-Hallucination',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Binary,
    title: 'AI Column Evaluation & Strict Value Resolution',
    description: 'Every column is read by AI. It evaluates field constraints, checks default profile values, inputs strict values [without extra text], and queries RAG for descriptive answers.',
    tag: 'Strict Values & Zero Fluff',
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    icon: Cpu,
    title: '100% Free & Offline Local Ollama',
    description: 'Run completely on-device with Ollama models like Llama 3.2, DeepSeek-R1, Mistral, or Phi-3. Enjoy zero cloud subscription fees, zero rate limits, and 100% data privacy.',
    tag: 'Privacy First',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Zap,
    title: 'In-Page Floating Assistant Dock',
    description: 'A discreet floating control widget directly inside Google Forms and Microsoft Forms. Switch candidate personas and toggle the live Target JD drawer with Alt + Shift + F.',
    tag: 'Instant Workflow',
    gradient: 'from-violet-500 to-pink-600',
  },
  {
    icon: Sliders,
    title: 'Multi-Persona Profile Management',
    description: 'Create and switch between distinct candidate profiles (e.g. AI Engineer, Full Stack, SDE-2) with unique skills, expected CTC brackets, and portfolio links.',
    tag: 'Customizable',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Lock,
    title: 'AES-GCM-256 Encrypted Backups',
    description: 'Protect your candidate information with military-grade Web Crypto API encryption. Includes strict anti-XSS DOM sanitization, anti-SSRF protections, and local storage.',
    tag: 'Enterprise Security',
    gradient: 'from-cyan-500 to-blue-600',
  },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background AI Prism & Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/bg-features.jpg"
          alt="AI Luminous Features Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powerful Core Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Precision, Privacy, and Speed
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Everything you need to apply for jobs and submit technical questionnaires 10x faster without sacrificing data accuracy.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-md p-7 sm:p-8 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Icon & Tag */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-50 border border-slate-200/80 group-hover:border-indigo-200 flex items-center justify-center text-indigo-600 transition-colors shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                      {feat.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>

                {/* Bottom line accent */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                  <span>Explore in Extension &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
