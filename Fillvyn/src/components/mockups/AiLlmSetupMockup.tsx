'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Cloud, 
  CheckCircle2, 
  Terminal, 
  RefreshCw,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export default function AiLlmSetupMockup() {
  const [provider, setProvider] = useState<'ollama' | 'gemini' | 'openai' | 'claude'>('ollama');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedModel, setDetectedModel] = useState('llama3.2:latest');

  const handleDetect = () => {
    setIsDetecting(true);
    setTimeout(() => {
      setIsDetecting(false);
      setDetectedModel('llama3.2:latest (Ready)');
    }, 800);
  };

  return (
    <div className="w-full h-full min-h-[380px] bg-slate-950 rounded-2xl text-white p-4 sm:p-5 flex flex-col justify-between border border-slate-800 text-xs select-none space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
            <span>AI & Local LLM Setup</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-medium">
              Multi-Engine Hybrid
            </span>
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Connect to local Ollama (100% free & offline) or Google Gemini / OpenAI / Anthropic cloud APIs
          </p>
        </div>
      </div>

      {/* Provider Selector Grid */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Provider Configuration</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          
          {/* Ollama */}
          <button
            onClick={() => setProvider('ollama')}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              provider === 'ollama'
                ? 'border-emerald-500 bg-emerald-950/40 shadow-xs'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-100 text-[11px]">Ollama</span>
              <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono">100% FREE</span>
            </div>
            <div className="text-[10px] text-slate-400">Local Offline</div>
          </button>

          {/* Gemini */}
          <button
            onClick={() => setProvider('gemini')}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              provider === 'gemini'
                ? 'border-indigo-500 bg-indigo-950/40 shadow-xs'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-100 text-[11px]">Google Gemini</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">CLOUD</span>
            </div>
            <div className="text-[10px] text-slate-400">Flash 1.5</div>
          </button>

          {/* OpenAI */}
          <button
            onClick={() => setProvider('openai')}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              provider === 'openai'
                ? 'border-indigo-500 bg-indigo-950/40 shadow-xs'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-100 text-[11px]">OpenAI</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">CLOUD</span>
            </div>
            <div className="text-[10px] text-slate-400">GPT-4o-mini</div>
          </button>

          {/* Claude */}
          <button
            onClick={() => setProvider('claude')}
            className={`p-2.5 rounded-2xl border text-left transition-all ${
              provider === 'claude'
                ? 'border-indigo-500 bg-indigo-950/40 shadow-xs'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-100 text-[11px]">Claude</span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">CLOUD</span>
            </div>
            <div className="text-[10px] text-slate-400">3.5 Sonnet</div>
          </button>

        </div>
      </div>

      {/* Ollama Settings / Cloud Settings Card */}
      <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="text-[11px] font-bold text-slate-200">
          {provider === 'ollama' ? 'Ollama Settings (Local Offline)' : 'Cloud API Configuration'}
        </div>

        {provider === 'ollama' ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Ollama Endpoint URL</label>
              <input
                type="text"
                readOnly
                value="http://localhost:11434"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 text-[11px] font-mono"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-slate-400 block mb-1">Local Model Detected</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-emerald-400 font-mono text-[11px] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{detectedModel}</span>
                </div>
              </div>

              <button
                onClick={handleDetect}
                disabled={isDetecting}
                className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>Detect Models</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">API Key (Stored only in local storage)</label>
              <input
                type="password"
                readOnly
                value="sk-ant-api03-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 text-[11px] font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Security Guarantee */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>No server telemetry. API keys & knowledge base remain strictly on your machine.</span>
      </div>

    </div>
  );
}
