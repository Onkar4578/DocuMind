import React, { useState } from "react";
import { IconFileText, IconEye } from "./Icons.jsx";

export default function CitationCard({ citation, onOpenPdf }) {
  const [expanded, setExpanded] = useState(false);

  const rawScore = citation.score ?? 0;
  const percentage = rawScore <= 1 ? (rawScore * 100).toFixed(1) : rawScore.toFixed(1);

  function handleOpen(e) {
    e.stopPropagation();
    if (onOpenPdf && citation.document_id) {
      onOpenPdf(citation.document_id, citation.page_number, citation.document_name, citation.snippet);
    }
  }

  return (
    <div className="clay-card p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all duration-200 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        {/* Document Info */}
        <div className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1" onClick={handleOpen}>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <IconFileText className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate hover:text-indigo-600 transition">
              {citation.document_name}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 font-medium">
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                Page {citation.page_number}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">
                Relevance: {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition text-[11px] font-semibold"
            title="Toggle snippet preview"
          >
            {expanded ? "Hide" : "Snippet"}
          </button>

          <button
            onClick={handleOpen}
            className="clay-button py-1 px-2.5 text-[11px] bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 flex items-center gap-1 font-semibold"
            title="Open Document in Side Drawer"
          >
            <IconEye className="w-3 h-3" />
            <span>View PDF</span>
          </button>
        </div>
      </div>

      {/* Snippet Preview */}
      {expanded && citation.snippet && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono leading-relaxed shadow-inner">
          <div className="text-[10px] text-indigo-700 font-sans font-bold uppercase mb-1 flex items-center justify-between">
            <span>Retrieved Chunk Snippet</span>
            {citation.chunk_id && <span className="text-slate-400">Chunk #{citation.chunk_id}</span>}
          </div>
          <p className="line-clamp-4">"{citation.snippet}"</p>
        </div>
      )}
    </div>
  );
}
