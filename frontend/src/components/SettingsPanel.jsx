import React, { useState } from "react";
import {
  IconSettings,
  IconCpu,
  IconSearch,
  IconZap,
  IconShield,
  IconCheckCircle
} from "./Icons.jsx";

export default function SettingsPanel() {
  const [activeTab, setActiveTab] = useState("llm");
  const [saved, setSaved] = useState(false);

  // Settings State
  const [model, setModel] = useState("gemini-1.5-flash");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(1500);

  const [topK, setTopK] = useState(20);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);

  const [rerankEnabled, setRerankEnabled] = useState(true);
  const [rerankerModel, setRerankerModel] = useState("bge-reranker-large");
  const [topN, setTopN] = useState(5);

  const [systemPrompt, setSystemPrompt] = useState(
    "You are DocuMind RAG, an expert AI research assistant. Answer questions strictly based on the provided document contexts with concise citations."
  );
  const [piiRedaction, setPiiRedaction] = useState(true);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tabs = [
    { id: "llm", label: "LLM Provider", icon: IconCpu },
    { id: "retrieval", label: "Retrieval & Vector", icon: IconSearch },
    { id: "reranking", label: "Cross-Encoder Reranking", icon: IconZap },
    { id: "generation", label: "Generation & System Prompt", icon: IconSettings },
    { id: "security", label: "Security & RBAC", icon: IconShield }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <IconSettings className="w-5 h-5 text-indigo-600" />
            System Configuration & Parameters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Tune RAG hyper-parameters, vector search thresholds, reranker models, and security policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="clay-button clay-button-primary text-xs py-2 px-4 flex items-center gap-2 font-semibold"
        >
          {saved ? <IconCheckCircle className="w-4 h-4 text-emerald-200" /> : null}
          <span>{saved ? "Saved Parameters" : "Save Changes"}</span>
        </button>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`clay-button text-xs py-2 px-3 flex items-center gap-2 flex-shrink-0 font-semibold ${
                isActive ? "clay-button-primary" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Tab Body */}
      <div className="clay-card p-6 border border-slate-200 space-y-6">
        {activeTab === "llm" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                LLM Provider Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="clay-input py-2 px-3 text-xs bg-white"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Fast & Cost Effective)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
                <option value="gpt-4o">OpenAI GPT-4o Enterprise</option>
                <option value="local-llama3">Local Ollama / Llama-3-8B</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Temperature ({temperature})</span>
                <span className="text-indigo-600">Deterministic RAG (0.0–0.3 recommended)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Max Token Limit
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="clay-input py-2 px-3 text-xs"
              />
            </div>
          </div>
        )}

        {activeTab === "retrieval" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Top K Vector Retrieval Cutoff ({topK})
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chunk Size (Tokens)
                </label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value))}
                  className="clay-input py-2 px-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chunk Overlap (Tokens)
                </label>
                <input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                  className="clay-input py-2 px-3 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "reranking" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Enable Cross-Encoder Reranking</span>
                <span className="text-[11px] text-slate-500 font-medium">Re-scores candidates using cross-attention model.</span>
              </div>
              <input
                type="checkbox"
                checked={rerankEnabled}
                onChange={(e) => setRerankEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reranker Model
              </label>
              <select
                value={rerankerModel}
                onChange={(e) => setRerankerModel(e.target.value)}
                className="clay-input py-2 px-3 text-xs bg-white"
              >
                <option value="bge-reranker-large">BAAI/bge-reranker-large (State of the Art)</option>
                <option value="ms-marco-MiniLM">ms-marco-MiniLM-L-6-v2</option>
                <option value="cohere-rerank-v3">Cohere Rerank v3 API</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Final Reranked Top N Chunks ({topN})
              </label>
              <input
                type="number"
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value))}
                className="clay-input py-2 px-3 text-xs"
              />
            </div>
          </div>
        )}

        {activeTab === "generation" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                System Prompt Template
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="clay-input py-2 px-3 text-xs font-mono leading-relaxed"
              />
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-900 block">PII & Privacy Protection Module</span>
                <span className="text-[11px] text-slate-500 font-medium">Automatically redacts emails, phones, SSN before LLM prompt submission.</span>
              </div>
              <input
                type="checkbox"
                checked={piiRedaction}
                onChange={(e) => setPiiRedaction(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                Role-Based Access Control (RBAC)
              </span>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>User Role:</span>
                <span className="font-bold text-emerald-700">Admin (Full Access)</span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>API Key Status:</span>
                <span className="font-mono text-indigo-700 font-semibold">ak_live_documind_***984</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
