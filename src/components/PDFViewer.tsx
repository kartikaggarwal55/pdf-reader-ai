"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfUrl: string;
  onTextSelect: (text: string, position: { x: number; y: number }) => void;
}

export default function PDFViewer({ pdfUrl, onTextSelect }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
    },
    []
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    setLoading(false);
    setError(error.message || "Failed to load PDF");
  }, []);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        onTextSelect(selectedText, {
          x: rect.left + rect.width / 2,
          y: rect.top,
        });
      }
    }
  }, [onTextSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mouseup", handleMouseUp);
      return () => container.removeEventListener("mouseup", handleMouseUp);
    }
  }, [handleMouseUp]);

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-100 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1.5 text-sm bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors"
          >
            -
          </button>
          <span className="text-sm text-stone-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-3 py-1.5 text-sm bg-white border border-stone-300 rounded hover:bg-stone-50 transition-colors"
          >
            +
          </button>
        </div>
        {numPages > 0 && (
          <span className="text-sm text-stone-500">{numPages} pages</span>
        )}
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-stone-200 p-4"
      >
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-stone-500">Loading PDF...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 text-center">
              <p className="font-medium">Failed to load PDF</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className="flex flex-col items-center gap-4"
        >
          {Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              scale={scale}
              className="shadow-lg bg-white"
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
