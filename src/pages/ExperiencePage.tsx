import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';
import type { ExperienceCategory, ExperienceEntry } from '../types/cms.ts';

const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  'Campaigns',
  'Runway',
  'Editorials',
  'Publications',
  'Collaborations',
];

const CATEGORY_INDEX: Record<ExperienceCategory, string> = {
  Campaigns: '01',
  Runway: '02',
  Editorials: '03',
  Publications: '04',
  Collaborations: '05',
};

export function ExperiencePage() {
  const { state, getAssetById } = useCms();
  const { pageHeroes, experiencePage, experienceEntries } = state;
  const hero = pageHeroes.experience;
  const rawHeroSlides = hero?.slides?.length ? hero.slides : [];
  const activeHeroSlides = rawHeroSlides.filter((s) => s.isActive !== false);
  const heroSlides = activeHeroSlides.length > 0 ? activeHeroSlides : rawHeroSlides;

  const [slideIndex, setSlideIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'ALL' | ExperienceCategory>('ALL');
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [modalState, setModalState] = useState<{
    entry: ExperienceEntry;
    imageIndex: number;
  } | null>(null);

  useEffect(() => {
    setSlideIndex(0);
  }, [heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const publishedEntries = useMemo(
    () =>
      [...experienceEntries]
        .filter((e) => e.isPublished !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [experienceEntries]
  );

  const filteredEntries = useMemo(() => {
    if (activeCategory === 'ALL') return publishedEntries;
    return publishedEntries.filter((e) => e.category === activeCategory);
  }, [publishedEntries, activeCategory]);

  const featuredPool = useMemo(() => {
    const base = filteredEntries.length > 0 ? filteredEntries : publishedEntries;
    const flagged = base.filter((e) => e.featured);
    return flagged.length > 0 ? flagged : base;
  }, [filteredEntries, publishedEntries]);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [activeCategory, featuredPool.length]);

  const currentFeatured = featuredPool[featuredIndex] || featuredPool[0] || null;

  const getEntryImageIds = (entry: ExperienceEntry): string[] => {
    const combined = [entry.coverAssetId, ...(entry.galleryAssetIds || [])].filter(Boolean);
    return Array.from(new Set(combined));
  };

  const featuredGalleryThumbs = useMemo(() => {
    if (!currentFeatured) return [];
    const allIds = getEntryImageIds(currentFeatured);
    const secondary = allIds.filter((id) => id !== currentFeatured.coverAssetId);
    if (secondary.length >= 2) return secondary.slice(0, 2);
    if (secondary.length === 1 && currentFeatured.coverAssetId) {
      return [secondary[0], currentFeatured.coverAssetId];
    }
    return allIds.slice(0, 2);
  }, [currentFeatured]);

  const openEntryModal = (entry: ExperienceEntry, assetId?: string) => {
    const ids = getEntryImageIds(entry);
    const idx = assetId ? Math.max(0, ids.indexOf(assetId)) : 0;
    setModalState({ entry, imageIndex: idx });
  };

  useEffect(() => {
    if (!modalState) return;
    const ids = getEntryImageIds(modalState.entry);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalState(null);
      } else if (e.key === 'ArrowRight' && ids.length > 1) {
        setModalState((prev) =>
          prev ? { ...prev, imageIndex: (prev.imageIndex + 1) % ids.length } : null
        );
      } else if (e.key === 'ArrowLeft' && ids.length > 1) {
        setModalState((prev) =>
          prev ? { ...prev, imageIndex: (prev.imageIndex - 1 + ids.length) % ids.length } : null
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalState]);

  const activeHeroSlide = heroSlides[slideIndex] || heroSlides[0];
  const activeHeroAsset = activeHeroSlide ? getAssetById(activeHeroSlide.assetId) : undefined;
  const resolvedHeroTitle = activeHeroSlide?.title?.trim() || hero.title;
  const resolvedHeroCtaText = activeHeroSlide?.ctaText?.trim() || hero.ctaText;
  const resolvedHeroCtaLink = activeHeroSlide?.ctaLink?.trim() || hero.ctaLink;

  const modalImageIds = modalState ? getEntryImageIds(modalState.entry) : [];
  const modalActiveAssetId = modalImageIds[modalState?.imageIndex ?? 0];
  const modalActiveAsset = modalActiveAssetId ? getAssetById(modalActiveAssetId) : undefined;

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — CAREER IN MOTION. */}
      <section className="relative min-h-[60vh] sm:min-h-[68vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHeroSlide?.id || 'experience-hero'}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <EditorialMediaFrame
              asset={activeHeroAsset}
              preset="hero"
              priority
              showPlaceholderBadge={false}
              className="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/92 via-[#0C0C0C]/55 to-black/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/90 via-transparent to-black/50" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14 pt-32 pb-12 sm:pb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-[#F5F0E8]/70">
                {hero.kicker}
              </span>
              <span className="h-px w-12 bg-white/30" />
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[4.65rem] font-light tracking-[0.02em] uppercase leading-[0.94] text-[#F5F0E8]">
              {resolvedHeroTitle}
            </h1>

            {hero.subtitle && (
              <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[#F5F0E8]/78">
                {hero.subtitle}
              </p>
            )}

            {resolvedHeroCtaText && (
              <div className="mt-7">
                <Link
                  to={resolvedHeroCtaLink || '/portfolio'}
                  className="group inline-flex items-center gap-4 border-b border-white/40 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{resolvedHeroCtaText}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[104px] text-[9px] leading-[1.7] tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                {experiencePage.heroCornerCaption}
              </p>
              <span className="h-8 w-px bg-white/30" />
            </div>

            {heroSlides.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono tabular-nums tracking-[0.22em] text-[#F5F0E8]/75">
                  {String(slideIndex + 1).padStart(2, '0')} /{' '}
                  {String(heroSlides.length).padStart(2, '0')}
                </span>
                {heroSlides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                      }
                      aria-label="Previous hero slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                      aria-label="Next hero slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 1 — EXPERIENCE CATEGORIES + FILTER TABS */}
      <section className="bg-[#F5F0E8] text-[#141414] py-14 sm:py-18">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                EXPERIENCE CATEGORIES
              </span>
              <span className="h-px w-12 bg-[#141414]/25" />
            </div>

            <div
              className="flex flex-wrap items-center gap-5 sm:gap-7"
              role="tablist"
              aria-label="Filter experience by category"
            >
              {(['ALL', ...EXPERIENCE_CATEGORIES] as const).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(cat)}
                    className={`pb-1 text-[10px] font-medium tracking-[0.22em] uppercase whitespace-nowrap shrink-0 transition-colors border-b ${
                      isActive
                        ? 'border-[#141414] text-[#141414]'
                        : 'border-transparent text-[#141414]/55 hover:text-[#141414]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {EXPERIENCE_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              const coverId = experiencePage.categoryCoverAssetIds?.[cat];
              const catAsset = coverId ? getAssetById(coverId) : undefined;
              const count = publishedEntries.filter((e) => e.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(isSelected ? 'ALL' : cat)}
                  className={`group relative aspect-[3/4] overflow-hidden bg-[#161513] text-left transition-all ${
                    isSelected ? 'ring-2 ring-[#141414] ring-offset-2 ring-offset-[#F5F0E8]' : ''
                  }`}
                >
                  <EditorialMediaFrame
                    asset={catAsset}
                    preset="portrait"
                    showPlaceholderBadge={false}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/40 to-black/15" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-[#F5F0E8] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono tabular-nums text-[10px] tracking-[0.2em] text-[#F5F0E8]/70">
                        {CATEGORY_INDEX[cat]}
                      </span>
                      <span className="font-mono tabular-nums text-[10px] tracking-[0.18em] text-[#F5F0E8]/55">
                        {String(count).padStart(2, '0')}
                      </span>
                    </div>

                    <h2 className="font-serif text-xl sm:text-[1.35rem] font-light tracking-[0.03em] uppercase text-[#F5F0E8]">
                      {cat}
                    </h2>

                    <p className="text-[11px] leading-relaxed text-[#F5F0E8]/75 line-clamp-2">
                      {experiencePage.categoryDescriptions?.[cat]}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-2 border-b border-white/35 pb-1 text-[9px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] group-hover:border-white">
                      <span>VIEW {cat}</span>
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURED EXPERIENCE SHOWCASE */}
      {currentFeatured && (
        <section className="bg-[#ECEAE4] text-[#141414] border-y border-[#141414]/10">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Featured Photograph Frame */}
              <div className="lg:col-span-6 relative min-h-[380px] sm:min-h-[480px] bg-[#141414] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFeatured.id}
                    initial={{ opacity: 0.35 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.35 }}
                    transition={{ duration: 0.45 }}
                    className="h-full w-full"
                  >
                    <button
                      type="button"
                      onClick={() => openEntryModal(currentFeatured, currentFeatured.coverAssetId)}
                      className="block h-full w-full text-left cursor-zoom-in"
                      aria-label={`Open ${currentFeatured.title} details and photographs`}
                    >
                      <EditorialMediaFrame
                        asset={getAssetById(
                          currentFeatured.coverAssetId || currentFeatured.galleryAssetIds?.[0] || ''
                        )}
                        preset="hero"
                        className="h-full w-full"
                      />
                    </button>
                  </motion.div>
                </AnimatePresence>

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45" />

                {/* Top Left Corner Label */}
                <div className="pointer-events-none absolute top-7 left-7 flex flex-col items-start gap-3">
                  <p className="max-w-[90px] text-[9px] leading-[1.6] tracking-[0.26em] uppercase text-[#F5F0E8]/80">
                    FEATURED EXPERIENCE
                  </p>
                  <span className="h-7 w-px bg-white/40" />
                </div>

                {/* Bottom Left Counter & Arrows */}
                <div className="absolute bottom-7 left-7 flex items-center gap-4 text-[#F5F0E8]">
                  <span className="font-mono tabular-nums text-[10px] tracking-[0.22em]">
                    {String(featuredIndex + 1).padStart(2, '0')} /{' '}
                    {String(featuredPool.length).padStart(2, '0')}
                  </span>

                  {featuredPool.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFeaturedIndex(
                            (prev) => (prev - 1 + featuredPool.length) % featuredPool.length
                          )
                        }
                        aria-label="Previous featured experience"
                        className="flex h-8 w-8 items-center justify-center border border-white/30 bg-black/35 text-[#F5F0E8] hover:border-white transition-colors"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFeaturedIndex((prev) => (prev + 1) % featuredPool.length)
                        }
                        aria-label="Next featured experience"
                        className="flex h-8 w-8 items-center justify-center border border-white/30 bg-black/35 text-[#F5F0E8] hover:border-white transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Featured Details + Gallery Preview Strip */}
              <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex items-center">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-center w-full">
                  <div className="md:col-span-7 space-y-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/65">
                        {currentFeatured.category}
                      </span>
                      <span className="h-px w-10 bg-[#141414]/25" />
                    </div>

                    <h2 className="font-serif text-3xl sm:text-[2.45rem] font-light uppercase leading-[0.98] tracking-[0.02em] text-[#141414]">
                      {currentFeatured.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#141414]/65">
                      <span>{currentFeatured.clientOrPublication}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{currentFeatured.year}</span>
                      {currentFeatured.season && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{currentFeatured.season}</span>
                        </>
                      )}
                      {currentFeatured.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{currentFeatured.location}</span>
                        </>
                      )}
                    </div>

                    <p className="text-[13px] leading-relaxed text-[#141414]/78">
                      {currentFeatured.description || currentFeatured.notes}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openEntryModal(currentFeatured)}
                        className="group inline-flex items-center gap-4 border border-[#141414]/35 px-5 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414] hover:border-[#141414] hover:bg-[#141414] hover:text-[#F5F0E8] transition-colors"
                      >
                        <span>VIEW MORE</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>

                      {currentFeatured.externalLink && (
                        <a
                          href={currentFeatured.externalLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414]/75 hover:text-[#141414] transition-colors"
                        >
                          <span>EXTERNAL LINK</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Two Stacked Gallery Thumbnails */}
                  <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-3.5">
                    {featuredGalleryThumbs.map((assetId, idx) => (
                      <button
                        key={`${assetId}-${idx}`}
                        type="button"
                        onClick={() => openEntryModal(currentFeatured, assetId)}
                        className="group aspect-[4/3] w-full overflow-hidden bg-[#181715]"
                        aria-label={`View gallery photograph ${idx + 1} for ${currentFeatured.title}`}
                      >
                        <EditorialMediaFrame
                          asset={getAssetById(assetId)}
                          preset="portfolio-card"
                          showPlaceholderBadge={false}
                          className="h-full w-full"
                          imgClassName="h-full w-full object-cover group-hover:scale-[1.04]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3 — SELECTED EXPERIENCE TIMELINE */}
      <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Timeline Intro */}
            <aside className="lg:col-span-4 space-y-6 lg:border-r lg:border-[#141414]/12 lg:pr-10">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/70">
                  {experiencePage.timelineKicker}
                </span>
                <span className="h-px w-12 bg-[#141414]/25" />
              </div>

              <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase leading-[0.98] tracking-[0.02em] text-[#141414]">
                {experiencePage.timelineTitle}
              </h2>

              <p className="text-[13px] leading-relaxed text-[#141414]/72 max-w-xs">
                {experiencePage.timelineDescription}
              </p>

              <div className="pt-2 text-[#141414]/85">
                <AbibatSignature className="w-28 h-auto" />
              </div>
            </aside>

            {/* Right Chronological Ledger Rows */}
            <div className="lg:col-span-8">
              {filteredEntries.length === 0 ? (
                <div className="border border-[#141414]/15 bg-white p-10 text-center space-y-4">
                  <p className="font-serif text-2xl font-light uppercase text-[#141414]">
                    NO CREDITS IN THIS CATEGORY YET
                  </p>
                  <p className="text-xs text-[#141414]/65 max-w-md mx-auto">
                    Published {activeCategory.toLowerCase()} records added through the Admin Studio
                    will appear here automatically.
                  </p>
                  {activeCategory !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setActiveCategory('ALL')}
                      className="border border-[#141414] px-5 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414] hover:bg-[#141414] hover:text-[#F5F0E8] transition-colors"
                    >
                      VIEW ALL CATEGORIES
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#141414]/12 border-t border-b border-[#141414]/12">
                  {filteredEntries.map((entry) => {
                    const galleryCount = getEntryImageIds(entry).length;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openEntryModal(entry)}
                        className="group w-full text-left py-4.5 sm:py-5 grid grid-cols-1 sm:grid-cols-[56px_118px_1fr_auto] items-center gap-2 sm:gap-5 hover:bg-[#ECEAE4]/65 px-2 -mx-2 transition-colors"
                      >
                        <span className="font-mono tabular-nums text-xs text-[#141414]/60">
                          {entry.year}
                        </span>

                        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414]">
                          {entry.category}
                        </span>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0">
                          <span className="text-[13px] font-medium text-[#141414] truncate">
                            {entry.title}
                          </span>
                          <span className="hidden sm:inline-block h-px w-6 bg-[#141414]/25 shrink-0" />
                          <span className="text-[12px] text-[#141414]/65 truncate">
                            {entry.clientOrPublication}
                            {entry.season ? ` · ${entry.season}` : ''}
                            {entry.location ? ` · ${entry.location}` : ''}
                            {galleryCount > 1 ? ` · ${galleryCount} photos` : ''}
                          </span>
                        </div>

                        <span className="inline-flex items-center justify-end text-[#141414]/65 group-hover:text-[#141414] group-hover:translate-x-1 transition-all">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — BOTTOM CTA BANNER */}
      <section className="relative overflow-hidden bg-[#0C0C0C] text-[#F5F0E8] border-t border-white/10">
        <div className="absolute inset-0">
          <EditorialMediaFrame
            asset={getAssetById(experiencePage.bottomCtaBackdropAssetId)}
            preset="hero"
            showPlaceholderBadge={false}
            className="h-full w-full opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/95 via-[#0C0C0C]/75 to-[#0C0C0C]/45" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 py-16 sm:py-22 flex flex-col sm:flex-row sm:items-center justify-between gap-10">
          <div className="max-w-lg space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8]/65">
                {experiencePage.bottomCtaKicker}
              </span>
              <span className="h-px w-12 bg-white/30" />
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-light uppercase leading-[0.98] tracking-[0.02em] text-[#F5F0E8]">
              {experiencePage.bottomCtaTitle}
            </h2>

            <p className="text-[13px] leading-relaxed text-[#F5F0E8]/78">
              {experiencePage.bottomCtaDescription}
            </p>

            <div className="pt-2">
              <Link
                to={experiencePage.bottomCtaLink || '/portfolio'}
                className="group inline-flex items-center gap-4 border border-white/35 px-6 py-3 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] hover:bg-[#F5F0E8] hover:text-[#0C0C0C] transition-colors"
              >
                <span>{experiencePage.bottomCtaText}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-4 text-[#F5F0E8]/65">
            <span className="font-mono tabular-nums text-[10px] tracking-[0.22em]">
              01 / {String(Math.max(publishedEntries.length, 1)).padStart(2, '0')}
            </span>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Scroll to top of experience archive"
                className="flex h-8 w-8 items-center justify-center border border-white/25 hover:border-white hover:text-white transition-colors"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <Link
                to="/portfolio"
                aria-label="Go to Portfolio"
                className="flex h-8 w-8 items-center justify-center border border-white/25 hover:border-white hover:text-white transition-colors"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ENTRY DETAIL & MULTI-PHOTO LIGHTBOX MODAL */}
      {modalState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={modalState.entry.title}
        >
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col lg:flex-row bg-[#121212] text-[#F5F0E8] border border-white/15 overflow-hidden">
            <button
              type="button"
              onClick={() => setModalState(null)}
              aria-label="Close experience detail"
              className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center bg-black/70 border border-white/25 text-[#F5F0E8] hover:bg-white hover:text-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left High-Resolution Cloudinary Viewer */}
            <div className="relative lg:w-3/5 bg-[#080808] flex flex-col justify-between min-h-[300px] sm:min-h-[420px]">
              <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                <EditorialMediaFrame
                  asset={modalActiveAsset}
                  preset="portfolio-lightbox"
                  className="h-full w-full max-h-[65vh]"
                  imgClassName="h-full w-full object-contain"
                />

                {modalImageIds.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setModalState((prev) =>
                          prev
                            ? {
                                ...prev,
                                imageIndex:
                                  (prev.imageIndex - 1 + modalImageIds.length) %
                                  modalImageIds.length,
                              }
                            : null
                        )
                      }
                      aria-label="Previous photograph"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/70 border border-white/25 text-[#F5F0E8] hover:border-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModalState((prev) =>
                          prev
                            ? { ...prev, imageIndex: (prev.imageIndex + 1) % modalImageIds.length }
                            : null
                        )
                      }
                      aria-label="Next photograph"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/70 border border-white/25 text-[#F5F0E8] hover:border-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {modalImageIds.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 bg-[#0C0C0C] p-3">
                  {modalImageIds.map((id, idx) => (
                    <button
                      key={`${id}-${idx}`}
                      type="button"
                      onClick={() =>
                        setModalState((prev) => (prev ? { ...prev, imageIndex: idx } : null))
                      }
                      className={`h-14 w-14 shrink-0 overflow-hidden border transition-colors ${
                        modalState.imageIndex === idx ? 'border-white' : 'border-white/20 opacity-60'
                      }`}
                    >
                      <EditorialMediaFrame
                        asset={getAssetById(id)}
                        preset="thumbnail"
                        showPlaceholderBadge={false}
                        className="h-full w-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Metadata & Description */}
            <div className="lg:w-2/5 p-6 sm:p-8 overflow-y-auto space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase text-[#F5F0E8]/60">
                  <span>{modalState.entry.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{modalState.entry.year}</span>
                </div>

                <h3 className="font-serif text-3xl font-light uppercase leading-tight text-[#F5F0E8]">
                  {modalState.entry.title}
                </h3>

                <dl className="divide-y divide-white/10 border-t border-b border-white/10 text-xs">
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#F5F0E8]/55 uppercase tracking-[0.16em] text-[10px]">
                      Brand / Client
                    </dt>
                    <dd className="text-right text-[#F5F0E8]">
                      {modalState.entry.clientOrPublication || '—'}
                    </dd>
                  </div>
                  {modalState.entry.season && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-[#F5F0E8]/55 uppercase tracking-[0.16em] text-[10px]">
                        Season
                      </dt>
                      <dd className="text-right text-[#F5F0E8]">{modalState.entry.season}</dd>
                    </div>
                  )}
                  {modalState.entry.location && (
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-[#F5F0E8]/55 uppercase tracking-[0.16em] text-[10px]">
                        Location
                      </dt>
                      <dd className="text-right text-[#F5F0E8]">{modalState.entry.location}</dd>
                    </div>
                  )}
                </dl>

                {(modalState.entry.description || modalState.entry.notes) && (
                  <p className="text-[13px] leading-relaxed text-[#F5F0E8]/78">
                    {modalState.entry.description || modalState.entry.notes}
                  </p>
                )}

                {modalActiveAsset?.altText && (
                  <p className="text-[11px] text-[#F5F0E8]/55 border-t border-white/10 pt-3">
                    {modalActiveAsset.altText}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                {modalState.entry.externalLink ? (
                  <a
                    href={modalState.entry.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F5F0E8] hover:bg-white hover:text-black transition-colors"
                  >
                    <span>OPEN EXTERNAL LINK</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="font-mono tabular-nums text-[10px] tracking-[0.2em] text-[#F5F0E8]/55">
                    {modalImageIds.length > 0
                      ? `IMAGE ${modalState.imageIndex + 1} / ${modalImageIds.length}`
                      : 'NO IMAGES ASSIGNED'}
                  </span>
                )}

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F5F0E8]/80 hover:text-white"
                >
                  <span>BOOKING INQUIRY</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
