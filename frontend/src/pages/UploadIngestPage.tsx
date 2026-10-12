import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FolderKanban,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Project, Paper } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

interface UploadIngestProps {
  activeProject: Project | null;
  projects: Project[];
  onNavigate: (screen: any) => void;
  onSelectPaperForReader: (paperId: string) => void;
}

interface UploadQueueItem {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  currentStage: string;
  paperId?: string;
  error?: string;
}

export const UploadIngestPage: React.FC<UploadIngestProps> = ({
  activeProject,
  projects,
  onNavigate,
  onSelectPaperForReader
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || '');
  const [titleOverride, setTitleOverride] = useState('');
  const [authorsOverride, setAuthorsOverride] = useState('');
  const [yearOverride, setYearOverride] = useState<string>('');

  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        alert(`"${file.name}" is not a PDF. Only .pdf files are supported.`);
        continue;
      }

      const queueId = `${Date.now()}-${i}`;
      const item: UploadQueueItem = {
        id: queueId,
        fileName: file.name,
        fileSize: file.size,
        status: 'uploading',
        currentStage: 'Uploading PDF to server...'
      };

      setQueue((prev) => [item, ...prev]);

      // Execute upload
      const formData = new FormData();
      formData.append('file', file);
      if (selectedProjectId) formData.append('project_id', selectedProjectId);
      if (titleOverride && files.length === 1) formData.append('title', titleOverride);
      if (authorsOverride && files.length === 1) formData.append('authors', authorsOverride);
      if (yearOverride && files.length === 1) formData.append('publication_year', yearOverride);

      try {
        const uploadedPaper = await api.uploadPaper(formData);
        
        // Update item in queue to processing
        setQueue((prev) =>
          prev.map((q) =>
            q.id === queueId
              ? {
                  ...q,
                  paperId: uploadedPaper.id,
                  status: 'processing',
                  currentStage: 'Parsing text & generating vector embeddings...'
                }
              : q
          )
        );

        // Poll ingestion status until completed or failed
        pollIngestion(uploadedPaper.id, queueId);
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === queueId
              ? {
                  ...q,
                  status: 'failed',
                  error: err.message || 'Upload failed'
                }
              : q
          )
        );
      }
    }

    // Reset overrides
    setTitleOverride('');
    setAuthorsOverride('');
    setYearOverride('');
  };

  const pollIngestion = async (paperId: string, queueId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const status = await api.getIngestionStatus(paperId);
        if (status.status === 'completed') {
          clearInterval(interval);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === queueId
                ? {
                    ...q,
                    status: 'completed',
                    currentStage: `Completed (${status.total_pages} pages, ${status.total_chunks} chunks)`
                  }
                : q
            )
          );
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setQueue((prev) =>
            prev.map((q) =>
              q.id === queueId
                ? {
                    ...q,
                    status: 'failed',
                    error: status.error_message || 'Ingestion processing failed'
                  }
                : q
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === queueId
                ? {
                    ...q,
                    currentStage: status.current_stage || 'Processing...'
                  }
                : q
            )
          );
        }
      } catch (err) {
        // continue polling
      }

      if (attempts > 30) {
        clearInterval(interval);
      }
    }, 1500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-6">
        <Badge variant="forest" className="mb-2">Phase 1: Ingestion & Indexing</Badge>
        <h1 className="editorial-header text-3xl font-medium text-ink">Upload Research Literature</h1>
        <p className="text-sm text-ink-light mt-1">
          Upload academic PDFs. AURA extracts page-level metadata, detects structural sections, splits text with overlap,
          and indexes semantic embeddings into Qdrant.
        </p>
      </div>

      {/* Target Project Selection */}
      <div className="paper-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
              Assign to Research Project Workspace
            </label>
            <p className="text-xs text-ink-light">
              Uploaded papers will be automatically associated with this project.
            </p>
          </div>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
          >
            <option value="">No Project (Uncategorized Library)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        {/* Optional Metadata Override */}
        <div className="pt-4 border-t border-paper-border">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-3">
            Optional Metadata Overrides (for single paper uploads)
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder="Custom Paper Title (optional)"
              className="px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
            />
            <input
              type="text"
              value={authorsOverride}
              onChange={(e) => setAuthorsOverride(e.target.value)}
              placeholder="Authors (comma-separated, optional)"
              className="px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
            />
            <input
              type="number"
              value={yearOverride}
              onChange={(e) => setYearOverride(e.target.value)}
              placeholder="Publication Year (optional)"
              className="px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
          dragActive
            ? 'border-forest-500 bg-forest-50/60'
            : 'border-paper-border hover:border-forest-400 bg-paper-card'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mb-4">
          <UploadCloud size={32} />
        </div>
        <h3 className="editorial-header text-xl font-medium text-ink mb-1">
          Drop academic PDF files here
        </h3>
        <p className="text-xs text-ink-light mb-4">
          Supports single or multiple PDF documents up to 50MB per paper.
        </p>
        <span className="px-4 py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition shadow-paper-sm">
          Browse Computer
        </span>
      </div>

      {/* Ingestion Queue & Job Status */}
      {queue.length > 0 && (
        <div className="space-y-4">
          <h3 className="editorial-header text-xl font-medium text-ink">
            Ingestion Pipeline Activity
          </h3>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="paper-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-paper border border-paper-border text-forest-700">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-ink">{item.fileName}</h4>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
                      <span>{(item.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{item.currentStage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      item.status === 'completed'
                        ? 'forest'
                        : item.status === 'failed'
                        ? 'red'
                        : 'amber'
                    }
                  >
                    {item.status === 'completed' && <CheckCircle2 size={12} className="inline mr-1" />}
                    {item.status === 'failed' && <AlertCircle size={12} className="inline mr-1" />}
                    {item.status === 'processing' && <Clock size={12} className="inline mr-1" />}
                    {item.status}
                  </Badge>

                  {item.paperId && item.status === 'completed' && (
                    <button
                      onClick={() => onSelectPaperForReader(item.paperId!)}
                      className="px-3 py-1 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-lg text-xs font-medium transition flex items-center gap-1"
                    >
                      Open in Reader <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
