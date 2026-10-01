import React from "react";
import ChatMessage from "./ChatMessage.jsx";
import { IconZap } from "./Icons.jsx";

export default function ChatWindow({ messages, loading, onOpenPdf, onFeedback }) {
  return (
    <div className="chat-container">
      {messages.length === 0 && (
        <div className="clay-card p-8 text-center my-8 border border-white/10 space-y-3 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-bold mx-auto shadow-md">
            ⚡
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">DocuMind RAG Assistant</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Upload your PDFs or select existing indexed documents to ask complex queries, extract citations, or perform multi-document comparisons.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              FAISS Dense Vector
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              BM25 Keyword Search
            </span>
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Cross-Encoder Reranker
            </span>
          </div>
        </div>
      )}

      {messages.map((msg, idx) => (
        <ChatMessage
          key={idx}
          message={msg}
          onOpenPdf={onOpenPdf}
          onFeedback={onFeedback}
        />
      ))}

      {loading && (
        <div className="chat-card-assistant mb-4 animate-pulse">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-3">
            <IconZap className="w-4 h-4 animate-bounce text-amber-400" />
            <span>Retrieving candidates & cross-encoder reranking...</span>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-800/60 rounded-full w-full" />
            <div className="h-3 bg-gray-800/60 rounded-full w-5/6" />
            <div className="h-3 bg-gray-800/60 rounded-full w-2/3" />
          </div>
        </div>
      )}
    </div>
  );
}
