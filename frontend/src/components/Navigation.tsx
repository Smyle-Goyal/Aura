import React from 'react';
import {
  BookOpen,
  FolderKanban,
  FileText,
  UploadCloud,
  Columns,
  Cpu,
  Sparkles,
  Compass,
  FileCheck2,
  Settings,
  ChevronDown,
  Plus,
  Activity,
  Layers
} from 'lucide-react';
import { ScreenView, Project, HealthResponse } from '../types';

interface NavigationProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  health: HealthResponse | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentScreen,
  onNavigate,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  health
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const navItems: Array<{ screen: ScreenView; label: string; icon: any; section: string }> = [
    { screen: 'dashboard', label: 'Home Dashboard', icon: Layers, section: 'Core' },
    { screen: 'projects', label: 'Research Projects', icon: FolderKanban, section: 'Core' },
    { screen: 'library', label: 'Paper Library', icon: BookOpen, section: 'Literature' },
    { screen: 'upload', label: 'Upload & Ingest', icon: UploadCloud, section: 'Literature' },
    { screen: 'reader', label: 'Paper Reader & AI', icon: FileText, section: 'Literature' },
    { screen: 'comparison', label: 'Multi-Paper Compare', icon: Columns, section: 'Intelligence' },
    { screen: 'studio', label: 'Research Studio', icon: Cpu, section: 'Intelligence' },
    { screen: 'gaps', label: 'Research Gaps', icon: Sparkles, section: 'Intelligence' },
    { screen: 'discover', label: 'Discover Literature', icon: Compass, section: 'Writing & Discovery' },
    { screen: 'reports', label: 'Reports & Writing', icon: FileCheck2, section: 'Writing & Discovery' },
    { screen: 'settings', label: 'Settings & Status', icon: Settings, section: 'System' },
  ];

  const sections = ['Core', 'Literature', 'Intelligence', 'Writing & Discovery', 'System'];

  return (
    <>
      {/* Top Header */}
      <header className="h-16 bg-paper-card border-b border-paper-border px-6 flex items-center justify-between sticky top-0 z-30 shadow-paper-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-forest-500 text-white flex items-center justify-center shadow-paper-sm">
              <span className="font-serif font-bold text-lg leading-none">A</span>
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-ink block leading-none">AURA</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-muted block mt-0.5 font-medium">Research Studio</span>
            </div>
          </div>

          <div className="h-5 w-px bg-paper-border hidden md:block" />

          {/* Active Project Selector */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-paper-border bg-paper hover:bg-paper-muted text-ink text-xs font-medium transition"
            >
              <FolderKanban size={14} className="text-forest-600" />
              <span className="max-w-[200px] truncate">
                {activeProject ? activeProject.title : 'Select Project'}
              </span>
              <ChevronDown size={14} className="text-ink-muted" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-paper-card border border-paper-border rounded-lg shadow-paper-md py-1 z-50">
                <div className="px-3 py-2 border-b border-paper-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Active Workspace</span>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNewProject();
                    }}
                    className="text-xs text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={12} /> New Project
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-paper transition ${
                        activeProject?.id === p.id ? 'bg-forest-50 font-semibold text-forest-700' : 'text-ink'
                      }`}
                    >
                      <span className="truncate pr-2">{p.title}</span>
                      <span className="text-[10px] text-ink-muted shrink-0">{p.paper_count} papers</span>
                    </button>
                  ))}
                  {projects.length === 0 && (
                    <div className="p-3 text-center text-xs text-ink-muted">No projects created yet</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Status */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-paper-border bg-paper text-xs text-ink-light cursor-pointer hover:bg-paper-muted transition"
            title="System Status"
          >
            <div className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-forest-500' : 'bg-amber-500'}`} />
            <span className="text-[11px] font-medium hidden sm:inline">
              {health ? (health.status === 'healthy' ? 'System Online' : 'Degraded') : 'Connecting...'}
            </span>
          </div>
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-paper-sm"
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </header>

      {/* Left Navigation Rail */}
      <aside className="w-64 bg-paper-card border-r border-paper-border min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {sections.map((section) => {
            const sectionItems = navItems.filter((i) => i.section === section);
            return (
              <div key={section}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted px-3 mb-1.5 block">
                  {section}
                </span>
                <nav className="space-y-0.5">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => onNavigate(item.screen)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          isActive
                            ? 'bg-forest-50 text-forest-700 font-semibold shadow-paper-sm'
                            : 'text-ink-light hover:bg-paper hover:text-ink'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-forest-600' : 'text-ink-muted'} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Bottom context notice */}
        <div className="p-3 bg-paper rounded-lg border border-paper-border text-[11px] text-ink-muted leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-ink mb-1">
            <Activity size={12} className="text-forest-600" /> Grounded Ingest
          </div>
          Evidence citations strictly map to source passages with zero fabrication.
        </div>
      </aside>
    </>
  );
};
