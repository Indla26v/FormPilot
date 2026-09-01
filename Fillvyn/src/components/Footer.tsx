'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Github, ShieldCheck, Terminal, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-2xl overflow-hidden shadow-md shadow-indigo-600/20 border border-slate-800 bg-white p-1 flex items-center justify-center">
                <Image
                  src="/images/fillvyn-logo.png"
                  alt="Fillvyn App Logo"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Fillvyn</span>
              <span className="text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
                Forms Auto-Filler
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              The intelligent AI browser assistant for candidates and developers. Fills Google & Microsoft Forms with grounded answers from your Resume and GitHub READMEs via local Ollama or cloud models.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>100% Free & Offline Capable</span>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Navigation</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="/" className="hover:text-indigo-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/#interactive-demo" className="hover:text-indigo-400 transition-colors">
                  Live Demo
                </a>
              </li>
              <li>
                <a href="/#features" className="hover:text-indigo-400 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#quickstart" className="hover:text-indigo-400 transition-colors">
                  Setup Guide
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-indigo-400 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/feedback" className="hover:text-indigo-400 transition-colors">
                  Feedback
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-indigo-400 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-indigo-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Shortcut & Tech Stack */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Shortcut</h4>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Trigger In-Page Autofill</span>
                <span className="font-mono text-xs font-bold bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700">
                  Alt + Shift + F
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Works instantly across all Google Forms and Microsoft Forms without opening extension popups.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div>
            &copy; {new Date().getFullYear()} Fillvyn. Built with Next.js & Manifest V3.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AES-GCM-256 Encrypted Backups</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Local Ollama Ready</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
