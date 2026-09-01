import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Database,
  Cpu,
  EyeOff,
  Trash2,
  FileCheck,
  Mail,
} from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Fillvyn AI Forms Auto-Filler',
  description: 'Learn about Fillvyn\'s zero-telemetry architecture, local Ollama execution, and on-device storage security.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* Main Single Luminous Section Spanning Full Page */}
      <section className="relative pt-28 pb-20 md:pt-32 md:pb-28 overflow-hidden bg-white flex-1">
        {/* Full-page Nanobanana Mesh Background with Luminous Light Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
          <Image
            src="/images/bg-privacy.jpg"
            alt="Privacy Luminous Mesh Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-white/40 to-white/95"></div>
        </div>

        {/* Ambient Radial Glowing Lights */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-[600px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-purple-100/30 via-indigo-100/20 to-transparent blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 space-y-8">
          
          {/* Top Bar with Back Button to the Left */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white/90 hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-xs transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Compact Single Header */}
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Data Protection & Privacy Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Privacy Policy for Fillvyn
            </h1>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal">
              Fillvyn is architected on a zero-knowledge, privacy-first model. Your candidate profiles, resume embeddings, and form inputs remain completely under your control on your local device.
            </p>
            <div className="pt-1 text-[11px] font-mono text-slate-500">
              Effective Date: August 31, 2026 &bull; Version 1.0.1
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-indigo-100 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Foundational Security Commitment</h2>
                <p className="text-xs text-slate-500 font-medium">Zero Cloud Trackers &bull; Local-First Storage</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              We do not run centralized databases that harvest user resumes or job applications. All automated form filling, resume chunking, and reasoning logic execute either on your own hardware via local Ollama or directly through client-side API calls with your private keys.
            </p>
          </div>

          {/* Policy Sections Cards */}
          <div className="space-y-6">
            
            {/* Section 1: Local Device Storage */}
            <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">1. Local Storage on Your Device</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                All profile information—including your full name, phone number, email address, portfolio links, GPA, and employment history—is stored solely within the encrypted browser storage area (<code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 text-xs font-mono">chrome.storage.local</code>).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-600">
                <li>Data is never transmitted to Fillvyn servers (we operate no telemetry backends).</li>
                <li>When exporting profile backups, data is encrypted locally using the Web Crypto API with standard AES-GCM-256 encryption.</li>
              </ul>
            </div>

            {/* Section 2: AI Processing & LLMs */}
            <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">2. AI Synthesis & Model Execution</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fillvyn provides two distinct modes for AI reasoning and answer generation:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Local Ollama Mode (100% Offline)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Form questions and RAG resume chunks are processed directly on your local CPU/GPU using on-device models. Zero data packets leave your machine.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Cloud Providers (User API Key)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If you choose Google Gemini, OpenAI, or Anthropic, prompts are sent directly from your browser to the respective provider using your personal API key stored in your local browser.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Telemetry & Analytics */}
            <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <EyeOff className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">3. Zero Telemetry, Trackers, or Analytics</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Fillvyn extension contains zero tracking pixels, Google Analytics tags, session replay scripts, or advertising SDKs. We do not track the URLs you visit, the forms you fill, or the candidates you configure.
              </p>
            </div>

            {/* Section 4: DOM Interaction & Security */}
            <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">4. Form DOM Interaction & Sanitization</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Fillvyn interacts with web pages exclusively when you trigger the autofill action (<code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-700 text-xs font-mono">Alt + Shift + F</code>) or open the floating dock on supported form URLs (Google Forms and Microsoft Forms). All synthesized content is strictly sanitized before DOM injection to eliminate cross-site scripting risks.
              </p>
            </div>

            {/* Section 5: Data Rights & Deletion */}
            <div className="p-7 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">5. User Data Rights & One-Click Purge</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                You retain complete ownership over all stored profiles and RAG files. You can delete individual profiles or perform a complete, irreversible wipe of all extension data directly from the Extension Options page with a single click. Uninstalling the extension removes all local data automatically.
              </p>
            </div>

            {/* Section 6: Contact & Inquiries */}
            <div className="p-7 sm:p-8 bg-slate-900/95 backdrop-blur-md rounded-3xl text-white shadow-xl space-y-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold">6. Questions & Privacy Inquiries</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                If you have questions about this Privacy Policy, compliance inquiries, or need support with local encryption keys, please reach out to our team.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Engineering</span>
                </Link>
                <a
                  href="mailto:fillvyn.support@gmail.com"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  <span>fillvyn.support@gmail.com</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
