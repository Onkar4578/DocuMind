import React from "react";
import { IconX, IconFileText, IconExternalLink, IconZap } from "./Icons.jsx";

export default function SourceDrawer({ pdfViewer, onClose }) {
  if (!pdfViewer) return null;

  return (
    <aside className="source-drawer">
      {/* Drawer Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <IconFileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {pdfViewer.document_name}
            </h3>
            <div className="text-xs text-indigo-600 font-semibold flex items-center gap-2">
              <span>Page {pdfViewer.page_number}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Active Citation Source</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="clay-button p-2 text-slate-500 hover:text-slate-900 rounded-xl"
          title="Close Drawer"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      {/* Citation Snippet & Metadata Box */}
      {pdfViewer.snippet && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <IconZap className="w-3.5 h-3.5 text-amber-500" /> Grounded Context Snippet
            </span>
            <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
              Matched Text
            </span>
          </div>
          <blockquote className="p-3 bg-white border-l-4 border-indigo-600 rounded-r-xl text-slate-700 italic leading-relaxed font-sans shadow-xs">
            "{pdfViewer.snippet}"
          </blockquote>
        </div>
      )}

      {/* PDF Iframe */}
      <div className="flex-1 bg-slate-100 relative">
        <iframe
          key={`${pdfViewer.document_id}-${pdfViewer.page_number}`}
          src={`/api/documents/${pdfViewer.document_id}/pdf#page=${pdfViewer.page_number}`}
          title="PDF Document Viewer"
          className="w-full h-full border-0"
        />
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Target: `/api/documents/${pdfViewer.document_id}/pdf`</span>
        <a
          href={`/api/documents/${pdfViewer.document_id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
        >
          <span>Open Full PDF</span>
          <IconExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
