import React, { useState, useEffect } from "react";
import ClaySidebar from "./components/ClaySidebar.jsx";
import TopHeader from "./components/TopHeader.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import ChatInput from "./components/ChatInput.jsx";
import SourceDrawer from "./components/SourceDrawer.jsx";
import DocumentManagement from "./components/DocumentManagement.jsx";
import ObservabilityDashboard from "./components/ObservabilityDashboard.jsx";
import RetrievalInspector from "./components/RetrievalInspector.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import CollectionsView from "./components/CollectionsView.jsx";

export default function App() {
  const [activeView, setActiveView] = useState("chat");
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfViewer, setPdfViewer] = useState(null);

  // Fetch Documents Initializer
  useEffect(() => {
    fetch("/api/documents")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load documents");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setDocuments(data);
      })
      .catch((err) => {
        console.warn("Document initial fetch warning:", err);
      });
  }, []);

  function handleUploaded(doc) {
    setDocuments((prev) => [doc, ...prev]);
    setSelectedDocIds([doc.document_id]);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Indexed "${doc.document_name}" — ${doc.num_pages} pages, ${doc.num_chunks} chunks.\n${doc.message || "Ready for query and comparison."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  function handleToggleDoc(docId) {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }

  function handleClearDocs() {
    setSelectedDocIds([]);
  }

  function handleDeleteDoc(docId) {
    setDocuments((prev) => prev.filter((d) => d.document_id !== docId));
    setSelectedDocIds((prev) => prev.filter((id) => id !== docId));
    if (pdfViewer?.document_id === docId) setPdfViewer(null);
  }

  function handleOpenPdf(document_id, page_number, document_name, snippet = "") {
    setPdfViewer({ document_id, page_number, document_name, snippet });
  }

  async function handleFeedback(logId, rating) {
    if (!logId) return;
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: logId, rating }),
      });
    } catch (err) {
      console.error("Feedback submission error:", err);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    setActiveView("chat");
  }

  async function handleAsk(e) {
    if (e && e.preventDefault) e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    const userMsgTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", content: query, timestamp: userMsgTime }]);
    setLoading(true);

    try {
      const payload = { query };
      if (selectedDocIds.length === 1) payload.document_id = selectedDocIds[0];
      else if (selectedDocIds.length > 1) payload.document_ids = selectedDocIds;

      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Query request failed");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          stats: data.retrieval_stats,
          logId: data.log_id,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAttachFile(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || "Upload failed");
      }
      const data = await res.json();
      handleUploaded(data);
    } catch (err) {
      alert(`File upload failed: ${err.message}`);
    }
  }

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <ClaySidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onNewChat={handleNewChat}
        documentsCount={documents.length}
      />

      {/* Main Viewport */}
      <div className="main-viewport">
        {/* Top Header */}
        <TopHeader
          documentCount={documents.length}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* Dynamic Content Area */}
        <main className="content-body">
          {activeView === "chat" && (
            <>
              <ChatWindow
                messages={messages}
                loading={loading}
                onOpenPdf={handleOpenPdf}
                onFeedback={handleFeedback}
              />
              <ChatInput
                input={input}
                setInput={setInput}
                onAsk={handleAsk}
                loading={loading}
                selectedDocCount={selectedDocIds.length}
                onAttachFile={handleAttachFile}
              />
            </>
          )}

          {activeView === "documents" && (
            <DocumentManagement
              documents={documents}
              selectedDocIds={selectedDocIds}
              onToggleDoc={handleToggleDoc}
              onClearDocs={handleClearDocs}
              onDeleteDoc={handleDeleteDoc}
              onUploaded={handleUploaded}
              onOpenPdf={handleOpenPdf}
            />
          )}

          {activeView === "analytics" && <ObservabilityDashboard />}

          {activeView === "inspector" && <RetrievalInspector />}

          {activeView === "settings" && <SettingsPanel />}

          {activeView === "collections" && <CollectionsView documents={documents} />}
        </main>
      </div>

      {/* PDF Source Right Drawer */}
      <SourceDrawer pdfViewer={pdfViewer} onClose={() => setPdfViewer(null)} />
    </div>
  );
}
