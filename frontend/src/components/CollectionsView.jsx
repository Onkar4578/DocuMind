import React from "react";
import { IconLayers, IconDatabase, IconPlus, IconCheckCircle } from "./Icons.jsx";

export default function CollectionsView({ documents = [] }) {
  const collections = [
    {
      id: "col1",
      name: "Resumes & HR Candidates",
      description: "PDF Resumes and candidate profile documents",
      count: documents.length || 2,
      dimension: "384-d (all-MiniLM-L6-v2)",
      metric: "Cosine Distance",
      updated: "10m ago"
    },
    {
      id: "col2",
      name: "Enterprise Architecture Specs",
      description: "Technical architecture specifications and documentation",
      count: 4,
      dimension: "384-d (all-MiniLM-L6-v2)",
      metric: "Cosine Distance",
      updated: "2h ago"
    },
    {
      id: "col3",
      name: "Legal & Compliance Knowledge",
      description: "Contract agreements, privacy terms, and security policies",
      count: 12,
      dimension: "384-d (all-MiniLM-L6-v2)",
      metric: "Cosine Distance",
      updated: "1d ago"
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <IconLayers className="w-5 h-5 text-indigo-600" />
            Vector Collections & FAISS Indices
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Organize vector spaces into isolated domain collections with custom distance metrics and index schemas.
          </p>
        </div>

        <button className="clay-button clay-button-primary text-xs py-2 px-4 flex items-center gap-2 font-semibold">
          <IconPlus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div key={col.id} className="clay-card p-5 border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <IconDatabase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <IconCheckCircle className="w-3 h-3 text-emerald-600" /> FAISS Active
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{col.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{col.description}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Documents:</span>
                <span className="text-slate-900 font-bold">{col.count} files</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Embedding:</span>
                <span className="text-indigo-700 font-semibold">{col.dimension}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Distance:</span>
                <span className="text-slate-800">{col.metric}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Updated {col.updated}</span>
              <button className="text-indigo-600 hover:underline font-bold">Explore Index</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
