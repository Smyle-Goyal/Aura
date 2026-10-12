import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  UploadCloud,
  ExternalLink,
  Trash2,
  RefreshCw,
  FolderPlus,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Paper, Project } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface PaperLibraryProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
  onSelectPaperForReader: (paperId: string) => void;
}

export const PaperLibraryPage: React.FC<PaperLibraryProps> = ({
  activeProject,
  projects,
  onNavigate,
  onSelectPaperForReader
}) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');

  // Assign to project modal
  const [assignModalPaper, setAssignModalPaper] = useState<Paper | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');

  useEffect(() => {
    if (activeProject) setSelectedProjectId(activeProject.id);
  }, [activeProject?.id]);

  useEffect(() => {
    loadPapers();
  }, [selectedProjectId, statusFilter]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const data = await api.listPapers({
        project_id: selectedProjectId || undefined,
        status: statusFilter || undefined,
        search: search || undefined
      });
      setPapers(data);
    } catch (err) {
      console.error('Failed to load papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPapers();
  };

  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? All indexed vectors and chunks will be removed.`)) return;
    try {
      await api.deletePaper(paperId);
      setPapers(papers.filter((p) => p.id !== paperId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetry = async (paperId: string) => {
    try {
      await api.retryIngestion(paperId);
      loadPapers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalPaper || !targetProjectId) return;
    try {
      await api.assignPaperToProject(assignModalPaper.id, targetProjectId);
      setAssignModalPaper(null);
      loadPapers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-border pb-6">
        <div>
          <Badge variant="forest" className="mb-2">Literature Repository</Badge>
          <h1 className="editorial-header text-3xl font-medium text-ink">Paper Library</h1>
          <p className="text-sm text-ink-light mt-1">
            Browse ingested academic publications with preserved page metadata and indexed vector chunks.
          </p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="px-4 py-2.5 bg-forest-500 hover:bg-forest-600 text-white rounded-xl text-sm font-medium transition shadow-paper-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <UploadCloud size={16} /> Upload PDFs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-paper-card p-3 rounded-xl border border-paper-border shadow-paper-sm">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search size={16} className="text-ink-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search papers by title, author, or keywords..."
            className="w-full bg-paper pl-9 pr-4 py-2 border border-paper-border rounded-lg text-xs text-ink focus:outline-none focus:border-forest-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-paper border border-paper-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-paper border border-paper-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="metadata_only">Metadata Only</option>
          </select>
        </div>
      </div>

      {/* Paper List */}
      <div className="space-y-4">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="paper-card p-5 hover:border-paper-borderDark transition space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      paper.ingestion_status === 'completed'
                        ? 'forest'
                        : paper.ingestion_status === 'processing'
                        ? 'amber'
                        : paper.ingestion_status === 'metadata_only'
                        ? 'sage'
                        : 'red'
                    }
                    size="sm"
                  >
                    {paper.ingestion_status === 'completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                    {paper.ingestion_status === 'processing' && <Clock size={12} className="inline mr-1" />}
                    {paper.ingestion_status === 'failed' && <AlertCircle size={12} className="inline mr-1" />}
                    {paper.ingestion_status}
                  </Badge>

                  {paper.publication_year && (
                    <Badge variant="ink" size="sm">{paper.publication_year}</Badge>
                  )}
                  {paper.venue && (
                    <Badge variant="outline" size="sm">{paper.venue}</Badge>
                  )}
                  <span className="text-xs text-ink-muted">
                    {paper.chunk_count} chunks indexed • {paper.page_count} pages
                  </span>
                </div>

                <h3
                  onClick={() => onSelectPaperForReader(paper.id)}
                  className="editorial-header text-xl font-medium text-ink hover:text-forest-700 cursor-pointer transition leading-snug"
                >
                  {paper.title}
                </h3>

                <p className="text-xs text-ink-muted font-medium">
                  {paper.authors || 'Authors unlisted'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                <button
                  onClick={() => onSelectPaperForReader(paper.id)}
                  className="px-3 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <FileText size={14} /> Open Reader
                </button>

                <button
                  onClick={() => {
                    setAssignModalPaper(paper);
                    setTargetProjectId(activeProject?.id || '');
                  }}
                  className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper transition"
                  title="Assign to project"
                >
                  <FolderPlus size={16} />
                </button>

                {paper.ingestion_status === 'failed' && (
                  <button
                    onClick={() => handleRetry(paper.id)}
                    className="p-1.5 text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition"
                    title="Retry Ingestion"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}

                <button
                  onClick={() => handleDeletePaper(paper.id, paper.title)}
                  className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title="Delete paper"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Abstract Preview */}
            {paper.abstract && (
              <p className="text-xs text-ink-light leading-relaxed line-clamp-2 italic font-serif bg-paper/60 p-3 rounded-lg border border-paper-border">
                "{paper.abstract}"
              </p>
            )}

            {paper.ingestion_error && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                <strong>Ingestion Error:</strong> {paper.ingestion_error}
              </div>
            )}
          </div>
        ))}

        {papers.length === 0 && !loading && (
          <EmptyState
            icon={BookOpen}
            title="No papers found"
            description="Your library is currently empty. Upload research PDFs or search scholarly publications."
            actionText="Upload First PDF"
            onAction={() => onNavigate('upload')}
          />
        )}
      </div>

      {/* Assign to Project Modal */}
      {assignModalPaper && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-card border border-paper-border rounded-2xl shadow-paper-lg max-w-md w-full p-6">
            <h3 className="editorial-header text-xl font-medium text-ink mb-1">
              Assign to Project
            </h3>
            <p className="text-xs text-ink-light mb-4">
              Link "{assignModalPaper.title}" to a research project workspace.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Target Project *
                </label>
                <select
                  required
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-paper-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalPaper(null)}
                  className="px-3 py-1.5 border border-paper-border rounded-lg text-xs font-medium text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!targetProjectId}
                  className="px-3 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition"
                >
                  Confirm Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
