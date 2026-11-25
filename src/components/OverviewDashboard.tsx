import { useState } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Route,
  ScanLine,
} from 'lucide-react';
import type { DashboardAnalytics, RoadScan } from '../types/roadscan';
import {
  formatShortDate,
  getPciColorClass,
  getSeverityTextClass,
} from '../utils/formatters';
import { AnnotatedRoadImage } from './AnnotatedRoadImage';

interface OverviewDashboardProps {
  analytics: DashboardAnalytics | null;
  scans: RoadScan[];
  loading: boolean;
  onNavigateScanner: () => void;
  onNavigateInspections: () => void;
  onSelectScan: (scan: RoadScan) => void;
}

export function OverviewDashboard({
  analytics,
  scans,
  loading,
  onNavigateScanner,
  onNavigateInspections,
  onSelectScan,
}: OverviewDashboardProps) {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  if (loading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-72 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <div className="lg:col-span-5 h-72 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
        </div>
      </div>
    );
  }

  const trend = analytics.monthlyTrend;
  const maxDefectsCount = Math.max(
    1,
    ...analytics.defectBreakdown.map((d) => d.count)
  );
  const activePoint =
    hoveredMonthIdx !== null ? trend[hoveredMonthIdx] : trend[trend.length - 1];

  // SVG line chart geometry
  const chartW = 540;
  const chartH = 180;
  const padX = 28;
  const padY = 20;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const getPointXY = (idx: number, val: number) => {
    const x = padX + (idx / Math.max(1, trend.length - 1)) * plotW;
    const clamped = Math.max(0, Math.min(100, val));
    const y = padY + (1 - clamped / 100) * plotH;
    return { x, y };
  };

  const polylinePoints = trend
    .map((pt, i) => {
      const { x, y } = getPointXY(i, pt.avgPci);
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${padX},${padY + plotH} ${polylinePoints} ${
    padX + plotW
  },${padY + plotH}`;

  return (
    <div className="space-y-8">
      {/* KPI Summary Strip */}
      <section aria-label="Network pavement metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Roadway Inspected</span>
              <Route className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {analytics.totalKilometersScanned} km
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                across {analytics.corridors.length} corridors
              </span>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Fleet Avg. PCI Score</span>
              <CheckCircle2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${getPciColorClass(
                  analytics.avgPci
                )}`}
              >
                {analytics.avgPci} / 100
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ASTM D6433 index
              </span>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Critical Defects</span>
              <AlertOctagon className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
                {analytics.criticalDefects}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                of {analytics.totalDefects} total anomalies
              </span>
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Open Work Orders</span>
              <ClipboardCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {analytics.openWorkOrders}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                Est. ${analytics.estimatedBacklogCostUsd.toLocaleString()}+ backlog
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-Month PCI & Scan Volume Chart */}
        <div className="lg:col-span-7 p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Pavement Condition Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                6-month average network PCI score and monthly scan volume
              </p>
            </div>
            {activePoint && (
              <div className="text-right text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activePoint.month}
                </span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span>PCI {activePoint.avgPci}</span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span>{activePoint.scansCompleted} scans</span>
              </div>
            )}
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-48 overflow-visible"
              role="img"
              aria-label="6 month pavement condition index line chart"
            >
              {[25, 50, 75, 100].map((tick) => {
                const y = padY + (1 - tick / 100) * plotH;
                return (
                  <g key={tick}>
                    <line
                      x1={padX}
                      x2={chartW - padX}
                      y1={y}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={4}
                      y={y + 3}
                      fontSize="10"
                      className="fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              <polygon points={areaPoints} fill="rgba(217, 119, 6, 0.12)" />
              <polyline
                fill="none"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polylinePoints}
              />

              {trend.map((pt, i) => {
                const { x, y } = getPointXY(i, pt.avgPci);
                const isHovered = hoveredMonthIdx === i;
                return (
                  <g
                    key={pt.month}
                    onMouseEnter={() => setHoveredMonthIdx(i)}
                    onMouseLeave={() => setHoveredMonthIdx(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill="#D97706"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={chartH - 2}
                      textAnchor="middle"
                      fontSize="11"
                      className="fill-slate-500 dark:fill-slate-400 font-sans"
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Defect Classification Distribution */}
        <div className="lg:col-span-5 p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Defect Classification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Frequency across active inspections
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {analytics.totalDefects} total
            </span>
          </div>

          <div className="space-y-3.5">
            {analytics.defectBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                No surface defects logged yet.
              </p>
            ) : (
              analytics.defectBreakdown.slice(0, 6).map((item) => {
                const widthPct = Math.round((item.count / maxDefectsCount) * 100);
                return (
                  <div key={item.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {item.type}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {item.count} {item.criticalCount > 0 ? `(${item.criticalCount} critical)` : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.criticalCount > 0 ? 'bg-red-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Recent Road Scans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recent Road Inspections
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any inspection frame to view full defect bounding boxes and repair schedule
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateInspections}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
            >
              <span>View all logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="p-10 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <ScanLine className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              No inspections recorded yet
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Upload a roadway image in the AI Scanner to log your first inspection.
            </p>
            <button
              type="button"
              onClick={onNavigateScanner}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              Scan First Road Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {scans.slice(0, 4).map((scan) => (
              <article
                key={scan.id}
                onClick={() => onSelectScan(scan)}
                className="group rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors overflow-hidden cursor-pointer flex flex-col"
              >
                <AnnotatedRoadImage
                  src={scan.imageUrl}
                  alt={scan.roadName}
                  defects={scan.defects}
                  showToggle={false}
                  className="aspect-[4/3] w-full rounded-none border-0 border-b border-slate-200 dark:border-slate-800"
                />
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="truncate">{scan.corridor}</span>
                      <span className="font-mono tabular-nums shrink-0">
                        {formatShortDate(scan.scannedAt)}
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mt-1 line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {scan.roadName}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className={`font-semibold ${getSeverityTextClass(scan.overallSeverity)}`}>
                      {scan.overallSeverity} · {scan.defects.length} defects
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      PCI {scan.pciScore}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
