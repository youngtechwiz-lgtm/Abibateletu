import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Instagram,
  Mail,
  Minus,
  Phone,
  Plus,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';

export function HomePage() {
  const { state, getAssetById } = useCms();
  const { homepage, pageHeroes, portfolioProjects, digitalsItems, experienceEntries, representationAgencies, siteSettings } =
    state;

  const homeHero = pageHeroes.home;
  const rawHeroSlides = homeHero.slides || [];
  const activeHeroSlides = rawHeroSlides.filter((s) => s.isActive !== false);
  const heroSlides = activeHeroSlides.length > 0 ? activeHeroSlides : rawHeroSlides;
  const [heroIndex, setHeroIndex] = useState(0);
  const [workIndex, setWorkIndex] = useState(0);
  const [digitalsOffset, setDigitalsOffset] = useState(0);
  const [openAgencyId, setOpenAgencyId] = useState<string | null>(null);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const activeHeroSlide = heroSlides[heroIndex] || heroSlides[0];
  const activeHeroAsset = activeHeroSlide ? getAssetById(activeHeroSlide.assetId) : undefined;

  // Featured projects for Section 01 Selected Work
  const featuredProjects = useMemo(() => {
    const published = portfolioProjects.filter((p) => p.isPublished !== false);
    const byIds = homepage.featuredProjectIds
      .map((id) => published.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (byIds.length > 0) return byIds;
    return published.filter((p) => p.featured).slice(0, 5);
  }, [homepage.featuredProjectIds, portfolioProjects]);

  const rotatedProjects = useMemo(() => {
    if (featuredProjects.length === 0) return [];
    const offset = workIndex % featuredProjects.length;
    return [...featuredProjects.slice(offset), ...featuredProjects.slice(0, offset)];
  }, [featuredProjects, workIndex]);

  const homeExperience = useMemo(
    () =>
      experienceEntries
        .filter((e) => e.featuredOnHome && e.isPublished !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, 6),
    [experienceEntries]
  );

  const visibleDigitals = useMemo(() => {
    if (digitalsItems.length <= 4) return digitalsItems;
    const items: typeof digitalsItems = [];
    for (let i = 0; i < 4; i++) {
      items.push(digitalsItems[(digitalsOffset + i) % digitalsItems.length]);
    }
    return items;
  }, [digitalsItems, digitalsOffset]);

  const totalWorkSlides = Math.max(portfolioProjects.length, 1);

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION */}
      {homepage.sectionVisibility.hero && (
        <section className="relative min-h-[78vh] sm:min-h-[86vh] w-full overflow-hidden bg-[#0C0C0C] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHeroSlide?.id || 'home-hero'}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <EditorialMediaFrame
                asset={activeHeroAsset}
                preset="hero"
                priority
                showPlaceholderBadge={false}
                className="h-full w-full"
              />
              {/* Warm high-fashion chiaroscuro scrims */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/90 via-[#0C0C0C]/45 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/85 via-transparent to-black/45" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14 pt-28 pb-16 flex flex-col justify-between min-h-[78vh] sm:min-h-[86vh]">
            <div />

            {/* Left Editorial Wordmark Block */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
              <div className="max-w-3xl">
                <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.34em] uppercase text-[#F5F0E8]/80 mb-3">
                  {homeHero.kicker}
                </p>

                <h1 className="font-serif text-6xl sm:text-8xl lg:text-[7.75rem] font-light tracking-[0.04em] uppercase leading-[0.88] text-[#F5F0E8]">
                  {homeHero.title}
                </h1>

                <p className="mt-5 text-[10px] sm:text-[11px] tracking-[0.34em] uppercase text-[#F5F0E8]/85">
                  {homeHero.subtitle}
                </p>

                <div className="mt-10">
                  <Link
                    to={homeHero.ctaLink || '/portfolio'}
                    className="group inline-flex items-center gap-6 border-b border-white/35 pb-2 text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                  >
                    <span>{homeHero.ctaText || 'EXPLORE MY WORK'}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right Corner Architectural Caption + Slideshow Controls */}
              <div className="flex flex-col items-start md:items-end gap-5">
                <div className="relative px-4 py-3 text-right">
                  <span
                    aria-hidden="true"
                    className="absolute top-0 right-0 h-3 w-3 border-t border-r border-white/35"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-white/35"
                  />
                  <p className="text-[9px] leading-[1.7] tracking-[0.28em] uppercase text-[#F5F0E8]/70">
                    {homepage.heroSideCaption}
                  </p>
                </div>

                {heroSlides.length > 1 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono tabular-nums tracking-[0.2em] text-[#F5F0E8]/70">
                      {String(heroIndex + 1).padStart(2, '0')} /{' '}
                      {String(heroSlides.length).padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIndex(
                            (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
                          )
                        }
                        aria-label="Previous hero slide"
                        className="flex h-7 w-7 items-center justify-center border border-white/20 text-[#F5F0E8]/75 hover:border-white hover:text-white transition-colors"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIndex((prev) => (prev + 1) % heroSlides.length)
                        }
                        aria-label="Next hero slide"
                        className="flex h-7 w-7 items-center justify-center border border-white/20 text-[#F5F0E8]/75 hover:border-white hover:text-white transition-colors"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5">
                      {heroSlides.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          onClick={() => setHeroIndex(idx)}
                          aria-label={`View hero slide ${idx + 1}`}
                          className={`h-1 transition-all duration-300 ${
                            idx === heroIndex ? 'w-7 bg-[#F5F0E8]' : 'w-3 bg-white/30 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 text-[10px] tracking-[0.2em] uppercase text-[#F5F0E8]/45">
              <span>{activeHeroSlide?.caption || 'Editorial Archive'}</span>
              {activeHeroSlide?.locationTag && <span>{activeHeroSlide.locationTag}</span>}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 01 — SELECTED WORK (Light Editorial Stone) */}
      {homepage.sectionVisibility.selectedWork && (
        <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-stretch">
              {/* Left Editorial Intro Column */}
              <div className="lg:col-span-3 flex flex-col justify-between gap-10">
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-[11px] font-mono tabular-nums tracking-[0.2em] text-[#141414]/65">
                      {homepage.selectedWorkKicker}
                    </span>
                    <span className="h-px w-12 bg-[#141414]/25" />
                  </div>

                  <h2 className="font-serif text-4xl sm:text-[2.75rem] font-light leading-[0.98] tracking-[0.02em] uppercase text-[#141414]">
                    {homepage.selectedWorkTitle}
                  </h2>

                  <p className="mt-5 text-[13px] leading-relaxed text-[#141414]/70 max-w-[230px]">
                    {homepage.selectedWorkDescription}
                  </p>

                  <div className="mt-7">
                    <Link
                      to={homepage.selectedWorkCtaLink || '/portfolio'}
                      className="group inline-flex items-center gap-4 border-b border-[#141414]/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414] hover:border-[#141414] transition-colors"
                    >
                      <span>{homepage.selectedWorkCtaText}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Category Quick Links */}
                <ul className="space-y-1.5 text-[10px] tracking-[0.22em] uppercase text-[#141414]/60">
                  {(['Editorials', 'Campaigns', 'Runway', 'Publications'] as const).map((cat) => (
                    <li key={cat}>
                      <Link
                        to={`/portfolio?category=${cat}`}
                        className="hover:text-[#141414] transition-colors"
                      >
                        {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Center Asymmetric Bento Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                {rotatedProjects[0] && (
                  <Link
                    to={`/portfolio?project=${rotatedProjects[0].id}`}
                    className="group relative md:col-span-5 md:row-span-2 min-h-[340px] md:min-h-[470px] overflow-hidden bg-[#1b1a18]"
                  >
                    <EditorialMediaFrame
                      asset={getAssetById(rotatedProjects[0].coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-[#F5F0E8]">
                      <p className="text-[10px] font-medium tracking-[0.2em] uppercase">
                        {rotatedProjects[0].title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#F5F0E8]/75">
                        {rotatedProjects[0].category} — {rotatedProjects[0].location}
                      </p>
                    </div>
                  </Link>
                )}

                {rotatedProjects[1] && (
                  <Link
                    to={`/portfolio?project=${rotatedProjects[1].id}`}
                    className="group relative md:col-span-3 min-h-[220px] overflow-hidden bg-[#1b1a18]"
                  >
                    <EditorialMediaFrame
                      asset={getAssetById(rotatedProjects[1].coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-[#F5F0E8]">
                      <p className="text-[10px] font-medium tracking-[0.18em] uppercase">
                        {rotatedProjects[1].title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#F5F0E8]/75">
                        {rotatedProjects[1].category} — {rotatedProjects[1].location}
                      </p>
                    </div>
                  </Link>
                )}

                {rotatedProjects[2] && (
                  <Link
                    to={`/portfolio?project=${rotatedProjects[2].id}`}
                    className="group relative md:col-span-4 min-h-[220px] overflow-hidden bg-[#1b1a18]"
                  >
                    <EditorialMediaFrame
                      asset={getAssetById(rotatedProjects[2].coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-[#F5F0E8]">
                      <p className="text-[10px] font-medium tracking-[0.18em] uppercase">
                        {rotatedProjects[2].title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#F5F0E8]/75">
                        {rotatedProjects[2].category} — {rotatedProjects[2].location}
                      </p>
                    </div>
                  </Link>
                )}

                {rotatedProjects[3] && (
                  <Link
                    to={`/portfolio?project=${rotatedProjects[3].id}`}
                    className="group relative md:col-span-7 min-h-[220px] overflow-hidden bg-[#1b1a18]"
                  >
                    <EditorialMediaFrame
                      asset={getAssetById(rotatedProjects[3].coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-[#F5F0E8]">
                      <p className="text-[10px] font-medium tracking-[0.2em] uppercase">
                        {rotatedProjects[3].title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#F5F0E8]/75">
                        {rotatedProjects[3].category} — {rotatedProjects[3].location}
                      </p>
                    </div>
                  </Link>
                )}
              </div>

              {/* Right Editorial Index & Thumbnail Rail */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-between gap-4 border-t lg:border-t-0 lg:border-l border-[#141414]/10 pt-5 lg:pt-0 lg:pl-4">
                <div className="text-center font-mono tabular-nums text-[11px] tracking-[0.18em] text-[#141414]/70">
                  <div>{String((workIndex % totalWorkSlides) + 1).padStart(2, '0')}</div>
                  <div className="text-[#141414]/35">/ {String(Math.max(totalWorkSlides, 6)).padStart(2, '0')}</div>
                </div>

                <div className="flex lg:flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[#141414]/65">
                    <button
                      type="button"
                      onClick={() =>
                        setWorkIndex((prev) => (prev - 1 + featuredProjects.length) % Math.max(featuredProjects.length, 1))
                      }
                      aria-label="Previous selected work"
                      className="p-1 hover:text-[#141414] transition-colors"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWorkIndex((prev) => (prev + 1) % Math.max(featuredProjects.length, 1))
                      }
                      aria-label="Next selected work"
                      className="p-1 hover:text-[#141414] transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="hidden sm:flex lg:flex-col gap-1.5">
                    {featuredProjects.slice(0, 3).map((proj, idx) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => setWorkIndex(idx)}
                        aria-label={`Focus ${proj.title}`}
                        className={`h-11 w-9 overflow-hidden border transition-opacity ${
                          workIndex % featuredProjects.length === idx
                            ? 'border-[#141414] opacity-100'
                            : 'border-transparent opacity-55 hover:opacity-90'
                        }`}
                      >
                        <EditorialMediaFrame
                          asset={getAssetById(proj.coverAssetId)}
                          preset="thumbnail"
                          showPlaceholderBadge={false}
                          className="h-full w-full"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <a
                  href="#about-section"
                  aria-label="Scroll to About section"
                  className="p-1 text-[#141414]/55 hover:text-[#141414] transition-colors"
                >
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 02 — ABOUT / DEDICATED TO THE CRAFT (Obsidian Dark) */}
      {homepage.sectionVisibility.about && (
        <section id="about-section" className="bg-[#0C0C0C] text-[#F5F0E8] py-16 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Feature Portrait + Calligraphic Abibat Signature */}
              <div className="lg:col-span-5 relative min-h-[420px] sm:min-h-[540px] overflow-hidden bg-[#141414]">
                <EditorialMediaFrame
                  asset={getAssetById(homepage.aboutPortraitAssetId)}
                  preset="portrait"
                  className="h-full w-full"
                />
                <div className="pointer-events-none absolute top-8 left-6 sm:top-12 sm:left-8 text-[#F5F0E8]/90">
                  <AbibatSignature className="w-36 sm:w-44 h-auto drop-shadow" />
                </div>
              </div>

              {/* Middle Editorial Bio */}
              <div className="lg:col-span-4 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/60">
                    {homepage.aboutKicker}
                  </span>
                  <span className="h-px w-10 bg-white/25" />
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-light leading-[1.04] tracking-[0.02em] uppercase text-[#F5F0E8]">
                  {homepage.aboutTitle}
                </h2>

                <div className="mt-6 space-y-4 text-[13px] leading-[1.7] text-[#F5F0E8]/78">
                  {homepage.aboutParagraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>

                {homepage.aboutQuote && (
                  <blockquote className="mt-7 font-serif italic text-base sm:text-lg leading-relaxed text-[#F5F0E8]/90">
                    {homepage.aboutQuote}
                  </blockquote>
                )}

                <div className="mt-8">
                  <Link
                    to={homepage.aboutCtaLink || '/about'}
                    className="group inline-flex items-center gap-4 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                  >
                    <span>{homepage.aboutCtaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right Model Stats + Inset Image */}
              <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-8">
                <div className="space-y-6">
                  <p className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/55">
                    MODEL STATS
                  </p>

                  <dl className="space-y-5 text-[12px]">
                    <div>
                      <dt className="text-[9px] tracking-[0.22em] uppercase text-[#F5F0E8]/50">
                        HEIGHT
                      </dt>
                      <dd className="mt-1 text-[#F5F0E8] tabular-nums">
                        {homepage.modelStats.height}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[9px] tracking-[0.22em] uppercase text-[#F5F0E8]/50">
                        LOCATIONS
                      </dt>
                      <dd className="mt-1 text-[#F5F0E8]">
                        {homepage.modelStats.locations}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[9px] tracking-[0.22em] uppercase text-[#F5F0E8]/50">
                        AGENCY REPRESENTATION
                      </dt>
                      <dd className="mt-1 text-[#F5F0E8]/75">
                        {homepage.modelStats.agencyNote}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[9px] tracking-[0.22em] uppercase text-[#F5F0E8]/50">
                        SPECIALTIES
                      </dt>
                      <dd className="mt-1 text-[#F5F0E8]">
                        {homepage.modelStats.specialties}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 aspect-[4/3] w-full overflow-hidden bg-[#141414]">
                  <EditorialMediaFrame
                    asset={getAssetById(homepage.aboutInsetAssetId)}
                    preset="portfolio-card"
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 03 — DIGITALS (Light Editorial Stone) */}
      {homepage.sectionVisibility.digitals && (
        <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-22 border-b border-[#141414]/10">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Monochrome Feature Portrait */}
              <div className="lg:col-span-3 aspect-[4/5] overflow-hidden bg-[#181818]">
                <EditorialMediaFrame
                  asset={getAssetById(homepage.digitalsFeatureAssetId)}
                  preset="digitals-bw"
                  grayscale
                  className="h-full w-full"
                />
              </div>

              {/* Center Digitals Copy */}
              <div className="lg:col-span-3 space-y-4 lg:px-2">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono tabular-nums tracking-[0.2em] text-[#141414]/65">
                    {homepage.digitalsKicker}
                  </span>
                  <span className="h-px w-10 bg-[#141414]/25" />
                </div>

                <h2 className="font-serif text-4xl font-light tracking-[0.02em] uppercase text-[#141414]">
                  {homepage.digitalsTitle}
                </h2>

                <p className="text-[12px] font-medium text-[#141414]">
                  {homepage.digitalsSubtitle}
                </p>

                <p className="text-[12px] leading-relaxed text-[#141414]/70 max-w-[240px]">
                  {homepage.digitalsDescription}
                </p>

                <div className="pt-2">
                  <Link
                    to={homepage.digitalsCtaLink || '/digitals'}
                    className="group inline-flex items-center gap-4 border-b border-[#141414]/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414] hover:border-[#141414] transition-colors"
                  >
                    <span>{homepage.digitalsCtaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right 4-Up Unretouched Digitals Grid */}
              <div className="lg:col-span-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {visibleDigitals.map((item) => (
                    <Link
                      key={item.id}
                      to="/digitals"
                      className="group aspect-[3/4] overflow-hidden bg-[#dedad2]"
                    >
                      <EditorialMediaFrame
                        asset={getAssetById(item.assetId)}
                        preset={item.isBw ? 'digitals-bw' : 'digitals'}
                        grayscale={item.isBw}
                        darkSurface={false}
                        className="h-full w-full"
                        imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                      />
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end gap-3 text-[#141414]/60">
                  <button
                    type="button"
                    onClick={() =>
                      setDigitalsOffset(
                        (prev) => (prev - 1 + Math.max(digitalsItems.length, 1)) % Math.max(digitalsItems.length, 1)
                      )
                    }
                    aria-label="Previous digitals"
                    className="p-1.5 hover:text-[#141414] transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDigitalsOffset((prev) => (prev + 1) % Math.max(digitalsItems.length, 1))
                    }
                    aria-label="Next digitals"
                    className="p-1.5 hover:text-[#141414] transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 04 & 05 — EXPERIENCE (Dark) & REPRESENTATION (Light) SPLIT */}
      {homepage.sectionVisibility.experienceRepresentation && (
        <section className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Dark Half: 04 EXPERIENCE */}
          <div className="lg:col-span-7 bg-[#0C0C0C] text-[#F5F0E8] py-14 sm:py-20 px-5 sm:px-10 lg:pl-14 lg:pr-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-center">
              <div className="md:col-span-3 aspect-[3/4] overflow-hidden bg-[#141414]">
                <EditorialMediaFrame
                  asset={getAssetById(homepage.experienceFeatureAssetId)}
                  preset="portrait"
                  className="h-full w-full"
                />
              </div>

              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-mono tabular-nums tracking-[0.2em] text-[#F5F0E8]/65">
                    {homepage.experienceKicker}
                  </span>
                  <span className="h-px w-10 bg-white/25" />
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl font-light tracking-[0.02em] uppercase">
                  {homepage.experienceTitle}
                </h2>

                <p className="text-[12px] leading-relaxed text-[#F5F0E8]/70">
                  {homepage.experienceDescription}
                </p>

                <div className="pt-2">
                  <Link
                    to={homepage.experienceCtaLink || '/experience'}
                    className="group inline-flex items-center gap-4 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                  >
                    <span>{homepage.experienceCtaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Experience Ledger Rows */}
              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-white/12 pt-5 md:pt-0 md:pl-6">
                <ul className="divide-y divide-white/10 text-[12px]">
                  {homeExperience.map((entry) => (
                    <li
                      key={entry.id}
                      className="grid grid-cols-[42px_96px_14px_1fr] items-center gap-2 py-2.5"
                    >
                      <span className="font-mono tabular-nums text-[11px] text-[#F5F0E8]/50">
                        {entry.year}
                      </span>
                      <span className="font-medium text-[#F5F0E8] truncate">
                        {entry.category}
                      </span>
                      <span className="text-[#F5F0E8]/35">—</span>
                      <span className="text-[#F5F0E8]/80 truncate">{entry.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Light Half: 05 REPRESENTATION */}
          <div className="lg:col-span-5 bg-[#F5F0E8] text-[#141414] py-14 sm:py-20 px-5 sm:px-10 lg:pr-14">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center h-full">
              <div className="sm:col-span-7 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[11px] font-mono tabular-nums tracking-[0.2em] text-[#141414]/65">
                      {homepage.representationKicker}
                    </span>
                    <span className="h-px w-10 bg-[#141414]/25" />
                  </div>

                  <h2 className="font-serif text-3xl font-light tracking-[0.02em] uppercase text-[#141414]">
                    {homepage.representationTitle}
                  </h2>

                  <p className="mt-2 text-[12px] text-[#141414]/70">
                    {homepage.representationDescription}
                  </p>
                </div>

                {/* Regional Representation Accordion */}
                <div className="divide-y divide-[#141414]/15 border-t border-b border-[#141414]/15">
                  {(() => {
                    const activeAgencies = representationAgencies
                      .filter((a) => a.isActive !== false && a.agencyName.trim().length > 0)
                      .sort((a, b) => a.sortOrder - b.sortOrder);
                    const rows =
                      activeAgencies.length > 0
                        ? activeAgencies
                        : (['LAGOS', 'PARIS', 'MILAN', 'SPAIN'] as const).map((city) => ({
                            id: `market-${city.toLowerCase()}`,
                            city,
                            agencyName: '',
                            agentName: '',
                            email: '',
                            statusNote: homepage.modelStats.agencyNote,
                          }));
                    return rows.map((agency) => {
                      const isOpen = openAgencyId === agency.id;
                      return (
                        <div key={agency.id}>
                          <button
                            type="button"
                            onClick={() => setOpenAgencyId(isOpen ? null : agency.id)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center justify-between py-2.5 text-left text-[11px] font-medium tracking-[0.2em] uppercase text-[#141414] hover:opacity-75 transition-opacity"
                          >
                            <span>{agency.city}</span>
                            {isOpen ? (
                              <Minus className="h-3.5 w-3.5 text-[#141414]/70" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 text-[#141414]/70" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="pb-3 text-[12px] text-[#141414]/75 space-y-1">
                              {agency.agencyName ? (
                                <>
                                  <p className="font-medium text-[#141414]">{agency.agencyName}</p>
                                  {agency.agentName && <p>Agent: {agency.agentName}</p>}
                                  {agency.email && <p>{agency.email}</p>}
                                </>
                              ) : (
                                <p className="italic text-[#141414]/60">
                                  {agency.statusNote ||
                                    'Agency details not yet added — configure via Admin Dashboard.'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                <div>
                  <Link
                    to={homepage.representationCtaLink || '/representation'}
                    className="group inline-flex items-center gap-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414] hover:opacity-70 transition-opacity"
                  >
                    <span>{homepage.representationCtaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              <div className="sm:col-span-5 aspect-[3/4] overflow-hidden bg-[#dedad2]">
                <EditorialMediaFrame
                  asset={getAssetById(homepage.representationFeatureAssetId)}
                  preset="portrait"
                  darkSurface={false}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 06 — LET'S WORK TOGETHER (Dark Atmospheric Backdrop) */}
      {homepage.sectionVisibility.contact && (
        <section className="relative overflow-hidden bg-[#0C0C0C] text-[#F5F0E8] py-20 sm:py-28">
          <div className="absolute inset-0">
            <EditorialMediaFrame
              asset={getAssetById(homepage.contactBackdropAssetId)}
              preset="hero"
              showPlaceholderBadge={false}
              className="h-full w-full opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/95 via-[#0C0C0C]/70 to-[#0C0C0C]/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-[#0C0C0C]/70" />
          </div>

          <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
              <div className="md:col-span-7">
                <p className="text-[9px] sm:text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/60 mb-4">
                  {homepage.contactKicker}
                </p>

                <h2 className="font-serif text-4xl sm:text-6xl font-light leading-[0.98] tracking-[0.02em] uppercase text-[#F5F0E8]">
                  {homepage.contactTitle}
                </h2>

                <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[#F5F0E8]/75">
                  {homepage.contactDescription}
                </p>

                <div className="mt-8">
                  <Link
                    to={homepage.contactCtaLink || '/contact'}
                    className="group inline-flex items-center gap-4 border border-white/35 px-6 py-3 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:bg-[#F5F0E8] hover:text-[#0C0C0C] transition-colors"
                  >
                    <span>{homepage.contactCtaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right Direct Contact Details */}
              <div className="md:col-span-5 md:flex md:justify-end">
                <ul className="space-y-3.5 text-[12px] text-[#F5F0E8]/85">
                  <li className="flex items-center gap-3.5">
                    <Mail className="h-3.5 w-3.5 text-[#F5F0E8]/55 shrink-0" />
                    <a
                      href={`mailto:${siteSettings.email}`}
                      className="hover:text-white transition-colors"
                    >
                      {siteSettings.email}
                    </a>
                  </li>
                  <li className="flex items-center gap-3.5">
                    <Phone className="h-3.5 w-3.5 text-[#F5F0E8]/55 shrink-0" />
                    <a
                      href={`tel:${siteSettings.phone}`}
                      className="tabular-nums hover:text-white transition-colors"
                    >
                      {siteSettings.phone}
                    </a>
                  </li>
                  <li className="flex items-center gap-3.5">
                    <Instagram className="h-3.5 w-3.5 text-[#F5F0E8]/55 shrink-0" />
                    <a
                      href={`https://instagram.com/${siteSettings.instagramPrimary.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      {siteSettings.instagramPrimary}
                    </a>
                  </li>
                  <li className="flex items-center gap-3.5">
                    <svg className="h-3.5 w-3.5 text-[#F5F0E8]/55 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <a
                      href="https://x.com/_theeletuabibat"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      @_theeletuabibat
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
