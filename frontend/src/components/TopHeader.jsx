import React from "react";
import { IconSettings, IconExternalLink } from "./Icons.jsx";

export default function TopHeader({
  documentCount = 0,
  activeView,
  setActiveView
}) {
  const viewTitles = {
    chat: "Interactive RAG Playground",
    documents: "Knowledge Document Management",
    collections: "Vector Collections & Indexing",
    analytics: "RAG Observability & Telemetry",
    inspector: "Retrieval Pipeline Inspector",
    settings: "System Configuration & RBAC"
  };

  return (
    <header className="top-header">
      {/* Left Workspace Info */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
              Workspace-Alpha
            </span>
            <span className="text-xs text-slate-300">•</span>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              {viewTitles[activeView] || "Enterprise RAG Workspace"}
            </h2>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5 font-medium">
            <span>Indexed Documents: <strong className="text-slate-800">{documentCount}</strong></span>
            <span>•</span>
            <span>Vector Index: <strong className="text-indigo-600">FAISS + BM25 Hybrid</strong></span>
          </div>
        </div>
      </div>

      {/* Right Header Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Status Indicator */}
        <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 shadow-xs">
          <span className="status-dot-green"></span>
          <span className="text-xs font-bold text-emerald-800">RAG System Online</span>
        </div>

        {/* Admin Link */}
        <a
          href="/api/admin/metrics"
          target="_blank"
          rel="noreferrer"
          className="clay-button py-1.5 px-3 text-xs flex items-center gap-1.5 text-slate-700 hover:text-slate-900"
          title="Open FastAPI Admin JSON Metrics"
        >
          <IconExternalLink className="w-3.5 h-3.5 text-indigo-600" />
          <span>Admin Telemetry</span>
        </a>

        {/* Settings Button */}
        <button
          onClick={() => setActiveView("settings")}
          className={`clay-button p-2 text-slate-700 ${activeView === "settings" ? "clay-button-primary" : ""}`}
          title="Settings"
        >
          <IconSettings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
