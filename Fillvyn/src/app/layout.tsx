import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fillvyn — AI Forms Auto-Filler & RAG Assistant',
  description: 'Smart Chrome Extension for Google Forms and Microsoft Forms. Features Local Offline Ollama RAG, Resume & GitHub README synthesis, and clean numeric formatting.',
  keywords: [
    'Fillvyn',
    'Google Forms Autofill',
    'Microsoft Forms Autofill',
    'RAG Chrome Extension',
    'Ollama Local LLM',
    'Job Application Autofill',
    'Resume RAG Assistant',
    'Form Filler',
  ],
  authors: [{ name: 'Fillvyn Engineering' }],
  icons: {
    icon: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-slate-900 antialiased min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
