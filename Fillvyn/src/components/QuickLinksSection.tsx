import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MessageSquareHeart, ShieldCheck, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

export default function QuickLinksSection() {
  return (
    <section className="py-16 md:py-24 bg-slate-50/70 relative overflow-hidden">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <Image
          src="/images/bg-contact.jpg"
          alt="Ambient Light Mesh"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-slate-50/80 to-slate-50/95"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community & Help Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Connect with Fillvyn
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Have feedback, questions about local Ollama models, or need engineering assistance?
          </p>
        </div>

        {/* 3 Action Cards with Pill-shaped Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Contact Support */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Direct Support & Contact</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect directly with our engineering team for assistance with local Ollama setup, custom JD parsing, or enterprise setups.
              </p>
            </div>

            <div>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-full shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Contact Engineering</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Community Feedback */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquareHeart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Share Your Feedback</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rate your experience, submit feature requests, and help shape our upcoming browser automation roadmap.
              </p>
            </div>

            <div>
              <Link
                href="/feedback"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-full shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Submit Feedback</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Privacy & Security */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all flex flex-col justify-between space-y-6 group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Privacy & Data Security</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review our zero-telemetry architecture, on-device AES-GCM-256 storage details, and local Ollama guarantees.
              </p>
            </div>

            <div>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 rounded-full transition-all"
              >
                <span>Read Privacy Policy</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
