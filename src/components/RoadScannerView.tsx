import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Compass,
  Info,
  Loader2,
  Save,
  ScanLine,
  Upload,
} from 'lucide-react';
import type { AnalysisPreviewResult, RoadScan, SeverityLevel } from '../types/roadscan';
import {
  CORRIDOR_OPTIONS,
  getPciColorClass,
  getPciLabel,
  getSeverityTextClass,
  SAMPLE_ROAD_PRESETS,
} from '../utils/formatters';
import { AnnotatedRoadImage } from './AnnotatedRoadImage';

interface RoadScannerViewProps {
  authToken: string | null;
  onScanSaved: (scan: RoadScan) => void;
}

function resizeImageToDataUrl(file: File, maxDimension = 1440): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read file.'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, 0.88));
      };
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
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

export function RoadScannerView({ authToken, onScanSaved }: RoadScannerViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roadName, setRoadName] = useState('W. Monroe St · Segment 12');
  const [corridor, setCorridor] = useState(CORRIDOR_OPTIONS[0]);
  const [coordinates, setCoordinates] = useState('41.8807, -87.6412');

  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [sampleImagePath, setSampleImagePath] = useState<string | null>(
    SAMPLE_ROAD_PRESETS[0].imagePath
  );
  const [previewUrl, setPreviewUrl] = useState<string>(SAMPLE_ROAD_PRESETS[0].imagePath);
  const [dragActive, setDragActive] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisPreviewResult | null>(null);
  const [highlightedDefectId, setHighlightedDefectId] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setError(null);
    setSaveMessage(null);
    setAnalysis(null);
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP roadway photograph.');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setUploadedDataUrl(dataUrl);
      setSampleImagePath(null);
      setPreviewUrl(dataUrl);
      if (!roadName.trim()) {
        setRoadName(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process selected image.');
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFileSelected(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFileSelected(file);
  };

  const selectPreset = (preset: (typeof SAMPLE_ROAD_PRESETS)[number]) => {
    setError(null);
    setSaveMessage(null);
    setAnalysis(null);
    setUploadedDataUrl(null);
    setSampleImagePath(preset.imagePath);
    setPreviewUrl(preset.imagePath);
    setRoadName(preset.roadName);
    setCorridor(preset.corridor);
    setCoordinates(preset.coordinates);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates(
          `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
      },
      () => {
        setError('Unable to read GPS location. You can enter coordinates manually.');
      }
    );
  };

  const handleAnalyze = async () => {
    setError(null);
    setSaveMessage(null);
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/scans/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageDataUrl: uploadedDataUrl ?? undefined,
          sampleImagePath: sampleImagePath ?? undefined,
          roadName,
        }),
      });
      const data = (await res.json()) as {
        analysis?: AnalysisPreviewResult;
        error?: string;
      };
      if (!res.ok || !data.analysis) {
        setError(data.error || 'AI road surface analysis failed.');
        return;
      }
      setAnalysis(data.analysis);
    } catch {
      setError('Connection failed while running AI road damage detection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveScan = async () => {
    if (!analysis || !analysis.isRoadImage) return;
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch('/api/scans', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roadName,
          corridor,
          coordinates,
          imageDataUrl: uploadedDataUrl ?? undefined,
          sampleImagePath: sampleImagePath ?? undefined,
          analysis,
        }),
      });
      const data = (await res.json()) as { scan?: RoadScan; error?: string };
      if (!res.ok || !data.scan) {
        setError(data.error || 'Failed to save inspection record.');
        return;
      }
      onScanSaved(data.scan);
      setSaveMessage(`Saved inspection ${data.scan.id} to the municipal log.`);
    } catch {
      setError('Failed to save inspection record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sample Presets Strip */}
      <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
          Test AI Vision with sample dashcam captures or upload your own road image:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_ROAD_PRESETS.map((preset) => {
            const active = sampleImagePath === preset.imagePath && !uploadedDataUrl;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Upload & Metadata Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <AnnotatedRoadImage
              src={previewUrl}
              alt={roadName || 'Selected road preview'}
              defects={analysis?.isRoadImage ? analysis.defects : []}
              highlightedDefectId={highlightedDefectId}
              onSelectDefect={setHighlightedDefectId}
              className="aspect-[4/3] w-full"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-lg border-2 border-dashed transition-colors cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-4 ${
                dragActive
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Upload road surface photograph
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Drag and drop JPG, PNG, or WEBP here, or click to browse
                  </p>
                </div>
              </div>
              <span className="px-3.5 py-2 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
                Choose File
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFileChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Road Segment Name
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. Oakridge Ave Mile 3"
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Corridor
                </label>
                <select
                  value={corridor}
                  onChange={(e) => setCorridor(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {CORRIDOR_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  GPS Coordinates
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={coordinates}
                    onChange={(e) => setCoordinates(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    title="Use current GPS"
                    aria-label="Use current GPS"
                    className="px-2.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md px-3.5 py-2.5"
              >
                {error}
              </div>
            )}

            {saveMessage && (
              <div className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md px-3.5 py-2.5">
                {saveMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyze}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ScanLine className="w-4 h-4" />
                )}
                <span>{analyzing ? 'Scanning Pavement...' : 'Run AI Damage Detection'}</span>
              </button>

              {analysis && analysis.isRoadImage && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveScan}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save to Inspection Log'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Detection Results */}
        <div className="lg:col-span-5 p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Detection Results &amp; Classification
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated ASTM D6433 pavement distress evaluation
            </p>
          </div>

          {analyzing ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
              <div className="text-sm font-medium text-slate-900 dark:text-white">
                Analyzing road surface geometry...
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Identifying potholes, fatigue cracks, lane wear, and calculating Pavement Condition Index.
              </p>
            </div>
          ) : !analysis ? (
            <div className="py-14 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
              <ScanLine className="w-7 h-7 mx-auto text-slate-400" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Ready for Road Surface Scan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Choose a test capture above or upload a road photo, then click Run AI Damage Detection.
              </p>
            </div>
          ) : !analysis.isRoadImage ? (
            <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 space-y-2">
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Non-Roadway Image Detected
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {analysis.rejectionReason ||
                  'This image does not appear to depict a road, street, or pavement surface. Please upload a clear roadway photograph.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Pavement Condition Index
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums mt-1 ${getPciColorClass(
                      analysis.pciScore
                    )}`}
                  >
                    {analysis.pciScore} / 100
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Rating: {getPciLabel(analysis.pciScore)}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Overall Severity
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 text-base font-semibold mt-1.5 ${getSeverityTextClass(
                      analysis.overallSeverity
                    )}`}
                  >
                    <SeverityIcon severity={analysis.overallSeverity} />
                    <span>{analysis.overallSeverity}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {analysis.surfaceMaterial} · {analysis.estimatedRepairAreaSqM.toFixed(1)} m²
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <p className="text-sm text-slate-700 dark:text-slate-300">{analysis.summary}</p>
                <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Recommended Action · Est. {analysis.estimatedCostUsd}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 mt-1">
                    {analysis.recommendedAction}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                  <span>Detected Anomalies ({analysis.defects.length})</span>
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    Hover to highlight on image
                  </span>
                </div>

                {analysis.defects.length === 0 ? (
                  <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300">
                    Surface integrity nominal. No potholes or structural cracks detected.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {analysis.defects.map((defect) => {
                      const active = highlightedDefectId === defect.id;
                      return (
                        <div
                          key={defect.id}
                          onMouseEnter={() => setHighlightedDefectId(defect.id)}
                          onMouseLeave={() => setHighlightedDefectId(null)}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {defect.type}
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                              <span
                                className={`font-medium ${getSeverityTextClass(defect.severity)}`}
                              >
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
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
