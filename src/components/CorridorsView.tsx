import { ArrowRight, MapPin } from 'lucide-react';
import type { CorridorSummary } from '../types/roadscan';
import { formatShortDate, getPciColorClass, getPciLabel } from '../utils/formatters';

interface CorridorsViewProps {
  corridors: CorridorSummary[];
  onInspectCorridor: (corridorName: string) => void;
}

export function CorridorsView({ corridors, onInspectCorridor }: CorridorsViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {corridors.map((corridor) => {
          const coveragePct = Math.round((corridor.scannedKm / corridor.lengthKm) * 100);
          return (
            <div
              key={corridor.name}
              className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{corridor.zone}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatShortDate(corridor.lastScannedAt)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {corridor.name}
                  </h2>
                  <span
                    className={`font-mono tabular-nums text-sm font-bold shrink-0 ${getPciColorClass(
                      corridor.avgPci
                    )}`}
                  >
                    PCI {corridor.avgPci}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Condition Rating: {getPciLabel(corridor.avgPci)} · {corridor.totalScans} logged scans
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">Survey Coverage</span>
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {corridor.scannedKm} / {corridor.lengthKm} km ({coveragePct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${coveragePct}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {corridor.criticalCount} Crit
                  </span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{corridor.moderateCount} Mod</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{corridor.minorCount} Min</span>
                </div>

                <button
                  type="button"
                  onClick={() => onInspectCorridor(corridor.name)}
                  className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap shrink-0"
                >
                  <span>View Scans</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
