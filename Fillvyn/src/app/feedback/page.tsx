'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  ArrowLeft,
  Star,
  MessageSquareHeart,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  UserCheck,
  Award,
} from 'lucide-react';
import { FeedbackCategory, UserPersona, FeedbackPayload } from '@/lib/feedback/types';

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: 'feature_request', label: 'Feature Request' },
  { id: 'accuracy_quality', label: 'Form Accuracy' },
  { id: 'ui_ux_design', label: 'UI & Usability' },
  { id: 'ollama_speed', label: 'Ollama & Speed' },
  { id: 'general_experience', label: 'General Experience' },
];

const PERSONAS: { id: UserPersona; label: string }[] = [
  { id: 'job_seeker', label: 'Job Seeker' },
  { id: 'software_engineer', label: 'Software Engineer' },
  { id: 'recruiter', label: 'Recruiter / Talent' },
  { id: 'student', label: 'Student / Graduate' },
  { id: 'other', label: 'Other Role' },
];

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Exceptional'];

export default function FeedbackPage() {
  const [formData, setFormData] = useState<FeedbackPayload>({
    rating: 5,
    category: 'feature_request',
    persona: 'software_engineer',
    feedbackText: '',
    npsScore: 10,
    email: '',
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successResult, setSuccessResult] = useState<{
    feedbackId: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessResult({
          feedbackId: data.feedbackId || 'FDB-CONFIRMED',
          message: data.message,
        });
        setFormData({
          rating: 5,
          category: 'feature_request',
          persona: 'software_engineer',
          feedbackText: '',
          npsScore: 10,
          email: '',
        });
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors({ form: data.message || 'Failed to submit feedback.' });
      }
    } catch (err) {
      setErrors({ form: 'Network error. Please try submitting again.' });
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
            src="/images/bg-feedback.jpg"
            alt="Feedback Luminous Mesh Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/40 to-white"></div>
        </div>

        {/* Ambient Radial Glowing Light */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-200/40 via-teal-200/30 to-indigo-200/40 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-6 sm:px-10 lg:px-12">
          
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

          {/* Compact Single Header */}
          <div className="mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <MessageSquareHeart className="w-3.5 h-3.5 text-emerald-600" />
              <span>Community Feedback</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Help Us Improve Fillvyn
            </h1>
            <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl">
              Your feedback directly guides our engineering roadmap, local model support, and Google/Microsoft Form autofill precision.
            </p>
          </div>

          {/* Feedback Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
            
            {successResult ? (
              <div className="py-10 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-900">Feedback Submitted</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {successResult.message}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                  <span>Reference ID:</span>
                  <strong className="text-emerald-700">{successResult.feedbackId}</strong>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSuccessResult(null)}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    Submit Additional Feedback
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                
                {errors.form && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                )}

                {/* 1. Star Rating Selector */}
                <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    1. Overall Experience Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = (hoverRating !== null ? hoverRating : formData.rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 rounded-full hover:scale-110 active:scale-95 transition-transform"
                            aria-label={`Rate ${star} out of 5 stars`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shadow-xs">
                      {RATING_LABELS[(hoverRating !== null ? hoverRating : formData.rating) - 1]}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="text-[11px] text-rose-600">{errors.rating}</p>
                  )}
                </div>

                {/* 2. Category Selection (Pill Buttons) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Select Feedback Category <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = formData.category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-[1.02]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="text-[11px] text-rose-600">{errors.category}</p>
                  )}
                </div>

                {/* 3. User Persona / Role Selection (Pill Buttons) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>3. Your Primary Role <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PERSONAS.map((p) => {
                      const isSelected = formData.persona === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, persona: p.id }))}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.persona && (
                    <p className="text-[11px] text-rose-600">{errors.persona}</p>
                  )}
                </div>

                {/* 4. Feedback Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      4. Your Detailed Feedback <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formData.feedbackText.length}/4000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.feedbackText}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, feedbackText: e.target.value }));
                      if (errors.feedbackText) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.feedbackText;
                          return next;
                        });
                      }
                    }}
                    placeholder="Share your thoughts on what works great, any bugs you encountered, or features you'd like to see next..."
                    required
                    className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                      errors.feedbackText ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  {errors.feedbackText && (
                    <p className="text-[11px] text-rose-600">{errors.feedbackText}</p>
                  )}
                </div>

                {/* 5. Likelihood to Recommend (NPS 0-10 Scale) */}
                <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>5. Likelihood to recommend Fillvyn to a peer?</span>
                    </label>
                    <span className="text-xs font-bold text-indigo-700">
                      {formData.npsScore} / 10
                    </span>
                  </div>
                  <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected = formData.npsScore === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, npsScore: score }))}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm scale-105'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                    <span>0 - Not likely</span>
                    <span>10 - Extremely likely</span>
                  </div>
                </div>

                {/* 6. Optional Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    6. Follow-up Email <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    placeholder="name@example.com (if you'd like our engineers to follow up)"
                    className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                      errors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-[11px] text-rose-600">{errors.email}</p>
                  )}
                </div>

                {/* Submit Button (Pill-shaped, Modern Clean UI) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-60 disabled:pointer-events-none rounded-full shadow-lg shadow-indigo-600/25 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting Feedback...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Community Feedback</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
