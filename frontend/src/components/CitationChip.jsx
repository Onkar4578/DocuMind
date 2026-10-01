import React, { useState } from "react";

export default function CitationChip({ citation, onOpenPdf }) {
  const [open, setOpen] = useState(false);

  function handleClick() {
    setOpen(!open);
    if (onOpenPdf && citation.document_id) {
      onOpenPdf(citation.document_id, citation.page_number, citation.document_name);
    }
  }

  const percentage =
    citation.score <= 1
      ? (citation.score * 100).toFixed(1)
      : citation.score.toFixed(1);

  return (
    <div className="citation-container">
      <span className="citation-chip" onClick={handleClick} title="Click to view PDF page">
        📍 [p.{citation.page_number}] {citation.document_name}
      </span>
      {open && (
        <div className="citation-detail">
          <div className="relevance-score">
            Relevance: {percentage}% Match
          </div>
          "{citation.snippet}{citation.snippet.length >= 280 ? "..." : ""}"
        </div>
      )}
    </div>
  );
}
