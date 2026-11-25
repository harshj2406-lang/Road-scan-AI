export type DefectType =
  | 'Pothole'
  | 'Alligator Cracking'
  | 'Longitudinal Crack'
  | 'Transverse Crack'
  | 'Edge Breakup'
  | 'Surface Raveling'
  | 'Faded Lane Markings';

export type SeverityLevel = 'Critical' | 'Moderate' | 'Minor' | 'Good';

export type RepairStatus = 'Open' | 'Scheduled' | 'Repaired';

export interface DetectedDefect {
  id: string;
  type: DefectType;
  severity: Exclude<SeverityLevel, 'Good'>;
  confidence: number; // 0 to 1
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  description: string;
  areaSqM: number;
}

export interface RoadScan {
  id: string;
  roadName: string;
  corridor: string;
  coordinates: string;
  scannedAt: string;
  inspectorName: string;
  userId: string | null;
  imageUrl: string;
  surfaceMaterial: 'Asphalt' | 'Concrete' | 'Composite' | 'Unpaved';
  pciScore: number; // 0-100 Pavement Condition Index
  overallSeverity: SeverityLevel;
  repairStatus: RepairStatus;
  estimatedRepairAreaSqM: number;
  estimatedCostUsd: string;
  recommendedAction: string;
  summary: string;
  defects: DetectedDefect[];
}

export interface CorridorSummary {
  name: string;
  zone: string;
  lengthKm: number;
  scannedKm: number;
  avgPci: number;
  totalScans: number;
  criticalCount: number;
  moderateCount: number;
  minorCount: number;
  lastScannedAt: string;
}

export interface MonthlyTrendPoint {
  month: string;
  avgPci: number;
  scansCompleted: number;
  defectsDetected: number;
  repairsClosed: number;
}

export interface DefectBreakdownItem {
  type: DefectType;
  count: number;
  criticalCount: number;
  avgConfidence: number;
}

export interface DashboardAnalytics {
  totalScans: number;
  totalDefects: number;
  criticalDefects: number;
  openWorkOrders: number;
  avgPci: number;
  totalKilometersScanned: number;
  estimatedBacklogCostUsd: number;
  defectBreakdown: DefectBreakdownItem[];
  severityCounts: Record<SeverityLevel, number>;
  monthlyTrend: MonthlyTrendPoint[];
  corridors: CorridorSummary[];
}

export interface AnalysisPreviewResult {
  isRoadImage: boolean;
  rejectionReason?: string;
  surfaceMaterial: 'Asphalt' | 'Concrete' | 'Composite' | 'Unpaved';
  pciScore: number;
  overallSeverity: SeverityLevel;
  estimatedRepairAreaSqM: number;
  estimatedCostUsd: string;
  recommendedAction: string;
  summary: string;
  defects: DetectedDefect[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Municipal Inspector' | 'Civil Engineer' | 'Fleet Manager';
  createdAt: string;
}
