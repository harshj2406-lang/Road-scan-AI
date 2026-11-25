import { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  MapPin,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import type { RepairStatus, RoadScan, SeverityLevel } from '../types/roadscan';
import {
  formatDateTime,
  getPciColorClass,
  getPciLabel,
  getSeverityTextClass,
} from '../utils/formatters';
import { AnnotatedRoadImage } from './AnnotatedRoadImage';

interface InspectionDetailModalProps {
  scan: RoadScan | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: RepairStatus) => Promise<void>;
  onDeleteScan: (id: string) => Promise<void>;
  canDelete: boolean;
}

function SeverityIcon({ severity }: { severity: SeverityLevel }) {
  switch (severity) {
    case 'Critical':
      return <AlertOctagon className="w-4 h-4 shrink-0" />;
    case 'Moderate':
      return <AlertTriangle className="w-4 h-4 shrink-0" />;
    case 'Minor':
      return <Info className="w-4 h-4 shrink-0" />;
    case 'Good':
      return <CheckCircle2 className="w-4 h-4 shrink-0" />;
  }
}

export function InspectionDetailModal({
  scan,
  onClose,
  onUpdateStatus,
  onDeleteScan,
  canDelete,
}: InspectionDetailModalProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!scan) return null;

  const handleStatusChange = async (status: RepairStatus) => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(scan.id, status);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteScan(scan.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono uppercase">{scan.id}</span>
              <span aria-hidden="true">·</span>
              <span>{scan.corridor}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDateTime(scan.scannedAt)}</span>
            </div>
            <h2
              id="detail-modal-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-0.5 truncate"
            >
              {scan.roadName}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            {canDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close inspection details"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <AnnotatedRoadImage
              src={scan.imageUrl}
              alt={scan.roadName}
              defects={scan.defects}
              highlightedDefectId={highlightedId}
              onSelectDefect={setHighlightedId}
              className="aspect-[4/3] w-full"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-xs text-slate-500 dark:text-slate-400">PCI Score</div>
                <div
                  className={`text-xl font-bold font-mono tabular-nums mt-0.5 ${getPciColorClass(
                    scan.pciScore
                  )}`}
                >
                  {scan.pciScore}/100
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {getPciLabel(scan.pciScore)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-xs text-slate-500 dark:text-slate-400">Severity</div>
                <div
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold mt-1 ${getSeverityTextClass(
                    scan.overallSeverity
                  )}`}
                >
                  <SeverityIcon severity={scan.overallSeverity} />
                  <span>{scan.overallSeverity}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-xs text-slate-500 dark:text-slate-400">Repair Area</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                  {scan.estimatedRepairAreaSqM.toFixed(1)} m²
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div className="text-xs text-slate-500 dark:text-slate-400">Est. Cost</div>
                <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {scan.estimatedCostUsd}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Maintenance Workflow Status
              </div>
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                {(['Open', 'Scheduled', 'Repaired'] as RepairStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(status)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      scan.repairStatus === status
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-sm border-t border-slate-200 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-mono">{scan.coordinates}</span>
                </span>
                <span>{scan.surfaceMaterial} · {scan.inspectorName}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{scan.summary}</p>
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Recommended Action:{' '}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {scan.recommendedAction}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
                Detected Surface Defects ({scan.defects.length})
              </h3>
              {scan.defects.length === 0 ? (
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                  No structural pavement defects detected on this segment.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {scan.defects.map((defect) => {
                    const active = highlightedId === defect.id;
                    return (
                      <div
                        key={defect.id}
                        onMouseEnter={() => setHighlightedId(defect.id)}
                        onMouseLeave={() => setHighlightedId(null)}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {defect.type}
                          </span>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-medium ${getSeverityTextClass(defect.severity)}`}>
                              {defect.severity}
                            </span>
                            <span className="text-slate-400" aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                              {Math.round(defect.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {defect.description}
                        </p>
                        <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-1.5">
                          Est. Area: {defect.areaSqM.toFixed(1)} m²
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
