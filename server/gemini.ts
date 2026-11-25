import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'node:crypto';
import type {
  AnalysisPreviewResult,
  DefectType,
  SeverityLevel,
} from '../src/types/roadscan.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add a valid Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const VALID_DEFECT_TYPES: DefectType[] = [
  'Pothole',
  'Alligator Cracking',
  'Longitudinal Crack',
  'Transverse Crack',
  'Edge Breakup',
  'Surface Raveling',
  'Faded Lane Markings',
];

function normalizeDefectType(raw: string): DefectType {
  const found = VALID_DEFECT_TYPES.find(
    (t) => t.toLowerCase() === raw.trim().toLowerCase()
  );
  if (found) return found;
  if (raw.toLowerCase().includes('pothole')) return 'Pothole';
  if (raw.toLowerCase().includes('alligator')) return 'Alligator Cracking';
  if (raw.toLowerCase().includes('longitudinal')) return 'Longitudinal Crack';
  if (raw.toLowerCase().includes('transverse')) return 'Transverse Crack';
  if (raw.toLowerCase().includes('edge')) return 'Edge Breakup';
  if (raw.toLowerCase().includes('marking') || raw.toLowerCase().includes('line'))
    return 'Faded Lane Markings';
  return 'Surface Raveling';
}

function normalizeSeverity(raw: string): SeverityLevel {
  const lower = raw.trim().toLowerCase();
  if (lower === 'critical' || lower === 'severe' || lower === 'high') return 'Critical';
  if (lower === 'moderate' || lower === 'medium') return 'Moderate';
  if (lower === 'minor' || lower === 'low' || lower === 'fair') return 'Minor';
  return 'Good';
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('DEADLINE_EXCEEDED');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function analyzeRoadSurface(
  base64Data: string,
  mimeType: string,
  roadName?: string
): Promise<AnalysisPreviewResult> {
  const ai = getGeminiClient();

  const prompt = `You are a certified civil infrastructure pavement inspection computer vision system (ASTM D6433 PCI methodology).
Analyze this image${roadName ? ` from "${roadName}"` : ''}.
1. Determine if this image depicts a road, street, highway, pavement, driveway, or asphalt/concrete roadway surface. If it does NOT depict a road or pavement surface, set isRoadImage to false and explain briefly in rejectionReason.
2. If it is a road surface, identify all visible pavement defects such as:
   - "Pothole"
   - "Alligator Cracking"
   - "Longitudinal Crack"
   - "Transverse Crack"
   - "Edge Breakup"
   - "Surface Raveling"
   - "Faded Lane Markings"
3. For each detected defect, provide normalized bounding box coordinates [ymin, xmin, ymax, xmax] scaled strictly from 0 to 1000 matching the defect's exact position in the image, severity ("Critical", "Moderate", or "Minor"), confidence (0.0 to 1.0), estimated areaSqM, and a concise engineering description.
4. Compute an overall Pavement Condition Index (pciScore from 0 to 100, where 85-100 is Good, 65-84 is Minor/Fair, 45-64 is Moderate, and 0-44 is Critical), overallSeverity ("Critical" | "Moderate" | "Minor" | "Good"), surfaceMaterial ("Asphalt" | "Concrete" | "Composite" | "Unpaved"), estimatedRepairAreaSqM, estimatedCostUsd (e.g. "$1,200 – $1,800" or "$0"), recommendedAction, and summary.
If the pavement is smooth and undamaged, return an empty defects array, high pciScore (88-98), and overallSeverity "Good".`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isRoadImage: {
              type: Type.BOOLEAN,
              description: 'Whether the image shows a road or pavement surface.',
            },
            rejectionReason: {
              type: Type.STRING,
              description: 'Brief reason if isRoadImage is false.',
            },
            surfaceMaterial: {
              type: Type.STRING,
              description: 'Asphalt, Concrete, Composite, or Unpaved.',
            },
            pciScore: {
              type: Type.NUMBER,
              description: 'Pavement Condition Index from 0 to 100.',
            },
            overallSeverity: {
              type: Type.STRING,
              description: 'Critical, Moderate, Minor, or Good.',
            },
            estimatedRepairAreaSqM: {
              type: Type.NUMBER,
              description: 'Total estimated damaged surface area in square meters.',
            },
            estimatedCostUsd: {
              type: Type.STRING,
              description: 'Estimated repair cost range in USD.',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Concise municipal maintenance action.',
            },
            summary: {
              type: Type.STRING,
              description: 'Two-sentence engineering inspection summary.',
            },
            defects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description:
                      'One of: Pothole, Alligator Cracking, Longitudinal Crack, Transverse Crack, Edge Breakup, Surface Raveling, Faded Lane Markings.',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'Critical, Moderate, or Minor.',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: 'Detection confidence score between 0 and 1.',
                  },
                  bbox: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'Normalized [ymin, xmin, ymax, xmax] integers between 0 and 1000.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Short technical description of this defect.',
                  },
                  areaSqM: {
                    type: Type.NUMBER,
                    description: 'Estimated area in square meters.',
                  },
                },
                required: ['type', 'severity', 'confidence', 'bbox', 'description', 'areaSqM'],
              },
            },
          },
          required: [
            'isRoadImage',
            'surfaceMaterial',
            'pciScore',
            'overallSeverity',
            'estimatedRepairAreaSqM',
            'estimatedCostUsd',
            'recommendedAction',
            'summary',
            'defects',
          ],
        },
      },
    })
  );

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText) as {
    isRoadImage?: boolean;
    rejectionReason?: string;
    surfaceMaterial?: string;
    pciScore?: number;
    overallSeverity?: string;
    estimatedRepairAreaSqM?: number;
    estimatedCostUsd?: string;
    recommendedAction?: string;
    summary?: string;
    defects?: Array<{
      type?: string;
      severity?: string;
      confidence?: number;
      bbox?: number[];
      description?: string;
      areaSqM?: number;
    }>;
  };

  const material = (['Asphalt', 'Concrete', 'Composite', 'Unpaved'].includes(
    parsed.surfaceMaterial ?? ''
  )
    ? parsed.surfaceMaterial
    : 'Asphalt') as AnalysisPreviewResult['surfaceMaterial'];

  const defects = (parsed.defects ?? []).map((d) => {
    const rawBox = Array.isArray(d.bbox) && d.bbox.length === 4 ? d.bbox : [300, 250, 700, 750];
    const clamp = (n: number) => Math.max(0, Math.min(1000, Math.round(Number(n) || 0)));
    const ymin = clamp(rawBox[0]);
    const xmin = clamp(rawBox[1]);
    const ymax = Math.max(ymin + 20, clamp(rawBox[2]));
    const xmax = Math.max(xmin + 20, clamp(rawBox[3]));

    const sev = normalizeSeverity(d.severity ?? 'Moderate');
    return {
      id: `def-${crypto.randomBytes(4).toString('hex')}`,
      type: normalizeDefectType(d.type ?? 'Surface Raveling'),
      severity: (sev === 'Good' ? 'Minor' : sev) as 'Critical' | 'Moderate' | 'Minor',
      confidence: Math.max(0.5, Math.min(0.99, Number(d.confidence) || 0.85)),
      bbox: [ymin, xmin, Math.min(1000, ymax), Math.min(1000, xmax)] as [
        number,
        number,
        number,
        number,
      ],
      description: d.description?.trim() || 'Detected surface distress requiring inspection.',
      areaSqM: Math.max(0.1, Number((Number(d.areaSqM) || 0.8).toFixed(1))),
    };
  });

  const pciScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pciScore) || 70)));
  const overallSeverity = normalizeSeverity(parsed.overallSeverity ?? 'Moderate');

  return {
    isRoadImage: parsed.isRoadImage !== false,
    rejectionReason: parsed.rejectionReason,
    surfaceMaterial: material,
    pciScore,
    overallSeverity,
    estimatedRepairAreaSqM: Math.max(
      0,
      Number((Number(parsed.estimatedRepairAreaSqM) || 0).toFixed(1))
    ),
    estimatedCostUsd: parsed.estimatedCostUsd?.trim() || '$0',
    recommendedAction:
      parsed.recommendedAction?.trim() || 'Continue routine road surface monitoring.',
    summary:
      parsed.summary?.trim() ||
      'Automated surface evaluation complete. Review detected zones below.',
    defects,
  };
}
