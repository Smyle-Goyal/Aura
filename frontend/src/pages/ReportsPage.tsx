import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  Plus,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Project, ResearchReport } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface ReportsPageProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  activeProject,
  projects,
  onNavigate
}) => {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [activeReport, setActiveReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // New report modal
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAbstract, setNewAbstract] = useState('');
  const [newMarkdown, setNewMarkdown] = useState('');

  useEffect(() => {
    loadReports();
  }, [activeProject?.id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.listReports(activeProject ? activeProject.id : undefined);
      setReports(data);
      if (data.length > 0) {
        setActiveReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeReport) return;
    navigator.clipboard.writeText(activeReport.content_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.content_markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReport.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const projId = activeProject?.id || projects[0]?.id;
    if (!projId || !newTitle.trim()) return;

    try {
      const created = await api.createReport({
        project_id: projId,
        title: newTitle,
        abstract: newAbstract,
        content_markdown: newMarkdown
      });
      setReports([created, ...reports]);
      setActiveReport(created);
      setIsCreating(false);
      setNewTitle('');
      setNewAbstract('');
      setNewMarkdown('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="forest" className="mb-1.5">Research Writing & Synthesis</Badge>
          <h1 className="editorial-header text-3xl font-medium text-ink">Research Reports</h1>
          <p className="text-sm text-ink-light mt-0.5">
            Structured, verifiable literature reviews generated from multi-paper comparisons and agentic workflows.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-xl text-xs font-medium transition shadow-paper-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={15} /> Compose New Report
        </button>
      </div>

      {/* Main Split Layout: Left Reports List (4 cols) | Right Report Reader (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Report List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
            Generated Reports ({reports.length})
          </span>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {reports.map((r) => {
              const isSelected = activeReport?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setActiveReport(r)}
                  className={`p-4 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-paper-card border-forest-500 ring-2 ring-forest-100 shadow-paper-md'
                      : 'bg-paper-card border-paper-border hover:border-paper-borderDark'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <Badge variant="sage" size="sm">Report</Badge>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="editorial-header text-base font-medium text-ink leading-snug">
                    {r.title}
                  </h3>
                  {r.abstract && (
                    <p className="text-xs text-ink-light line-clamp-2">
                      {r.abstract}
                    </p>
                  )}
                </div>
              );
            })}

            {reports.length === 0 && !loading && (
              <EmptyState
                icon={FileCheck2}
                title="No reports written yet"
                description="Run an agentic research workflow or compose a structured synthesis report."
                actionText="Compose Report"
                onAction={() => setIsCreating(true)}
              />
            )}
          </div>
        </div>

        {/* Right Column: Active Report Viewer */}
        <div className="lg:col-span-8 bg-paper-card border border-paper-border rounded-2xl p-8 shadow-paper min-h-[700px]">
          {activeReport ? (
            <div className="space-y-6">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper-border pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="forest">Traceable Citations</Badge>
                  <span className="text-xs text-ink-muted">
                    Last modified {new Date(activeReport.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-3 py-1.5 bg-paper hover:bg-paper-muted border border-paper-border rounded-lg text-xs font-medium text-ink transition flex items-center gap-1.5"
                    title="Copy Markdown"
                  >
                    {copied ? <Check size={14} className="text-forest-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy MD'}
                  </button>
                  <button
                    onClick={handleDownloadMarkdown}
                    className="px-3 py-1.5 bg-paper hover:bg-paper-muted border border-paper-border rounded-lg text-xs font-medium text-ink transition flex items-center gap-1.5"
                    title="Download Markdown File"
                  >
                    <Download size={14} /> Download MD
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                    title="Print / Save PDF"
                  >
                    <Printer size={14} /> Print / PDF
                  </button>
                </div>
              </div>

              {/* Title & Abstract */}
              <div className="space-y-3">
                <h1 className="editorial-header text-3xl font-medium text-ink leading-tight">
                  {activeReport.title}
                </h1>
                {activeReport.abstract && (
                  <div className="p-4 bg-paper rounded-xl border border-paper-border italic font-serif text-ink text-sm leading-relaxed">
                    <strong className="not-italic block font-sans text-xs uppercase tracking-wider text-ink-muted mb-1">
                      Abstract
                    </strong>
                    "{activeReport.abstract}"
                  </div>
                )}
              </div>

              {/* Markdown Content */}
              <div className="font-serif text-ink text-base leading-relaxed space-y-4 whitespace-pre-line border-t border-paper-border pt-4">
                {activeReport.content_markdown}
              </div>
            </div>
          ) : (
            <div className="text-center py-32 text-ink-muted text-sm">
              Select a research report on the left or create a new synthesis.
            </div>
          )}
        </div>
      </div>

      {/* Compose Report Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-card border border-paper-border rounded-2xl shadow-paper-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="editorial-header text-2xl font-medium text-ink">
              Compose Research Report
            </h3>
            <p className="text-xs text-ink-light">
              Author an evidence-backed report with traceable markdown formatting.
            </p>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Meta-Analysis of Context Boundary Slicing in DPR"
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Abstract / Executive Summary
                </label>
                <textarea
                  rows={2}
                  value={newAbstract}
                  onChange={(e) => setNewAbstract(e.target.value)}
                  placeholder="Brief synopsis of primary findings..."
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Report Content (Markdown) *
                </label>
                <textarea
                  rows={10}
                  required
                  value={newMarkdown}
                  onChange={(e) => setNewMarkdown(e.target.value)}
                  placeholder="# 1. Introduction&#10;Synthesize literature with bracketed citations [1], [2]...&#10;&#10;## 2. Methodology Review&#10;Evaluate empirical setup..."
                  className="w-full font-mono text-xs px-3 py-2 bg-paper border border-paper-border rounded-lg text-ink focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-paper-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 border border-paper-border rounded-lg text-xs font-medium text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition"
                >
                  Save Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
