import React, { useRef, useState } from "react";

export default function UploadPanel({
  documents,
  selectedDocIds,
  onToggleDoc,
  onClearDocs,
  onDeleteDoc,
  onUploaded,
}) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
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

  async function handleDelete(e, docId) {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleteDoc(docId);
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  }

  const isAllSelected = selectedDocIds.length === 0;

  return (
    <div className="upload-panel">
      <div className="upload-row">
        <button
          className="upload-btn"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Ingesting..." : "Upload PDF"}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          className="hidden-input"
          onChange={handleFileChange}
        />
        <span
          className={`doc-chip ${isAllSelected ? "active" : ""}`}
          onClick={onClearDocs}
        >
          🌐 All Documents
        </span>

        {documents.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.document_id);
          return (
            <span
              key={doc.document_id}
              className={`doc-chip ${isSelected ? "active" : ""}`}
              onClick={() => onToggleDoc(doc.document_id)}
              title={`${doc.num_pages} pages, ${doc.num_chunks} chunks — Click to select for query/comparison`}
            >
              📄 {doc.document_name}
              <button
                className="delete-chip-btn"
                onClick={(e) => handleDelete(e, doc.document_id)}
                title="Delete document"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      {selectedDocIds.length > 1 && (
        <div className="comparison-banner">
          ⚡ Multi-Document Comparison Mode Active ({selectedDocIds.length} documents selected)
        </div>
      )}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
