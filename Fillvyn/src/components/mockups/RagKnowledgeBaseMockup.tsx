'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Github, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function RagKnowledgeBaseMockup() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/alex-morgan-dev/ai-voice-agent-pipeline');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingested, setIngested] = useState(true);

  const handleIngest = () => {
    setIsIngesting(true);
    setTimeout(() => {
      setIsIngesting(false);
      setIngested(true);
    }, 1200);
  };

  return (
    <div className="w-full h-full min-h-[380px] bg-slate-950 rounded-2xl text-white p-4 sm:p-5 flex flex-col justify-between border border-slate-800 text-xs select-none space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
            <span>Knowledge Base (RAG)</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.5 rounded-full font-medium">
              Client-Side Vector Index
            </span>
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Upload resume and GitHub project READMEs to auto-synthesize factual answers for open-ended questions
          </p>
        </div>
      </div>

      {/* Upload Resume Dropzone */}
      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 text-center space-y-1.5 transition-colors cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-indigo-950/80 text-indigo-400 flex items-center justify-center mx-auto">
          <UploadCloud className="w-4 h-4" />
        </div>
        <div className="text-xs font-semibold text-slate-200">
          Click to browse or drag & drop your Resume
        </div>
        <p className="text-[10px] text-slate-500">
          Supports PDF, Markdown (.md), Plain Text (.txt), and Word Docs
        </p>
      </div>

      {/* GitHub Repository Ingest Form */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5 text-slate-300" />
            <span>Ingest GitHub Repository README</span>
          </div>
          <span className="text-[10px] text-indigo-400">1-Click Fast Ingestion</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-[11px] font-mono"
            placeholder="e.g. https://github.com/username/project"
          />
          <button
            onClick={handleIngest}
            disabled={isIngesting}
            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all"
          >
            {isIngesting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Ingesting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Fetch & Ingest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ingested Documents List */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>Ingested Knowledge Base Documents (2 Active)</span>
          <button className="text-rose-400 hover:text-rose-300">Clear All</button>
        </div>

        <div className="space-y-1.5">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <div>
                <div className="text-[11px] font-semibold text-slate-200">Alex_Morgan_Resume_2026.pdf</div>
                <div className="text-[10px] text-slate-500">14 semantic chunks • 1,420 tokens</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Indexed</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-3.5 h-3.5 text-slate-300" />
              <div>
                <div className="text-[11px] font-semibold text-slate-200">ai-voice-agent-pipeline / README.md</div>
                <div className="text-[10px] text-slate-500">8 semantic chunks • 890 tokens</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Indexed</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
