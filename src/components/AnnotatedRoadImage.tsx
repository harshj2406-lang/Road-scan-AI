import { useState } from 'react';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import type { DetectedDefect } from '../types/roadscan';
import { getSeverityHex } from '../utils/formatters';

interface AnnotatedRoadImageProps {
  src: string;
  alt: string;
  defects: DetectedDefect[];
  highlightedDefectId?: string | null;
  onSelectDefect?: (id: string | null) => void;
  showToggle?: boolean;
  className?: string;
}

export function AnnotatedRoadImage({
  src,
  alt,
  defects,
  highlightedDefectId,
  onSelectDefect,
  showToggle = true,
  className = '',
}: AnnotatedRoadImageProps) {
  const [showBoxes, setShowBoxes] = useState(true);
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 select-none ${className}`}
    >
      {imgError ? (
        <div className="flex flex-col items-center justify-center aspect-[4/3] w-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-6 text-center">
          <MapPin className="w-8 h-8 mb-2 opacity-60" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{alt}</span>
          <span className="text-xs mt-1">Road surface preview unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover block"
        />
      )}

      {!imgError && showBoxes && defects.length > 0 && (
        <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-auto"
          aria-label="Detected road damage overlays"
        >
          {defects.map((defect) => {
            const [ymin, xmin, ymax, xmax] = defect.bbox;
            const width = Math.max(20, xmax - xmin);
            const height = Math.max(20, ymax - ymin);
            const color = getSeverityHex(defect.severity);
            const isHighlighted = highlightedDefectId === defect.id;
            const labelY = ymin > 54 ? ymin - 8 : Math.min(980, ymax + 26);

            return (
              <g
                key={defect.id}
                onMouseEnter={() => onSelectDefect?.(defect.id)}
                onMouseLeave={() => onSelectDefect?.(null)}
                onClick={(e) => {
                  if (onSelectDefect) {
                    e.stopPropagation();
                    onSelectDefect(isHighlighted ? null : defect.id);
                  }
                }}
                className="cursor-pointer"
              >
                <rect
                  x={xmin}
                  y={ymin}
                  width={width}
                  height={height}
                  fill={color}
                  fillOpacity={isHighlighted ? 0.24 : 0.1}
                  stroke={color}
                  strokeWidth={isHighlighted ? 8 : 5}
                  rx={6}
                />
                <rect
                  x={xmin}
                  y={Math.max(4, labelY - 26)}
                  width={Math.min(460, defect.type.length * 14 + 92)}
                  height={30}
                  rx={4}
                  fill={color}
                  fillOpacity={0.92}
                />
                <text
                  x={xmin + 10}
                  y={Math.max(24, labelY - 6)}
                  fill="#FFFFFF"
                  fontSize="20"
                  fontWeight="600"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {`${defect.type} ${Math.round(defect.confidence * 100)}%`}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      {showToggle && defects.length > 0 && !imgError && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowBoxes((prev) => !prev);
          }}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900/85 text-white hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 backdrop-blur-xs"
        >
          {showBoxes ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showBoxes ? 'Hide Overlays' : 'Show Overlays'}</span>
        </button>
      )}
    </div>
  );
}
