import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { AbibatSignature } from '../components/AbibatSignature.tsx';

export function AboutPage() {
  const { state, getAssetById } = useCms();
  const { aboutPage, homepage, pageHeroes } = state;
  const hero = pageHeroes.about;
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeSlides.length > 0 ? activeSlides : rawSlides;

  const [slideIndex, setSlideIndex] = useState(0);
  const [valuesOpen, setValuesOpen] = useState(false);

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

  const activeSlide = slides[slideIndex] || slides[0];
  const activeHeroAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;
  const resolvedHeroTitle = activeSlide?.title?.trim() || hero.title;

  const storyTextBlock = (
    <div className="lg:col-span-4 flex flex-col justify-between gap-8">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#141414]/65">
            {aboutPage.storyKicker}
          </span>
          <span className="h-px w-12 bg-[#141414]/25" />
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-light uppercase leading-[0.98] tracking-[0.02em] text-[#141414]">
          {aboutPage.storyTitle}
        </h2>

        <div className="mt-6 space-y-4 text-[13px] leading-[1.75] text-[#141414]/75">
          {aboutPage.storyParagraphs.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
      </div>

      <div className="pt-2 text-[#141414]/85">
        <AbibatSignature className="w-32 h-auto" />
      </div>
    </div>
  );

  const storyPortraitBlock = (
    <div className="lg:col-span-5 aspect-[4/5] w-full overflow-hidden bg-[#dedad2]">
      <EditorialMediaFrame
        asset={getAssetById(aboutPage.storyPortraitAssetId)}
        preset="portrait"
        darkSurface={false}
        className="h-full w-full"
      />
    </div>
  );

  const bigPicturePortraitBlock = (
    <div className="lg:col-span-4 aspect-[3/4] w-full overflow-hidden bg-[#dedad2]">
      <EditorialMediaFrame
        asset={getAssetById(aboutPage.bigPictureLeftAssetId)}
        preset="portrait"
        darkSurface={false}
        className="h-full w-full"
      />
    </div>
  );

  const bigPictureCollageBlock = (
    <div className="lg:col-span-4 flex flex-col justify-between gap-4">
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-7 aspect-[4/3] overflow-hidden bg-[#1a1918]">
          <EditorialMediaFrame
            asset={getAssetById(aboutPage.bigPictureTopRightAssetId)}
            preset="digitals-bw"
            grayscale
            className="h-full w-full"
          />
        </div>
        <div className="col-span-5 pl-1">
          <p className="font-serif italic text-xl sm:text-2xl leading-snug text-[#141414]/80 -rotate-6 select-none">
            {aboutPage.bigPictureHandwrittenNote}
          </p>
        </div>
      </div>

      <div className="aspect-[16/10] w-full overflow-hidden bg-[#dedad2]">
        <EditorialMediaFrame
          asset={getAssetById(aboutPage.bigPictureBottomRightAssetId)}
          preset="portfolio-card"
          darkSurface={false}
          className="h-full w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — THE GIRL BEHIND THE VISION */}
      <section className="relative min-h-[62vh] sm:min-h-[70vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide?.id || 'about-hero'}
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

        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-14 pt-32 pb-14 sm:pb-18 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-[10px] font-medium tracking-[0.28em] uppercase text-[#F5F0E8]/70">
                {hero.kicker}
              </span>
              <span className="h-px w-12 bg-white/30" />
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[4.75rem] font-light tracking-[0.02em] uppercase leading-[0.94] text-[#F5F0E8]">
              {resolvedHeroTitle}
            </h1>

            {hero.subtitle && (
              <p className="mt-6 text-[10px] sm:text-[11px] tracking-[0.32em] uppercase text-[#F5F0E8]/80">
                {hero.subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-6">
            {/* Right-side vertical architectural tag from reference screenshot */}
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[72px] text-[9px] leading-[1.7] tracking-[0.28em] uppercase text-[#F5F0E8]/65">
                {aboutPage.heroCornerCaption}
              </p>
              <span className="h-8 w-px bg-white/30" />
            </div>

            {slides.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono tabular-nums tracking-[0.2em] text-[#F5F0E8]/70">
                  {String(slideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
                {slides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length)
                      }
                      aria-label="Previous About slide"
                      className="flex h-8 w-8 items-center justify-center border border-white/25 text-[#F5F0E8]/80 hover:border-white hover:text-white transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
                      aria-label="Next About slide"
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

      {/* SECTION 02 — MY STORY / QUICK FACTS (Light Stone Paper) */}
      <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-stretch">
            {aboutPage.storyLayoutOrder === 'portrait-text-facts' ? (
              <>
                {storyPortraitBlock}
                {storyTextBlock}
              </>
            ) : (
              <>
                {storyTextBlock}
                {storyPortraitBlock}
              </>
            )}

            {/* Quick Facts & My Values Column */}
            <aside className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#141414]/15 pt-8 lg:pt-0 lg:pl-8">
              <div className="space-y-6">
                <div className="border-b border-[#141414]/15 pb-3">
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/65">
                    {aboutPage.quickFactsTitle}
                  </p>
                </div>

                <dl className="space-y-5 text-[12px]">
                  <div>
                    <dt className="text-[9px] tracking-[0.22em] uppercase text-[#141414]/50">
                      HEIGHT
                    </dt>
                    <dd className="mt-1 tabular-nums text-[#141414]">
                      {homepage.modelStats.height}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[9px] tracking-[0.22em] uppercase text-[#141414]/50">
                      LOCATIONS
                    </dt>
                    <dd className="mt-1 text-[#141414]">{homepage.modelStats.locations}</dd>
                  </div>

                  <div>
                    <dt className="text-[9px] tracking-[0.22em] uppercase text-[#141414]/50">
                      AGENCY REPRESENTATION
                    </dt>
                    <dd className="mt-1 text-[#141414]/75">{homepage.modelStats.agencyNote}</dd>
                  </div>
                </dl>

                <blockquote className="pt-2 font-serif italic text-base leading-relaxed text-[#141414]/85">
                  {aboutPage.quickFactsQuote}
                </blockquote>
              </div>

              {/* Expandable My Values Accordion */}
              <div className="mt-8 border-t border-b border-[#141414]/15">
                <button
                  type="button"
                  onClick={() => setValuesOpen((prev) => !prev)}
                  aria-expanded={valuesOpen}
                  className="flex w-full items-center justify-between py-3.5 text-left text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414] hover:opacity-70 transition-opacity"
                >
                  <span>{aboutPage.valuesTitle}</span>
                  {valuesOpen ? (
                    <Minus className="h-3.5 w-3.5 text-[#141414]/65" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 text-[#141414]/65" />
                  )}
                </button>

                {valuesOpen && (
                  <div className="pb-4 space-y-3 border-t border-[#141414]/10 pt-3">
                    {aboutPage.valuesItems.map((item, idx) => (
                      <div key={idx}>
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#141414]">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[#141414]/70">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTION 03 — WHAT DRIVES ME: PASSION. DISCIPLINE. GROWTH. (Dark Monochrome Backdrop) */}
      <section className="relative overflow-hidden bg-[#121110] text-[#F5F0E8] py-20 sm:py-28">
        <div className="absolute inset-0">
          <EditorialMediaFrame
            asset={getAssetById(aboutPage.drivesBackdropAssetId)}
            preset="hero"
            grayscale
            showPlaceholderBadge={false}
            className="h-full w-full opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/92 via-[#0C0C0C]/55 to-[#0C0C0C]/92" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C]/75 via-transparent to-[#0C0C0C]/75" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                  {aboutPage.drivesKicker}
                </span>
                <span className="h-px w-12 bg-white/30" />
              </div>

              <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-light uppercase leading-[0.98] tracking-[0.02em] text-[#F5F0E8] max-w-md">
                {aboutPage.drivesTitle}
              </h2>
            </div>

            <div className="lg:col-span-5 lg:col-start-8 space-y-4 text-[13px] sm:text-sm leading-[1.75] text-[#F5F0E8]/85">
              {aboutPage.drivesParagraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04 — THE BIG PICTURE: MORE THAN A MODEL (Light Stone Collage) */}
      <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-center">
            {aboutPage.bigPictureLayoutOrder === 'collage-text-portrait' ? (
              <>
                {bigPictureCollageBlock}
                {/* Center Copy */}
                <div className="lg:col-span-4 space-y-5 lg:px-3">
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/60">
                    {aboutPage.bigPictureKicker}
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl font-light uppercase leading-[1.02] tracking-[0.02em] text-[#141414]">
                    {aboutPage.bigPictureTitle}
                  </h2>
                  <div className="space-y-4 text-[13px] leading-[1.75] text-[#141414]/75">
                    {aboutPage.bigPictureParagraphs.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link
                      to={aboutPage.bigPictureCtaLink || '/portfolio'}
                      className="group inline-flex items-center gap-4 border-b border-[#141414]/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414] hover:border-[#141414] transition-colors"
                    >
                      <span>{aboutPage.bigPictureCtaText}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
                {bigPicturePortraitBlock}
              </>
            ) : (
              <>
                {bigPicturePortraitBlock}
                <div className="lg:col-span-4 space-y-5 lg:px-3">
                  <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/60">
                    {aboutPage.bigPictureKicker}
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl font-light uppercase leading-[1.02] tracking-[0.02em] text-[#141414]">
                    {aboutPage.bigPictureTitle}
                  </h2>
                  <div className="space-y-4 text-[13px] leading-[1.75] text-[#141414]/75">
                    {aboutPage.bigPictureParagraphs.map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>
                  <div className="pt-2">
                    <Link
                      to={aboutPage.bigPictureCtaLink || '/portfolio'}
                      className="group inline-flex items-center gap-4 border-b border-[#141414]/35 pb-1.5 text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414] hover:border-[#141414] transition-colors"
                    >
                      <span>{aboutPage.bigPictureCtaText}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>
                </div>
                {bigPictureCollageBlock}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
