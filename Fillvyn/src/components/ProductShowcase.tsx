'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { SHOWCASE_TABS } from '../data/mockData';
import FloatingDockMockup from './mockups/FloatingDockMockup';
import ExtensionPopupMockup from './mockups/ExtensionPopupMockup';
import PersonalDetailsMockup from './mockups/PersonalDetailsMockup';
import RagKnowledgeBaseMockup from './mockups/RagKnowledgeBaseMockup';
import AiLlmSetupMockup from './mockups/AiLlmSetupMockup';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Eye
} from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function ProductShowcase() {
  const [activeTabId, setActiveTabId] = useState<string>('floating-dock');

  const currentTab = SHOWCASE_TABS.find((t) => t.id === activeTabId) || SHOWCASE_TABS[0];

  const renderActiveMockup = () => {
    switch (activeTabId) {
      case 'floating-dock':
        return <FloatingDockMockup />;
      case 'extension-popup':
        return <ExtensionPopupMockup />;
      case 'rag-knowledge-base':
        return <RagKnowledgeBaseMockup />;
      case 'ai-llm-setup':
        return <AiLlmSetupMockup />;
      case 'personal-details':
        return <PersonalDetailsMockup />;
      default:
        return <FloatingDockMockup />;
    }
  };

  return (
    <section id="product-showcase" className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Background AI Mesh & Luminous Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
        <Image
          src="/images/bg-showcase.jpg"
          alt="AI Luminous Showcase Background"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/90"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Interface Tour</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Seamless Speed & Privacy
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Explore Fillvyn&apos;s modular interface designed for speed, zero-click autofill convenience, and complete local privacy.
          </p>
        </div>

        {/* Pill Tabs Selector */}
        <div className="flex items-center sm:justify-center mb-10 overflow-x-auto pb-2 px-2 scrollbar-none">
          <div className="inline-flex p-1.5 bg-slate-100/90 backdrop-blur-sm rounded-full border border-slate-200 gap-1.5 shadow-sm shrink-0">
            {SHOWCASE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTabId === tab.id
                    ? 'bg-white text-indigo-700 shadow-md shadow-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Display Card */}
        <div className="bg-slate-50/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Info & Feature Highlights */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full inline-block">
                  {currentTab.tag}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {currentTab.title}
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {currentTab.description}
                </p>
              </div>

              {/* Bullet Features */}
              <div className="space-y-3 pt-2">
                {currentTab.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-700">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action Pill */}
              <div className="pt-4">
                <a
                  href={SITE_CONFIG.chromeExtensionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm group"
                >
                  <span>Install Chrome Extension</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right: Interactive UI Mockup Container */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl bg-slate-950 p-2 sm:p-3 shadow-2xl border border-slate-800 overflow-hidden min-h-[420px] flex items-center justify-center">
                {renderActiveMockup()}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
