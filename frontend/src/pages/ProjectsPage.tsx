import React, { useState, useEffect } from 'react';
import { Plus, FolderKanban, Archive, Trash2, Edit3, ArrowRight, BookOpen, Sparkles, Check } from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';

interface ProjectsPageProps {
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNavigate: (screen: any) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  activeProject,
  onSelectProject,
  onNavigate
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [researchQuestion, setResearchQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.listProjects(true);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setTitle(project.title);
      setDescription(project.description || '');
      setResearchQuestion(project.research_question || '');
    } else {
      setEditingProject(null);
      setTitle('');
      setDescription('');
      setResearchQuestion('');
    }
    setError(null);
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      if (editingProject) {
        const updated = await api.updateProject(editingProject.id, {
          title,
          description,
          research_question: researchQuestion
        });
        setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
        if (activeProject?.id === updated.id) onSelectProject(updated);
      } else {
        const created = await api.createProject({
          title,
          description,
          research_question: researchQuestion
        });
        setProjects([created, ...projects]);
        onSelectProject(created);
      }
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.updateProject(project.id, {
        is_archived: !project.is_archived
      });
      setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProject?.id === updated.id) onSelectProject(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this research project? Associated links will be cleaned.')) return;
    try {
      await api.deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-border pb-6">
        <div>
          <Badge variant="forest" className="mb-2">Workspaces</Badge>
          <h1 className="editorial-header text-3xl font-medium text-ink">Research Projects</h1>
          <p className="text-sm text-ink-light mt-1">
            Organize papers into dedicated investigation workspaces with bound research questions.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-forest-500 hover:bg-forest-600 text-white rounded-xl text-sm font-medium transition shadow-paper-sm flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const isActive = activeProject?.id === project.id;
          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`paper-card p-6 cursor-pointer transition relative flex flex-col justify-between ${
                isActive
                  ? 'border-forest-500 ring-2 ring-forest-100 shadow-paper-md'
                  : 'hover:border-paper-borderDark hover:shadow-paper'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-forest-50 text-forest-700">
                      <FolderKanban size={18} />
                    </span>
                    {isActive && (
                      <Badge variant="forest" size="sm">
                        <Check size={12} className="inline mr-1" /> Active Workspace
                      </Badge>
                    )}
                    {project.is_archived && (
                      <Badge variant="ink" size="sm">Archived</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenModal(project)}
                      className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper transition"
                      title="Edit project"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={(e) => handleToggleArchive(project, e)}
                      className="p-1.5 text-ink-muted hover:text-ink rounded-lg hover:bg-paper transition"
                      title={project.is_archived ? "Unarchive" : "Archive"}
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h2 className="editorial-header text-xl font-medium text-ink mb-2 leading-snug">
                  {project.title}
                </h2>
                
                {project.research_question ? (
                  <div className="p-3 bg-paper rounded-lg border border-paper-border text-xs text-ink-light mb-3 italic">
                    <span className="font-semibold text-ink not-italic block mb-0.5">Primary Question:</span>
                    "{project.research_question}"
                  </div>
                ) : (
                  <p className="text-xs text-ink-light mb-3 line-clamp-2">
                    {project.description || 'No description provided.'}
                  </p>
                )}
              </div>

              {/* Stats Footer */}
              <div className="pt-4 border-t border-paper-border flex items-center justify-between text-xs text-ink-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-forest-600" />
                    <strong>{project.paper_count}</strong> papers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <strong>{project.gap_count}</strong> gaps
                  </span>
                </div>
                <button
                  onClick={() => {
                    onSelectProject(project);
                    onNavigate('library');
                  }}
                  className="text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
                >
                  Explore <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && !loading && (
        <EmptyState
          icon={FolderKanban}
          title="No research projects yet"
          description="Create your first research workspace to organize papers, compare findings, and run agentic research."
          actionText="Create Project"
          onAction={() => handleOpenModal()}
        />
      )}

      {/* Create / Edit Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-card border border-paper-border rounded-2xl shadow-paper-lg max-w-lg w-full p-6">
            <h3 className="editorial-header text-2xl font-medium text-ink mb-1">
              {editingProject ? 'Edit Research Project' : 'New Research Project'}
            </h3>
            <p className="text-xs text-ink-light mb-6">
              Define the scope and primary inquiry for this literature collection.
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Robustness in Retrieval-Augmented Generation"
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-sm text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Primary Research Question
                </label>
                <textarea
                  rows={3}
                  value={researchQuestion}
                  onChange={(e) => setResearchQuestion(e.target.value)}
                  placeholder="e.g. What chunking strategies minimize factual drift across contradictory sources?"
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-sm text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
                  Scope & Background Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context regarding benchmarks, scope, and target academic venues..."
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-sm text-ink focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="pt-4 border-t border-paper-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-paper-border rounded-lg text-xs font-medium text-ink hover:bg-paper transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-4 py-2 bg-forest-500 hover:bg-forest-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-paper-sm"
                >
                  {isSubmitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
