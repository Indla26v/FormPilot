import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeedbackSection from '@/components/FeedbackSection';
import { ArrowLeft, MessageSquareHeart, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Community Feedback - Fillvyn AI Forms Auto-Filler',
  description: 'Share your experience, feature requests, or suggestions to improve Fillvyn AI forms auto-filler.',
};

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* Hero Banner with Nanobanana Emerald Background */}
      <section className="relative pt-32 pb-12 md:pt-36 md:pb-16 overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <Image
            src="/images/bg-feedback.jpg"
            alt="Feedback Luminous Mesh Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2 rounded-full border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-950 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-800">
              <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Developer & User Feedback Loop</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Community Feedback
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
              We build Fillvyn openly for candidates and developers. Help us refine local Ollama detection, RAG retrieval accuracy, and form compatibility by sharing your thoughts.
            </p>
          </div>
        </div>
      </section>

      {/* Embedded Feedback Form */}
      <div className="flex-1">
        <FeedbackSection />
      </div>

      <Footer />
    </main>
  );
}
