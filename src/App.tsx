import { useCallback, useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import { CorridorsView } from './components/CorridorsView';
import { InspectionDetailModal } from './components/InspectionDetailModal';
import { InspectionsView } from './components/InspectionsView';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ReportsAnalyticsView } from './components/ReportsAnalyticsView';
import { RoadScannerView } from './components/RoadScannerView';
import { Sidebar, type NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import type {
  DashboardAnalytics,
  RepairStatus,
  RoadScan,
  UserProfile,
} from './types/roadscan';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth state kept strictly in React memory (never persisted to localStorage)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [scans, setScans] = useState<RoadScan[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [selectedScan, setSelectedScan] = useState<RoadScan | null>(null);
  const [corridorFilter, setCorridorFilter] = useState<string>('All');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const fetchData = useCallback(async () => {
    try {
      const [scansRes, analyticsRes] = await Promise.all([
        fetch('/api/scans'),
        fetch('/api/analytics'),
      ]);
      if (!scansRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to load inspection data.');
      }
      const scansJson = (await scansRes.json()) as { scans: RoadScan[] };
      const analyticsJson = (await analyticsRes.json()) as DashboardAnalytics;
      setScans(scansJson.scans);
      setAnalytics(analyticsJson);
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to load road scan data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleScanSaved = (savedScan: RoadScan) => {
    setScans((prev) => [savedScan, ...prev]);
    void fetchData();
  };

  const handleUpdateStatus = async (id: string, repairStatus: RepairStatus) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ repairStatus }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { scan: RoadScan };
    setScans((prev) => prev.map((s) => (s.id === id ? data.scan : s)));
    setSelectedScan((prev) => (prev && prev.id === id ? data.scan : prev));
    void fetchData();
  };

  const handleDeleteScan = async (id: string) => {
    const headers: Record<string, string> = {};
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const res = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) return;
    setScans((prev) => prev.filter((s) => s.id !== id));
    void fetchData();
  };

  const handleInspectCorridor = (corridorName: string) => {
    setCorridorFilter(corridorName);
    setActiveTab('inspections');
  };

  const canDeleteSelected = Boolean(
    selectedScan && (!selectedScan.userId || (user && selectedScan.userId === user.id))
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={() => {
          setUser(null);
          setAuthToken(null);
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          isDark={isDark}
          onToggleTheme={() => setIsDark((d) => !d)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNewScan={() => setActiveTab('scanner')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {errorBanner && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-center justify-between"
            >
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => void fetchData()}
                className="font-semibold underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewDashboard
              analytics={analytics}
              scans={scans}
              loading={loading}
              onNavigateScanner={() => setActiveTab('scanner')}
              onNavigateInspections={() => setActiveTab('inspections')}
              onSelectScan={setSelectedScan}
            />
          )}

          {activeTab === 'scanner' && (
            <RoadScannerView authToken={authToken} onScanSaved={handleScanSaved} />
          )}

          {activeTab === 'inspections' && (
            <InspectionsView
              scans={scans}
              corridorFilter={corridorFilter}
              onChangeCorridorFilter={setCorridorFilter}
              onSelectScan={setSelectedScan}
              onNavigateScanner={() => setActiveTab('scanner')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalyticsView
              analytics={analytics}
              scans={scans}
              onSelectScan={setSelectedScan}
            />
          )}

          {activeTab === 'corridors' && analytics && (
            <CorridorsView
              corridors={analytics.corridors}
              onInspectCorridor={handleInspectCorridor}
            />
          )}
        </main>
      </div>

      <InspectionDetailModal
        scan={selectedScan}
        onClose={() => setSelectedScan(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteScan={handleDeleteScan}
        canDelete={canDeleteSelected}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedInUser, token) => {
          setUser(loggedInUser);
          setAuthToken(token);
        }}
      />
    </div>
  );
}
