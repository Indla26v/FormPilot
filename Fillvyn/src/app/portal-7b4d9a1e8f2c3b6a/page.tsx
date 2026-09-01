'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  ShieldAlert,
  Star,
  Download,
  RefreshCw,
  Search,
  MessageSquareHeart,
  Mail,
  Sliders,
  Sparkles,
  Award,
  Clock,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { StoredFeedback, StoredContact, FeedbackSummaryKPIs } from '@/lib/storage/types';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'feedback' | 'contact'>('feedback');

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<StoredFeedback[]>([]);
  const [feedbackKPIs, setFeedbackKPIs] = useState<FeedbackSummaryKPIs | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState<boolean>(false);

  // Contact State
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [contactLoading, setContactLoading] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [personaFilter, setPersonaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check existing session token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fillvyn_admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('fillvyn_admin_token', data.token);
        setIsAuthenticated(true);
        setPasskeyInput('');
      } else {
        setAuthError(data.message || 'Invalid admin passkey.');
      }
    } catch {
      setAuthError('Authentication network error. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fillvyn_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // Fetch Feedback
  const fetchFeedbacks = useCallback(async () => {
    if (!token) return;
    setFeedbackLoading(true);
    try {
      const params = new URLSearchParams();
      if (ratingFilter > 0) params.append('rating', ratingFilter.toString());
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (personaFilter !== 'all') params.append('persona', personaFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/feedback?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.data || []);
        if (data.kpis) setFeedbackKPIs(data.kpis);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setFeedbackLoading(false);
    }
  }, [token, ratingFilter, categoryFilter, personaFilter, statusFilter, searchQuery]);

  // Fetch Contact Messages
  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setContactLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/contact?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (data.success) {
        setContacts(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setContactLoading(false);
    }
  }, [token, categoryFilter, statusFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'feedback') {
        fetchFeedbacks();
      } else {
        fetchContacts();
      }
    }
  }, [isAuthenticated, activeTab, fetchFeedbacks, fetchContacts]);

  // Update Status
  const handleUpdateFeedbackStatus = async (id: string, newStatus: StoredFeedback['status']) => {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdateContactStatus = async (id: string, newStatus: StoredContact['status']) => {
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setContacts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update contact status:', err);
    }
  };

  // Delete Feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this feedback entry?')) return;
    try {
      const res = await fetch(`/api/admin/feedback?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (activeTab === 'feedback') {
      const headers = ['ID', 'Rating', 'Category', 'Persona', 'NPS', 'Email', 'Status', 'Timestamp', 'Feedback'];
      const rows = feedbacks.map((f) => [
        f.id,
        f.rating,
        f.category,
        f.persona,
        f.npsScore ?? '',
        f.email ?? '',
        f.status,
        f.timestamp,
        `"${f.feedbackText.replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fillvyn_feedback_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['ID', 'Name', 'Email', 'Category', 'Subject', 'Status', 'Timestamp', 'Message'];
      const rows = contacts.map((c) => [
        c.id,
        `"${c.name.replace(/"/g, '""')}"`,
        c.email,
        c.category,
        `"${c.subject.replace(/"/g, '""')}"`,
        c.status,
        c.timestamp,
        `"${c.message.replace(/"/g, '""')}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `fillvyn_contacts_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If not authenticated, render standalone Light-Themed Admin Passkey Login Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center px-4 relative overflow-hidden">
        {/* Luminous Cyber Mesh Background with Light Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-80">
          <Image
            src="/images/bg-admin.jpg"
            alt="Admin Luminous Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/60 to-white/95"></div>
        </div>

        {/* Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-200/40 via-cyan-200/30 to-purple-200/40 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Fillvyn Admin Console
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Private portal for reviewing user feedbacks and engineering inquiries.
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Admin Passkey
              </label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter security passkey..."
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Protected Gateway</span>
            <Link href="/" className="hover:text-indigo-700 text-indigo-600 font-semibold transition-colors">
              Return to Website
            </Link>
          </div>

        </div>
      </main>
    );
  }

  // Authenticated Light-Themed Admin Dashboard View
  return (
    <main className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col relative overflow-hidden">
      {/* Background Luminous Nanobanana Mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70 fixed">
        <Image
          src="/images/bg-admin.jpg"
          alt="Admin Luminous Background"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-slate-50/50 to-slate-50/95"></div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 shadow-xs">
        <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-14 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Fillvyn Admin Console</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
              <p className="text-[11px] text-slate-500">Live Inquiries & Feedback Stream</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => (activeTab === 'feedback' ? fetchFeedbacks() : fetchContacts())}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs rounded-full transition-all"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(feedbackLoading || contactLoading) ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Console</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 max-w-[1700px] w-full mx-auto px-6 sm:px-10 lg:px-14 py-8 space-y-8">
        
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Total Feedback */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Feedback</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <MessageSquareHeart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {feedbackKPIs?.total || feedbacks.length}
            </div>
            <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>User community ratings</span>
            </div>
          </div>

          {/* Card 2: Average Rating */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Average Star Rating</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
              <span>{feedbackKPIs?.averageRating ?? '4.8'}</span>
              <span className="text-sm font-normal text-slate-500">/ 5.0</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Across all recorded ratings
            </div>
          </div>

          {/* Card 3: Net Promoter Score (NPS) */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Net Promoter Score (NPS)</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-indigo-600">
              +{feedbackKPIs?.npsScore ?? 100}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium">
              Industry leading satisfaction
            </div>
          </div>

          {/* Card 4: Total Contact Inquiries */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Contact Messages</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {contacts.length}
            </div>
            <div className="text-[11px] text-cyan-600 font-medium">
              Engineering & support inquiries
            </div>
          </div>

        </div>

        {/* Tab Selector & Controls Bar */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Pill Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200 w-full sm:w-auto">
              <button
                onClick={() => {
                  setActiveTab('feedback');
                  setRatingFilter(0);
                  setCategoryFilter('all');
                  setPersonaFilter('all');
                  setStatusFilter('all');
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  activeTab === 'feedback'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquareHeart className="w-4 h-4" />
                <span>User Feedbacks ({feedbacks.length})</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('contact');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial ${
                  activeTab === 'contact'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Contact Inquiries ({contacts.length})</span>
              </button>
            </div>

            {/* Search Input Field */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedback, email, ID..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

          </div>

          {/* Filter Chips Bar (Pill Shaped) */}
          {activeTab === 'feedback' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                <span>Rating:</span>
              </span>
              {[
                { label: 'All Ratings', value: 0 },
                { label: '5 Stars', value: 5 },
                { label: '4 Stars', value: 4 },
                { label: '3 Stars', value: 3 },
                { label: '2 Stars', value: 2 },
                { label: '1 Star', value: 1 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRatingFilter(r.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    ratingFilter === r.value
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}

              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-4 mr-2">
                Category:
              </span>
              {[
                { label: 'All', value: 'all' },
                { label: 'Feature Request', value: 'feature_request' },
                { label: 'Form Accuracy', value: 'accuracy_quality' },
                { label: 'UI/UX', value: 'ui_ux_design' },
                { label: 'Ollama Speed', value: 'ollama_speed' },
              ].map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategoryFilter(c.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    categoryFilter === c.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Content List: Feedback Cards */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {feedbackLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Loading feedback submissions...</span>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2 shadow-sm">
                <MessageSquareHeart className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Feedback Found</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query or filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {feedbacks.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg shadow-sm flex flex-col justify-between space-y-5 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-amber-600 ml-1">
                            {item.rating}.0
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.persona.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Feedback Body */}
                      <p className="text-sm text-slate-800 leading-relaxed font-normal">
                        &ldquo;{item.feedbackText}&rdquo;
                      </p>

                      {/* NPS Score & Email */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                        {item.npsScore !== undefined && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px]">
                            <span className="text-slate-500 font-medium">NPS:</span>
                            <strong className="text-indigo-600">{item.npsScore} / 10</strong>
                          </div>
                        )}

                        {item.email ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{item.email}</span>
                            <button
                              onClick={() => handleCopy(item.email || '', item.id)}
                              className="text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy email"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Anonymous User</span>
                        )}
                      </div>
                    </div>

                    {/* Footer of Card: Status & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                        <span className="font-mono text-[10px] text-slate-400">({item.id})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateFeedbackStatus(
                              item.id,
                              e.target.value as StoredFeedback['status']
                            )
                          }
                          className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="starred">Starred</option>
                          <option value="archived">Archived</option>
                        </select>

                        <button
                          onClick={() => handleDeleteFeedback(item.id)}
                          className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete Feedback"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content List: Contact Messages */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            {contactLoading ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Loading contact inquiries...</span>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-2 shadow-sm">
                <Mail className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Inquiries Found</h3>
                <p className="text-xs text-slate-500">No contact messages match your search.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 hover:border-indigo-300 shadow-sm space-y-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{item.subject}</h4>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          From: <strong className="text-slate-800">{item.name}</strong> &bull; {item.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject)}`}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Reply via Email</span>
                        </a>

                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleUpdateContactStatus(
                              item.id,
                              e.target.value as StoredContact['status']
                            )
                          }
                          className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-sm text-slate-800 leading-relaxed font-normal">
                      {item.message}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{item.id}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
