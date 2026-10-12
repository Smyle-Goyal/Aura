import {
  Project,
  Paper,
  IngestionJob,
  RAGResponse,
  ComparisonResponse,
  ResearchRun,
  CandidateGap,
  ResearchReport,
  ResearchNote,
  DiscoveryResponse,
  HealthResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorDetail = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch (_) {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // System Health
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },

  // Projects
  async listProjects(includeArchived = false): Promise<Project[]> {
    return request<Project[]>(`/projects?include_archived=${includeArchived}`);
  },

  async createProject(data: { title: string; description?: string; research_question?: string }): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getProject(projectId: string): Promise<Project> {
    return request<Project>(`/projects/${projectId}`);
  },

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    return request<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteProject(projectId: string): Promise<void> {
    return request<void>(`/projects/${projectId}`, { method: 'DELETE' });
  },

  // Papers
  async listPapers(params?: { project_id?: string; search?: string; status?: string }): Promise<Paper[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return request<Paper[]>(`/papers?${q.toString()}`);
  },

  async getPaper(paperId: string): Promise<Paper> {
    return request<Paper>(`/papers/${paperId}`);
  },

  async uploadPaper(formData: FormData): Promise<Paper> {
    return request<Paper>('/papers/upload', {
      method: 'POST',
      body: formData
    });
  },

  async assignPaperToProject(paperId: string, projectId: string): Promise<{ status: string }> {
    const body = new FormData();
    body.append('project_id', projectId);
    return request<{ status: string }>(`/papers/${paperId}/assign-project`, {
      method: 'POST',
      body
    });
  },

  async deletePaper(paperId: string): Promise<void> {
    return request<void>(`/papers/${paperId}`, { method: 'DELETE' });
  },

  // Ingestion
  async getIngestionStatus(paperId: string): Promise<IngestionJob> {
    return request<IngestionJob>(`/ingestion/status/${paperId}`);
  },

  async retryIngestion(paperId: string): Promise<IngestionJob> {
    return request<IngestionJob>('/ingestion/retry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId })
    });
  },

  // RAG Question Answering
  async querySinglePaper(paperId: string, question: string, topK = 5): Promise<RAGResponse> {
    return request<RAGResponse>('/rag/query/paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId, question, top_k: topK })
    });
  },

  async queryCollection(projectId: string, question: string, paperIds?: string[], topK = 8): Promise<RAGResponse> {
    return request<RAGResponse>('/rag/query/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, question, paper_ids: paperIds, top_k: topK })
    });
  },

  // Multi-Paper Comparisons
  async createComparison(data: {
    project_id: string;
    paper_ids: string[];
    research_question: string;
    title?: string;
  }): Promise<ComparisonResponse> {
    return request<ComparisonResponse>('/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async listComparisons(projectId?: string): Promise<ComparisonResponse[]> {
    const q = projectId ? `?project_id=${projectId}` : '';
    return request<ComparisonResponse[]>(`/comparisons${q}`);
  },

  async getComparison(comparisonId: string): Promise<ComparisonResponse> {
    return request<ComparisonResponse>(`/comparisons/${comparisonId}`);
  },

  // Agentic Workflows
  async createResearchRun(data: {
    project_id: string;
    objective: string;
    paper_ids?: string[];
  }): Promise<ResearchRun> {
    return request<ResearchRun>('/workflows/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async listResearchRuns(projectId?: string): Promise<ResearchRun[]> {
    const q = projectId ? `?project_id=${projectId}` : '';
    return request<ResearchRun[]>(`/workflows/runs${q}`);
  },

  async getResearchRun(runId: string): Promise<ResearchRun> {
    return request<ResearchRun>(`/workflows/runs/${runId}`);
  },

  async cancelResearchRun(runId: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/workflows/runs/${runId}/cancel`, {
      method: 'POST'
    });
  },

  // Research Gaps
  async discoverGaps(data: { project_id: string; paper_ids?: string[]; focus_domain?: string }): Promise<CandidateGap[]> {
    return request<CandidateGap[]>('/gaps/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async listGaps(params?: {
    project_id?: string;
    category?: string;
    review_status?: string;
    evidence_strength?: string;
  }): Promise<CandidateGap[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.category) q.set('category', params.category);
    if (params?.review_status) q.set('review_status', params.review_status);
    if (params?.evidence_strength) q.set('evidence_strength', params.evidence_strength);
    return request<CandidateGap[]>(`/gaps?${q.toString()}`);
  },

  async getGap(gapId: string): Promise<CandidateGap> {
    return request<CandidateGap>(`/gaps/${gapId}`);
  },

  async reviewGap(gapId: string, decision: 'promising' | 'rejected' | 'investigating' | 'unreviewed', reviewerNote?: string): Promise<CandidateGap> {
    return request<CandidateGap>(`/gaps/${gapId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewer_note: reviewerNote })
    });
  },

  // Scholarly Discovery
  async searchLiterature(params: {
    query: string;
    provider?: string;
    limit?: number;
    year_start?: number;
    year_end?: number;
  }): Promise<DiscoveryResponse> {
    const q = new URLSearchParams();
    q.set('query', params.query);
    if (params.provider) q.set('provider', params.provider);
    if (params.limit) q.set('limit', String(params.limit));
    if (params.year_start) q.set('year_start', String(params.year_start));
    if (params.year_end) q.set('year_end', String(params.year_end));
    return request<DiscoveryResponse>(`/discovery/search?${q.toString()}`);
  },

  async importDiscoveredPaper(data: {
    source_id: string;
    title: string;
    authors?: string;
    publication_year?: number;
    abstract?: string;
    doi?: string;
    url?: string;
    project_id?: string;
  }): Promise<{ status: string; paper_id: string; message: string }> {
    return request<{ status: string; paper_id: string; message: string }>('/discovery/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Reports
  async listReports(projectId?: string): Promise<ResearchReport[]> {
    const q = projectId ? `?project_id=${projectId}` : '';
    return request<ResearchReport[]>(`/reports${q}`);
  },

  async createReport(data: {
    project_id: string;
    run_id?: string;
    title: string;
    abstract?: string;
    content_markdown: string;
  }): Promise<ResearchReport> {
    return request<ResearchReport>('/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getReport(reportId: string): Promise<ResearchReport> {
    return request<ResearchReport>(`/reports/${reportId}`);
  },

  getReportMarkdownExportUrl(reportId: string): string {
    return `${API_BASE}/reports/${reportId}/export/markdown`;
  },

  // Notes
  async listNotes(params?: { project_id?: string; paper_id?: string }): Promise<ResearchNote[]> {
    const q = new URLSearchParams();
    if (params?.project_id) q.set('project_id', params.project_id);
    if (params?.paper_id) q.set('paper_id', params.paper_id);
    return request<ResearchNote[]>(`/notes?${q.toString()}`);
  },

  async createNote(data: { project_id: string; paper_id?: string; title: string; content: string; tags?: string }): Promise<ResearchNote> {
    return request<ResearchNote>('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateNote(noteId: string, data: { title?: string; content?: string; tags?: string }): Promise<ResearchNote> {
    return request<ResearchNote>(`/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteNote(noteId: string): Promise<void> {
    return request<void>(`/notes/${noteId}`, { method: 'DELETE' });
  }
};
