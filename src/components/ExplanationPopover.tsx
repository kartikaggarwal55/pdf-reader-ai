"use client";

import { useEffect, useRef, useState } from "react";

interface ExplanationPopoverProps {
  text: string;
  position: { x: number; y: number };
  model: "fast" | "balanced" | "thinking";
  onClose: () => void;
}

export default function ExplanationPopover({
  text,
  position,
  model,
  onClose,
}: ExplanationPopoverProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, model }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get explanation");
        }

        setExplanation(data.explanation);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [text, model]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Position popover on the right side of viewport
  const getPopoverStyle = () => {
    const popoverWidth = 320;
    const padding = 16;

    // Fixed to right side of viewport
    const right = padding;

    // Vertically align with selection, but keep in viewport
    let top = position.y - 60;
    const headerHeight = 56;

    if (top < headerHeight + padding) {
      top = headerHeight + padding;
    }

    return { right, top };
  };

  const style = getPopoverStyle();

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-white rounded-lg shadow-xl border border-stone-200"
      style={{ right: style.right, top: style.top }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
          AI Explanation
        </span>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        {loading && (
          <div className="flex items-center gap-2 text-stone-500">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {explanation && !loading && (
          <p className="text-sm text-stone-700 leading-relaxed">
            {explanation}
          </p>
        )}
      </div>

      {/* Selected text preview */}
      <div className="px-3 py-2 bg-stone-50 border-t border-stone-100">
        <p className="text-xs text-stone-400 line-clamp-2 italic">
          "{text.slice(0, 100)}{text.length > 100 ? "..." : ""}"
        </p>
      </div>
    </div>
  );
}
