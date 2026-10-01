import React from "react";
import CitationCard from "./CitationCard.jsx";
import { IconThumbsUp, IconThumbsDown, IconZap, IconCheckCircle, IconLayers } from "./Icons.jsx";

function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");

  return (
    <div className="formatted-markdown">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-3" />;

        // Parse Bold markdown **text**
        const parts = line.split(/(\*\*.*?\*\*)/g);
        const renderedParts = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
              <div className="flex-1 text-slate-700 font-normal leading-relaxed">{renderedParts}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="mb-2 leading-relaxed text-slate-700 font-normal">
            {renderedParts}
          </p>
        );
      })}
    </div>
  );
}

function StatsBar({ stats }) {
  if (!stats) return null;
  const groundedness =
    stats.groundedness != null ? `${(stats.groundedness * 100).toFixed(0)}%` : null;
  const topScore =
    stats.top_relevance_score != null
      ? `${(stats.top_relevance_score * 100).toFixed(1)}%`
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
      {stats.cache_hit && (
        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 flex items-center gap-1 shadow-xs">
          <IconZap className="w-3 h-3 text-amber-500" /> Cache Hit
        </span>
      )}
      {topScore && (
        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1">
          🎯 Top Match: {topScore}
        </span>
      )}
      {groundedness && (
        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100 flex items-center gap-1">
          📌 Grounded: {groundedness}
        </span>
      )}
      {stats.query_route === "comparative" && (
        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
          <IconLayers className="w-3 h-3 text-amber-600" /> Comparative Route
        </span>
      )}

      <div className="ml-auto text-[11px] text-slate-500 flex items-center gap-3 font-medium">
        <span>Candidates: {stats.merged_candidates || 16}</span>
        <span>•</span>
        <span>Reranked: {stats.reranked || 5}</span>
        {stats.response_time_ms && (
          <>
            <span>•</span>
            <span className="font-mono text-slate-700 font-semibold">{stats.response_time_ms}ms</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ChatMessage({ message, onOpenPdf, onFeedback }) {
  const isUser = message.role === "user";
  const timestamp = message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 mb-2">
        <div className="chat-bubble-user">
          <div className="text-sm font-sans">{message.content}</div>
        </div>
        <span className="text-[10px] text-slate-400 mr-2 font-medium">{timestamp}</span>
      </div>
    );
  }

  return (
    <div className="chat-card-assistant mb-4">
      {/* Assistant Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            ⚡
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 tracking-wide">DocuMind AI</span>
            <span className="text-[10px] text-indigo-600 ml-2 font-mono font-semibold">bge-reranker-large</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">{timestamp}</span>
      </div>

      {/* Answer Content */}
      <FormattedText text={message.content} />

      {/* Sources Citations Section */}
      {message.citations && message.citations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <IconCheckCircle className="w-4 h-4 text-emerald-600" />
              Verified Citations ({message.citations.length})
            </span>
            <span className="text-[10px] text-slate-400 font-medium normal-case">Click citation to inspect PDF</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {message.citations.map((c, idx) => (
              <CitationCard
                key={idx}
                citation={c}
                index={idx}
                onOpenPdf={onOpenPdf}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <StatsBar stats={message.stats} />

      {/* Feedback Bar */}
      {message.logId && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Was this response helpful and grounded?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFeedback(message.logId, 1)}
              className="clay-button py-1 px-2.5 text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1"
              title="Helpful response"
            >
              <IconThumbsUp className="w-3.5 h-3.5" />
              <span>Yes</span>
            </button>
            <button
              onClick={() => onFeedback(message.logId, -1)}
              className="clay-button py-1 px-2.5 text-xs text-slate-600 hover:text-rose-700 flex items-center gap-1"
              title="Not helpful"
            >
              <IconThumbsDown className="w-3.5 h-3.5" />
              <span>No</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
