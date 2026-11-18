import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from './EditorialMediaFrame.tsx';
import type { PageSlug } from '../types/cms.ts';

interface PageHeroSlideshowProps {
  pageSlug: PageSlug;
}

export function PageHeroSlideshow({ pageSlug }: PageHeroSlideshowProps) {
  const { state, getAssetById } = useCms();
  const hero = state.pageHeroes[pageSlug];
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeSlides.length > 0 ? activeSlides : rawSlides;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [pageSlug, slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[index] || slides[0];
  const activeAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;
  const resolvedTitle = activeSlide?.title?.trim() || hero.title;
  const resolvedCtaText = activeSlide?.ctaText?.trim() || hero.ctaText;
  const resolvedCtaLink = activeSlide?.ctaLink?.trim() || hero.ctaLink;

  const goPrev = () => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative min-h-[58vh] sm:min-h-[64vh] w-full overflow-hidden bg-[#0C0C0C] text-[#F5F0E8] flex items-end">
      {/* Independent Hero Slideshow Backdrop */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide?.id || pageSlug}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <EditorialMediaFrame
            asset={activeAsset}
            preset="hero"
            priority
            showPlaceholderBadge={false}
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-[#0C0C0C]/55 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/85 via-[#0C0C0C]/35 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Hero Editorial Copy */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14 pt-28 pb-12 sm:pb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-[#F5F0E8]/70">
              {hero.kicker}
            </span>
            <span className="h-px w-10 bg-white/25" />
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-light tracking-[0.04em] uppercase leading-[0.95] text-[#F5F0E8]">
            {resolvedTitle}
          </h1>

          {hero.subtitle && (
            <p className="mt-4 text-[11px] tracking-[0.26em] uppercase text-[#F5F0E8]/75">
              {hero.subtitle}
            </p>
          )}

          {resolvedCtaText && (
            <div className="mt-7">
              {resolvedCtaLink.startsWith('#') ? (
                <a
                  href={resolvedCtaLink}
                  className="inline-flex items-center gap-3 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{resolvedCtaText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  to={resolvedCtaLink || '/portfolio'}
                  className="inline-flex items-center gap-3 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{resolvedCtaText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Slide Controls & Caption */}
        {slides.length > 0 && (
          <div className="flex flex-col items-start md:items-end gap-3 text-left md:text-right">
            {activeSlide?.caption && (
              <p className="text-xs text-[#F5F0E8]/75 max-w-xs">
                {activeSlide.caption}
                {activeSlide.locationTag ? ` · ${activeSlide.locationTag}` : ''}
              </p>
            )}
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-mono tabular-nums tracking-[0.2em] text-[#F5F0E8]/75">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
              {slides.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous hero slide"
                    className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next hero slide"
                    className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
