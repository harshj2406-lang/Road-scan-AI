# ROADSCAN AI

AI-powered road surface inspection, pothole & crack detection, and municipal pavement condition analytics platform.

## Features

- **AI Road Damage Detection**: Upload roadway photographs or test built-in dashcam samples to detect potholes, alligator cracking, longitudinal/transverse cracks, edge breakup, surface raveling, and faded lane markings with bounding-box localization.
- **Pavement Condition Index (PCI) Scoring**: Automated 0–100 condition grading, severity classification (`Critical`, `Moderate`, `Minor`, `Good`), repair area estimation, and maintenance action recommendations.
- **Operations Dashboard & Analytics**: Live KPI telemetry, defect distribution charts, 6-month PCI trend visualization, and corridor-level pavement health summaries.
- **Inspection Log & Workflow**: Searchable, filterable inspection records with detail modal, bounding-box inspection viewer, and repair status workflow (`Open` → `Scheduled` → `Repaired`).
- **Condition Reports & Export**: Printable municipal road condition reports and CSV export.
- **Operator Authentication**: Server-backed account registration and sign-in with salted `scrypt` password hashing and HMAC-SHA256 Bearer tokens.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Express.js (`server.ts`), `@google/genai` (`gemini-4-hydrogen` Vision API), file-backed JSON persistence (`data/db.json`)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Set `GEMINI_API_KEY` to a valid Google Gemini API key.

3. Start the development server (port 3000):
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```
