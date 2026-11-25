import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import {
  attachOptionalAuth,
  hashPassword,
  requireAuth,
  signSessionToken,
  toPublicUser,
  verifyPassword,
  type AuthenticatedRequest,
  type UserRole,
} from './server/auth.ts';
import {
  addScan,
  computeAnalytics,
  createUser,
  deleteScan,
  findScanById,
  findUserByEmail,
  findUserById,
  listScans,
  saveUploadedImage,
  updateScanStatus,
  UPLOADS_DIR,
} from './server/store.ts';
import { analyzeRoadSurface } from './server/gemini.ts';
import type { RepairStatus, RoadScan } from './src/types/roadscan.ts';

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_ROLES: UserRole[] = [
  'Municipal Inspector',
  'Civil Engineer',
  'Fleet Manager',
];

const SAMPLE_IMAGE_ALLOWLIST: Record<string, string> = {
  '/src/assets/images/road_pothole_asphalt_1795598710816.jpg':
    'src/assets/images/road_pothole_asphalt_1795598710816.jpg',
  '/src/assets/images/road_alligator_cracks_1795598711200.jpg':
    'src/assets/images/road_alligator_cracks_1795598711200.jpg',
  '/src/assets/images/road_highway_surface_1795598711941.jpg':
    'src/assets/images/road_highway_surface_1795598711941.jpg',
  '/src/assets/images/road_repaired_clean_1795598711260.jpg':
    'src/assets/images/road_repaired_clean_1795598711260.jpg',
};

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  return { mimeType: match[1].toLowerCase(), base64Data: match[2] };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use(attachOptionalAuth(findUserById));

  // Serve persisted uploaded road photos safely
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ROADSCAN AI' });
  });

  // Authentication endpoints
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body as {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
      };

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        res.status(400).json({ error: 'Please enter a valid full name (at least 2 characters).' });
        return;
      }
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (findUserByEmail(cleanEmail)) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const validRole: UserRole = ALLOWED_ROLES.includes(role as UserRole)
        ? (role as UserRole)
        : 'Municipal Inspector';

      const passwordHash = await hashPassword(password);
      const user = createUser({
        id: `usr-${crypto.randomUUID()}`,
        name: name.trim(),
        email: cleanEmail,
        role: validRole,
        passwordHash,
        createdAt: new Date().toISOString(),
      });

      const publicUser = toPublicUser(user);
      const token = signSessionToken(publicUser);
      res.status(201).json({ user: publicUser, token });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Unable to create account right now.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const user = findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const publicUser = toPublicUser(user);
      const token = signSessionToken(publicUser);
      res.json({ user: publicUser, token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Sign in failed. Please try again.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Inspections & Analytics API
  app.get('/api/scans', (req, res) => {
    const { severity, status, corridor, search } = req.query as Record<string, string | undefined>;
    let scans = listScans();

    if (severity && severity !== 'All') {
      scans = scans.filter((s) => s.overallSeverity === severity);
    }
    if (status && status !== 'All') {
      scans = scans.filter((s) => s.repairStatus === status);
    }
    if (corridor && corridor !== 'All') {
      scans = scans.filter((s) => s.corridor === corridor);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      scans = scans.filter(
        (s) =>
          s.roadName.toLowerCase().includes(q) ||
          s.corridor.toLowerCase().includes(q) ||
          s.inspectorName.toLowerCase().includes(q) ||
          s.defects.some((d) => d.type.toLowerCase().includes(q))
      );
    }

    res.json({ scans });
  });

  app.get('/api/analytics', (_req, res) => {
    res.json(computeAnalytics());
  });

  app.post('/api/scans/analyze', async (req: AuthenticatedRequest, res) => {
    try {
      const { imageDataUrl, sampleImagePath, roadName } = req.body as {
        imageDataUrl?: string;
        sampleImagePath?: string;
        roadName?: string;
      };

      let base64Data = '';
      let mimeType = 'image/jpeg';

      if (sampleImagePath) {
        const relPath = SAMPLE_IMAGE_ALLOWLIST[sampleImagePath];
        if (!relPath) {
          res.status(400).json({ error: 'Invalid sample road image reference.' });
          return;
        }
        const resolved = path.resolve(process.cwd(), relPath);
        const assetsBase = path.resolve(process.cwd(), 'src', 'assets', 'images');
        if (!resolved.startsWith(assetsBase + path.sep) || !fs.existsSync(resolved)) {
          res.status(404).json({ error: 'Sample road image not found.' });
          return;
        }
        base64Data = fs.readFileSync(resolved).toString('base64');
        mimeType = 'image/jpeg';
      } else if (imageDataUrl && typeof imageDataUrl === 'string') {
        const parsed = parseDataUrl(imageDataUrl);
        if (!parsed) {
          res.status(400).json({
            error: 'Invalid image payload. Please upload a valid JPG, PNG, or WEBP image.',
          });
          return;
        }
        base64Data = parsed.base64Data;
        mimeType = parsed.mimeType;
      } else {
        res.status(400).json({ error: 'Please provide a road image to analyze.' });
        return;
      }

      const result = await analyzeRoadSurface(base64Data, mimeType, roadName);
      res.json({ analysis: result });
    } catch (err: unknown) {
      console.error('Road analysis error:', err);
      const message = err instanceof Error ? err.message : 'Road surface analysis failed.';
      if (message.includes('GEMINI_API_KEY') || message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) {
        res.status(503).json({
          error:
            'Gemini Vision API key is missing or invalid. Please check your key in Settings > Secrets.',
        });
        return;
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        res.status(429).json({
          error: 'AI analysis quota temporarily reached. Please wait a moment and retry.',
        });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/scans', (req: AuthenticatedRequest, res) => {
    try {
      const {
        roadName,
        corridor,
        coordinates,
        imageDataUrl,
        sampleImagePath,
        analysis,
      } = req.body as {
        roadName?: string;
        corridor?: string;
        coordinates?: string;
        imageDataUrl?: string;
        sampleImagePath?: string;
        analysis?: RoadScan;
      };

      if (!roadName || typeof roadName !== 'string' || !roadName.trim()) {
        res.status(400).json({ error: 'Road segment name is required.' });
        return;
      }
      if (!corridor || typeof corridor !== 'string' || !corridor.trim()) {
        res.status(400).json({ error: 'Corridor name is required.' });
        return;
      }
      if (!analysis || typeof analysis !== 'object') {
        res.status(400).json({ error: 'Analysis data is required to save an inspection.' });
        return;
      }

      let storedImageUrl = '';
      if (sampleImagePath && SAMPLE_IMAGE_ALLOWLIST[sampleImagePath]) {
        storedImageUrl = sampleImagePath;
      } else if (imageDataUrl && typeof imageDataUrl === 'string') {
        const parsed = parseDataUrl(imageDataUrl);
        if (!parsed) {
          res.status(400).json({ error: 'Invalid uploaded image format.' });
          return;
        }
        storedImageUrl = saveUploadedImage(parsed.base64Data, parsed.mimeType);
      } else {
        res.status(400).json({ error: 'An image is required to save the inspection.' });
        return;
      }

      const newScan: RoadScan = {
        id: `scan-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        roadName: roadName.trim(),
        corridor: corridor.trim(),
        coordinates: coordinates?.trim() || '41.8781, -87.6298',
        scannedAt: new Date().toISOString(),
        inspectorName: req.user ? req.user.name : 'Field Guest Operator',
        userId: req.user ? req.user.id : null,
        imageUrl: storedImageUrl,
        surfaceMaterial: analysis.surfaceMaterial ?? 'Asphalt',
        pciScore: Math.max(0, Math.min(100, Math.round(Number(analysis.pciScore) || 70))),
        overallSeverity: analysis.overallSeverity ?? 'Moderate',
        repairStatus: analysis.overallSeverity === 'Good' ? 'Repaired' : 'Open',
        estimatedRepairAreaSqM: Number(analysis.estimatedRepairAreaSqM) || 0,
        estimatedCostUsd: analysis.estimatedCostUsd || '$0',
        recommendedAction: analysis.recommendedAction || 'Routine monitoring.',
        summary: analysis.summary || 'Road surface scan logged.',
        defects: Array.isArray(analysis.defects) ? analysis.defects : [],
      };

      const saved = addScan(newScan);
      res.status(201).json({ scan: saved });
    } catch (err) {
      console.error('Save scan error:', err);
      res.status(500).json({ error: 'Failed to save inspection record.' });
    }
  });

  app.patch('/api/scans/:id', (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { repairStatus } = req.body as { repairStatus?: RepairStatus };
    if (!repairStatus || !['Open', 'Scheduled', 'Repaired'].includes(repairStatus)) {
      res.status(400).json({ error: 'Invalid repair status.' });
      return;
    }

    const existing = findScanById(id);
    if (!existing) {
      res.status(404).json({ error: 'Inspection record not found.' });
      return;
    }

    const updated = updateScanStatus(id, repairStatus);
    res.json({ scan: updated });
  });

  app.delete('/api/scans/:id', (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const existing = findScanById(id);
    if (!existing) {
      res.status(404).json({ error: 'Inspection record not found.' });
      return;
    }
    if (existing.userId && (!req.user || req.user.id !== existing.userId)) {
      res.status(403).json({ error: 'Only the owner of this scan can delete it.' });
      return;
    }
    deleteScan(id);
    res.json({ deleted: true });
  });

  // Vite dev middleware vs production static serve
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ROADSCAN AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
