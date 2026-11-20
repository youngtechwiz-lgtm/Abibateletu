import { useEffect, useState } from 'react';
import { getOptimizedCloudinaryUrl, type CloudinaryPreset } from '../lib/cloudinary.ts';
import type { MediaAsset } from '../types/cms.ts';

interface EditorialMediaFrameProps {
  asset?: MediaAsset;
  preset?: CloudinaryPreset;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showPlaceholderBadge?: boolean;
  darkSurface?: boolean;
  grayscale?: boolean;
}

const TONE_CLASSES: Record<NonNullable<MediaAsset['placeholderTone']>, string> = {
  obsidian: 'from-[#1a1816] via-[#100f0e] to-[#080807] text-[#e8e3da]',
  bronze: 'from-[#3a2a1e] via-[#241912] to-[#110d0a] text-[#f0e6d8]',
  charcoal: 'from-[#282725] via-[#1a1918] to-[#0e0e0d] text-[#ece8e1]',
  sepia: 'from-[#5a4a3c] via-[#3c3026] to-[#1e1813] text-[#f4efe8]',
  alabaster: 'from-[#d9d4cb] via-[#c7c0b4] to-[#ada598] text-[#1c1a17]',
};

export function EditorialMediaFrame({
  asset,
  preset = 'portfolio-card',
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  priority = false,
  showPlaceholderBadge = true,
  darkSurface = true,
  grayscale = false,
}: EditorialMediaFrameProps) {
  const [useRawFallback, setUseRawFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUseRawFallback(false);
    setFailed(false);
  }, [asset?.id, asset?.secureUrl, preset]);

  const rawUrl = asset?.secureUrl?.trim() || '';
  const optimizedUrl = asset ? getOptimizedCloudinaryUrl(asset, preset) : '';
  const activeUrl = failed ? '' : useRawFallback ? rawUrl : optimizedUrl || rawUrl;
  const hasRealImage = Boolean(activeUrl);

  const handleError = () => {
    // If the optimized URL failed and differs from the raw URL, try falling back to raw secureUrl
    if (!useRawFallback && rawUrl && optimizedUrl && optimizedUrl !== rawUrl) {
      setUseRawFallback(true);
    } else {
      setFailed(true);
    }
  };

  if (hasRealImage && asset) {
    return (
      <div className={`relative overflow-hidden bg-[#141414] ${className}`}>
        <img
          src={activeUrl}
          alt={alt || asset.altText || asset.assetName}
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
          onError={handleError}
          className={`${imgClassName} ${grayscale ? 'grayscale contrast-110' : ''} transition-transform duration-700 ease-out`}
        />
      </div>
    );
  }

  const tone = asset?.placeholderTone || (darkSurface ? 'obsidian' : 'alabaster');
  const toneClass = TONE_CLASSES[tone];
  const label = asset?.placeholderLabel || asset?.assetName || 'Editorial Photography Slot';

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${toneClass} ${className}`}
      role="img"
      aria-label={alt || label}
    >
      {/* Architectural window-light beam mimicking the reference lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 bg-[linear-gradient(122deg,transparent_18%,rgba(255,244,226,0.18)_38%,transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_28%,rgba(212,184,142,0.14),transparent_62%)]"
      />

      {showPlaceholderBadge && (
        <div className="relative z-10 flex h-full w-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.24em] opacity-65">
              Placeholder Plate
            </span>
            <span className="h-px flex-1 max-w-[36px] bg-current opacity-25" />
          </div>

          <div className="space-y-1">
            <p className="font-serif text-sm sm:text-base tracking-wide opacity-85 leading-snug">
              {label}
            </p>
            <p className="text-[10px] tracking-[0.14em] uppercase opacity-55">
              Upload via Cloudinary Media Library
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
