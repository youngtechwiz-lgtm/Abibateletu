import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  Footprints,
  MapPin,
  Ruler,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';
import type { DigitalsItem } from '../types/cms.ts';

const DIGITAL_CATEGORIES = [
  'All',
  'Front Portrait',
  'Side Portrait',
  'Profile',
  'Full Body',
  'Half Body',
  'Close Up',
  'Additional',
] as const;

export function DigitalsPage() {
  const { state, getAssetById } = useCms();
  const { pageHeroes, digitalsPage, digitalsItems, homepage, representationAgencies } = state;
  const hero = pageHeroes.digitals;
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeSlides.length > 0 ? activeSlides : rawSlides;

  const [slideIndex, setSlideIndex] = useState(0);
  const [angleFilter, setAngleFilter] = useState<string>('All');
  const [activeDigital, setActiveDigital] = useState<DigitalsItem | null>(null);
  const [pdfNotice, setPdfNotice] = useState(false);

  useEffect(() => {
    setSlideIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const orderedItems = useMemo(
    () => [...digitalsItems].sort((a, b) => a.sortOrder - b.sortOrder),
    [digitalsItems]
  );

  const availableCategories = useMemo(() => {
    const existing = new Set(orderedItems.map((item) => item.angle));
    const orderedStandard = DIGITAL_CATEGORIES.filter(
      (cat) => cat === 'All' || existing.has(cat)
    );
    const custom = Array.from(existing).filter(
      (angle) => !DIGITAL_CATEGORIES.includes(angle as (typeof DIGITAL_CATEGORIES)[number])
    );
    return [...orderedStandard, ...custom];
  }, [orderedItems]);

  const filteredItems = useMemo(() => {
    if (angleFilter === 'All') return orderedItems;
    return orderedItems.filter((item) => item.angle === angleFilter);
  }, [orderedItems, angleFilter]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!activeDigital || filteredItems.length === 0) return;
      const idx = filteredItems.findIndex((item) => item.id === activeDigital.id);
      if (e.key === 'Escape') setActiveDigital(null);
      if (e.key === 'ArrowRight' && idx !== -1) {
        setActiveDigital(filteredItems[(idx + 1) % filteredItems.length]);
      }
      if (e.key === 'ArrowLeft' && idx !== -1) {
        setActiveDigital(filteredItems[(idx - 1 + filteredItems.length) % filteredItems.length]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDigital, filteredItems]);

  const activeSlide = slides[slideIndex] || slides[0];
  const activeHeroAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;
  const resolvedHeroTitle = activeSlide?.title?.trim() || hero.title;
  const resolvedHeroCtaText = activeSlide?.ctaText?.trim() || hero.ctaText;

  // Optional fields — strictly hidden when blank
  const bustValue = digitalsPage.bust.trim();
  const waistValue = digitalsPage.waist.trim();
  const hipsValue = digitalsPage.hips.trim();
  const shoeValue = digitalsPage.shoeSize.trim();
  const hairValue = digitalsPage.hair.trim();
  const eyesValue = digitalsPage.eyes.trim();
  const pdfUrl = digitalsPage.compCardPdfUrl.trim();

  const optionalSidebarStats = [
    hairValue ? { label: 'HAIR', value: hairValue } : null,
    eyesValue ? { label: 'EYES', value: eyesValue } : null,
    shoeValue ? { label: 'SHOE SIZE', value: shoeValue } : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  const measurementRows = [
    bustValue ? { label: 'BUST', value: bustValue } : null,
    waistValue ? { label: 'WAIST', value: waistValue } : null,
    hipsValue ? { label: 'HIPS', value: hipsValue } : null,
    shoeValue ? { label: 'SHOE SIZE', value: shoeValue } : null,
    { label: 'HEIGHT', value: homepage.modelStats.height || "178 cm / 5'10\"" },
  ].filter((entry): entry is { label: string; value: string } => entry !== null);

  const quickFactRows = [
    { icon: User, label: 'Name', value: digitalsPage.aboutName || 'ABIBAT' },
    { icon: Ruler, label: 'Height', value: homepage.modelStats.height || "178 cm / 5'10\"" },
    { icon: MapPin, label: 'Locations', value: 'Lagos, Paris, Milan & Spain' },
    hairValue ? { icon: Sparkles, label: 'Hair', value: hairValue } : null,
    eyesValue ? { icon: Eye, label: 'Eyes', value: eyesValue } : null,
    shoeValue ? { icon: Footprints, label: 'Shoe Size', value: shoeValue } : null,
  ].filter(
    (entry): entry is { icon: typeof User; label: string; value: string } => entry !== null
  );

  const configuredAgencies = representationAgencies
    .filter((a) => a.isActive !== false && a.agencyName.trim().length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // When showing All and at least 4 items exist, match the reference editorial composition:
  // Top 3 items in right column, 4th item ("04. CLOSE UP") in left sidebar bottom, remaining in 4-col lower grid.
  const useEditorialComposition = angleFilter === 'All' && filteredItems.length >= 4;
  const topRowItems = useEditorialComposition ? filteredItems.slice(0, 3) : [];
  const sidebarFeatureItem = useEditorialComposition ? filteredItems[3] : null;
  const lowerGridItems = useEditorialComposition ? filteredItems.slice(4) : filteredItems;

  const formatNumberedTitle = (item: DigitalsItem, index: number) => {
    const num = String(index + 1).padStart(2, '0');
    return `${num}. ${item.title}`;
  };

  const activeLightboxIndex = activeDigital
    ? filteredItems.findIndex((item) => item.id === activeDigital.id)
    : -1;

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — THE MODEL BOOK */}
      <section className="relative min-h-[60vh] sm:min-h-[68vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide?.id || 'digitals-hero'}
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

            <div className="mt-7">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  download={digitalsPage.compCardPdfName || 'ABIBAT-Digitals-Comp-Card.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-4 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{resolvedHeroCtaText || 'DOWNLOAD DIGITALS (PDF)'}</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
                </a>
              ) : (
                <a
                  href="#measurements"
                  onClick={() => setPdfNotice(true)}
                  className="group inline-flex items-center gap-4 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{resolvedHeroCtaText || 'DOWNLOAD DIGITALS (PDF)'}</span>
                  <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
                </a>
              )}
            </div>
          </div>

          {/* Right Vertical Caption & Slideshow Index */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[92px] text-[9px] leading-[1.7] tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                {digitalsPage.heroCornerCaption}
              </p>
              <span className="h-8 w-px bg-white/30" />
            </div>

            {slides.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono tabular-nums tracking-[0.22em] text-[#F5F0E8]/75">
                  {String(slideIndex + 1).padStart(2, '0')} /{' '}
                  {String(slides.length).padStart(2, '0')}
                </span>
                {slides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
                      }
                      aria-label="Previous hero slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
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

      {/* MODEL BOOK MAIN EDITORIAL CANVAS (Light Stone Paper) */}
      <section className="bg-[#F5F0E8] text-[#141414] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* LEFT COLUMN — ABOUT ME + CONFIRMED BIO/STATS + SLOT 04 CLOSE UP */}
            <aside className="lg:col-span-3 flex flex-col justify-between gap-8">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/65">
                      {digitalsPage.aboutKicker}
                    </span>
                    <span className="h-px w-10 bg-[#141414]/25" />
                  </div>

                  <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase tracking-[0.02em] text-[#141414]">
                    {digitalsPage.aboutName}
                  </h2>

                  <p className="mt-4 text-[13px] leading-[1.7] text-[#141414]/75">
                    {digitalsPage.aboutBio}
                  </p>

                  <div className="mt-5 text-[#141414]/85">
                    <AbibatSignature className="w-28 h-auto" />
                  </div>
                </div>

                {/* Compact Confirmed & Provided Model Stats */}
                <dl className="border-t border-[#141414]/15 pt-5 space-y-2.5 text-[11px]">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[9px] tracking-[0.2em] uppercase text-[#141414]/55">
                      HEIGHT
                    </dt>
                    <dd className="tabular-nums text-[#141414] font-medium">
                      {homepage.modelStats.height || "178 cm / 5'10\""}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[9px] tracking-[0.2em] uppercase text-[#141414]/55">
                      LOCATIONS
                    </dt>
                    <dd className="text-[#141414] text-right">Lagos, Paris, Milan, Spain</dd>
                  </div>

                  {optionalSidebarStats.map((stat) => (
                    <div key={stat.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-[9px] tracking-[0.2em] uppercase text-[#141414]/55">
                        {stat.label}
                      </dt>
                      <dd className="text-[#141414] text-right">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* 04. CLOSE UP Feature Card (Reference Bottom-Left Alignment) */}
              {sidebarFeatureItem && (
                <article
                  onClick={() => setActiveDigital(sidebarFeatureItem)}
                  className="group relative aspect-[4/4] w-full cursor-pointer overflow-hidden bg-[#1b1a18]"
                >
                  <EditorialMediaFrame
                    asset={getAssetById(sidebarFeatureItem.assetId)}
                    preset={sidebarFeatureItem.isBw ? 'digitals-bw' : 'digitals'}
                    grayscale={sidebarFeatureItem.isBw}
                    darkSurface={false}
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3 text-[#F5F0E8]">
                    <span className="text-[10px] font-medium tracking-[0.22em] uppercase whitespace-nowrap">
                      {formatNumberedTitle(sidebarFeatureItem, 3)}
                    </span>
                    <span className="h-px flex-1 bg-white/30" />
                  </div>
                </article>
              )}
            </aside>

            {/* RIGHT COLUMN — DIGITALS GALLERY */}
            <div className="lg:col-span-9 flex flex-col justify-between gap-8">
              {/* Angle / Category Filter Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#141414]/12 pb-3.5">
                <div
                  className="flex flex-wrap items-center gap-4 sm:gap-6"
                  role="tablist"
                  aria-label="Filter digitals by pose or angle"
                >
                  {availableCategories.map((cat) => {
                    const active = angleFilter === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setAngleFilter(cat)}
                        className={`relative pb-1 text-[10px] font-medium tracking-[0.2em] uppercase whitespace-nowrap shrink-0 transition-colors ${
                          active ? 'text-[#141414]' : 'text-[#141414]/50 hover:text-[#141414]'
                        }`}
                      >
                        {cat}
                        <span
                          className={`absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#141414] transition-transform duration-200 origin-left ${
                            active ? 'scale-x-100' : 'scale-x-0'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] font-mono tabular-nums tracking-[0.18em] text-[#141414]/55">
                  {String(filteredItems.length).padStart(2, '0')} FRAMES
                </span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="py-20 text-center border border-[#141414]/12 bg-white/40">
                  <p className="font-serif text-2xl uppercase text-[#141414]/70">
                    NO DIGITALS IN THIS CATEGORY
                  </p>
                  <button
                    type="button"
                    onClick={() => setAngleFilter('All')}
                    className="mt-3 border-b border-[#141414] pb-1 text-[10px] font-medium tracking-[0.2em] uppercase"
                  >
                    Show All Digitals
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Top 3 Large Overlay Cards (01. FACE — FRONT, 02. FACE — SIDE, 03. FULL BODY) */}
                  {topRowItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {topRowItems.map((item, idx) => (
                        <article
                          key={item.id}
                          onClick={() => setActiveDigital(item)}
                          className="group relative aspect-[3/4] cursor-pointer overflow-hidden bg-[#1b1a18]"
                        >
                          <EditorialMediaFrame
                            asset={getAssetById(item.assetId)}
                            preset={item.isBw ? 'digitals-bw' : 'digitals'}
                            grayscale={item.isBw}
                            darkSurface={false}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-4 flex items-center gap-3 text-[#F5F0E8]">
                            <span className="text-[10px] font-medium tracking-[0.2em] uppercase whitespace-nowrap">
                              {formatNumberedTitle(item, idx)}
                            </span>
                            <span className="h-px flex-1 bg-white/30" />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Lower 4-Column Row (05+, or all filtered items when filtering) */}
                  {lowerGridItems.length > 0 && (
                    <div
                      className={`grid gap-5 ${
                        useEditorialComposition
                          ? 'grid-cols-2 sm:grid-cols-4'
                          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      }`}
                    >
                      {lowerGridItems.map((item, idx) => {
                        const displayIndex = useEditorialComposition ? idx + 4 : idx;
                        return (
                          <article
                            key={item.id}
                            onClick={() => setActiveDigital(item)}
                            className="group cursor-pointer"
                          >
                            <div className="relative aspect-[3/4] overflow-hidden bg-[#dedad2]">
                              <EditorialMediaFrame
                                asset={getAssetById(item.assetId)}
                                preset={item.isBw ? 'digitals-bw' : 'digitals'}
                                grayscale={item.isBw}
                                darkSurface={false}
                                className="h-full w-full"
                                imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/80">
                                {formatNumberedTitle(item, displayIndex)}
                              </p>
                              <span className="text-[9px] tracking-[0.16em] uppercase text-[#141414]/45">
                                {item.angle}
                              </span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SPECIFICATIONS BAND — MEASUREMENTS / LOCATIONS / QUICK FACTS */}
      <section
        id="measurements"
        className="bg-[#ECE9E2] text-[#141414] border-t border-[#141414]/12 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-0 lg:divide-x lg:divide-[#141414]/12">
            {/* Column 1: Measurements & PDF Download */}
            <div className="lg:col-span-4 lg:pr-10 space-y-6">
              <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                MEASUREMENTS
              </p>

              <dl className="divide-y divide-[#141414]/12 border-t border-b border-[#141414]/12 text-[12px]">
                {measurementRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2.5 gap-4"
                  >
                    <dt className="text-[10px] tracking-[0.2em] uppercase text-[#141414]/55">
                      {row.label}
                    </dt>
                    <dd className="tabular-nums text-[#141414] font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="pt-1 space-y-2">
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    download={digitalsPage.compCardPdfName || 'ABIBAT-Digitals-Comp-Card.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 border border-[#141414]/35 px-5 py-2.5 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414] hover:bg-[#141414] hover:text-[#F5F0E8] transition-colors"
                  >
                    <span>DOWNLOAD FULL DIGITALS</span>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setPdfNotice(true)}
                      className="inline-flex items-center gap-3 border border-[#141414]/30 px-5 py-2.5 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414]/70 hover:border-[#141414] hover:text-[#141414] transition-colors"
                    >
                      <span>DOWNLOAD FULL DIGITALS</span>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    {pdfNotice && (
                      <p className="text-[11px] text-[#141414]/65">
                        Comp-card PDF has not been uploaded yet. Upload it in the Admin Digitals
                        studio to enable direct PDF download.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Column 2: Locations & Agency Representation */}
            <div className="lg:col-span-4 lg:px-10 flex flex-col justify-between gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                    LOCATIONS
                  </p>
                  <p className="mt-3 text-[12px] tracking-[0.06em] text-[#141414]/85">
                    Lagos &nbsp;/&nbsp; Paris &nbsp;/&nbsp; Milan &nbsp;/&nbsp; Spain
                  </p>
                  <div className="mt-5 h-px w-full bg-[#141414]/15 relative">
                    <span className="absolute left-0 top-0 h-[1.5px] w-16 bg-[#141414]" />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                    AGENCY REPRESENTATION
                  </p>
                  {configuredAgencies.length > 0 ? (
                    <ul className="mt-2.5 space-y-1 text-[12px] text-[#141414]/80">
                      {configuredAgencies.map((ag) => (
                        <li key={ag.id}>
                          <span className="font-medium uppercase text-[10px] tracking-[0.16em]">
                            {ag.city}:
                          </span>{' '}
                          {ag.agencyName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2.5 text-[12px] text-[#141414]/70">
                      {homepage.modelStats.agencyNote || '(You can add your agencies here)'}
                    </p>
                  )}
                </div>
              </div>

              <blockquote className="font-serif italic text-lg leading-relaxed text-[#141414]/85">
                {digitalsPage.quote}
              </blockquote>
            </div>

            {/* Column 3: Quick Facts & Book Abibat CTA */}
            <div className="lg:col-span-4 lg:pl-10 flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]">
                  QUICK FACTS
                </p>

                <dl className="divide-y divide-[#141414]/10 text-[12px]">
                  {quickFactRows.map((fact) => {
                    const Icon = fact.icon;
                    return (
                      <div
                        key={fact.label}
                        className="flex items-center justify-between py-2 gap-4"
                      >
                        <dt className="flex items-center gap-2.5 text-[#141414]/65">
                          <Icon className="h-3.5 w-3.5 text-[#141414]/50" />
                          <span>{fact.label}</span>
                        </dt>
                        <dd className="text-[#141414] font-medium text-right">{fact.value}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div>
                <Link
                  to={digitalsPage.bookCtaLink || '/contact'}
                  className="group inline-flex items-center gap-4 bg-[#141414] px-6 py-3.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:bg-[#2a2a2a] transition-colors"
                >
                  <span>{digitalsPage.bookCtaText || 'BOOK ABIBAT'}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIGITAL LIGHTBOX MODAL */}
      {activeDigital && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={activeDigital.title}
        >
          <button
            type="button"
            onClick={() => setActiveDigital(null)}
            aria-label="Close digital viewer"
            className="fixed top-5 right-5 z-20 flex h-10 w-10 items-center justify-center border border-white/25 bg-black/60 text-white hover:border-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid max-w-5xl w-full grid-cols-1 md:grid-cols-12 gap-8 items-center text-[#F5F0E8]">
            <div className="md:col-span-7 relative aspect-[3/4] bg-[#141414] overflow-hidden">
              <EditorialMediaFrame
                asset={getAssetById(activeDigital.assetId)}
                preset="portfolio-lightbox"
                grayscale={activeDigital.isBw}
                className="h-full w-full"
                imgClassName="h-full w-full object-contain"
              />

              {filteredItems.length > 1 && activeLightboxIndex !== -1 && (
                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDigital(
                        filteredItems[
                          (activeLightboxIndex - 1 + filteredItems.length) % filteredItems.length
                        ]
                      )
                    }
                    aria-label="Previous digital"
                    className="flex h-9 w-9 items-center justify-center bg-black/75 border border-white/25 text-white hover:bg-black"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="bg-black/75 px-3 py-1 text-[10px] font-mono tabular-nums tracking-[0.2em]">
                    {String(activeLightboxIndex + 1).padStart(2, '0')} /{' '}
                    {String(filteredItems.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveDigital(
                        filteredItems[(activeLightboxIndex + 1) % filteredItems.length]
                      )
                    }
                    aria-label="Next digital"
                    className="flex h-9 w-9 items-center justify-center bg-black/75 border border-white/25 text-white hover:bg-black"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-5 space-y-5">
              <p className="text-[10px] tracking-[0.24em] uppercase text-[#F5F0E8]/55">
                {activeDigital.angle}
                {activeDigital.isPlaceholder ? ' · PLACEHOLDER' : ''}
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-light uppercase">
                {activeDigital.title}
              </h3>
              {activeDigital.notes && (
                <p className="text-[13px] leading-relaxed text-[#F5F0E8]/78">
                  {activeDigital.notes}
                </p>
              )}

              <div className="border-t border-white/15 pt-4 space-y-1.5 text-[11px] text-[#F5F0E8]/65">
                <p>
                  <span className="uppercase tracking-[0.18em] text-[#F5F0E8]/45">Model:</span>{' '}
                  {digitalsPage.aboutName} · {homepage.modelStats.height}
                </p>
                <p>
                  <span className="uppercase tracking-[0.18em] text-[#F5F0E8]/45">Locations:</span>{' '}
                  Lagos, Paris, Milan &amp; Spain
                </p>
                {getAssetById(activeDigital.assetId)?.altText && (
                  <p>
                    <span className="uppercase tracking-[0.18em] text-[#F5F0E8]/45">Plate:</span>{' '}
                    {getAssetById(activeDigital.assetId)?.altText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
