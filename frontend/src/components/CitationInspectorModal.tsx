import React from 'react';
import { X, ExternalLink, Bookmark, CheckCircle2 } from 'lucide-react';
import { CitationItem } from '../types';
import { Badge } from './Badge';

interface CitationInspectorModalProps {
  citation: CitationItem | null;
  onClose: () => void;
  onOpenPaper?: (paperId: string) => void;
}

export const CitationInspectorModal: React.FC<CitationInspectorModalProps> = ({
  citation,
  onClose,
  onOpenPaper
}) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-card border border-paper-border rounded-xl shadow-paper-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-6 border-b border-paper-border flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="forest">Citation [{citation.citation_id}]</Badge>
              <Badge variant="sage">Page {citation.page_number || 'N/A'}</Badge>
              <Badge variant="ink">{citation.section || 'General'}</Badge>
              {citation.similarity_score > 0 && (
                <Badge variant="amber">Score: {(citation.similarity_score * 100).toFixed(1)}%</Badge>
              )}
            </div>
            <h3 className="editorial-header text-lg font-medium text-ink leading-snug">
              {citation.paper_title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded-lg hover:bg-paper-muted transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted block mb-2">
              Verbatim Extracted Passage
            </span>
            <div className="p-4 bg-paper rounded-lg border border-paper-border font-serif text-ink text-base leading-relaxed italic">
              "{citation.snippet}"
            </div>
          </div>

          <div className="bg-sage-50/50 border border-sage-200/60 rounded-lg p-3.5 text-xs text-ink-light flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-forest-600 shrink-0" />
            <span>
              This excerpt is indexed in vector storage with exact chunk page anchoring. AURA guarantees source traceability.
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-paper-border bg-paper/50 flex items-center justify-between">
          <span className="text-xs text-ink-muted">Paper ID: {citation.paper_id}</span>
          <div className="flex items-center gap-2">
            {onOpenPaper && (
              <button
                onClick={() => {
                  onOpenPaper(citation.paper_id);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
              >
                <ExternalLink size={14} /> Open in Paper Reader
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-paper-card border border-paper-border text-ink text-xs font-medium rounded-lg hover:bg-paper-muted transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
