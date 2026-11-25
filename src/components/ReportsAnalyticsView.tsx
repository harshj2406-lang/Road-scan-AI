import { Download, Printer } from 'lucide-react';
import type { DashboardAnalytics, RoadScan } from '../types/roadscan';
import {
  exportScansToCsv,
  formatShortDate,
  getPciColorClass,
  getPciLabel,
  getSeverityTextClass,
} from '../utils/formatters';

interface ReportsAnalyticsViewProps {
  analytics: DashboardAnalytics | null;
  scans: RoadScan[];
  onSelectScan: (scan: RoadScan) => void;
}

export function ReportsAnalyticsView({
  analytics,
  scans,
  onSelectScan,
}: ReportsAnalyticsViewProps) {
  if (!analytics) return null;

  const priorityQueue = [...scans]
    .filter((s) => s.repairStatus !== 'Repaired')
    .sort((a, b) => a.pciScore - b.pciScore);

  const totalSeverityCount = Math.max(
    1,
    analytics.severityCounts.Critical +
      analytics.severityCounts.Moderate +
      analytics.severityCounts.Minor +
      analytics.severityCounts.Good
  );

  return (
    <div className="space-y-6">
      {/* Header Action Strip */}
      <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Municipal Road Condition Summary Report
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generated {formatShortDate(new Date().toISOString())} · {analytics.totalScans} inspections ·{' '}
            {analytics.totalKilometersScanned} km surveyed
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={() => exportScansToCsv(scans)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Corridor PCI Bar Comparison */}
        <div className="lg:col-span-7 p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Corridor Pavement Condition Index (PCI)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Higher PCI indicates healthier pavement surface (0–100 scale)
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {analytics.corridors.map((corridor) => {
              const barColor =
                corridor.avgPci >= 85
                  ? 'bg-emerald-600'
                  : corridor.avgPci >= 65
                  ? 'bg-sky-600'
                  : corridor.avgPci >= 45
                  ? 'bg-amber-500'
                  : 'bg-red-600';

              return (
                <div key={corridor.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {corridor.name}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      PCI {corridor.avgPci} ({getPciLabel(corridor.avgPci)})
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${corridor.avgPci}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Distribution & Repair Throughput */}
        <div className="lg:col-span-5 p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Road Condition Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Share of inspected road segments by overall severity
            </p>
          </div>

          <div className="space-y-3">
            {(
              [
                { label: 'Critical', count: analytics.severityCounts.Critical, color: 'bg-red-600' },
                { label: 'Moderate', count: analytics.severityCounts.Moderate, color: 'bg-amber-500' },
                { label: 'Minor', count: analytics.severityCounts.Minor, color: 'bg-sky-600' },
                { label: 'Good', count: analytics.severityCounts.Good, color: 'bg-emerald-600' },
              ] as const
            ).map((row) => {
              const pct = Math.round((row.count / totalSeverityCount) * 100);
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-xs ${row.color}`} aria-hidden="true" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {row.label}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {row.count} segments ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Estimated Open Repair Backlog
            </span>
            <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
              ${analytics.estimatedBacklogCostUsd.toLocaleString()}+
            </span>
          </div>
        </div>
      </div>

      {/* Priority Dispatch Queue */}
      <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Maintenance Priority Dispatch Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unresolved road segments ordered from lowest PCI score to highest
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {priorityQueue.length} pending
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Road Segment</th>
                <th className="py-3 px-4">Recommended Action</th>
                <th className="py-3 px-4 text-right">PCI</th>
                <th className="py-3 px-4 text-right">Area</th>
                <th className="py-3 px-4 text-right">Est. Cost</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {priorityQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    All logged road defects have been marked as Repaired.
                  </td>
                </tr>
              ) : (
                priorityQueue.map((scan, idx) => (
                  <tr
                    key={scan.id}
                    onClick={() => onSelectScan(scan)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                        {scan.roadName}
                      </div>
                      <div className={`text-xs font-medium ${getSeverityTextClass(scan.overallSeverity)}`}>
                        {scan.overallSeverity} · {scan.corridor}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                      {scan.recommendedAction}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${getPciColorClass(
                        scan.pciScore
                      )}`}
                    >
                      {scan.pciScore}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                      {scan.estimatedRepairAreaSqM.toFixed(1)} m²
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {scan.estimatedCostUsd}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {scan.repairStatus}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
