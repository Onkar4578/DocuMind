import React, { useState } from "react";
import {
  IconCpu,
  IconSearch,
  IconChevronRight,
  IconFileText
} from "./Icons.jsx";

export default function RetrievalInspector() {
  const [activeQuery, setActiveQuery] = useState("What is my email ID?");
  const [selectedChunkId, setSelectedChunkId] = useState(1);

  const sampleChunks = [
    {
      chunk_id: 1,
      document_name: "Onkar_Virakt_Resume.pdf",
      page_number: 3,
      dense_score: 0.884,
      reranker_score: 0.942,
      preview: "Contact & Email: omkarvirakt11@gmail.com | Phone: +91-9876543210 | Location: Bangalore, India."
    },
    {
      chunk_id: 2,
      document_name: "Onkar_Virakt_Resume.pdf",
      page_number: 1,
      dense_score: 0.762,
      reranker_score: 0.815,
      preview: "Omkar Virakt - Senior Full Stack & AI Systems Engineer. Specializing in Hybrid RAG, FAISS Vector Search..."
    },
    {
      chunk_id: 3,
      document_name: "DocuMind_Architecture_Overview.pdf",
      page_number: 2,
      dense_score: 0.640,
      reranker_score: 0.690,
      preview: "PII protection module automatically redacts email addresses, social security numbers, and phone credentials."
    }
  ];

  const pipelineSteps = [
    { label: "Query", sub: "User Prompt" },
    { label: "Embedding", sub: "all-MiniLM-L6-v2" },
    { label: "Hybrid Search", sub: "FAISS + BM25" },
    { label: "16 Candidates", sub: "Merged RRF" },
    { label: "Reranker", sub: "bge-reranker" },
    { label: "Top 5", sub: "Context Window" },
    { label: "LLM", sub: "Gemini 1.5" },
    { label: "Answer", sub: "Grounded" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <IconCpu className="w-5 h-5 text-indigo-600" />
          Retrieval Pipeline Inspector
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Developer debug view. Inspect reciprocal rank fusion candidates, cross-encoder logits, and chunk context construction.
        </p>
      </div>

      {/* Query Bar */}
      <div className="clay-card p-4 flex items-center gap-3">
        <IconSearch className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-slate-700">Target Query:</span>
        <input
          type="text"
          value={activeQuery}
          onChange={(e) => setActiveQuery(e.target.value)}
          className="clay-input py-1.5 px-3 text-xs font-mono"
        />
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="clay-card p-5 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
          RAG Pipeline Execution Trace
        </h3>

        <div className="flex items-center justify-between overflow-x-auto py-2 gap-2">
          {pipelineSteps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center min-w-[90px] text-center p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 shadow-xs">
                <span className="text-xs font-bold text-indigo-950">{step.label}</span>
                <span className="text-[9px] text-indigo-600 font-semibold mt-0.5">{step.sub}</span>
              </div>
              {idx < pipelineSteps.length - 1 && (
                <IconChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Retrieved Chunks Scoring Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span>Top Candidate Chunks ({sampleChunks.length})</span>
          <span className="text-[10px] text-slate-400 font-mono">Cross-Encoder Sigmoid Normalized</span>
        </h3>

        {sampleChunks.map((chunk) => {
          const isExpanded = selectedChunkId === chunk.chunk_id;
          return (
            <div
              key={chunk.chunk_id}
              onClick={() => setSelectedChunkId(isExpanded ? null : chunk.chunk_id)}
              className={`clay-card p-4 cursor-pointer transition-all duration-200 ${
                isExpanded ? "border-indigo-400 bg-indigo-50/10 shadow-md" : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                    #{chunk.chunk_id}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <IconFileText className="w-3.5 h-3.5 text-indigo-600" />
                      {chunk.document_name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Page {chunk.page_number}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Vector Score</div>
                    <div className="text-slate-700 font-semibold">{chunk.dense_score}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-600">Reranker Score</div>
                    <div className="text-emerald-700 font-bold">
                      {(chunk.reranker_score * 100).toFixed(1)}% Match
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-800 space-y-2 border border-slate-200">
                  <div className="text-[10px] font-sans font-bold text-indigo-700 uppercase">
                    Raw Chunk Text Content
                  </div>
                  <p className="leading-relaxed">"{chunk.preview}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
