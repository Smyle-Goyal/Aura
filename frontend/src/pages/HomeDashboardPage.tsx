import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  FolderKanban,
  Cpu,
  Sparkles,
  Compass,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project, Paper, ResearchRun, CandidateGap, ResearchReport, CitationItem, RAGResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface HomeDashboardProps {
  activeProject: Project | null;
  onNavigate: (screen: any) => void;
  onSelectPaperForReader: (paperId: string) => void;
  onInspectCitation: (citation: CitationItem) => void;
}

export const HomeDashboardPage: React.FC<HomeDashboardProps> = ({
  activeProject,
  onNavigate,
  onSelectPaperForReader,
  onInspectCitation
}) => {
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [gaps, setGaps] = useState<CandidateGap[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [activeProject?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pList, paList, rList, gList, repList] = await Promise.all([
        api.listProjects(),
        api.listPapers(activeProject ? { project_id: activeProject.id } : undefined),
        api.listResearchRuns(activeProject ? activeProject.id : undefined),
        api.listGaps(activeProject ? { project_id: activeProject.id } : undefined),
        api.listReports(activeProject ? activeProject.id : undefined),
      ]);
      setProjects(pList);
      setPapers(paList);
      setRuns(rList);
      setGaps(gList);
      setReports(repList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    if (!activeProject && projects.length === 0) {
      setRagError('Please create or select a research project first.');
      return;
    }

    const targetProjectId = activeProject?.id || projects[0]?.id;
    setIsQuerying(true);
    setRagError(null);
    setRagResult(null);

    try {
      const res = await api.queryCollection(targetProjectId, question);
      setRagResult(res);
    } catch (err: any) {
      setRagError(err.message || 'Error retrieving literature evidence.');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Editorial Hero Banner */}
      <div className="bg-paper-card border border-paper-border rounded-2xl p-8 shadow-paper relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-forest-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="max-w-3xl">
          <Badge variant="forest" className="mb-3">
            Autonomous Unified Research Assistant
          </Badge>
          <h1 className="editorial-header text-3xl sm:text-4xl font-normal text-ink mb-3 leading-tight">
            Academic synthesis grounded in verifiable evidence.
          </h1>
          <p className="text-sm text-ink-light mb-6 leading-relaxed">
            Investigate research collections, detect methodological trade-offs, execute bounded agentic workflows,
            and uncover testable research gaps across scholarly literature.
          </p>

          {/* Prominent Research Question Input */}
          <form onSubmit={handleAskQuestion} className="relative">
            <div className="flex items-center bg-paper rounded-xl border border-paper-border shadow-paper-sm focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-100 transition p-1.5">
              <Search size={18} className="text-ink-muted ml-3 shrink-0" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={
                  activeProject
                    ? `Ask anything grounded in "${activeProject.title}"...`
                    : "Ask an evidence-grounded research question across your corpus..."
                }
                className="w-full bg-transparent border-none px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={isQuerying || !question.trim()}
                className="px-4 py-2 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1.5 shadow-paper-sm"
              >
                {isQuerying ? 'Retrieving...' : 'Synthesize'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
            <span className="text-ink-muted font-medium">Quick Workflows:</span>
            <button
              onClick={() => onNavigate('studio')}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-ink-light transition flex items-center gap-1"
            >
              <Cpu size={12} className="text-forest-600" /> Run Agentic Studio
            </button>
            <button
              onClick={() => onNavigate('comparison')}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-ink-light transition flex items-center gap-1"
            >
              <FolderKanban size={12} className="text-sage-500" /> Compare Methodologies
            </button>
            <button
              onClick={() => onNavigate('gaps')}
              className="px-2.5 py-1 bg-paper hover:bg-paper-muted border border-paper-border rounded-md text-ink-light transition flex items-center gap-1"
            >
              <Sparkles size={12} className="text-amber-500" /> Discover Research Gaps
            </button>
          </div>
        </div>
      </div>

      {/* RAG Synthesis Result Card */}
      {ragError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0" />
          <span>{ragError}</span>
        </div>
      )}

      {ragResult && (
        <div className="bg-paper-card border border-paper-border rounded-2xl p-6 shadow-paper space-y-4">
          <div className="flex items-center justify-between border-b border-paper-border pb-3">
            <div className="flex items-center gap-2">
              <Badge variant="forest">Synthesized Answer</Badge>
              <span className="text-xs text-ink-muted">Scope: {ragResult.retrieval_scope}</span>
            </div>
            <span className="text-xs text-ink-muted">Engine: {ragResult.model_used}</span>
          </div>

          <div className="font-serif text-ink text-base leading-relaxed whitespace-pre-line">
            {ragResult.answer}
          </div>

          {/* Citation Chips */}
          {ragResult.citations.length > 0 && (
            <div className="pt-3 border-t border-paper-border">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
                Traceable Sources ({ragResult.citations.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {ragResult.citations.map((c) => (
                  <button
                    key={c.citation_id}
                    onClick={() => onInspectCitation(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-paper-muted border border-paper-border rounded-lg text-xs text-ink transition text-left"
                  >
                    <span className="font-serif font-bold text-forest-700">[{c.citation_id}]</span>
                    <span className="max-w-[180px] truncate">{c.paper_title}</span>
                    <span className="text-[10px] text-ink-muted">p.{c.page_number || 'N/A'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Dashboard Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects & Active Workflows */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects Overview */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderKanban size={18} className="text-forest-600" />
                <h2 className="editorial-header text-xl font-medium text-ink">Research Projects</h2>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
              >
                View all ({projects.length}) <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('projects')}
                  className="p-4 rounded-lg border border-paper-border bg-paper hover:bg-paper-muted cursor-pointer transition flex items-start justify-between gap-4"
                >
                  <div>
                    <h3 className="font-medium text-ink text-sm mb-1">{p.title}</h3>
                    <p className="text-xs text-ink-light line-clamp-1 mb-2">
                      {p.research_question || p.description || 'No research question set.'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                      <span>{p.paper_count} papers</span>
                      <span>•</span>
                      <span>{p.gap_count} gaps</span>
                      <span>•</span>
                      <span>{p.run_count} runs</span>
                    </div>
                  </div>
                  <Badge variant={p.is_archived ? 'ink' : 'forest'} size="sm">
                    {p.is_archived ? 'Archived' : 'Active'}
                  </Badge>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-6 text-sm text-ink-muted">
                  No research projects yet. Create one to organize papers.
                </div>
              )}
            </div>
          </div>

          {/* Recent Papers */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-forest-600" />
                <h2 className="editorial-header text-xl font-medium text-ink">Recent Ingested Literature</h2>
              </div>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
              >
                Open Library ({papers.length}) <ArrowRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-paper-border">
              {papers.slice(0, 4).map((paper) => (
                <div key={paper.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <button
                      onClick={() => onSelectPaperForReader(paper.id)}
                      className="text-sm font-medium text-ink hover:text-forest-700 transition text-left line-clamp-1"
                    >
                      {paper.title}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <span>{paper.authors ? paper.authors.split(',')[0] + ' et al.' : 'Authors N/A'}</span>
                      <span>•</span>
                      <span>{paper.publication_year || 2024}</span>
                      <span>•</span>
                      <span>{paper.chunk_count} chunks indexed</span>
                    </div>
                  </div>
                  <Badge
                    variant={paper.ingestion_status === 'completed' ? 'forest' : 'amber'}
                    size="sm"
                  >
                    {paper.ingestion_status}
                  </Badge>
                </div>
              ))}
              {papers.length === 0 && (
                <div className="text-center py-6 text-sm text-ink-muted">
                  No papers in active scope. Upload PDF or discover literature.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Research Runs & Discovered Gaps */}
        <div className="space-y-6">
          {/* Active Research Runs */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-forest-600" />
                <h2 className="editorial-header text-lg font-medium text-ink">Agentic Research Runs</h2>
              </div>
              <button
                onClick={() => onNavigate('studio')}
                className="text-xs text-forest-600 hover:text-forest-700 font-medium"
              >
                Studio
              </button>
            </div>

            <div className="space-y-3">
              {runs.slice(0, 3).map((r) => (
                <div key={r.id} className="p-3 bg-paper rounded-lg border border-paper-border text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink truncate max-w-[160px]">{r.objective}</span>
                    <Badge variant={r.status === 'completed' ? 'forest' : r.status === 'running' ? 'amber' : 'ink'} size="sm">
                      {r.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-paper-border h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-forest-500 h-full transition-all duration-300"
                      style={{ width: `${r.progress_percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-muted">
                    <span className="truncate">{r.current_stage_name}</span>
                    <span>{r.progress_percent}%</span>
                  </div>
                </div>
              ))}
              {runs.length === 0 && (
                <div className="text-center py-4 text-xs text-ink-muted">
                  No active runs. Launch an agentic synthesis run in the Studio.
                </div>
              )}
            </div>
          </div>

          {/* Research Gaps Preview */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h2 className="editorial-header text-lg font-medium text-ink">Candidate Gaps</h2>
              </div>
              <button
                onClick={() => onNavigate('gaps')}
                className="text-xs text-forest-600 hover:text-forest-700 font-medium"
              >
                View ({gaps.length})
              </button>
            </div>

            <div className="space-y-3">
              {gaps.slice(0, 3).map((g) => (
                <div
                  key={g.id}
                  onClick={() => onNavigate('gaps')}
                  className="p-3 bg-paper hover:bg-paper-muted rounded-lg border border-paper-border cursor-pointer transition space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-ink text-xs line-clamp-1">{g.title}</h4>
                    <Badge variant="amber" size="sm">{g.evidence_strength}</Badge>
                  </div>
                  <p className="text-[11px] text-ink-light line-clamp-2">{g.description}</p>
                </div>
              ))}
              {gaps.length === 0 && (
                <div className="text-center py-4 text-xs text-ink-muted">
                  No candidate gaps discovered yet. Run the Research Gap Engine.
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-forest-600" />
                <h2 className="editorial-header text-lg font-medium text-ink">Generated Reports</h2>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-forest-600 hover:text-forest-700 font-medium"
              >
                All Reports
              </button>
            </div>

            <div className="space-y-2">
              {reports.slice(0, 2).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onNavigate('reports')}
                  className="p-2.5 rounded-lg border border-paper-border hover:bg-paper cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-ink truncate max-w-[190px]">{rep.title}</span>
                  <ExternalLink size={12} className="text-ink-muted shrink-0" />
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-3 text-xs text-ink-muted">No reports written yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
