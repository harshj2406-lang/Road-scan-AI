import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  ScanLine,
  X,
} from 'lucide-react';
import type { UserProfile } from '../types/roadscan';

export type NavTab = 'overview' | 'scanner' | 'inspections' | 'reports' | 'corridors';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scanner', label: 'AI Scanner', icon: ScanLine },
  { id: 'inspections', label: 'Inspections', icon: ClipboardList },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'corridors', label: 'Corridors', icon: Map },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarBody = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 shrink-0">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleSelect('overview')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-600 rounded"
        >
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-slate-900 dark:bg-amber-500 text-amber-400 dark:text-slate-950">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="w-4.5 h-4.5"
              aria-hidden="true"
            >
              <path d="M5 19L9 5M19 19L15 5M12 7v3M12 14v3" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
            ROADSCAN AI
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/src/assets/images/inspector_avatar_1795598712758.jpg"
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-md text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Guest Operator · Read &amp; Scan
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex shrink-0">{sidebarBody}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
