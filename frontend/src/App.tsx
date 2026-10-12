import React, { useState, useEffect } from 'react';
import { ScreenView, Project, CitationItem, HealthResponse } from './types';
import { api } from './services/api';
import { Navigation } from './components/Navigation';
import { CitationInspectorModal } from './components/CitationInspectorModal';

import { HomeDashboardPage } from './pages/HomeDashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PaperLibraryPage } from './pages/PaperLibraryPage';
import { UploadIngestPage } from './pages/UploadIngestPage';
import { PaperReaderPage } from './pages/PaperReaderPage';
import { MultiPaperComparisonPage } from './pages/MultiPaperComparisonPage';
import { ResearchStudioPage } from './pages/ResearchStudioPage';
import { ResearchGapsPage } from './pages/ResearchGapsPage';
import { DiscoverPapersPage } from './pages/DiscoverPapersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsStatusPage } from './pages/SettingsStatusPage';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Cross-screen interaction states
  const [readerPaperId, setReaderPaperId] = useState<string | null>(null);
  const [inspectingCitation, setInspectingCitation] = useState<CitationItem | null>(null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectQuestion, setNewProjectQuestion] = useState('');

  useEffect(() => {
    loadAppInitialData();
  }, []);

  const loadAppInitialData = async () => {
    try {
      const [hData, pList] = await Promise.all([
        api.getHealth(),
        api.listProjects(false)
      ]);
      setHealth(hData);
      setProjects(pList);
      if (pList.length > 0 && !activeProject) {
        setActiveProject(pList[0]);
      }
    } catch (err) {
      console.error('Failed to initialize app state:', err);
    }
  };

  const handleSelectPaperForReader = (paperId: string) => {
    setReaderPaperId(paperId);
    setCurrentScreen('reader');
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    try {
      const created = await api.createProject({
        title: newProjectTitle,
        research_question: newProjectQuestion
      });
      setProjects([created, ...projects]);
      setActiveProject(created);
      setNewProjectModalOpen(false);
      setNewProjectTitle('');
      setNewProjectQuestion('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans text-ink antialiased">
      {/* Top Header & Left Navigation Rail */}
      <Navigation
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={setActiveProject}
        onNewProject={() => setNewProjectModalOpen(true)}
        health={health}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {currentScreen === 'dashboard' && (
            <HomeDashboardPage
              activeProject={activeProject}
              onNavigate={setCurrentScreen}
              onSelectPaperForReader={handleSelectPaperForReader}
              onInspectCitation={setInspectingCitation}
            />
          )}

          {currentScreen === 'projects' && (
            <ProjectsPage
              activeProject={activeProject}
              onSelectProject={setActiveProject}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'library' && (
            <PaperLibraryPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
              onSelectPaperForReader={handleSelectPaperForReader}
            />
          )}

          {currentScreen === 'upload' && (
            <UploadIngestPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
              onSelectPaperForReader={handleSelectPaperForReader}
            />
          )}

          {currentScreen === 'reader' && (
            <PaperReaderPage
              paperId={readerPaperId}
              onInspectCitation={setInspectingCitation}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'comparison' && (
            <MultiPaperComparisonPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'studio' && (
            <ResearchStudioPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
              onInspectCitation={setInspectingCitation}
            />
          )}

          {currentScreen === 'gaps' && (
            <ResearchGapsPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'discover' && (
            <DiscoverPapersPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'reports' && (
            <ReportsPage
              activeProject={activeProject}
              projects={projects}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsStatusPage />
          )}
        </main>
      </div>

      {/* Citation Inspector Modal */}
      <CitationInspectorModal
        citation={inspectingCitation}
        onClose={() => setInspectingCitation(null)}
        onOpenPaper={handleSelectPaperForReader}
      />

      {/* Quick New Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper-card border border-paper-border rounded-2xl shadow-paper-lg max-w-md w-full p-6 space-y-4">
            <h3 className="editorial-header text-xl font-medium text-ink">
              New Research Project
            </h3>
            <p className="text-xs text-ink-light">
              Create an organized workspace for literature synthesis.
            </p>

            <form onSubmit={handleCreateNewProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. LLM Multi-Agent Coordination Protocols"
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                  Primary Research Question
                </label>
                <textarea
                  rows={2}
                  value={newProjectQuestion}
                  onChange={(e) => setNewProjectQuestion(e.target.value)}
                  placeholder="e.g. How does agent communication topology affect task completion latency?"
                  className="w-full px-3 py-2 bg-paper border border-paper-border rounded-lg text-xs text-ink focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-paper-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewProjectModalOpen(false)}
                  className="px-3.5 py-1.5 border border-paper-border rounded-lg text-xs font-medium text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProjectTitle.trim()}
                  className="px-4 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
