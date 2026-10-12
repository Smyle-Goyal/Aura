import React, { useState, useEffect } from 'react';
import {
  Columns,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  ArrowRight,
  BookOpen,
  Scale,
  GitCommit
} from 'lucide-react';
import { Project, Paper, ComparisonResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

interface MultiPaperComparisonProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
}

export const MultiPaperComparisonPage: React.FC<MultiPaperComparisonProps> = ({
  activeProject,
  projects,
  onNavigate
}) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [researchQuestion, setResearchQuestion] = useState(
    activeProject?.research_question || 'Compare architectural paradigms, retrieval latency, and factual hallucination trade-offs.'
  );

  const [comparisons, setComparisons] = useState<ComparisonResponse[]>([]);
  const [activeComparison, setActiveComparison] = useState<ComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab inside comparison: 'methodology' | 'datasets' | 'findings' | 'consensus_dispute'
  const [activeMatrixTab, setActiveMatrixTab] = useState<'methodology' | 'datasets' | 'findings' | 'consensus_dispute'>('methodology');

  useEffect(() => {
    loadData();
  }, [activeProject?.id]);

  const loadData = async () => {
    try {
      const [pList, compList] = await Promise.all([
        api.listPapers(activeProject ? { project_id: activeProject.id } : undefined),
        api.listComparisons(activeProject ? activeProject.id : undefined)
      ]);
      setPapers(pList);
      setComparisons(compList);

      // Pre-select first 2-3 papers if available
      if (pList.length >= 2) {
        setSelectedPaperIds([pList[0].id, pList[1].id]);
      }
      if (compList.length > 0) {
        setActiveComparison(compList[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePaper = (id: string) => {
    if (selectedPaperIds.includes(id)) {
      setSelectedPaperIds(selectedPaperIds.filter((p) => p !== id));
    } else {
      setSelectedPaperIds([...selectedPaperIds, id]);
    }
  };

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPaperIds.length < 2) {
      setError('Please select at least 2 papers to compare.');
      return;
    }
    if (!researchQuestion.trim()) return;

    const projectId = activeProject?.id || projects[0]?.id;
    if (!projectId) {
      setError('A research project is required for comparisons.');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const res = await api.createComparison({
        project_id: projectId,
        paper_ids: selectedPaperIds,
        research_question: researchQuestion,
        title: `Comparison: ${researchQuestion.slice(0, 45)}...`
      });
      setActiveComparison(res);
      setComparisons([res, ...comparisons]);
    } catch (err: any) {
      setError(err.message || 'Comparison synthesis failed.');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-6">
        <Badge variant="forest" className="mb-2">Phase 3: Multi-Paper Intelligence</Badge>
        <h1 className="editorial-header text-3xl font-medium text-ink">Multi-Paper Analytical Comparison</h1>
        <p className="text-sm text-ink-light mt-1">
          Investigate shared inquiries across multiple studies. AURA generates structured matrices for
          methodologies, benchmark datasets, evaluation metrics, and detects areas of consensus versus contradiction.
        </p>
      </div>

      {/* Comparison Configuration Card */}
      <div className="paper-card p-6 space-y-5">
        <h3 className="editorial-header text-lg font-medium text-ink">
          Select Publications & Analytical Inquiry
        </h3>

        {/* Paper Selection Chips */}
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
            Selected Papers ({selectedPaperIds.length} chosen, min 2)
          </label>
          <div className="flex flex-wrap gap-2">
            {papers.map((p) => {
              const selected = selectedPaperIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleTogglePaper(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                    selected
                      ? 'bg-forest-50 border-forest-300 text-forest-700 shadow-paper-sm'
                      : 'bg-paper border-paper-border text-ink-light hover:bg-paper-muted'
                  }`}
                >
                  <BookOpen size={12} className={selected ? 'text-forest-600' : 'text-ink-muted'} />
                  <span className="max-w-[220px] truncate">{p.title}</span>
                </button>
              );
            })}
            {papers.length === 0 && (
              <p className="text-xs text-ink-muted">No papers available in scope. Ingest papers first.</p>
            )}
          </div>
        </div>

        {/* Question and Submit */}
        <form onSubmit={handleRunComparison} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Comparison Research Question
            </label>
            <input
              type="text"
              value={researchQuestion}
              onChange={(e) => setResearchQuestion(e.target.value)}
              placeholder="e.g. Compare methodology and limitations across dense retrieval and long context models."
              className="w-full px-3 py-2.5 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none focus:border-forest-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-ink-muted">
              Distinguishes explicit paper statements from synthesized inferences.
            </span>
            <button
              type="submit"
              disabled={isComparing || selectedPaperIds.length < 2}
              className="px-4 py-2 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-paper-sm flex items-center gap-2"
            >
              <Scale size={14} />
              {isComparing ? 'Synthesizing Matrices...' : 'Generate Multi-Paper Comparison'}
            </button>
          </div>
        </form>
      </div>

      {/* Comparison Results Section */}
      {activeComparison && (
        <div className="space-y-6">
          {/* Narrative Synthesis Card */}
          <div className="bg-paper-card border border-paper-border rounded-xl p-6 shadow-paper space-y-3">
            <div className="flex items-center justify-between border-b border-paper-border pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="forest">Cross-Paper Synthesis</Badge>
                <span className="text-xs text-ink-muted">
                  Comparing {activeComparison.paper_ids.length} publications
                </span>
              </div>
              <span className="text-xs text-ink-muted">
                {new Date(activeComparison.created_at).toLocaleDateString()}
              </span>
            </div>

            <h2 className="editorial-header text-xl font-medium text-ink">
              {activeComparison.research_question}
            </h2>

            <div className="font-serif text-ink text-sm sm:text-base leading-relaxed bg-paper/60 p-4 rounded-xl border border-paper-border">
              {activeComparison.synthesis_narrative}
            </div>
          </div>

          {/* Structured Matrices Tabs */}
          <div className="bg-paper-card border border-paper-border rounded-xl shadow-paper overflow-hidden">
            <div className="flex border-b border-paper-border bg-paper/50 overflow-x-auto">
              <button
                onClick={() => setActiveMatrixTab('methodology')}
                className={`px-5 py-3 text-xs font-medium border-b-2 transition shrink-0 ${
                  activeMatrixTab === 'methodology'
                    ? 'border-forest-600 text-forest-700 bg-paper-card font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                1. Methodology Matrix
              </button>
              <button
                onClick={() => setActiveMatrixTab('datasets')}
                className={`px-5 py-3 text-xs font-medium border-b-2 transition shrink-0 ${
                  activeMatrixTab === 'datasets'
                    ? 'border-forest-600 text-forest-700 bg-paper-card font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                2. Datasets & Metrics
              </button>
              <button
                onClick={() => setActiveMatrixTab('findings')}
                className={`px-5 py-3 text-xs font-medium border-b-2 transition shrink-0 ${
                  activeMatrixTab === 'findings'
                    ? 'border-forest-600 text-forest-700 bg-paper-card font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                3. Findings & Limitations
              </button>
              <button
                onClick={() => setActiveMatrixTab('consensus_dispute')}
                className={`px-5 py-3 text-xs font-medium border-b-2 transition shrink-0 ${
                  activeMatrixTab === 'consensus_dispute'
                    ? 'border-forest-600 text-forest-700 bg-paper-card font-semibold'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                4. Consensus & Contradictions
              </button>
            </div>

            <div className="p-6">
              {/* Methodology Matrix */}
              {activeMatrixTab === 'methodology' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-paper-border text-ink-muted uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 pr-4 font-semibold">Publication</th>
                        <th className="py-2.5 px-4 font-semibold">Paradigm</th>
                        <th className="py-2.5 px-4 font-semibold">Architecture / Method</th>
                        <th className="py-2.5 px-4 font-semibold">Reported Strengths</th>
                        <th className="py-2.5 pl-4 font-semibold">Reported Weaknesses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-border">
                      {activeComparison.methodology_matrix.map((row, i) => (
                        <tr key={i} className="hover:bg-paper/40 transition">
                          <td className="py-3.5 pr-4 font-medium text-ink max-w-[200px]">
                            {row.paper_title}
                          </td>
                          <td className="py-3.5 px-4 text-ink-light">
                            <Badge variant="sage" size="sm">{row.paradigm}</Badge>
                          </td>
                          <td className="py-3.5 px-4 text-ink font-mono text-[11px]">
                            {row.architecture_or_method}
                          </td>
                          <td className="py-3.5 px-4 text-forest-800">
                            <ul className="list-disc list-inside space-y-1">
                              {row.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </td>
                          <td className="py-3.5 pl-4 text-ink-light">
                            <ul className="list-disc list-inside space-y-1">
                              {row.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Dataset & Metrics Matrix */}
              {activeMatrixTab === 'datasets' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-paper-border text-ink-muted uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 pr-4 font-semibold">Publication</th>
                        <th className="py-2.5 px-4 font-semibold">Datasets Tested</th>
                        <th className="py-2.5 px-4 font-semibold">Evaluation Metrics</th>
                        <th className="py-2.5 px-4 font-semibold">Reported Results</th>
                        <th className="py-2.5 pl-4 font-semibold">Benchmark Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-border">
                      {activeComparison.dataset_metric_matrix.map((row, i) => (
                        <tr key={i} className="hover:bg-paper/40 transition">
                          <td className="py-3.5 pr-4 font-medium text-ink max-w-[200px]">
                            {row.paper_title}
                          </td>
                          <td className="py-3.5 px-4 text-ink-light">
                            <div className="flex flex-wrap gap-1">
                              {row.datasets_used.map((d, idx) => (
                                <Badge key={idx} variant="ink" size="sm">{d}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-ink font-mono text-[11px]">
                            {row.evaluation_metrics.join(', ')}
                          </td>
                          <td className="py-3.5 px-4 text-ink font-serif leading-relaxed">
                            {row.reported_results}
                          </td>
                          <td className="py-3.5 pl-4 text-ink-muted italic">
                            {row.benchmark_notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Findings & Limitations Matrix */}
              {activeMatrixTab === 'findings' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-paper-border text-ink-muted uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 pr-4 font-semibold">Publication</th>
                        <th className="py-2.5 px-4 font-semibold">Key Empirical Findings</th>
                        <th className="py-2.5 px-4 font-semibold">Author-Stated Limitations</th>
                        <th className="py-2.5 pl-4 font-semibold">Implied Weaknesses</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-border">
                      {activeComparison.findings_limitations_matrix.map((row, i) => (
                        <tr key={i} className="hover:bg-paper/40 transition">
                          <td className="py-3.5 pr-4 font-medium text-ink max-w-[200px]">
                            {row.paper_title}
                          </td>
                          <td className="py-3.5 px-4 text-ink font-serif leading-relaxed">
                            <ul className="list-disc list-inside space-y-1">
                              {row.key_findings.map((f, idx) => <li key={idx}>{f}</li>)}
                            </ul>
                          </td>
                          <td className="py-3.5 px-4 text-amber-700 bg-amber-50/30 p-2 rounded">
                            <ul className="list-disc list-inside space-y-1">
                              {row.author_limitations.map((l, idx) => <li key={idx}>{l}</li>)}
                            </ul>
                          </td>
                          <td className="py-3.5 pl-4 text-ink-light">
                            <ul className="list-disc list-inside space-y-1">
                              {row.implied_weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Consensus & Contradiction Cards */}
              {activeMatrixTab === 'consensus_dispute' && (
                <div className="space-y-6">
                  {/* Consensus Points */}
                  <div>
                    <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-forest-600" /> Consensus Agreements Across Studies
                    </h4>
                    <div className="space-y-3">
                      {activeComparison.agreements.map((a, idx) => (
                        <div key={idx} className="p-4 bg-forest-50/40 rounded-xl border border-forest-200/60 text-xs space-y-1.5">
                          <span className="font-semibold text-forest-900 block text-sm font-serif">
                            "{a.claim}"
                          </span>
                          <p className="text-forest-800 leading-relaxed">{a.evidence_summary}</p>
                          <div className="text-[11px] text-forest-700 pt-1">
                            Corroborating papers: {a.supporting_papers.join(' • ')}
                          </div>
                        </div>
                      ))}
                      {activeComparison.agreements.length === 0 && (
                        <p className="text-xs text-ink-muted">No explicit consensus points detected.</p>
                      )}
                    </div>
                  </div>

                  {/* Contradictions / Disputes */}
                  <div>
                    <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-500" /> Active Contradictions & Methodological Disputes
                    </h4>
                    <div className="space-y-3">
                      {activeComparison.disagreements.map((d, idx) => (
                        <div key={idx} className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 text-xs space-y-2">
                          <Badge variant="amber" size="sm">{d.dimension}</Badge>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            <div className="p-2.5 bg-paper rounded border border-paper-border">
                              <span className="font-semibold text-ink block mb-1">Perspective A ({d.paper_a}):</span>
                              <p className="text-ink-light">{d.perspective_a}</p>
                            </div>
                            <div className="p-2.5 bg-paper rounded border border-paper-border">
                              <span className="font-semibold text-ink block mb-1">Perspective B ({d.paper_b}):</span>
                              <p className="text-ink-light">{d.perspective_b}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-amber-800 italic pt-1">
                            <strong>Divergence Rationale:</strong> {d.divergence_rationale}
                          </p>
                        </div>
                      ))}
                      {activeComparison.disagreements.length === 0 && (
                        <p className="text-xs text-ink-muted">No sharp empirical contradictions identified.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
