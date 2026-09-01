'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { SITE_CONFIG } from '../config/site';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      {/* Stretched container reaching closer to ends */}
      <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-indigo-500/10 group-hover:scale-105 transition-transform border border-slate-200/80 bg-white p-1 flex items-center justify-center">
              <Image
                src="/images/fillvyn-logo.png"
                alt="Fillvyn App Logo"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Fillvyn
              </span>
              <p className="text-[11px] text-slate-500 font-medium leading-none">Google & Microsoft Forms</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Home
            </Link>
            <a
              href="/#interactive-demo"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Live Demo
            </a>
            <a
              href="/#features"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Features
            </a>
            <a
              href="/#quickstart"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Setup Guide
            </a>
            <a
              href="/#faq"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              FAQ
            </a>
            <Link
              href="/feedback"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Feedback
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* CTA Buttons (Pill-shaped, Clean UI) */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="/#quickstart"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100/90 hover:bg-slate-200 border border-slate-200 rounded-full transition-all"
            >
              <Terminal className="w-4 h-4 text-slate-600" />
              <span>Ollama Docs</span>
            </a>
            <a
              href={SITE_CONFIG.chromeExtensionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-500/20 rounded-full transition-all"
            >
              <span>Get Extension</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1">
                <span className={`block h-0.5 bg-slate-800 rounded-full transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                <span className={`block h-0.5 bg-slate-800 rounded-full transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 bg-slate-800 rounded-full transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col gap-3">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Home
            </Link>
            <a
              href="/#interactive-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Live Demo
            </a>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Features
            </a>
            <a
              href="/#quickstart"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Setup Guide
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              FAQ
            </a>
            <Link
              href="/feedback"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Feedback
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Contact
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              Privacy Policy
            </Link>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={SITE_CONFIG.chromeExtensionUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm"
              >
                Get Extension Free
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
