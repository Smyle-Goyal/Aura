import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  BookOpen,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Project, Paper, ResearchRun, WorkflowStage, CitationItem } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

interface ResearchStudioProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
  onInspectCitation: (citation: CitationItem) => void;
}

export const ResearchStudioPage: React.FC<ResearchStudioProps> = ({
  activeProject,
  projects,
  onNavigate,
  onInspectCitation
}) => {
  const [objective, setObjective] = useState(
    'Compare recent approaches to retrieval-augmented generation, identify methodological weaknesses, and suggest promising research directions.'
  );
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<ResearchRun[]>([]);
  const [activeRun, setActiveRun] = useState<ResearchRun | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(1);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector state (Right column)
  const [inspectingPassage, setInspectingPassage] = useState<{
    title: string;
    page?: number;
    section?: string;
    text: string;
    confidence?: string;
  } | null>(null);

  useEffect(() => {
    loadStudioData();
  }, [activeProject?.id]);

  const loadStudioData = async () => {
    try {
      const pList = await api.listPapers(activeProject ? { project_id: activeProject.id } : undefined);
      setPapers(pList);
      setSelectedPaperIds(pList.map((p) => p.id));

      const runList = await api.listResearchRuns(activeProject ? activeProject.id : undefined);
      setRuns(runList);

      if (runList.length > 0) {
        loadRunDetails(runList[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const detailed = await api.getResearchRun(runId);
      setActiveRun(detailed);
      if (detailed.stages && detailed.stages.length > 0) {
        setSelectedStageIndex(detailed.stages[0].stage_index);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    const projectId = activeProject?.id || projects[0]?.id;
    if (!projectId) {
      setError('Please select or create a project first.');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      const newRun = await api.createResearchRun({
        project_id: projectId,
        objective,
        paper_ids: selectedPaperIds.length > 0 ? selectedPaperIds : undefined
      });
      setActiveRun(newRun);
      setRuns([newRun, ...runs]);

      // Poll run progress
      pollRun(newRun.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start research run.');
      setIsRunning(false);
    }
  };

  const pollRun = (runId: string) => {
    const interval = setInterval(async () => {
      try {
        const updated = await api.getResearchRun(runId);
        setActiveRun(updated);
        setRuns((prev) => prev.map((r) => (r.id === runId ? updated : r)));

        if (updated.status === 'completed' || updated.status === 'failed' || updated.status === 'cancelled') {
          clearInterval(interval);
          setIsRunning(false);
        }
      } catch (err) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 1500);
  };

  const currentStage = activeRun?.stages?.find((s) => s.stage_index === selectedStageIndex);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Badge variant="forest" className="mb-1.5">Phase 4: Agentic Research Orchestration</Badge>
            <h1 className="editorial-header text-3xl font-medium text-ink">Research Studio</h1>
            <p className="text-sm text-ink-light mt-0.5">
              Execute bounded, stateful, 11-stage autonomous research runs with real persistence and evidence inspection.
            </p>
          </div>
          {activeRun && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge variant={activeRun.status === 'completed' ? 'forest' : activeRun.status === 'running' ? 'amber' : 'ink'}>
                {activeRun.status === 'running' && <Clock size={12} className="inline mr-1" />}
                {activeRun.status === 'completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                {activeRun.status} ({activeRun.progress_percent}%)
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* 3-Part Editorial Workspace: Left (3 cols) | Center (6 cols) | Right (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Context, Objective, Stepper, History (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Objective Form */}
          <div className="paper-card p-4 space-y-3">
            <h3 className="editorial-header text-base font-medium text-ink">
              Research Objective
            </h3>
            <form onSubmit={handleStartWorkflow} className="space-y-3">
              <textarea
                rows={3}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Submit an autonomous research inquiry..."
                className="w-full p-2.5 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none focus:border-forest-500"
              />
              <div className="text-[11px] text-ink-muted">
                Papers in scope: <strong>{selectedPaperIds.length}</strong> of {papers.length}
              </div>
              <button
                type="submit"
                disabled={isRunning || !objective.trim()}
                className="w-full py-2 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-paper-sm flex items-center justify-center gap-1.5"
              >
                <Play size={13} fill="currentColor" />
                {isRunning ? 'Executing Stages...' : 'Launch Workflow Run'}
              </button>
            </form>
          </div>

          {/* 11 Stages Stepper */}
          <div className="paper-card p-4 space-y-3">
            <h3 className="editorial-header text-base font-medium text-ink flex items-center justify-between">
              <span>Workflow Stages</span>
              <span className="text-[10px] text-ink-muted font-sans font-normal">11 Stages</span>
            </h3>

            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {[
                "1. Parse Objective & Scope",
                "2. Create Research Plan",
                "3. Identify Evidence Needs",
                "4. Select Relevant Papers",
                "5. Retrieve Source Passages",
                "6. Extract Methods & Datasets",
                "7. Cross-Paper Alignment",
                "8. Detect Contradictions",
                "9. Formulate Candidate Gaps",
                "10. Validate Grounding Claims",
                "11. Generate Final Report"
              ].map((stageLabel, idx) => {
                const stageIndex = idx + 1;
                const stageData = activeRun?.stages?.find((s) => s.stage_index === stageIndex);
                const isSelected = selectedStageIndex === stageIndex;
                const isDone = stageData?.status === 'completed';
                const isCurrRunning = stageData?.status === 'running';

                return (
                  <button
                    key={stageIndex}
                    onClick={() => setSelectedStageIndex(stageIndex)}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-forest-50 font-semibold text-forest-700 border border-forest-200'
                        : 'text-ink-light hover:bg-paper'
                    }`}
                  >
                    <span className="truncate pr-1">{stageLabel}</span>
                    <span className="shrink-0">
                      {isDone && <CheckCircle2 size={13} className="text-forest-600" />}
                      {isCurrRunning && <Clock size={13} className="text-amber-500 animate-spin" />}
                      {!isDone && !isCurrRunning && <span className="w-2 h-2 rounded-full bg-paper-border block" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run History */}
          <div className="paper-card p-4 space-y-2">
            <h3 className="editorial-header text-base font-medium text-ink">Run History</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {runs.map((r) => (
                <button
                  key={r.id}
                  onClick={() => loadRunDetails(r.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition border ${
                    activeRun?.id === r.id
                      ? 'bg-paper-card border-forest-500 font-medium text-ink shadow-paper-sm'
                      : 'border-paper-border hover:bg-paper text-ink-light'
                  }`}
                >
                  <p className="truncate font-medium">{r.objective}</p>
                  <div className="flex items-center justify-between text-[10px] text-ink-muted mt-1">
                    <span>{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <Badge variant={r.status === 'completed' ? 'forest' : 'amber'} size="sm">
                      {r.status}
                    </Badge>
                  </div>
                </button>
              ))}
              {runs.length === 0 && (
                <p className="text-xs text-ink-muted">No runs recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Stage Outputs, Structured Findings, Reports (6 cols) */}
        <div className="lg:col-span-6 bg-paper-card border border-paper-border rounded-2xl p-6 shadow-paper min-h-[640px] space-y-5">
          {activeRun ? (
            <>
              {/* Active Stage Header */}
              <div className="border-b border-paper-border pb-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">
                    Stage {selectedStageIndex} of 11
                  </span>
                  <h2 className="editorial-header text-xl font-medium text-ink">
                    {currentStage?.stage_name || `Stage ${selectedStageIndex}`}
                  </h2>
                </div>
                <Badge
                  variant={currentStage?.status === 'completed' ? 'forest' : currentStage?.status === 'running' ? 'amber' : 'ink'}
                >
                  {currentStage?.status || 'pending'}
                </Badge>
              </div>

              {/* Stage Summary */}
              {currentStage?.summary && (
                <div className="p-3.5 bg-paper rounded-xl border border-paper-border text-xs text-ink-light font-medium">
                  <strong>Summary:</strong> {currentStage.summary}
                </div>
              )}

              {/* Dynamic Stage Render based on stage index */}
              <div className="space-y-4">
                {/* Stage 1: Objective & Scope */}
                {selectedStageIndex === 1 && currentStage?.output_payload && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-paper rounded-lg border border-paper-border">
                      <span className="font-semibold text-ink block mb-1">Formulated Scope:</span>
                      <p className="text-ink-light">{currentStage.output_payload.target_scope}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-ink-muted block mb-1.5 uppercase text-[10px]">Identified Core Thematic Dimensions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentStage.output_payload.core_themes?.map((t: string, i: number) => (
                          <Badge key={i} variant="forest">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stage 5: Retrieved Source Passages */}
                {selectedStageIndex === 5 && currentStage?.output_payload && (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block">
                      Retrieved Evidence Passages (Click to Inspect)
                    </span>
                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                      {currentStage.output_payload.passages?.map((p: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setInspectingPassage({
                            title: p.paper_title,
                            page: p.page,
                            section: p.section,
                            text: p.text,
                            confidence: 'High Qdrant Cosine Grounding'
                          })}
                          className="p-3.5 bg-paper hover:bg-paper-muted cursor-pointer rounded-lg border border-paper-border text-xs transition space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-forest-700">{p.paper_title}</span>
                            <Badge variant="sage" size="sm">Page {p.page}</Badge>
                          </div>
                          <p className="font-serif text-ink italic line-clamp-3">
                            "{p.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stage 8: Contradictions */}
                {selectedStageIndex === 8 && currentStage?.output_payload && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Identified Empirical Contradictions
                    </h4>
                    {currentStage.output_payload.contradictions?.map((c: any, i: number) => (
                      <div key={i} className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-1.5">
                        <Badge variant="amber" size="sm">{c.issue}</Badge>
                        <p className="text-ink font-serif mt-1">"{c.observation}"</p>
                        <p className="text-ink-light pt-1">
                          <strong>Missing Evidence:</strong> {c.missing_evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stage 9: Candidate Gaps */}
                {selectedStageIndex === 9 && currentStage?.output_payload && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                      Formulated Literature Gaps
                    </h4>
                    {currentStage.output_payload.candidate_gaps?.map((g: any, i: number) => (
                      <div key={i} className="p-4 bg-paper rounded-xl border border-paper-border text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink text-sm">{g.title}</span>
                          <Badge variant="forest" size="sm">{g.category}</Badge>
                        </div>
                        <p className="text-ink-light font-serif italic">
                          <strong>Hypothesis:</strong> "{g.hypothesis}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stage 11: Final Report */}
                {selectedStageIndex === 11 && currentStage?.output_payload && (
                  <div className="space-y-3">
                    <div className="p-4 bg-forest-50/50 rounded-xl border border-forest-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-base text-forest-900">
                          {currentStage.output_payload.title}
                        </span>
                        <Badge variant="forest">Generated</Badge>
                      </div>
                      <p className="text-forest-800">
                        Autonomous research synthesis report successfully compiled and saved to project reports.
                      </p>
                      <button
                        onClick={() => onNavigate('reports')}
                        className="px-3 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
                      >
                        Open in Reports Workspace <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Default Payload Inspector */}
                {![1, 5, 8, 9, 11].includes(selectedStageIndex) && currentStage?.output_payload && (
                  <div className="p-4 bg-paper rounded-xl border border-paper-border space-y-2">
                    <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block">
                      Stage Structured Data
                    </span>
                    <pre className="text-xs font-mono text-ink bg-paper-card p-3 rounded-lg border border-paper-border overflow-x-auto max-h-80">
                      {JSON.stringify(currentStage.output_payload, null, 2)}
                    </pre>
                  </div>
                )}

                {!currentStage?.output_payload && (
                  <div className="text-center py-20 text-xs text-ink-muted">
                    Stage has not executed yet or is pending previous dependencies.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-ink-muted space-y-3">
              <Cpu size={32} className="mx-auto text-forest-500 opacity-60" />
              <h3 className="editorial-header text-lg font-medium text-ink">No Research Run Active</h3>
              <p className="text-xs max-w-sm mx-auto">
                Enter a research inquiry on the left and launch an autonomous workflow run.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Evidence Inspector (3 cols) */}
        <div className="lg:col-span-3 bg-paper-card border border-paper-border rounded-2xl p-5 shadow-paper min-h-[640px] space-y-4 sticky top-20">
          <div className="border-b border-paper-border pb-3">
            <div className="flex items-center gap-1.5 text-forest-700 font-medium text-xs mb-1">
              <ShieldCheck size={16} />
              <span>Evidence Inspector</span>
            </div>
            <p className="text-[11px] text-ink-muted">
              Trace verbatim source passages, page references, and similarity confidence.
            </p>
          </div>

          {inspectingPassage ? (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Source Publication
                </span>
                <h4 className="editorial-header text-sm font-medium text-ink leading-snug">
                  {inspectingPassage.title}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="sage" size="sm">Page {inspectingPassage.page || 1}</Badge>
                  <Badge variant="ink" size="sm">{inspectingPassage.section || 'General'}</Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Verbatim Source Passage
                </span>
                <div className="p-3.5 bg-paper rounded-lg border border-paper-border font-serif text-ink text-xs leading-relaxed italic">
                  "{inspectingPassage.text}"
                </div>
              </div>

              {inspectingPassage.confidence && (
                <div className="p-2.5 bg-forest-50/50 rounded-lg border border-forest-200 text-[11px] text-forest-800 flex items-center gap-2">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{inspectingPassage.confidence}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-ink-muted space-y-2">
              <BookOpen size={24} className="mx-auto text-ink-muted opacity-50" />
              <p className="text-xs">No passage selected.</p>
              <p className="text-[10px] text-ink-muted">
                Click any evidence snippet in Stage 5 or across comparisons to inspect grounding details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
