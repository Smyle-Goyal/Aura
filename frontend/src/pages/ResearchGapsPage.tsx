import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Filter,
  Check,
  X,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Project, CandidateGap, GapCategory } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface ResearchGapsProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
}

const CATEGORY_LABELS: Record<GapCategory, string> = {
  methodological: 'Methodological Gap',
  dataset_coverage: 'Dataset & Coverage Gap',
  evaluation: 'Evaluation & Benchmark Gap',
  generalization_robustness: 'Generalization & Robustness',
  reproducibility: 'Reproducibility & Transparency',
  contradictory_findings: 'Contradictory Empirical Findings',
  underexplored_applications: 'Underexplored Domain Applications'
};

export const ResearchGapsPage: React.FC<ResearchGapsProps> = ({
  activeProject,
  projects,
  onNavigate
}) => {
  const [gaps, setGaps] = useState<CandidateGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('');
  const [expandedGapId, setExpandedGapId] = useState<string | null>(null);

  // Review note modal / input state
  const [reviewingGapId, setReviewingGapId] = useState<string | null>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [pendingDecision, setPendingDecision] = useState<'promising' | 'rejected' | 'investigating'>('promising');

  // Discover state
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [focusDomain, setFocusDomain] = useState('');

  useEffect(() => {
    loadGaps();
  }, [activeProject?.id, selectedCategory, selectedReviewStatus]);

  const loadGaps = async () => {
    try {
      setLoading(true);
      const data = await api.listGaps({
        project_id: activeProject?.id || undefined,
        category: selectedCategory || undefined,
        review_status: selectedReviewStatus || undefined
      });
      setGaps(data);
      if (data.length > 0 && !expandedGapId) {
        setExpandedGapId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiscovery = async () => {
    const projId = activeProject?.id || projects[0]?.id;
    if (!projId) {
      alert('Please select or create a project workspace first.');
      return;
    }

    setIsDiscovering(true);
    try {
      const discovered = await api.discoverGaps({
        project_id: projId,
        focus_domain: focusDomain || undefined
      });
      setGaps([...discovered, ...gaps]);
      if (discovered.length > 0) setExpandedGapId(discovered[0].id);
    } catch (err: any) {
      alert(err.message || 'Gap discovery failed.');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleOpenReviewModal = (gapId: string, decision: 'promising' | 'rejected' | 'investigating') => {
    setReviewingGapId(gapId);
    setPendingDecision(decision);
    setReviewerNote('');
  };

  const handleConfirmReview = async () => {
    if (!reviewingGapId) return;
    try {
      const updated = await api.reviewGap(reviewingGapId, pendingDecision, reviewerNote);
      setGaps(gaps.map((g) => (g.id === updated.id ? updated : g)));
      setReviewingGapId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="amber" className="mb-2">Phase 5: Research Gap Engine</Badge>
          <h1 className="editorial-header text-3xl font-medium text-ink">Evidence-Grounded Research Gaps</h1>
          <p className="text-sm text-ink-light mt-1">
            Discover unresolved boundaries across your literature collection.
            Author-stated limitations are explicitly distinguished from model-inferred hypotheses.
          </p>
        </div>

        <button
          onClick={handleRunDiscovery}
          disabled={isDiscovering}
          className="px-4 py-2.5 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition shadow-paper-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Sparkles size={16} />
          {isDiscovering ? 'Analyzing Corpus...' : 'Discover New Gaps'}
        </button>
      </div>

      {/* Filter and Category Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-paper-card p-3 rounded-xl border border-paper-border shadow-paper-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-paper border border-paper-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="">All 7 Gap Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
              <option key={cat} value={cat}>{label}</option>
            ))}
          </select>

          <select
            value={selectedReviewStatus}
            onChange={(e) => setSelectedReviewStatus(e.target.value)}
            className="bg-paper border border-paper-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="">All Review Decisions</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="promising">Promising</option>
            <option value="investigating">Under Investigation</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <span className="text-xs text-ink-muted self-end md:self-auto">
          Showing <strong>{gaps.length}</strong> candidate gaps
        </span>
      </div>

      {/* Candidate Gaps List */}
      <div className="space-y-4">
        {gaps.map((gap) => {
          const isExpanded = expandedGapId === gap.id;
          return (
            <div
              key={gap.id}
              className={`paper-card transition overflow-hidden ${
                isExpanded ? 'ring-2 ring-forest-100 border-paper-borderDark' : 'hover:border-paper-borderDark'
              }`}
            >
              {/* Gap Summary Row */}
              <div
                onClick={() => setExpandedGapId(isExpanded ? null : gap.id)}
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="sage" size="sm">
                      {CATEGORY_LABELS[gap.category] || gap.category}
                    </Badge>
                    <Badge
                      variant={
                        gap.evidence_strength === 'strong'
                          ? 'forest'
                          : gap.evidence_strength === 'moderate'
                          ? 'sage'
                          : 'amber'
                      }
                      size="sm"
                    >
                      Evidence: {gap.evidence_strength}
                    </Badge>
                    <Badge
                      variant={
                        gap.review_status === 'promising'
                          ? 'forest'
                          : gap.review_status === 'rejected'
                          ? 'red'
                          : gap.review_status === 'investigating'
                          ? 'amber'
                          : 'ink'
                      }
                      size="sm"
                    >
                      {gap.review_status}
                    </Badge>
                    <span className="text-xs text-ink-muted">
                      {gap.supporting_papers.length} supporting papers
                    </span>
                  </div>

                  <h3 className="editorial-header text-xl font-medium text-ink leading-snug">
                    {gap.title}
                  </h3>
                  <p className="text-xs text-ink-light line-clamp-2">
                    {gap.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Quick Decision Action buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenReviewModal(gap.id, 'promising')}
                      className={`p-1.5 rounded-lg transition ${
                        gap.review_status === 'promising'
                          ? 'bg-forest-100 text-forest-700'
                          : 'hover:bg-forest-50 text-ink-muted hover:text-forest-700'
                      }`}
                      title="Mark as Promising"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(gap.id, 'investigating')}
                      className={`p-1.5 rounded-lg transition ${
                        gap.review_status === 'investigating'
                          ? 'bg-amber-100 text-amber-700'
                          : 'hover:bg-amber-50 text-ink-muted hover:text-amber-700'
                      }`}
                      title="Mark as Investigating"
                    >
                      <Clock size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(gap.id, 'rejected')}
                      className={`p-1.5 rounded-lg transition ${
                        gap.review_status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'hover:bg-red-50 text-ink-muted hover:text-red-700'
                      }`}
                      title="Reject Gap"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-1 text-ink-muted">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Drawer */}
              {isExpanded && (
                <div className="p-6 border-t border-paper-border bg-paper/40 space-y-6 text-xs">
                  {/* Significance Rationale */}
                  {gap.significance_rationale && (
                    <div className="p-4 bg-paper-card rounded-xl border border-paper-border">
                      <span className="font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                        Academic & Practical Significance
                      </span>
                      <p className="font-serif text-ink text-sm leading-relaxed">
                        {gap.significance_rationale}
                      </p>
                    </div>
                  )}

                  {/* Two Columns: Author-Stated Limitations vs Inferred Hypotheses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: Author Limitations (Explicit in corpus) */}
                    <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-800 font-semibold uppercase tracking-wider text-[11px]">
                        <AlertCircle size={14} /> Explicit Author-Stated Limitations
                      </div>
                      <ul className="space-y-1.5 font-serif text-ink italic leading-relaxed">
                        {gap.author_stated_limitations.map((lim, idx) => (
                          <li key={idx} className="p-2 bg-paper-card rounded border border-amber-100">
                            "{lim}"
                          </li>
                        ))}
                        {gap.author_stated_limitations.length === 0 && (
                          <li className="text-ink-muted not-italic">No verbatim limitation quotes found.</li>
                        )}
                      </ul>
                    </div>

                    {/* Right: Testable Hypotheses (Model-Formulated) */}
                    <div className="p-4 bg-forest-50/40 rounded-xl border border-forest-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-forest-800 font-semibold uppercase tracking-wider text-[11px]">
                        <FlaskConical size={14} /> Inferred Testable Hypotheses
                      </div>
                      <ul className="space-y-1.5 font-serif text-ink leading-relaxed">
                        {gap.testable_hypotheses.map((hyp, idx) => (
                          <li key={idx} className="p-2 bg-paper-card rounded border border-forest-100">
                            <strong>H{idx + 1}:</strong> {hyp}
                          </li>
                        ))}
                        {gap.testable_hypotheses.length === 0 && (
                          <li className="text-ink-muted">No explicit hypothesis formulated.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Suggested Experiments & Potential Metrics */}
                  <div className="p-4 bg-paper-card rounded-xl border border-paper-border space-y-3">
                    <span className="font-semibold text-ink-muted uppercase tracking-wider block">
                      Suggested Empirical Experiments & Evaluation Benchmarks
                    </span>
                    <div className="space-y-2">
                      {gap.suggested_experiments.map((exp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-forest-600 font-bold">•</span>
                          <span className="text-ink-light">{exp}</span>
                        </div>
                      ))}
                    </div>

                    {gap.potential_metrics.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-ink-muted font-medium">Recommended Metrics:</span>
                        <div className="flex flex-wrap gap-1">
                          {gap.potential_metrics.map((m, idx) => (
                            <Badge key={idx} variant="ink" size="sm">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supporting Source Passages */}
                  {gap.supporting_papers.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-semibold text-ink-muted uppercase tracking-wider block">
                        Supporting Grounded Citations ({gap.supporting_papers.length})
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gap.supporting_papers.map((sp, idx) => (
                          <div key={idx} className="p-3 bg-paper-card rounded-lg border border-paper-border space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-ink truncate max-w-[200px]">{sp.paper_title}</span>
                              <Badge variant="sage" size="sm">Page {sp.page || 'N/A'}</Badge>
                            </div>
                            <p className="font-serif italic text-ink-light text-[11px] line-clamp-2">
                              "{sp.quoted_passage}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Notes / Audit Trail */}
                  {gap.user_notes && (
                    <div className="p-3 bg-paper rounded-lg border border-paper-border text-[11px] text-ink-light whitespace-pre-line">
                      <span className="font-semibold text-ink block mb-1">Reviewer Annotations:</span>
                      {gap.user_notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {gaps.length === 0 && !loading && (
          <EmptyState
            icon={Sparkles}
            title="No candidate research gaps found"
            description="Run the Research Gap Engine to analyze limitations and discover unaddressed research directions across your collection."
            actionText="Discover Gaps"
            onAction={handleRunDiscovery}
          />
        )}
      </div>

      {/* Review Modal */}
      {reviewingGapId && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-card border border-paper-border rounded-2xl shadow-paper-lg max-w-md w-full p-6 space-y-4">
            <h3 className="editorial-header text-xl font-medium text-ink">
              Review Research Gap
            </h3>
            <p className="text-xs text-ink-light">
              Marking this gap as <strong className="capitalize">{pendingDecision}</strong>. Add review notes or experimental observations.
            </p>

            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                Reviewer Notes & Action Items
              </label>
              <textarea
                rows={3}
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="e.g. Discussed in research seminar; prioritize for next submission..."
                className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none focus:border-forest-500"
              />
            </div>

            <div className="pt-2 border-t border-paper-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingGapId(null)}
                className="px-3.5 py-1.5 border border-paper-border rounded-lg text-xs font-medium text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition"
              >
                Save Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
