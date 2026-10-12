export type ScreenView = 
  | 'dashboard'
  | 'projects'
  | 'library'
  | 'upload'
  | 'reader'
  | 'comparison'
  | 'studio'
  | 'gaps'
  | 'discover'
  | 'reports'
  | 'settings';

export interface Project {
  id: string;
  title: string;
  description?: string;
  research_question?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  paper_count: number;
  run_count: number;
  report_count: number;
  gap_count: number;
  paper_ids?: string[];
}

export interface PaperChunk {
  id: string;
  chunk_index: number;
  page_number?: number;
  section?: string;
  content: string;
  token_count: number;
}

export interface Paper {
  id: string;
  title: string;
  authors?: string;
  publication_year?: number;
  abstract?: string;
  doi?: string;
  url?: string;
  venue?: string;
  tags?: string;
  file_name?: string;
  file_size_bytes: number;
  page_count: number;
  ingestion_status: 'pending' | 'processing' | 'completed' | 'failed' | 'metadata_only';
  ingestion_error?: string;
  created_at: string;
  updated_at: string;
  chunk_count: number;
  project_ids: string[];
  chunks?: PaperChunk[];
}

export interface IngestionJob {
  id: string;
  paper_id: string;
  status: string;
  current_stage: string;
  total_pages: number;
  total_chunks: number;
  error_message?: string;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CitationItem {
  citation_id: number;
  paper_id: string;
  paper_title: string;
  page_number?: number;
  section?: string;
  snippet: string;
  similarity_score: number;
}

export interface RAGResponse {
  question: string;
  answer: string;
  citations: CitationItem[];
  model_used: string;
  retrieval_scope: string;
  confidence_assessment: string;
  retrieved_chunk_count: number;
}

export interface MethodologyItem {
  paper_id: string;
  paper_title: string;
  paradigm: string;
  architecture_or_method: string;
  strengths: string[];
  weaknesses: string[];
}

export interface DatasetMetricItem {
  paper_id: string;
  paper_title: string;
  datasets_used: string[];
  evaluation_metrics: string[];
  reported_results: string;
  benchmark_notes: string;
}

export interface FindingsLimitationsItem {
  paper_id: string;
  paper_title: string;
  key_findings: string[];
  author_limitations: string[];
  implied_weaknesses: string[];
}

export interface ConsensusPoint {
  claim: string;
  supporting_papers: string[];
  evidence_summary: string;
}

export interface ContradictionPoint {
  dimension: string;
  perspective_a: string;
  paper_a: string;
  perspective_b: string;
  paper_b: string;
  divergence_rationale: string;
}

export interface ComparisonResponse {
  id: string;
  project_id: string;
  title: string;
  research_question: string;
  paper_ids: string[];
  methodology_matrix: MethodologyItem[];
  dataset_metric_matrix: DatasetMetricItem[];
  findings_limitations_matrix: FindingsLimitationsItem[];
  agreements: ConsensusPoint[];
  disagreements: ContradictionPoint[];
  synthesis_narrative: string;
  created_at: string;
}

export interface WorkflowStage {
  id: string;
  stage_index: number;
  stage_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  summary?: string;
  input_payload?: any;
  output_payload?: any;
  started_at?: string;
  completed_at?: string;
}

export interface ResearchRun {
  id: string;
  project_id: string;
  objective: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percent: number;
  current_stage_name: string;
  selected_paper_ids: string[];
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  stages?: WorkflowStage[];
}

export type GapCategory = 
  | 'methodological'
  | 'dataset_coverage'
  | 'evaluation'
  | 'generalization_robustness'
  | 'reproducibility'
  | 'contradictory_findings'
  | 'underexplored_applications';

export interface CandidateGap {
  id: string;
  project_id: string;
  title: string;
  description: string;
  category: GapCategory;
  supporting_papers: Array<{
    paper_id: string;
    paper_title: string;
    page?: number;
    section?: string;
    quoted_passage: string;
  }>;
  author_stated_limitations: string[];
  conflicting_findings: string[];
  significance_rationale?: string;
  candidate_research_questions: string[];
  testable_hypotheses: string[];
  suggested_experiments: string[];
  potential_metrics: string[];
  evidence_strength: 'strong' | 'moderate' | 'preliminary' | 'insufficient';
  evidence_justification?: string;
  missing_evidence_notes?: string;
  uncertainty_rating: 'low' | 'medium' | 'high';
  review_status: 'unreviewed' | 'promising' | 'rejected' | 'investigating';
  user_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchReport {
  id: string;
  project_id: string;
  run_id?: string;
  title: string;
  abstract?: string;
  content_markdown: string;
  structured_sections?: any;
  citations?: any[];
  created_at: string;
  updated_at: string;
}

export interface ResearchNote {
  id: string;
  project_id: string;
  paper_id?: string;
  title: string;
  content: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredPaperItem {
  source_id: string;
  provider: string;
  title: string;
  authors: string[];
  publication_year?: number;
  venue?: string;
  abstract?: string;
  doi?: string;
  url?: string;
  citation_count?: number;
  is_open_access: boolean;
  open_access_pdf_url?: string;
  can_download_full_text: boolean;
}

export interface DiscoveryResponse {
  query: string;
  provider: string;
  total_results: number;
  papers: DiscoveredPaperItem[];
  external_service_status: string;
}

export interface ServiceHealthStatus {
  database: string;
  qdrant: string;
  gemini_api: string;
  file_storage: string;
  active_models: Record<string, string>;
}

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  environment: string;
  services: ServiceHealthStatus;
  details?: Record<string, any>;
}
