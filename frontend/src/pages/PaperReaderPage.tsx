import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Send,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Bookmark,
  FileText,
  AlertCircle,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { Paper, CitationItem, RAGResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

interface PaperReaderProps {
  paperId: string | null;
  onInspectCitation: (citation: CitationItem) => void;
  onNavigate: (screen: any) => void;
}

export const PaperReaderPage: React.FC<PaperReaderProps> = ({
  paperId,
  onInspectCitation,
  onNavigate
}) => {
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>(paperId || '');
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(false);

  // AI Chat state
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ q: string; response: RAGResponse }>>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    api.listPapers().then((papers) => {
      setAllPapers(papers);
      if (!selectedPaperId && papers.length > 0) {
        setSelectedPaperId(papers[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (paperId) setSelectedPaperId(paperId);
  }, [paperId]);

  useEffect(() => {
    if (selectedPaperId) {
      loadPaperDetails(selectedPaperId);
      setChatHistory([]);
    }
  }, [selectedPaperId]);

  const loadPaperDetails = async (id: string) => {
    try {
      setLoading(true);
      const data = await api.getPaper(id);
      setPaper(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (customQ?: string) => {
    const qText = customQ || question;
    if (!qText.trim() || !paper) return;

    setIsQuerying(true);
    setQueryError(null);

    try {
      const result = await api.querySinglePaper(paper.id, qText);
      setChatHistory((prev) => [...prev, { q: qText, response: result }]);
      if (!customQ) setQuestion('');
    } catch (err: any) {
      setQueryError(err.message || 'Error querying paper.');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Top Paper Selector Bar */}
      <div className="bg-paper-card border border-paper-border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-paper-sm">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-forest-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Reading Paper:</span>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="bg-paper border border-paper-border rounded-lg px-2.5 py-1 text-xs text-ink font-medium max-w-xs sm:max-w-md truncate focus:outline-none"
          >
            {allPapers.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onNavigate('library')}
          className="text-xs text-forest-600 hover:text-forest-700 font-medium"
        >
          Back to Library
        </button>
      </div>

      {/* Main Split Layout: Left Paper Content | Right AI Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Paper Structure & Chunks (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {paper ? (
            <div className="bg-paper-card border border-paper-border rounded-2xl p-6 shadow-paper space-y-6">
              {/* Paper Header */}
              <div className="space-y-2 border-b border-paper-border pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="forest">Indexed Corpus</Badge>
                  {paper.publication_year && <Badge variant="ink">{paper.publication_year}</Badge>}
                  {paper.venue && <Badge variant="outline">{paper.venue}</Badge>}
                  <span className="text-xs text-ink-muted">{paper.page_count} pages • {paper.chunk_count} chunks</span>
                </div>

                <h1 className="editorial-header text-2xl sm:text-3xl font-medium text-ink leading-tight">
                  {paper.title}
                </h1>

                <p className="text-xs font-medium text-ink-muted">
                  {paper.authors || 'Authors unlisted'}
                </p>

                {paper.doi && (
                  <p className="text-xs text-ink-muted font-mono">DOI: {paper.doi}</p>
                )}
              </div>

              {/* Abstract */}
              {paper.abstract && (
                <div className="p-4 bg-paper rounded-xl border border-paper-border">
                  <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Abstract
                  </h3>
                  <p className="font-serif text-ink text-sm leading-relaxed italic">
                    "{paper.abstract}"
                  </p>
                </div>
              )}

              {/* Indexed Passages & Chunks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="editorial-header text-lg font-medium text-ink">
                    Indexed Text Chunks ({paper.chunks?.length || 0})
                  </h3>
                  <span className="text-[11px] text-ink-muted">Preserving page & section headers</span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {paper.chunks && paper.chunks.length > 0 ? (
                    paper.chunks.map((chunk) => (
                      <div
                        key={chunk.id}
                        className="p-3.5 bg-paper/60 hover:bg-paper rounded-lg border border-paper-border text-xs transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-forest-700 bg-forest-50 px-2 py-0.5 rounded text-[11px]">
                            {chunk.section || 'General'}
                          </span>
                          <span className="text-ink-muted text-[11px]">Page {chunk.page_number || '1'}</span>
                        </div>
                        <p className="text-ink-light font-serif leading-relaxed line-clamp-3">
                          {chunk.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-ink-muted">
                      No chunks parsed yet. Ensure ingestion completed.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="paper-card p-12 text-center text-ink-muted text-sm">
              Loading paper content...
            </div>
          )}
        </div>

        {/* Right Column: Contextual AI Assistant (5 cols) */}
        <div className="lg:col-span-5 bg-paper-card border border-paper-border rounded-2xl p-6 shadow-paper flex flex-col h-[750px] sticky top-20">
          <div className="border-b border-paper-border pb-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-forest-600" />
              <h2 className="editorial-header text-xl font-medium text-ink">Contextual AI Assistant</h2>
            </div>
            <p className="text-[11px] text-ink-muted">
              Grounded exclusively in this publication's text. Citations reference exact chunks.
            </p>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => handleAskQuestion("Summarize the authors' key methodology and architecture.")}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-[11px] text-ink-light transition"
            >
              Methodology
            </button>
            <button
              onClick={() => handleAskQuestion("What specific limitations and threats to validity do the authors state?")}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-[11px] text-ink-light transition"
            >
              Limitations
            </button>
            <button
              onClick={() => handleAskQuestion("What benchmark datasets and evaluation metrics were tested?")}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-[11px] text-ink-light transition"
            >
              Datasets & Metrics
            </button>
          </div>

          {/* Conversation Body */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {chatHistory.length === 0 && (
              <div className="text-center py-16 text-ink-muted space-y-2">
                <FileText size={24} className="mx-auto text-forest-500 opacity-60" />
                <p className="text-xs">Ask anything about this publication.</p>
                <p className="text-[10px] text-ink-muted max-w-xs mx-auto">
                  Answers cite indexed excerpts and disclose limitations transparently.
                </p>
              </div>
            )}

            {chatHistory.map((item, idx) => (
              <div key={idx} className="space-y-3">
                {/* User message */}
                <div className="p-3 bg-forest-50/70 text-forest-900 rounded-lg text-xs font-medium ml-6 border border-forest-100">
                  {item.q}
                </div>

                {/* AI Grounded response */}
                <div className="p-4 bg-paper rounded-lg border border-paper-border text-xs space-y-3">
                  <div className="font-serif text-ink text-sm leading-relaxed whitespace-pre-line">
                    {item.response.answer}
                  </div>

                  {/* Inline Citations */}
                  {item.response.citations.length > 0 && (
                    <div className="pt-2 border-t border-paper-border space-y-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                        Source Citations
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.response.citations.map((c) => (
                          <button
                            key={c.citation_id}
                            onClick={() => onInspectCitation(c)}
                            className="px-2 py-1 bg-paper-card hover:bg-paper-muted border border-paper-border rounded text-[11px] text-ink flex items-center gap-1 transition"
                          >
                            <span className="font-serif font-bold text-forest-700">[{c.citation_id}]</span>
                            <span>Page {c.page_number || 'N/A'}</span>
                            <span className="text-ink-muted">({c.section})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="p-3 bg-paper rounded-lg border border-paper-border text-xs text-ink-muted italic animate-pulse">
                Retrieving passage embeddings and synthesizing grounded response...
              </div>
            )}

            {queryError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {queryError}
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskQuestion();
            }}
            className="flex items-center gap-2 pt-2 border-t border-paper-border"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this paper..."
              disabled={isQuerying}
              className="flex-1 px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none focus:border-forest-500"
            />
            <button
              type="submit"
              disabled={isQuerying || !question.trim()}
              className="p-2 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
