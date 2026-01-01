"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import ExplanationPopover from "@/components/ExplanationPopover";

// Dynamic import to avoid SSR issues with react-pdf
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-stone-500">
      Loading viewer...
    </div>
  ),
});

interface Selection {
  text: string;
  position: { right: number; top: number; bottom: number };
}

type ModelType = "gpt-4o-mini" | "gpt-4o";

const MODEL_OPTIONS: { value: ModelType; label: string }[] = [
  { value: "gpt-4o-mini", label: "gpt-4o-mini" },
  { value: "gpt-4o", label: "gpt-4o" },
];

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [model, setModel] = useState<ModelType>("gpt-4o-mini");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      // Clear any existing blob URL
      if (pdfUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(urlInput.trim());
      setSelection(null);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    // Clear any existing blob URL
    if (pdfUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }

    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setSelection(null);
    setUrlInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }, [pdfUrl]);

  const handleTextSelect = useCallback(
    (text: string, position: { right: number; top: number; bottom: number }) => {
      if (text.length >= 3) {
        setSelection({ text, position });
      }
    },
    []
  );

  const handleClosePopover = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleBack = () => {
    if (pdfUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setSelection(null);
    setUrlInput("");
  };

  // Landing page
  if (!pdfUrl) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-stone-800 mb-2">
              PDF Reader AI
            </h1>
            <p className="text-stone-500">
              Select any text while reading to get an instant AI explanation
            </p>
          </div>

          {/* URL Input */}
          <form onSubmit={handleUrlSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste a PDF URL..."
                className="flex-1 px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Open
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-sm text-stone-400">or</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          {/* File Upload */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${
                dragActive
                  ? "border-sky-500 bg-sky-50"
                  : "border-stone-300 hover:border-stone-400"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <svg
              className="w-12 h-12 mx-auto mb-4 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-stone-600 mb-1">
              Drag and drop a PDF here, or click to browse
            </p>
            <p className="text-sm text-stone-400">PDF files only</p>
          </div>

          <p className="mt-8 text-center text-xs text-stone-400">
            Tip: Select any text in the PDF to get an AI explanation
          </p>
        </div>
      </main>
    );
  }

  // PDF Viewer
  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 bg-white border-b border-stone-200">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="flex-1" />

        {/* Model Selector */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setModel(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                model === opt.value
                  ? "bg-white text-stone-800 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-sm text-stone-500">
          Select text to explain
        </span>
      </header>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <PDFViewer pdfUrl={pdfUrl} onTextSelect={handleTextSelect} />
      </div>

      {/* Explanation Popover */}
      {selection && (
        <ExplanationPopover
          text={selection.text}
          position={selection.position}
          model={model}
          onClose={handleClosePopover}
        />
      )}
    </main>
  );
}
