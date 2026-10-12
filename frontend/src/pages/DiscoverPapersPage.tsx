import React, { useState } from 'react';
import {
  Compass,
  Search,
  ExternalLink,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Layers
} from 'lucide-react';
import { Project, DiscoveredPaperItem, DiscoveryResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface DiscoverPapersProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
}

export const DiscoverPapersPage: React.FC<DiscoverPapersProps> = ({
  activeProject,
  projects,
  onNavigate
}) => {
  const [query, setQuery] = useState('retrieval augmented generation hallucination');
  const [provider, setProvider] = useState<'openalex' | 'semanticscholar'>('openalex');
  const [yearStart, setYearStart] = useState<string>('');
  const [yearEnd, setYearEnd] = useState<string>('');

  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<string[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await api.searchLiterature({
        query,
        provider,
        limit: 10,
        year_start: yearStart ? parseInt(yearStart) : undefined,
        year_end: yearEnd ? parseInt(yearEnd) : undefined
      });
      setDiscoveryResult(res);
    } catch (err: any) {
      setError(err.message || 'Literature discovery failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (paper: DiscoveredPaperItem) => {
    try {
      await api.importDiscoveredPaper({
        source_id: paper.source_id,
        title: paper.title,
        authors: paper.authors.join(', '),
        publication_year: paper.publication_year,
        abstract: paper.abstract,
        doi: paper.doi,
        url: paper.url,
        project_id: activeProject?.id
      });
      setImportedIds((prev) => [...prev, paper.source_id]);
    } catch (err: any) {
      alert(err.message || 'Import failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-6">
        <Badge variant="forest" className="mb-2">Phase 2: Scholarly Literature Discovery</Badge>
        <h1 className="editorial-header text-3xl font-medium text-ink">Discover Scholarly Publications</h1>
        <p className="text-sm text-ink-light mt-1">
          Search indexed global research repositories (OpenAlex & Semantic Scholar).
          Full-text PDF access is strictly separated from metadata discovery to maintain citation integrity.
        </p>
      </div>

      {/* Search Bar & Provider Controls */}
      <form onSubmit={handleSearch} className="paper-card p-5 space-y-4 shadow-paper-sm">
        <div className="flex items-center bg-paper rounded-xl border border-paper-border p-1.5 focus-within:border-forest-500">
          <Search size={18} className="text-ink-muted ml-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scholarly literature by topic, keywords, or authors..."
            className="w-full bg-transparent border-none px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-5 py-2.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-paper-sm shrink-0"
          >
            {isSearching ? 'Searching...' : 'Search Publications'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex items-center gap-3">
            <span className="text-ink-muted font-medium">Scholarly Provider:</span>
            <div className="flex items-center gap-1 bg-paper p-1 rounded-lg border border-paper-border">
              <button
                type="button"
                onClick={() => setProvider('openalex')}
                className={`px-3 py-1 rounded text-xs transition ${
                  provider === 'openalex'
                    ? 'bg-paper-card font-semibold text-forest-700 shadow-paper-sm'
                    : 'text-ink-light hover:text-ink'
                }`}
              >
                OpenAlex
              </button>
              <button
                type="button"
                onClick={() => setProvider('semanticscholar')}
                className={`px-3 py-1 rounded text-xs transition ${
                  provider === 'semanticscholar'
                    ? 'bg-paper-card font-semibold text-forest-700 shadow-paper-sm'
                    : 'text-ink-light hover:text-ink'
                }`}
              >
                Semantic Scholar
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-ink-muted">Year Range:</span>
            <input
              type="number"
              placeholder="From"
              value={yearStart}
              onChange={(e) => setYearStart(e.target.value)}
              className="w-20 px-2 py-1 bg-paper border border-paper-border rounded text-xs text-ink"
            />
            <span className="text-ink-muted">-</span>
            <input
              type="number"
              placeholder="To"
              value={yearEnd}
              onChange={(e) => setYearEnd(e.target.value)}
              className="w-20 px-2 py-1 bg-paper border border-paper-border rounded text-xs text-ink"
            />
          </div>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Discovery Results */}
      {discoveryResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                Discovery Results ({discoveryResult.papers.length})
              </span>
              <Badge variant={discoveryResult.external_service_status === 'available' ? 'forest' : 'amber'} size="sm">
                Service: {discoveryResult.external_service_status}
              </Badge>
            </div>
            {activeProject && (
              <span className="text-xs text-ink-muted">
                Importing to project: <strong>{activeProject.title}</strong>
              </span>
            )}
          </div>

          <div className="space-y-4">
            {discoveryResult.papers.map((paper) => {
              const isImported = importedIds.includes(paper.source_id);
              return (
                <div key={paper.source_id} className="paper-card p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {paper.publication_year && <Badge variant="ink" size="sm">{paper.publication_year}</Badge>}
                        {paper.venue && <Badge variant="outline" size="sm">{paper.venue}</Badge>}
                        {paper.is_open_access ? (
                          <Badge variant="forest" size="sm">Open Access</Badge>
                        ) : (
                          <Badge variant="ink" size="sm">Subscription / Paywall</Badge>
                        )}
                        {paper.can_download_full_text ? (
                          <Badge variant="sage" size="sm">Full-Text PDF Available</Badge>
                        ) : (
                          <Badge variant="amber" size="sm">Metadata Only</Badge>
                        )}
                      </div>

                      <h3 className="editorial-header text-xl font-medium text-ink leading-snug">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {paper.authors.join(', ') || 'Authors unlisted'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper transition"
                          title="View on publisher page"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}

                      <button
                        onClick={() => handleImport(paper)}
                        disabled={isImported}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                          isImported
                            ? 'bg-forest-100 text-forest-700'
                            : 'bg-forest-500 hover:bg-forest-600 text-white shadow-paper-sm'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <CheckCircle2 size={13} /> Added to Library
                          </>
                        ) : (
                          <>
                            <Plus size={13} /> Import Metadata
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {paper.abstract && (
                    <p className="text-xs font-serif text-ink-light leading-relaxed line-clamp-3 bg-paper/60 p-3 rounded-lg border border-paper-border">
                      "{paper.abstract}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
