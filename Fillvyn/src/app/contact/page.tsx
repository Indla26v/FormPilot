import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import { ArrowLeft, Mail, MessageSquare, ShieldCheck, Cpu } from 'lucide-react';

export const metadata = {
  title: 'Contact Engineering & Support - Fillvyn',
  description: 'Get in touch with the Fillvyn team for technical support, Ollama integration inquiries, or feedback.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      {/* Top Banner Section */}
      <section className="relative pt-32 pb-12 md:pt-36 md:pb-16 overflow-hidden bg-slate-900 text-white">
        {/* Nanobanana Mesh Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <Image
            src="/images/bg-contact.jpg"
            alt="Contact Luminous Mesh Background"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-slate-950"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-4 py-2 rounded-full border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-950 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-800">
              <Mail className="w-3.5 h-3.5" />
              <span>Support & Engineering Inquiries</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Contact Fillvyn Support
            </h1>
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
              Whether you need help configuring local Ollama models on Windows/macOS/Linux or have suggestions for new form automation features, we are here for you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section Form Component */}
      <div className="flex-1">
        <ContactSection />
      </div>

      <Footer />
    </main>
  );
}
