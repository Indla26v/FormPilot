'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FAQS } from '../data/mockData';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background AI Mesh & Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/bg-faq.jpg"
          alt="AI Luminous FAQ Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Got Questions? We&apos;ve Got Answers.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Learn more about Fillvyn&apos;s privacy guarantees, offline RAG retrieval, and form compatibility.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden backdrop-blur-md ${
                  isOpen
                    ? 'border-indigo-300 bg-indigo-50/50 shadow-sm'
                    : 'border-slate-200 bg-white/90 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors"
                >
                  <span className="text-base font-bold text-slate-900 flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Card in FAQ */}
        <div className="mt-14 p-8 rounded-3xl bg-slate-900/95 backdrop-blur-md text-white text-center space-y-4 shadow-2xl border border-slate-800">
          <h3 className="text-xl sm:text-2xl font-bold">Ready to streamline your form workflows?</h3>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Install Fillvyn today. Auto-fill Google Forms and Microsoft Forms with 100% private on-device RAG in under 3 minutes.
          </p>
          <div className="pt-2">
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started Now</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
