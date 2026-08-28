'use client';

import React from 'react';
import { Check, X, Sparkles, Zap, ShieldCheck } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'RAG Resume & GitHub README Ingestion',
    fillvyn: true,
    generic: false,
    manual: false,
    note: 'Chunks and retrieves factual metrics from real files',
  },
  {
    feature: 'Smart Numeric & LPA Formatting (e.g. 14 LPA vs 14)',
    fillvyn: true,
    generic: false,
    manual: 'Manual Math',
    note: 'Converts between textual compensation & numeric constraints',
  },
  {
    feature: '100% Offline Local Ollama LLM Execution',
    fillvyn: true,
    generic: false,
    manual: false,
    note: 'Zero cloud latency, zero external data transfer',
  },
  {
    feature: 'Target Job Description (JD) Live Alignment',
    fillvyn: true,
    generic: false,
    manual: 'Slow & Tedious',
    note: 'Aligns technical responses to specific employer JD keywords',
  },
  {
    feature: 'Multi-Persona Profile Switching (Alt + Shift + F)',
    fillvyn: true,
    generic: 'Limited (1 Profile)',
    manual: false,
    note: 'Instant switch between Frontend, SDE-2, AI, etc.',
  },
  {
    feature: 'Zero Subscription Cost & No Telemetry Tracking',
    fillvyn: true,
    generic: 'Varies',
    manual: true,
    note: 'Open-source, free local models with zero cloud bills',
  },
];

export default function ComparisonSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Why Choose Fillvyn</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Fillvyn Compares
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            See how Fillvyn&apos;s intelligent RAG architecture compares against ordinary form autofillers and manual copy-pasting.
          </p>
        </div>

        {/* Mobile scroll hint */}
        <div className="sm:hidden text-center mb-3">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Scroll horizontally to compare all features
          </span>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <th className="py-5 px-6 text-sm font-bold text-slate-900 w-2/5">
                    Feature & Capability
                  </th>
                  <th className="py-5 px-6 text-sm font-bold text-indigo-700 bg-indigo-50/50 w-1/5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Fillvyn AI</span>
                    </div>
                  </th>
                  <th className="py-5 px-6 text-sm font-semibold text-slate-500 w-1/5 text-center">
                    Generic Auto-Fillers
                  </th>
                  <th className="py-5 px-6 text-sm font-semibold text-slate-500 w-1/5 text-center">
                    Manual Copy-Paste
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{row.feature}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{row.note}</div>
                    </td>
                    
                    {/* Fillvyn */}
                    <td className="py-4 px-6 text-center bg-indigo-50/30">
                      <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white shadow-xs">
                        <Check className="w-4 h-4" />
                      </div>
                    </td>

                    {/* Generic */}
                    <td className="py-4 px-6 text-center">
                      {typeof row.generic === 'boolean' ? (
                        row.generic ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )
                      ) : (
                        <span className="text-xs font-medium text-slate-500">{row.generic}</span>
                      )}
                    </td>

                    {/* Manual */}
                    <td className="py-4 px-6 text-center">
                      {typeof row.manual === 'boolean' ? (
                        row.manual ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )
                      ) : (
                        <span className="text-xs font-medium text-slate-500">{row.manual}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
