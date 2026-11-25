import { Menu, Moon, Plus, Sun } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface TopBarProps {
  activeTab: NavTab;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onNewScan: () => void;
}

const VIEW_LABELS: Record<NavTab, { section: string; description: string }> = {
  overview: {
    section: 'Operations Overview',
    description: 'Network-wide pavement health & recent AI detections',
  },
  scanner: {
    section: 'AI Road Scanner',
    description: 'Upload road imagery for automated pothole & crack classification',
  },
  inspections: {
    section: 'Inspections Log',
    description: 'Searchable defect records & maintenance dispatch workflow',
  },
  reports: {
    section: 'Reports & Analytics',
    description: 'Condition trends, cost backlog & exportable municipal reports',
  },
  corridors: {
    section: 'Monitored Corridors',
    description: 'Arterial coverage, PCI scores & sector inspection health',
  },
};

export function TopBar({
  activeTab,
  isDark,
  onToggleTheme,
  onOpenMobileMenu,
  onNewScan,
}: TopBarProps) {
  const current = VIEW_LABELS[activeTab];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
            ROADSCAN AI
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
            {current.section}
          </h1>
        </div>
      </div>

      <p className="hidden xl:block text-xs text-slate-500 dark:text-slate-400 truncate">
        {current.description}
      </p>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="p-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {activeTab !== 'scanner' && (
          <button
            type="button"
            onClick={onNewScan}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scan Road Image</span>
          </button>
        )}
      </div>
    </header>
  );
}
