'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Clock,
  ShieldCheck,
  Cpu,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { ContactCategory, ContactPayload } from '@/lib/contact/types';

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactPayload>({
    name: '',
    email: '',
    category: 'technical_support',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successResult, setSuccessResult] = useState<{
    referenceId: string;
    message: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('fillvyn.support@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessResult({
          referenceId: data.referenceId || 'FLV-SUPPORT',
          message: data.message,
        });
        setFormData({
          name: '',
          email: '',
          category: 'technical_support',
          subject: '',
          message: '',
        });
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ form: data.message || 'Failed to submit message. Please try again.' });
      }
    } catch (err) {
      setErrors({ form: 'Network error. Please check your connection or contact us directly via email.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* Main Single Luminous Section */}
      <section className="relative pt-28 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-white flex-1">
        {/* Nanobanana Mesh Background with Luminous Light Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90">
          <Image
            src="/images/bg-contact.jpg"
            alt="Contact Luminous Mesh Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
        </div>

        {/* Ambient Radial Glowing Light */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-200/40 via-indigo-200/30 to-blue-200/40 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
          
          {/* Top Bar with Back Button to the Left */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white/90 hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-xs transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Compact Header */}
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Direct Support & Inquiries</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Contact Fillvyn Support
            </h1>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl">
              Connect directly with the engineering team for assistance with local Ollama setup, custom JD parsing, or enterprise deployments.
            </p>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Direct Info Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-7 text-white border border-slate-800 shadow-2xl space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Developer Support</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Direct Communication</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Connect directly with the engineers building Fillvyn. We actively assist with local LLM hardware setups and custom form parsing.
                  </p>
                </div>

                {/* Email Box with 1-Click Copy */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[11px] text-slate-400 block font-medium">Official Support Email</span>
                      <span className="text-xs sm:text-sm font-mono font-semibold text-slate-200 truncate block">
                        fillvyn.support@gmail.com
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0"
                    title="Copy email to clipboard"
                  >
                    {copiedEmail ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Highlights */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Average response time within 24 hours</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <span>Specialized assistance for Ollama & CUDA hardware</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-7 h-7 rounded-full bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>100% confidential. No spam or commercial newsletters</span>
                  </div>
                </div>
              </div>

              {/* Quick Links Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Self-Service Resources</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="/#quickstart"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Ollama Setup Guide</span>
                  </a>
                  <a
                    href="/#faq"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Frequently Asked Questions</span>
                  </a>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Privacy Policy</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-7 sm:p-10 border border-slate-200 shadow-xl space-y-6">
                
                {successResult ? (
                  <div className="py-8 text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-extrabold text-slate-900">Message Delivered Successfully</h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        {successResult.message}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                      <span>Reference ID:</span>
                      <strong className="text-indigo-600">{successResult.referenceId}</strong>
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => setSuccessResult(null)}
                        className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <span>Send an Inquiry</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Fill out the form below and our team will get back to you promptly.
                      </p>
                    </div>

                    {errors.form && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errors.form}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Alex Morgan"
                          required
                          className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                            errors.name ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                          }`}
                        />
                        {errors.name && (
                          <p className="text-[11px] text-rose-600">{errors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="alex.morgan@example.com"
                          required
                          className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                            errors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                          }`}
                        />
                        {errors.email && (
                          <p className="text-[11px] text-rose-600">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Category & Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        >
                          <option value="technical_support">Technical Support</option>
                          <option value="ollama_integration">Ollama / Local LLM Integration</option>
                          <option value="feature_request">Feature Request</option>
                          <option value="bug_report">Bug Report</option>
                          <option value="general_inquiry">General Inquiry</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="e.g. Question on Ollama CORS configuration"
                          required
                          className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                            errors.subject ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                          }`}
                        />
                        {errors.subject && (
                          <p className="text-[11px] text-rose-600">{errors.subject}</p>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Describe your question, request, or issue with as much detail as possible..."
                        required
                        className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                          errors.message ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {errors.message && (
                        <p className="text-[11px] text-rose-600">{errors.message}</p>
                      )}
                    </div>

                    {/* Submit Button (Pill-shaped, Modern Clean UI) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:pointer-events-none rounded-full shadow-lg shadow-indigo-600/25 transition-all"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Transmitting Message...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
