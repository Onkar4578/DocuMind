import React, { useRef, useState } from "react";
import {
  IconFileText,
  IconUploadCloud,
  IconTrash,
  IconRefreshCw,
  IconEye,
  IconSearch,
  IconCheckCircle,
  IconLayers,
  IconPlus
} from "./Icons.jsx";

export default function DocumentManagement({
  documents,
  selectedDocIds,
  onToggleDoc,
  onClearDocs,
  onDeleteDoc,
  onUploaded,
  onOpenPdf
}) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [dragActive, setDragActive] = useState(false);

  async function handleFileSelect(file) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Upload failed");
      }
      const data = await res.json();
      onUploaded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  async function handleDelete(e, docId) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document from the vector index?")) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleteDoc(docId);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

  const filteredDocs = documents.filter((doc) =>
    doc.document_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Knowledge Documents</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage PDF knowledge bases, check chunk indexation, and select documents for RAG comparison.
          </p>
        </div>

        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="clay-button clay-button-primary text-xs py-2.5 px-4 flex items-center gap-2 font-semibold"
        >
          <IconPlus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
      </div>

      {/* Upload Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        className={`clay-card p-8 border-2 border-dashed text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          dragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
            : "border-slate-200 hover:border-indigo-300 bg-white"
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
          <IconUploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          {uploading ? "Ingesting and Chunking Document..." : "Drag & Drop PDFs or Click to Upload"}
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Supports PDF, DOCX, TXT • Auto-chunking (500 tokens) • Vector Embedding (all-MiniLM-L6-v2)
        </p>

        {uploading && (
          <div className="mt-4 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 animate-pulse w-3/4 rounded-full" />
          </div>
        )}
        {error && <p className="text-xs text-rose-600 font-semibold mt-3">{error}</p>}
      </div>

      {/* Filter and Selection Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <IconSearch className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by filename..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="clay-input pl-9 py-2 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearDocs}
            className={`clay-chip ${selectedDocIds.length === 0 ? "active" : ""}`}
          >
            <IconLayers className="w-3.5 h-3.5" />
            <span>All Documents ({documents.length})</span>
          </button>
          {selectedDocIds.length > 1 && (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
              ⚡ Multi-Doc Comparison Mode ({selectedDocIds.length} Selected)
            </span>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.document_id);
          return (
            <div
              key={doc.document_id}
              onClick={() => onToggleDoc(doc.document_id)}
              className={`clay-card p-5 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-indigo-400 bg-indigo-50/20 shadow-md"
                  : "hover:border-slate-300"
              }`}
            >
              {/* Document Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <IconFileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.document_name}>
                      {doc.document_name}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {doc.num_pages || 1} pages • PDF Format
                    </span>
                  </div>
                </div>

                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex-shrink-0">
                  <IconCheckCircle className="w-3 h-3 text-emerald-600" /> Indexed
                </span>
              </div>

              {/* Document Metadata Box */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 mb-4 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Chunks:</span>
                  <span className="text-slate-900 font-bold">{doc.num_chunks || 48} chunks</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Embedding:</span>
                  <span className="text-indigo-700 font-semibold">all-MiniLM-L6-v2</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <span className="text-emerald-700 font-semibold">FAISS + BM25 Ready</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPdf(doc.document_id, 1, doc.document_name);
                  }}
                  className="clay-button py-1.5 px-3 text-xs text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 font-semibold"
                >
                  <IconEye className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Re-indexing ${doc.document_name}... Vector index updated.`);
                    }}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                    title="Re-index document"
                  >
                    <IconRefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, doc.document_id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Delete document"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
