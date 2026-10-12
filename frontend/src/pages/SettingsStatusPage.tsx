import React, { useState, useEffect } from 'react';
import {
  Settings,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Key,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { HealthResponse } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';

export const SettingsStatusPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Health check failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-paper-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="forest" className="mb-2">System Diagnostics</Badge>
          <h1 className="editorial-header text-3xl font-medium text-ink">Settings & System Status</h1>
          <p className="text-sm text-ink-light mt-1">
            Real-time status of local development dependencies, relational storage, Qdrant vector indices, and Gemini AI models.
          </p>
        </div>

        <button
          onClick={loadHealth}
          disabled={refreshing}
          className="px-4 py-2 bg-paper hover:bg-paper-muted border border-paper-border text-ink rounded-xl text-xs font-medium transition shadow-paper-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking...' : 'Refresh Diagnostics'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Status Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Relational Database Card */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-forest-600" />
                <h3 className="font-medium text-sm text-ink">Relational Database</h3>
              </div>
              <Badge variant={health.services.database.includes('healthy') ? 'forest' : 'red'}>
                {health.services.database.includes('healthy') ? 'Connected' : 'Degraded'}
              </Badge>
            </div>
            <p className="text-xs text-ink-light">
              Engine: <strong>{health.details?.database_type || 'SQLAlchemy / SQLite'}</strong>
            </p>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Stores projects, papers metadata, chunk bounds, workflow run histories, candidate research gaps, and reports.
            </p>
          </div>

          {/* 2. Qdrant Vector Storage Card */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-forest-600" />
                <h3 className="font-medium text-sm text-ink">Qdrant Vector Database</h3>
              </div>
              <Badge variant={health.services.qdrant.includes('healthy') ? 'forest' : 'amber'}>
                {health.services.qdrant}
              </Badge>
            </div>
            <p className="text-xs text-ink-light">
              Active Collection: <strong>{health.details?.qdrant_collection}</strong> (Cosine 768-dim)
            </p>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Operates in embedded local path mode (`./data/qdrant`) or connects seamlessly to remote Docker/Qdrant servers.
            </p>
          </div>

          {/* 3. Gemini AI Models Card */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-amber-500" />
                <h3 className="font-medium text-sm text-ink">Gemini API & Embeddings</h3>
              </div>
              <Badge variant={health.services.gemini_api.includes('configured') && !health.services.gemini_api.includes('unconfigured') ? 'forest' : 'sage'}>
                {health.services.gemini_api.includes('unconfigured') ? 'Offline Mode' : 'Online'}
              </Badge>
            </div>
            <div className="space-y-1 text-xs text-ink-light">
              <div>Generation Model: <strong>{health.services.active_models.chat_completion}</strong></div>
              <div>Embedding Model: <strong>{health.services.active_models.embedding}</strong></div>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              When unconfigured, AURA activates deterministic grounded synthesis so local tests and document exploration work out-of-the-box.
            </p>
          </div>

          {/* 4. Document Storage & Chunking Parameters */}
          <div className="paper-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-forest-600" />
                <h3 className="font-medium text-sm text-ink">PDF Ingestion & Storage</h3>
              </div>
              <Badge variant={health.services.file_storage === 'available' ? 'forest' : 'red'}>
                {health.services.file_storage}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-light">
              <div>Max Upload: <strong>{health.details?.max_file_size_mb} MB</strong></div>
              <div>Chunk Size: <strong>{health.details?.default_chunk_size} chars</strong></div>
              <div>Chunk Overlap: <strong>{health.details?.default_chunk_overlap} chars</strong></div>
              <div>Environment: <strong>{health.environment}</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Reference Guide */}
      <div className="paper-card p-6 space-y-4">
        <h3 className="editorial-header text-xl font-medium text-ink">
          Environment & Deployment Reference
        </h3>
        <p className="text-xs text-ink-light leading-relaxed">
          To configure production credentials or connect external instances, edit your <code className="px-1 py-0.5 bg-paper rounded text-forest-700 font-mono">.env</code> file:
        </p>

        <div className="p-4 bg-paper rounded-xl border border-paper-border font-mono text-xs text-ink space-y-1 overflow-x-auto">
          <div><span className="text-forest-600"># Set your Gemini API key for live inference</span></div>
          <div>GEMINI_API_KEY=your_gemini_api_key_here</div>
          <div className="pt-2"><span className="text-forest-600"># For PostgreSQL in production:</span></div>
          <div>DATABASE_URL=postgresql://user:password@localhost:5432/aura_db</div>
          <div className="pt-2"><span className="text-forest-600"># For remote Qdrant container:</span></div>
          <div>QDRANT_URL=http://localhost:6333</div>
        </div>
      </div>
    </div>
  );
};
