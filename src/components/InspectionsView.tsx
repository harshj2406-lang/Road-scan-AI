import { useMemo, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Grid,
  Info,
  List,
  Search,
} from 'lucide-react';
import type { RepairStatus, RoadScan, SeverityLevel } from '../types/roadscan';
import {
  CORRIDOR_OPTIONS,
  formatShortDate,
  getPciColorClass,
  getSeverityTextClass,
} from '../utils/formatters';
import { AnnotatedRoadImage } from './AnnotatedRoadImage';

interface InspectionsViewProps {
  scans: RoadScan[];
  corridorFilter: string;
  onChangeCorridorFilter: (corridor: string) => void;
  onSelectScan: (scan: RoadScan) => void;
  onNavigateScanner: () => void;
}

function SeverityIcon({ severity }: { severity: SeverityLevel }) {
  switch (severity) {
    case 'Critical':
      return <AlertOctagon className="w-3.5 h-3.5 shrink-0" />;
    case 'Moderate':
      return <AlertTriangle className="w-3.5 h-3.5 shrink-0" />;
    case 'Minor':
      return <Info className="w-3.5 h-3.5 shrink-0" />;
    case 'Good':
      return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
  }
}

export function InspectionsView({
  scans,
  corridorFilter,
  onChangeCorridorFilter,
  onSelectScan,
  onNavigateScanner,
}: InspectionsViewProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | SeverityLevel>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | RepairStatus>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filtered = useMemo(() => {
    return scans.filter((scan) => {
      if (corridorFilter !== 'All' && scan.corridor !== corridorFilter) return false;
      if (severityFilter !== 'All' && scan.overallSeverity !== severityFilter) return false;
      if (statusFilter !== 'All' && scan.repairStatus !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchRoad = scan.roadName.toLowerCase().includes(q);
        const matchCorridor = scan.corridor.toLowerCase().includes(q);
        const matchInspector = scan.inspectorName.toLowerCase().includes(q);
        const matchDefect = scan.defects.some((d) => d.type.toLowerCase().includes(q));
        if (!matchRoad && !matchCorridor && !matchInspector && !matchDefect) return false;
      }
      return true;
    });
  }, [scans, corridorFilter, severityFilter, statusFilter, search]);

  return (
    <div className="space-y-5">
      {/* Filter Toolbar */}
      <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search road name, defect type, or inspector..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Filter by corridor"
              value={corridorFilter}
              onChange={(e) => onChangeCorridorFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Corridors</option>
              {CORRIDOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by repair status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | RepairStatus)}
              className="px-3 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Repaired">Repaired</option>
            </select>

            <div className="inline-flex p-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                className={`p-1.5 rounded ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-lg gap-1">
            {(['All', 'Critical', 'Moderate', 'Minor', 'Good'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  severityFilter === sev
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {scans.length} inspections
          </span>
        </div>
      </div>

      {/* Results View */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No matching inspections found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Adjust your active filters or run a new AI road surface scan.
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSeverityFilter('All');
                setStatusFilter('All');
                onChangeCorridorFilter('All');
              }}
              className="px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onNavigateScanner}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              Scan Road Image
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Road Segment</th>
                  <th className="py-3 px-4">Corridor</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4 text-right">PCI</th>
                  <th className="py-3 px-4 text-right">Defects</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((scan) => (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={scan.imageUrl}
                          alt={scan.roadName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-9 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs">
                            {scan.roadName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {scan.id} · {scan.inspectorName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {scan.corridor}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${getSeverityTextClass(
                          scan.overallSeverity
                        )}`}
                      >
                        <SeverityIcon severity={scan.overallSeverity} />
                        <span>{scan.overallSeverity}</span>
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${getPciColorClass(
                        scan.pciScore
                      )}`}
                    >
                      {scan.pciScore}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {scan.defects.length}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {scan.repairStatus}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(scan.scannedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((scan) => (
            <article
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 overflow-hidden cursor-pointer transition-colors flex flex-col"
            >
              <AnnotatedRoadImage
                src={scan.imageUrl}
                alt={scan.roadName}
                defects={scan.defects}
                showToggle={false}
                className="aspect-[4/3] w-full rounded-none border-0 border-b border-slate-200 dark:border-slate-800"
              />
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{scan.corridor}</span>
                    <span className="font-mono tabular-nums">{formatShortDate(scan.scannedAt)}</span>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mt-1">
                    {scan.roadName}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {scan.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${getSeverityTextClass(
                      scan.overallSeverity
                    )}`}
                  >
                    <SeverityIcon severity={scan.overallSeverity} />
                    <span>{scan.overallSeverity}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {scan.repairStatus} · PCI{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {scan.pciScore}
                    </strong>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
