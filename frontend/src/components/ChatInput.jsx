import React, { useRef, useState } from "react";
import { IconSend, IconPaperclip, IconMic, IconZap } from "./Icons.jsx";

export default function ChatInput({
  input,
  setInput,
  onAsk,
  loading,
  selectedDocCount,
  onAttachFile
}) {
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onAsk(e);
  }

  function toggleVoice() {
    setIsListening(!isListening);
    if (!isListening) {
      setInput((prev) => (prev ? prev + " " : "") + "What are the key skills mentioned in the resume?");
      setTimeout(() => setIsListening(false), 2000);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="floating-input-bar">
      {/* Attach Document Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="clay-button p-2.5 text-slate-500 hover:text-indigo-600 rounded-2xl flex-shrink-0"
        title="Attach document to context"
      >
        <IconPaperclip className="w-4 h-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Text Input Field */}
      <div className="flex-1 relative flex items-center">
        {selectedDocCount > 1 && (
          <span className="absolute left-3 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100 flex items-center gap-1 z-10 pointer-events-none">
            <IconZap className="w-3 h-3 text-amber-500" />
            Comparing {selectedDocCount} Docs
          </span>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            selectedDocCount > 1
              ? "Ask a multi-document comparison query..."
              : "Ask anything about your documents..."
          }
          className={`clay-input py-2.5 ${
            selectedDocCount > 1 ? "pl-36" : "pl-4"
          } pr-10 text-sm`}
          disabled={loading}
        />
      </div>

      {/* Voice Input Button */}
      <button
        type="button"
        onClick={toggleVoice}
        className={`clay-button p-2.5 rounded-2xl flex-shrink-0 ${
          isListening
            ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
            : "text-slate-500 hover:text-indigo-600"
        }`}
        title="Voice input"
      >
        <IconMic className="w-4 h-4" />
      </button>

      {/* Raised Primary Send Button */}
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="clay-button clay-button-primary py-2.5 px-5 text-sm flex items-center gap-2 flex-shrink-0 font-semibold"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <IconSend className="w-4 h-4" />
        )}
        <span>{loading ? "Retrieving..." : "Send"}</span>
      </button>
    </form>
  );
}
