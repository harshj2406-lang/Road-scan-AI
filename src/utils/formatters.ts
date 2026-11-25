import type { RoadScan, SeverityLevel } from '../types/roadscan';

export const SAMPLE_ROAD_PRESETS = [
  {
    id: 'preset-pothole',
    label: 'Severe Asphalt Pothole',
    roadName: 'W. Fulton Industrial Ave (Test Frame)',
    corridor: 'I-90 Metro Corridor',
    coordinates: '41.8869, -87.6512',
    imagePath: '/src/assets/images/road_pothole_asphalt_1795598710816.jpg',
  },
  {
    id: 'preset-alligator',
    label: 'Alligator Fatigue Cracking',
    roadName: 'Dockside Access Rd (Test Frame)',
    corridor: 'Harbor Freight Parkway',
    coordinates: '41.8412, -87.6194',
    imagePath: '/src/assets/images/road_alligator_cracks_1795598711200.jpg',
  },
  {
    id: 'preset-arterial',
    label: 'Arterial Surface Cracks',
    roadName: 'Oakridge Blvd Northbound (Test Frame)',
    corridor: 'Oakridge Arterial',
    coordinates: '41.9125, -87.7041',
    imagePath: '/src/assets/images/road_highway_surface_1795598711941.jpg',
  },
  {
    id: 'preset-clean',
    label: 'Freshly Resurfaced Road',
    roadName: 'Highland Ridge Scenic Pkwy (Test Frame)',
    corridor: 'Highland Ridge Connector',
    coordinates: '41.9482, -87.7689',
    imagePath: '/src/assets/images/road_repaired_clean_1795598711260.jpg',
  },
] as const;

export const CORRIDOR_OPTIONS = [
  'I-90 Metro Corridor',
  'Oakridge Arterial',
  'Harbor Freight Parkway',
  'Civic Center Loop',
  'Highland Ridge Connector',
];

export function getSeverityTextClass(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':
      return 'text-red-600 dark:text-red-400';
    case 'Moderate':
      return 'text-amber-600 dark:text-amber-400';
    case 'Minor':
      return 'text-sky-600 dark:text-sky-400';
    case 'Good':
      return 'text-emerald-600 dark:text-emerald-400';
  }
}

export function getSeverityHex(severity: SeverityLevel): string {
  switch (severity) {
    case 'Critical':
      return '#DC2626';
    case 'Moderate':
      return '#D97706';
    case 'Minor':
      return '#0284C7';
    case 'Good':
      return '#16A34A';
  }
}

export function getPciLabel(pci: number): string {
  if (pci >= 85) return 'Good';
  if (pci >= 65) return 'Fair';
  if (pci >= 45) return 'Poor';
  return 'Critical';
}

export function getPciColorClass(pci: number): string {
  if (pci >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (pci >= 65) return 'text-sky-600 dark:text-sky-400';
  if (pci >= 45) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function exportScansToCsv(scans: RoadScan[]) {
  const headers = [
    'Scan ID',
    'Road Name',
    'Corridor',
    'Coordinates',
    'Scanned At',
    'Inspector',
    'Material',
    'PCI Score',
    'Severity',
    'Repair Status',
    'Defect Count',
    'Primary Defects',
    'Repair Area (m2)',
    'Estimated Cost',
    'Recommended Action',
  ];

  const escapeCsv = (val: unknown) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = scans.map((s) => [
    s.id,
    s.roadName,
    s.corridor,
    s.coordinates,
    s.scannedAt,
    s.inspectorName,
    s.surfaceMaterial,
    s.pciScore,
    s.overallSeverity,
    s.repairStatus,
    s.defects.length,
    s.defects.map((d) => `${d.type} (${d.severity})`).join('; '),
    s.estimatedRepairAreaSqM,
    s.estimatedCostUsd,
    s.recommendedAction,
  ]);

  const csvContent =
    [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `roadscan-report-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
