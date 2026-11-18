import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';
import type { PortfolioProject, ProjectCategory } from '../types/cms.ts';

const CATEGORIES: Array<'All' | ProjectCategory> = [
  'All',
  'Campaigns',
  'Editorials',
  'Runway',
  'Publications',
  'Collaborations',
];

// Asymmetric 12-column editorial row span pattern matching the reference layout
const MASONRY_SPANS = [
  'md:col-span-5',
  'md:col-span-4',
  'md:col-span-3',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-5',
  'md:col-span-3',
  'md:col-span-5',
  'md:col-span-3',
  'md:col-span-4',
];

const PAGE_SIZE = 12;

export function PortfolioPage() {
  const { state, getAssetById } = useCms();
  const { pageHeroes, portfolioProjects, portfolioSeasons, portfolioPage } = state;
  const hero = pageHeroes.portfolio;
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeOnlySlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeOnlySlides.length > 0 ? activeOnlySlides : rawSlides;

  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategoryParam = searchParams.get('category');
  const normalizedInitialCategory: 'All' | ProjectCategory =
    rawCategoryParam === 'Editorial'
      ? 'Editorials'
      : CATEGORIES.includes(rawCategoryParam as 'All' | ProjectCategory)
        ? (rawCategoryParam as 'All' | ProjectCategory)
        : 'All';

  const [slideIndex, setSlideIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<'All' | ProjectCategory>(
    normalizedInitialCategory
  );
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [seasonFilter, setSeasonFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllMode, setShowAllMode] = useState(false);

  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      const found = portfolioProjects.find((p) => p.id === projectParam);
      if (found) {
        setSelectedProject(found);
        setGalleryIndex(0);
      }
    }
  }, [searchParams, portfolioProjects]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!selectedProject) return;
      const gallery =
        selectedProject.galleryAssetIds.length > 0
          ? selectedProject.galleryAssetIds
          : [selectedProject.coverAssetId];
      if (e.key === 'Escape') setSelectedProject(null);
      if (e.key === 'ArrowRight') setGalleryIndex((prev) => (prev + 1) % gallery.length);
      if (e.key === 'ArrowLeft')
        setGalleryIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedProject]);

  const publishedProjects = useMemo(
    () => portfolioProjects.filter((p) => p.isPublished !== false),
    [portfolioProjects]
  );

  const years = useMemo(() => {
    const unique = Array.from(new Set(publishedProjects.map((p) => p.year).filter(Boolean))).sort(
      (a, b) => b.localeCompare(a)
    );
    return ['All', ...unique];
  }, [publishedProjects]);

  const seasons = useMemo(() => {
    const fromProjects = publishedProjects.map((p) => p.season).filter(Boolean);
    const merged = Array.from(new Set([...portfolioSeasons, ...fromProjects]));
    return ['All', ...merged];
  }, [portfolioSeasons, publishedProjects]);

  const filteredProjects = useMemo(() => {
    const sorted = [...publishedProjects].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.filter((proj) => {
      if (activeCategory !== 'All' && proj.category !== activeCategory) return false;
      if (yearFilter !== 'All' && proj.year !== yearFilter) return false;
      if (seasonFilter !== 'All' && proj.season !== seasonFilter) return false;
      return true;
    });
  }, [publishedProjects, activeCategory, yearFilter, seasonFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const displayedProjects = useMemo(() => {
    if (showAllMode) return filteredProjects;
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage, showAllMode]);

  const handleCategoryChange = (cat: 'All' | ProjectCategory) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    setShowAllMode(false);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const activeSlide = slides[slideIndex] || slides[0];
  const activeHeroAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;

  const modalGalleryIds = selectedProject
    ? selectedProject.galleryAssetIds.length > 0
      ? selectedProject.galleryAssetIds
      : [selectedProject.coverAssetId]
    : [];
  const activeModalAsset = modalGalleryIds[galleryIndex]
    ? getAssetById(modalGalleryIds[galleryIndex])
    : undefined;

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — A COLLECTION OF MOMENTS */}
      <section className="relative min-h-[62vh] sm:min-h-[68vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide?.id || 'portfolio-hero'}
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

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[4.5rem] font-light tracking-[0.02em] uppercase leading-[0.94] text-[#F5F0E8]">
              {hero.title}
            </h1>

            {hero.subtitle && (
              <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[#F5F0E8]/78">
                {hero.subtitle}
              </p>
            )}

            {hero.ctaText && (
              <div className="mt-7">
                <Link
                  to={hero.ctaLink || '/digitals'}
                  className="group inline-flex items-center gap-5 border-b border-white/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:border-white transition-colors"
                >
                  <span>{hero.ctaText}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Vertical Editorial Caption & Slideshow Index */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[82px] text-[9px] leading-[1.7] tracking-[0.28em] uppercase text-[#F5F0E8]/65">
                {portfolioPage.heroCornerCaption}
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

      {/* FILTER BAR & ASYMMETRIC EDITORIAL MASONRY GRID (Light Stone Paper) */}
      <section className="bg-[#F5F0E8] text-[#141414] py-14 sm:py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          {/* Explore Filter Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#141414]/12">
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#141414]/65">
                EXPLORE
              </span>
              <span className="h-px w-12 bg-[#141414]/25" />
            </div>

            {/* Category Underline Tabs */}
            <div
              className="flex flex-wrap items-center gap-5 sm:gap-7"
              role="tablist"
              aria-label="Portfolio categories"
            >
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleCategoryChange(cat)}
                    className={`relative pb-1.5 text-[10px] font-medium tracking-[0.22em] uppercase whitespace-nowrap shrink-0 transition-colors ${
                      active ? 'text-[#141414]' : 'text-[#141414]/55 hover:text-[#141414]'
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

            {/* Year & Season Dropdowns */}
            <div className="flex items-center gap-4 shrink-0">
              <select
                aria-label="Filter by year"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-b border-[#141414]/25 bg-transparent py-1.5 pr-4 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414] focus:border-[#141414] focus:outline-none"
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr === 'All' ? 'ALL YEARS' : yr}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by season"
                value={seasonFilter}
                onChange={(e) => {
                  setSeasonFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-b border-[#141414]/25 bg-transparent py-1.5 pr-4 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414] focus:border-[#141414] focus:outline-none"
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'SEASON' : s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Asymmetric Masonry Photography Grid */}
          {displayedProjects.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <p className="font-serif text-2xl uppercase text-[#141414]/70">
                NO PROJECTS MATCH THESE FILTERS
              </p>
              <button
                type="button"
                onClick={() => {
                  handleCategoryChange('All');
                  setYearFilter('All');
                  setSeasonFilter('All');
                }}
                className="border-b border-[#141414] pb-1 text-[10px] font-medium tracking-[0.22em] uppercase"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              {displayedProjects.map((project, idx) => {
                const spanClass = MASONRY_SPANS[idx % MASONRY_SPANS.length];
                return (
                  <motion.article
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      setSelectedProject(project);
                      setGalleryIndex(0);
                    }}
                    className={`group relative cursor-pointer overflow-hidden bg-[#191817] h-[300px] sm:h-[340px] ${spanClass}`}
                  >
                    <EditorialMediaFrame
                      asset={getAssetById(project.coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                      imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition-opacity duration-300" />

                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-[#F5F0E8]">
                      <p className="text-[9px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8]/75">
                        {project.category}
                        {project.isPlaceholder ? ' · PLACEHOLDER' : ''}
                      </p>
                      <h3 className="mt-1 font-serif text-xl sm:text-2xl font-light uppercase tracking-[0.02em] text-[#F5F0E8]">
                        {project.title}
                      </h3>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono tabular-nums tracking-[0.18em] text-[#F5F0E8]/70">
                        <span>
                          {String(idx + 1).padStart(2, '0')} /{' '}
                          {String(filteredProjects.length).padStart(2, '0')}
                        </span>
                        <span className="font-sans text-[10px] tracking-[0.16em] uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                          {project.year}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {/* Pagination & Load More Strip */}
          {filteredProjects.length > 0 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#141414]/12 pt-6 text-[10px] tracking-[0.22em] uppercase text-[#141414]/70">
              <div className="flex items-center gap-4">
                <span className="font-mono tabular-nums">
                  SHOWING {displayedProjects.length} OF {filteredProjects.length}
                </span>
                <span className="h-px w-10 bg-[#141414]/25" />
              </div>

              {totalPages > 1 && !showAllMode && (
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                    className="p-1 disabled:opacity-30 hover:text-[#141414]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`pb-0.5 ${
                        page === currentPage
                          ? 'border-b border-[#141414] font-semibold text-[#141414]'
                          : 'text-[#141414]/55 hover:text-[#141414]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                    className="p-1 disabled:opacity-30 hover:text-[#141414]"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {filteredProjects.length > PAGE_SIZE ? (
                <button
                  type="button"
                  onClick={() => setShowAllMode((prev) => !prev)}
                  className="inline-flex items-center gap-2 font-medium text-[#141414] hover:opacity-70"
                >
                  <span>{showAllMode ? 'PAGINATE VIEW' : 'LOAD MORE'}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 font-medium text-[#141414] hover:opacity-70"
                >
                  <span>REQUEST FULL BOOK</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CLOSING CTA BAND — LET'S WORK TOGETHER */}
      <section className="relative overflow-hidden bg-[#0C0C0C] text-[#F5F0E8] py-20 sm:py-28">
        <div className="absolute inset-0">
          <EditorialMediaFrame
            asset={getAssetById(portfolioPage.bottomCtaBackdropAssetId)}
            preset="hero"
            showPlaceholderBadge={false}
            className="h-full w-full opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/95 via-[#0C0C0C]/70 to-[#0C0C0C]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-[#0C0C0C]/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="max-w-md space-y-5">
            <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase leading-[0.98] text-[#F5F0E8]">
              {portfolioPage.bottomCtaTitle}
            </h2>
            <p className="text-[13px] leading-relaxed text-[#F5F0E8]/75">
              {portfolioPage.bottomCtaDescription}
            </p>
            <div className="pt-2">
              <Link
                to={portfolioPage.bottomCtaLink || '/contact'}
                className="group inline-flex items-center gap-4 border border-white/35 px-6 py-3 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:bg-[#F5F0E8] hover:text-[#0C0C0C] transition-colors"
              >
                <span>{portfolioPage.bottomCtaText}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 text-right">
            <AbibatSignature className="w-36 h-auto text-[#F5F0E8]/90" />
            <p className="text-[9px] tracking-[0.28em] uppercase text-[#F5F0E8]/65">
              {portfolioPage.bottomCtaTagline}
            </p>
          </div>
        </div>
      </section>

      {/* PROJECT LIGHTBOX & GALLERY MODAL */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/94 p-4 sm:p-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={selectedProject.title}
        >
          <button
            type="button"
            onClick={() => setSelectedProject(null)}
            aria-label="Close project lightbox"
            className="fixed top-5 right-5 z-20 flex h-10 w-10 items-center justify-center border border-white/25 bg-black/60 text-[#F5F0E8] hover:border-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="grid w-full max-w-6xl grid-cols-1 lg:grid-cols-12 gap-8 items-start text-[#F5F0E8] my-auto">
            {/* Main Gallery Stage + Thumbnails */}
            <div className="lg:col-span-8 space-y-3">
              <div className="relative aspect-[4/5] sm:aspect-[16/11] bg-[#141414] overflow-hidden">
                <EditorialMediaFrame
                  asset={activeModalAsset}
                  preset="portfolio-lightbox"
                  className="h-full w-full"
                  imgClassName="h-full w-full object-contain"
                />

                {modalGalleryIds.length > 1 && (
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryIndex(
                          (prev) => (prev - 1 + modalGalleryIds.length) % modalGalleryIds.length
                        )
                      }
                      aria-label="Previous photograph"
                      className="flex h-9 w-9 items-center justify-center bg-black/75 border border-white/25 text-white hover:bg-black"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="bg-black/75 px-3 py-1 text-[10px] font-mono tabular-nums tracking-[0.2em]">
                      {String(galleryIndex + 1).padStart(2, '0')} /{' '}
                      {String(modalGalleryIds.length).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryIndex((prev) => (prev + 1) % modalGalleryIds.length)
                      }
                      aria-label="Next photograph"
                      className="flex h-9 w-9 items-center justify-center bg-black/75 border border-white/25 text-white hover:bg-black"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip (Cloudinary thumbnail transform) */}
              {modalGalleryIds.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {modalGalleryIds.map((assetId, idx) => (
                    <button
                      key={`${assetId}-${idx}`}
                      type="button"
                      onClick={() => setGalleryIndex(idx)}
                      className={`h-16 w-14 shrink-0 overflow-hidden border transition-opacity ${
                        idx === galleryIndex
                          ? 'border-white opacity-100'
                          : 'border-white/20 opacity-50 hover:opacity-90'
                      }`}
                    >
                      <EditorialMediaFrame
                        asset={getAssetById(assetId)}
                        preset="thumbnail"
                        showPlaceholderBadge={false}
                        className="h-full w-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project Details Sidebar */}
            <div className="lg:col-span-4 space-y-5">
              <p className="text-[10px] tracking-[0.24em] uppercase text-[#F5F0E8]/60">
                {selectedProject.category} · {selectedProject.year}
                {selectedProject.season ? ` · ${selectedProject.season}` : ''}
              </p>

              <h3 className="font-serif text-3xl sm:text-4xl font-light uppercase">
                {selectedProject.title}
              </h3>

              <dl className="grid grid-cols-2 gap-4 border-t border-b border-white/15 py-4 text-xs">
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.2em] text-[#F5F0E8]/45">
                    BRAND / CLIENT
                  </dt>
                  <dd className="mt-1 text-[#F5F0E8]/90">{selectedProject.client || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.2em] text-[#F5F0E8]/45">
                    PHOTOGRAPHER
                  </dt>
                  <dd className="mt-1 text-[#F5F0E8]/90">
                    {selectedProject.photographer || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.2em] text-[#F5F0E8]/45">
                    LOCATION
                  </dt>
                  <dd className="mt-1 text-[#F5F0E8]/90">{selectedProject.location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.2em] text-[#F5F0E8]/45">
                    SEASON / YEAR
                  </dt>
                  <dd className="mt-1 text-[#F5F0E8]/90 tabular-nums">
                    {[selectedProject.season, selectedProject.year].filter(Boolean).join(' · ')}
                  </dd>
                </div>
              </dl>

              <p className="text-[13px] leading-relaxed text-[#F5F0E8]/80">
                {selectedProject.description}
              </p>

              {selectedProject.credits && (
                <div className="text-[11px] text-[#F5F0E8]/65">
                  <p className="uppercase tracking-[0.2em] text-[9px] text-[#F5F0E8]/45 mb-1">
                    CREDITS
                  </p>
                  <p>{selectedProject.credits}</p>
                </div>
              )}

              {activeModalAsset && (
                <div className="border-t border-white/10 pt-3 text-[11px] text-[#F5F0E8]/55">
                  <p className="uppercase tracking-[0.2em] text-[9px] text-[#F5F0E8]/40">
                    CURRENT PLATE
                  </p>
                  <p className="mt-0.5">{activeModalAsset.altText || activeModalAsset.assetName}</p>
                </div>
              )}

              {selectedProject.externalLink && (
                <a
                  href={selectedProject.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-white/30 px-4 py-2 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] hover:bg-white hover:text-[#0C0C0C] transition-colors"
                >
                  <span>VIEW EXTERNAL FEATURE</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
