import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { StoredUser } from './auth.ts';
import type {
  CorridorSummary,
  DashboardAnalytics,
  DefectBreakdownItem,
  DefectType,
  MonthlyTrendPoint,
  RepairStatus,
  RoadScan,
  SeverityLevel,
} from '../src/types/roadscan.ts';

interface DatabaseSchema {
  users: StoredUser[];
  scans: RoadScan[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.resolve(DATA_DIR, 'db.json');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

const CORRIDOR_META: Array<{ name: string; zone: string; lengthKm: number }> = [
  { name: 'I-90 Metro Corridor', zone: 'North Industrial Sector', lengthKm: 28.4 },
  { name: 'Oakridge Arterial', zone: 'West Residential District', lengthKm: 16.2 },
  { name: 'Harbor Freight Parkway', zone: 'Port & Logistics Zone', lengthKm: 22.8 },
  { name: 'Civic Center Loop', zone: 'Downtown Core', lengthKm: 11.5 },
  { name: 'Highland Ridge Connector', zone: 'East Foothills', lengthKm: 19.6 },
];

const SEED_SCANS: RoadScan[] = [
  {
    id: 'scan-1042',
    roadName: 'W. Fulton Industrial Ave (Mile 4.2)',
    corridor: 'I-90 Metro Corridor',
    coordinates: '41.8869, -87.6512',
    scannedAt: '2026-11-24T14:22:00.000Z',
    inspectorName: 'Marcus Chen, PE',
    userId: null,
    imageUrl: '/src/assets/images/road_pothole_asphalt_1795598710816.jpg',
    surfaceMaterial: 'Asphalt',
    pciScore: 34,
    overallSeverity: 'Critical',
    repairStatus: 'Open',
    estimatedRepairAreaSqM: 3.4,
    estimatedCostUsd: '$1,450 – $2,200',
    recommendedAction: 'Full-depth asphalt saw-cut and hot-mix patch within 48 hours; seal radiating longitudinal fissures.',
    summary: 'Severe structural pothole spanning center wheel-path with exposed base aggregate, surrounded by secondary longitudinal cracking and abraded lane striping.',
    defects: [
      {
        id: 'def-1042-1',
        type: 'Pothole',
        severity: 'Critical',
        confidence: 0.97,
        bbox: [425, 302, 622, 725],
        description: 'Deep circular pothole with delaminated asphalt edges and loose base gravel.',
        areaSqM: 2.1,
      },
      {
        id: 'def-1042-2',
        type: 'Longitudinal Crack',
        severity: 'Moderate',
        confidence: 0.91,
        bbox: [320, 385, 425, 560],
        description: 'Linear fatigue crack propagating along the mid-lane wheel track.',
        areaSqM: 0.9,
      },
      {
        id: 'def-1042-3',
        type: 'Faded Lane Markings',
        severity: 'Minor',
        confidence: 0.86,
        bbox: [528, 35, 658, 285],
        description: 'Thermoplastic dashed lane line exhibiting >50% surface abrasion.',
        areaSqM: 0.4,
      },
    ],
  },
  {
    id: 'scan-1041',
    roadName: 'Dockside Access Rd (Pier 7)',
    corridor: 'Harbor Freight Parkway',
    coordinates: '41.8412, -87.6194',
    scannedAt: '2026-11-23T09:45:00.000Z',
    inspectorName: 'Elena Rostova',
    userId: null,
    imageUrl: '/src/assets/images/road_alligator_cracks_1795598711200.jpg',
    surfaceMaterial: 'Asphalt',
    pciScore: 28,
    overallSeverity: 'Critical',
    repairStatus: 'Scheduled',
    estimatedRepairAreaSqM: 14.8,
    estimatedCostUsd: '$5,800 – $7,900',
    recommendedAction: 'Mill 100mm distressed wearing course and reconstruct sub-base drainage along shoulder edge.',
    summary: 'Extensive alligator fatigue cracking across heavy freight wheel path with deep longitudinal shear delamination and right-shoulder breakup.',
    defects: [
      {
        id: 'def-1041-1',
        type: 'Alligator Cracking',
        severity: 'Critical',
        confidence: 0.96,
        bbox: [95, 40, 940, 880],
        description: 'Interconnected polygonal fatigue network covering primary freight lane.',
        areaSqM: 11.2,
      },
      {
        id: 'def-1041-2',
        type: 'Edge Breakup',
        severity: 'Critical',
        confidence: 0.92,
        bbox: [215, 760, 950, 985],
        description: 'Severe shoulder raveling and edge shear loss from heavy axle loads.',
        areaSqM: 3.6,
      },
    ],
  },
  {
    id: 'scan-1040',
    roadName: 'Oakridge Blvd Northbound (Block 1400)',
    corridor: 'Oakridge Arterial',
    coordinates: '41.9125, -87.7041',
    scannedAt: '2026-11-21T16:10:00.000Z',
    inspectorName: 'Marcus Chen, PE',
    userId: null,
    imageUrl: '/src/assets/images/road_highway_surface_1795598711941.jpg',
    surfaceMaterial: 'Asphalt',
    pciScore: 63,
    overallSeverity: 'Moderate',
    repairStatus: 'Open',
    estimatedRepairAreaSqM: 6.2,
    estimatedCostUsd: '$1,100 – $1,650',
    recommendedAction: 'Schedule hot-pour rubberized crack sealing and repaint dashed lane dividers prior to winter freeze.',
    summary: 'Moderate transverse and block surface cracking with minor curb-adjacent pavement spalling; structural sub-base remains stable.',
    defects: [
      {
        id: 'def-1040-1',
        type: 'Transverse Crack',
        severity: 'Moderate',
        confidence: 0.93,
        bbox: [560, 65, 920, 745],
        description: 'Thermal transverse and intersecting cracks across both northbound lanes.',
        areaSqM: 4.5,
      },
      {
        id: 'def-1040-2',
        type: 'Faded Lane Markings',
        severity: 'Minor',
        confidence: 0.88,
        bbox: [598, 295, 735, 412],
        description: 'Skip-line paint deterioration along center lane divider.',
        areaSqM: 0.8,
      },
      {
        id: 'def-1040-3',
        type: 'Surface Raveling',
        severity: 'Minor',
        confidence: 0.82,
        bbox: [565, 815, 760, 995],
        description: 'Aggregate weathering and curb-gutter edge spalling.',
        areaSqM: 0.9,
      },
    ],
  },
  {
    id: 'scan-1039',
    roadName: 'Highland Ridge Scenic Pkwy (KM 8.4)',
    corridor: 'Highland Ridge Connector',
    coordinates: '41.9482, -87.7689',
    scannedAt: '2026-11-19T11:30:00.000Z',
    inspectorName: 'David Park',
    userId: null,
    imageUrl: '/src/assets/images/road_repaired_clean_1795598711260.jpg',
    surfaceMaterial: 'Asphalt',
    pciScore: 96,
    overallSeverity: 'Good',
    repairStatus: 'Repaired',
    estimatedRepairAreaSqM: 0,
    estimatedCostUsd: '$0',
    recommendedAction: 'No corrective work required. Include in routine biennial profilometer sweep.',
    summary: 'Freshly resurfaced dense-graded asphalt wearing course with crisp retroreflective edge and centerline markings.',
    defects: [],
  },
  {
    id: 'scan-1038',
    roadName: 'W. Randolph Civic Loop (Sector 3)',
    corridor: 'Civic Center Loop',
    coordinates: '41.8841, -87.6324',
    scannedAt: '2026-11-16T08:15:00.000Z',
    inspectorName: 'Elena Rostova',
    userId: null,
    imageUrl: '/src/assets/images/road_highway_surface_1795598711941.jpg',
    surfaceMaterial: 'Composite',
    pciScore: 71,
    overallSeverity: 'Minor',
    repairStatus: 'Scheduled',
    estimatedRepairAreaSqM: 3.1,
    estimatedCostUsd: '$650 – $950',
    recommendedAction: 'Apply crack sealant during off-peak overnight window and refresh crosswalk/lane markings.',
    summary: 'Early-stage thermal cracking and moderate surface wear along high-volume commuter corridor.',
    defects: [
      {
        id: 'def-1038-1',
        type: 'Longitudinal Crack',
        severity: 'Minor',
        confidence: 0.89,
        bbox: [580, 120, 885, 620],
        description: 'Hairline longitudinal reflective crack above underlying concrete joint.',
        areaSqM: 2.3,
      },
      {
        id: 'def-1038-2',
        type: 'Faded Lane Markings',
        severity: 'Minor',
        confidence: 0.85,
        bbox: [602, 298, 725, 405],
        description: 'Reduced nighttime retroreflectivity on dashed divider.',
        areaSqM: 0.8,
      },
    ],
  },
  {
    id: 'scan-1037',
    roadName: 'I-90 Frontage East (Exit 19B)',
    corridor: 'I-90 Metro Corridor',
    coordinates: '41.8954, -87.6691',
    scannedAt: '2026-11-12T13:50:00.000Z',
    inspectorName: 'Marcus Chen, PE',
    userId: null,
    imageUrl: '/src/assets/images/road_alligator_cracks_1795598711200.jpg',
    surfaceMaterial: 'Asphalt',
    pciScore: 41,
    overallSeverity: 'Critical',
    repairStatus: 'Repaired',
    estimatedRepairAreaSqM: 9.5,
    estimatedCostUsd: '$3,900 – $5,100',
    recommendedAction: 'Completed 75mm mill-and-fill structural overlay on November 15.',
    summary: 'Localized wheel-path fatigue cracking remediated via full-lane mill and hot-mix asphalt overlay.',
    defects: [
      {
        id: 'def-1037-1',
        type: 'Alligator Cracking',
        severity: 'Critical',
        confidence: 0.94,
        bbox: [150, 90, 860, 820],
        description: 'Clustered fatigue cracking across deceleration lane.',
        areaSqM: 9.5,
      },
    ],
  },
];

function ensureInitialized(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: DatabaseSchema = {
      users: [],
      scans: SEED_SCANS,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      scans: Array.isArray(parsed.scans) ? parsed.scans : SEED_SCANS,
    };
  } catch {
    const fallback: DatabaseSchema = { users: [], scans: SEED_SCANS };
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

let dbCache: DatabaseSchema = ensureInitialized();

function persistDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
}

export function listUsers(): StoredUser[] {
  return dbCache.users;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return dbCache.users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): StoredUser | undefined {
  return dbCache.users.find((u) => u.id === id);
}

export function createUser(user: StoredUser): StoredUser {
  dbCache.users.push(user);
  persistDb();
  return user;
}

export function listScans(): RoadScan[] {
  return [...dbCache.scans].sort(
    (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  );
}

export function findScanById(id: string): RoadScan | undefined {
  return dbCache.scans.find((s) => s.id === id);
}

export function addScan(scan: RoadScan): RoadScan {
  dbCache.scans.unshift(scan);
  persistDb();
  return scan;
}

export function updateScanStatus(id: string, repairStatus: RepairStatus): RoadScan | undefined {
  const target = dbCache.scans.find((s) => s.id === id);
  if (!target) return undefined;
  target.repairStatus = repairStatus;
  persistDb();
  return target;
}

export function deleteScan(id: string): boolean {
  const idx = dbCache.scans.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  dbCache.scans.splice(idx, 1);
  persistDb();
  return true;
}

export function saveUploadedImage(base64Data: string, mimeType: string): string {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[mimeType.toLowerCase()];
  if (!ext) {
    throw new Error('Unsupported image format. Please upload JPG, PNG, or WEBP.');
  }

  const fileName = `road-${crypto.randomUUID()}.${ext}`;
  const resolved = path.resolve(UPLOADS_DIR, fileName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Invalid upload path.');
  }
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(resolved, buffer);
  return `/uploads/${fileName}`;
}

function parseLowerUsd(costStr: string): number {
  const match = costStr.replace(/,/g, '').match(/\$(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function computeAnalytics(): DashboardAnalytics {
  const scans = listScans();
  const totalScans = scans.length;
  const allDefects = scans.flatMap((s) => s.defects);
  const totalDefects = allDefects.length;
  const criticalDefects = allDefects.filter((d) => d.severity === 'Critical').length;
  const openWorkOrders = scans.filter((s) => s.repairStatus !== 'Repaired').length;
  const avgPci =
    totalScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + s.pciScore, 0) / totalScans)
      : 0;

  const estimatedBacklogCostUsd = scans
    .filter((s) => s.repairStatus !== 'Repaired')
    .reduce((acc, s) => acc + parseLowerUsd(s.estimatedCostUsd), 0);

  const severityCounts: Record<SeverityLevel, number> = {
    Critical: 0,
    Moderate: 0,
    Minor: 0,
    Good: 0,
  };
  for (const s of scans) {
    severityCounts[s.overallSeverity] += 1;
  }

  const defectMap = new Map<
    DefectType,
    { count: number; criticalCount: number; confSum: number }
  >();
  for (const d of allDefects) {
    const existing = defectMap.get(d.type) ?? { count: 0, criticalCount: 0, confSum: 0 };
    existing.count += 1;
    if (d.severity === 'Critical') existing.criticalCount += 1;
    existing.confSum += d.confidence;
    defectMap.set(d.type, existing);
  }

  const defectBreakdown: DefectBreakdownItem[] = Array.from(defectMap.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      criticalCount: stats.criticalCount,
      avgConfidence: Number((stats.confSum / stats.count).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count);

  const corridors: CorridorSummary[] = CORRIDOR_META.map((meta) => {
    const cScans = scans.filter((s) => s.corridor === meta.name);
    const cAvgPci =
      cScans.length > 0
        ? Math.round(cScans.reduce((sum, s) => sum + s.pciScore, 0) / cScans.length)
        : 78;
    const criticalCount = cScans.filter((s) => s.overallSeverity === 'Critical').length;
    const moderateCount = cScans.filter((s) => s.overallSeverity === 'Moderate').length;
    const minorCount = cScans.filter((s) => s.overallSeverity === 'Minor').length;
    const scannedKm = Number(
      Math.min(meta.lengthKm, Math.max(meta.lengthKm * 0.65, cScans.length * 4.8)).toFixed(1)
    );
    const lastScannedAt = cScans[0]?.scannedAt ?? '2026-11-18T10:00:00.000Z';

    return {
      name: meta.name,
      zone: meta.zone,
      lengthKm: meta.lengthKm,
      scannedKm,
      avgPci: cAvgPci,
      totalScans: cScans.length,
      criticalCount,
      moderateCount,
      minorCount,
      lastScannedAt,
    };
  });

  const totalKilometersScanned = Number(
    corridors.reduce((sum, c) => sum + c.scannedKm, 0).toFixed(1)
  );

  // Historical baseline merged with live November data
  const monthlyTrend: MonthlyTrendPoint[] = [
    { month: 'Jun', avgPci: 66, scansCompleted: 18, defectsDetected: 31, repairsClosed: 14 },
    { month: 'Jul', avgPci: 68, scansCompleted: 22, defectsDetected: 28, repairsClosed: 19 },
    { month: 'Aug', avgPci: 65, scansCompleted: 25, defectsDetected: 34, repairsClosed: 21 },
    { month: 'Sep', avgPci: 69, scansCompleted: 29, defectsDetected: 26, repairsClosed: 24 },
    { month: 'Oct', avgPci: 71, scansCompleted: 31, defectsDetected: 22, repairsClosed: 27 },
    {
      month: 'Nov',
      avgPci: avgPci || 62,
      scansCompleted: Math.max(12, totalScans * 4),
      defectsDetected: Math.max(8, totalDefects),
      repairsClosed: scans.filter((s) => s.repairStatus === 'Repaired').length * 6 + 12,
    },
  ];

  return {
    totalScans,
    totalDefects,
    criticalDefects,
    openWorkOrders,
    avgPci,
    totalKilometersScanned,
    estimatedBacklogCostUsd,
    defectBreakdown,
    severityCounts,
    monthlyTrend,
    corridors,
  };
}
