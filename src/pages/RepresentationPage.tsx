import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { useCms } from '../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../components/EditorialMediaFrame.tsx';
import { getOptimizedCloudinaryUrl } from '../lib/cloudinary.ts';
import type { RepresentationAgency } from '../types/cms.ts';

type GroupByMode = 'all' | 'city' | 'country';

function formatWebsiteLabel(url: string) {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function normalizeExternalUrl(url: string) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export function RepresentationPage() {
  const { state, getAssetById } = useCms();
  const { pageHeroes, representationPage, representationAgencies } = state;
  const hero = pageHeroes.representation;
  const rawSlides = hero?.slides?.length ? hero.slides : [];
  const activeHeroSlides = rawSlides.filter((s) => s.isActive !== false);
  const slides = activeHeroSlides.length > 0 ? activeHeroSlides : rawSlides;

  const [slideIndex, setSlideIndex] = useState(0);
  const [groupBy, setGroupBy] = useState<GroupByMode>('all');
  const [countryFilter, setCountryFilter] = useState<string>('All');

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

  const activeAgencies = useMemo(
    () =>
      [...representationAgencies]
        .filter((a) => a.isActive !== false && a.agencyName.trim().length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [representationAgencies]
  );

  const countries = useMemo(() => {
    const unique = Array.from(
      new Set(activeAgencies.map((a) => a.country.trim()).filter(Boolean))
    );
    return ['All', ...unique];
  }, [activeAgencies]);

  const filteredAgencies = useMemo(() => {
    if (countryFilter === 'All') return activeAgencies;
    return activeAgencies.filter(
      (a) => a.country.trim().toLowerCase() === countryFilter.toLowerCase()
    );
  }, [activeAgencies, countryFilter]);

  const groupedSections = useMemo(() => {
    if (groupBy === 'all') {
      return [{ label: '', items: filteredAgencies }];
    }

    const groups = new Map<string, RepresentationAgency[]>();
    for (const agency of filteredAgencies) {
      const rawKey =
        groupBy === 'city'
          ? agency.city.trim() || 'Other Cities'
          : agency.country.trim() || 'Other Regions';
      const key = rawKey.toUpperCase();
      const bucket = groups.get(key) || [];
      bucket.push(agency);
      groups.set(key, bucket);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }, [filteredAgencies, groupBy]);

  const activeSlide = slides[slideIndex] || slides[0];
  const activeHeroAsset = activeSlide ? getAssetById(activeSlide.assetId) : undefined;
  const resolvedHeroTitle = activeSlide?.title?.trim() || hero.title;
  const resolvedHeroCtaText = activeSlide?.ctaText?.trim() || hero.ctaText;
  const resolvedHeroCtaLink = activeSlide?.ctaLink?.trim() || hero.ctaLink;

  const renderAgencyCard = (agency: RepresentationAgency, globalIndex: number) => {
    const photoAsset = agency.photoAssetId ? getAssetById(agency.photoAssetId) : undefined;
    const logoAsset = agency.logoAssetId ? getAssetById(agency.logoAssetId) : undefined;
    const logoUrl = logoAsset ? getOptimizedCloudinaryUrl(logoAsset, 'thumbnail') : '';
    const websiteHref = normalizeExternalUrl(agency.website.trim());
    const indexLabel = String(globalIndex + 1).padStart(2, '0');

    return (
      <article
        key={agency.id}
        className="group border border-[#141414]/15 bg-[#F8F6F2] flex flex-col justify-between transition-colors hover:border-[#141414]/45"
      >
        <div>
          {/* Optional Agency Photograph */}
          {photoAsset ? (
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#191817]">
              <EditorialMediaFrame
                asset={photoAsset}
                preset="portfolio-card"
                className="h-full w-full"
                imgClassName="h-full w-full object-cover group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/35" />
              <span className="absolute top-3.5 left-4 font-mono text-[10px] tabular-nums tracking-[0.22em] text-[#F5F0E8]/90">
                {indexLabel}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-[#141414]/10 px-6 py-3.5 bg-[#EFECE5]">
              <span className="font-mono text-[10px] tabular-nums tracking-[0.22em] text-[#141414]/55">
                {indexLabel}
              </span>
              {(agency.city || agency.country) && (
                <span className="text-[9px] tracking-[0.22em] uppercase text-[#141414]/55">
                  {[agency.city, agency.country].filter(Boolean).join(' / ')}
                </span>
              )}
            </div>
          )}

          {/* Card Body */}
          <div className="p-6 sm:p-7 space-y-4">
            {/* Optional Agency Logo */}
            {logoAsset && (
              <div className="pb-1">
                {logoUrl && !logoAsset.isPlaceholder ? (
                  <img
                    src={logoUrl}
                    alt={logoAsset.altText || `${agency.agencyName} logo`}
                    loading="lazy"
                    className="h-8 w-auto max-w-[150px] object-contain"
                  />
                ) : (
                  <div className="inline-flex border border-[#141414]/15 bg-white px-3 py-1.5 text-[9px] tracking-[0.2em] uppercase text-[#141414]/65">
                    {logoAsset.assetName}
                  </div>
                )}
              </div>
            )}

            <div>
              <h3 className="font-serif text-2xl sm:text-[1.75rem] font-light uppercase leading-[1.06] tracking-[0.02em] text-[#141414]">
                {agency.agencyName}
              </h3>

              {(agency.city || agency.country) && (
                <p className="mt-2 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414]/58">
                  {[agency.city, agency.country].filter(Boolean).join('  /  ')}
                </p>
              )}
            </div>

            {agency.specialties && agency.specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {agency.specialties.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#141414]/20 px-2.5 py-0.5 text-[9px] tracking-[0.16em] uppercase text-[#141414]/75"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {agency.description && (
              <p className="text-[12px] leading-relaxed text-[#141414]/72">{agency.description}</p>
            )}
          </div>
        </div>

        {/* Contact Details & Action */}
        <div className="px-6 sm:px-7 pb-6 pt-4 border-t border-[#141414]/10 flex items-end justify-between gap-4">
          <div className="space-y-2 text-[11px] text-[#141414]/75 min-w-0">
            {websiteHref && (
              <p className="flex items-center gap-2.5 truncate">
                <Globe className="h-3.5 w-3.5 text-[#141414]/45 shrink-0" />
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:text-[#141414] hover:underline"
                >
                  {formatWebsiteLabel(agency.website)}
                </a>
              </p>
            )}
            {agency.email && (
              <p className="flex items-center gap-2.5 truncate">
                <Mail className="h-3.5 w-3.5 text-[#141414]/45 shrink-0" />
                <a
                  href={`mailto:${agency.email}`}
                  className="truncate hover:text-[#141414] hover:underline"
                >
                  {agency.email}
                </a>
              </p>
            )}
            {agency.phone && (
              <p className="flex items-center gap-2.5 tabular-nums truncate">
                <Phone className="h-3.5 w-3.5 text-[#141414]/45 shrink-0" />
                <a
                  href={`tel:${agency.phone}`}
                  className="truncate hover:text-[#141414] hover:underline"
                >
                  {agency.phone}
                </a>
              </p>
            )}
            {agency.agentName && (
              <p className="flex items-center gap-2.5 truncate">
                <User className="h-3.5 w-3.5 text-[#141414]/45 shrink-0" />
                <span className="truncate">{agency.agentName}</span>
              </p>
            )}
          </div>

          {websiteHref ? (
            <a
              href={websiteHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Visit ${agency.agencyName}`}
              className="p-1 text-[#141414]/65 hover:text-[#141414] transition-transform duration-200 group-hover:translate-x-0.5 shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <Link
              to="/contact?inquiryType=Agency%20Representation"
              aria-label={`Inquire regarding ${agency.agencyName}`}
              className="p-1 text-[#141414]/65 hover:text-[#141414] transition-transform duration-200 group-hover:translate-x-0.5 shrink-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </article>
    );
  };

  let runningCardIndex = 0;

  return (
    <div className="bg-[#0C0C0C] text-[#F5F0E8]">
      {/* HERO SECTION — GLOBAL REPRESENTATION */}
      <section className="relative min-h-[60vh] sm:min-h-[68vh] w-full overflow-hidden bg-[#0C0C0C] flex items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide?.id || 'representation-hero'}
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

            <h1 className="font-serif text-5xl sm:text-7xl lg:text-[4.6rem] font-light tracking-[0.02em] uppercase leading-[0.94] text-[#F5F0E8]">
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
                  to={resolvedHeroCtaLink || '/contact?inquiryType=Agency%20Representation'}
                  className="group inline-flex items-center gap-4 border border-white/35 px-5 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] hover:bg-[#F5F0E8] hover:text-[#0C0C0C] transition-colors"
                >
                  <span>{resolvedHeroCtaText}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Vertical Caption & Slideshow Index */}
          <div className="flex flex-col items-start md:items-end gap-8">
            <div className="flex flex-col items-end gap-3 text-right">
              <p className="max-w-[100px] text-[9px] leading-[1.7] tracking-[0.26em] uppercase text-[#F5F0E8]/65">
                {representationPage.heroCornerCaption}
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

      {/* DYNAMIC AGENCIES DIRECTORY SECTION (Light Stone Paper) */}
      <section className="bg-[#F5F0E8] text-[#141414] py-16 sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 space-y-10">
          {/* Editorial Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#141414]/12 pb-8">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#141414]/65">
                  {representationPage.sectionKicker}
                </span>
                <span className="h-px w-12 bg-[#141414]/25" />
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase tracking-[0.02em] text-[#141414]">
                {representationPage.sectionTitle}
              </h2>
            </div>

            <p className="max-w-sm text-[12px] leading-relaxed text-[#141414]/70">
              {representationPage.sectionDescription}
            </p>
          </div>

          {/* Grouping & Country Controls (shown when agencies exist) */}
          {activeAgencies.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div
                className="flex flex-wrap items-center gap-6"
                role="tablist"
                aria-label="Group agencies by view"
              >
                {(
                  [
                    { id: 'all', label: 'ALL AGENCIES' },
                    { id: 'city', label: 'GROUP BY CITY' },
                    { id: 'country', label: 'GROUP BY COUNTRY' },
                  ] as const
                ).map((tab) => {
                  const active = groupBy === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setGroupBy(tab.id)}
                      className={`relative pb-1.5 text-[10px] font-medium tracking-[0.22em] uppercase whitespace-nowrap shrink-0 transition-colors ${
                        active ? 'text-[#141414]' : 'text-[#141414]/50 hover:text-[#141414]'
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`absolute left-0 right-0 bottom-0 h-[1.5px] bg-[#141414] transition-transform duration-200 origin-left ${
                          active ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4">
                {countries.length > 2 && (
                  <select
                    aria-label="Filter agencies by country"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="border-b border-[#141414]/25 bg-transparent py-1 pr-4 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414] focus:border-[#141414] focus:outline-none"
                  >
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'ALL COUNTRIES' : c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}

                <span className="text-[10px] font-mono tabular-nums tracking-[0.18em] text-[#141414]/55">
                  {String(filteredAgencies.length).padStart(2, '0')}{' '}
                  {filteredAgencies.length === 1 ? 'AGENCY' : 'AGENCIES'}
                </span>
              </div>
            </div>
          )}

          {/* Dynamic Agency Grid OR Clean Empty State */}
          {activeAgencies.length === 0 ? (
            <div className="border border-[#141414]/15 bg-[#F8F6F2] p-8 sm:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-lg space-y-3">
                <p className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#141414]/55">
                  REPRESENTATION DIRECTORY
                </p>
                <h3 className="font-serif text-3xl sm:text-4xl font-light uppercase text-[#141414]">
                  NO PARTNER AGENCIES LISTED YET
                </h3>
                <p className="text-[13px] leading-relaxed text-[#141414]/72">
                  Agency placements are managed dynamically in the studio dashboard and will appear
                  here automatically once added. For direct representation inquiries or worldwide
                  bookings, please get in touch directly.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <Link
                  to="/contact?inquiryType=Agency%20Representation"
                  className="inline-flex items-center gap-3 bg-[#141414] px-6 py-3.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F5F0E8] hover:bg-[#2a2a2a] transition-colors"
                >
                  <span>REQUEST TO REPRESENT</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 border border-[#141414]/30 px-5 py-3.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414] hover:border-[#141414] transition-colors"
                >
                  <span>ADD IN ADMIN</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {groupedSections.map((group) => (
                <div key={group.label || 'all'} className="space-y-5">
                  {group.label && (
                    <div className="flex items-center justify-between border-b border-[#141414]/12 pb-2.5">
                      <h3 className="font-serif text-2xl font-light uppercase tracking-[0.04em] text-[#141414]">
                        {group.label}
                      </h3>
                      <span className="text-[10px] font-mono tabular-nums tracking-[0.2em] text-[#141414]/55">
                        {String(group.items.length).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((agency) => {
                      const idx = runningCardIndex++;
                      return renderAgencyCard(agency, idx);
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CLOSING CTA BAND — LET'S BUILD SOMETHING BIG. */}
      <section className="relative overflow-hidden bg-[#0C0C0C] text-[#F5F0E8] py-20 sm:py-28">
        <div className="absolute inset-0">
          <EditorialMediaFrame
            asset={getAssetById(representationPage.bottomCtaBackdropAssetId)}
            preset="hero"
            showPlaceholderBadge={false}
            className="h-full w-full opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0C0C]/95 via-[#0C0C0C]/70 to-[#0C0C0C]/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-transparent to-[#0C0C0C]/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-14 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="max-w-md space-y-5">
            <p className="text-[10px] font-medium tracking-[0.26em] uppercase text-[#F5F0E8]/60">
              {representationPage.bottomCtaKicker}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light uppercase leading-[0.98] text-[#F5F0E8]">
              {representationPage.bottomCtaTitle}
            </h2>
            <p className="text-[13px] leading-relaxed text-[#F5F0E8]/75">
              {representationPage.bottomCtaDescription}
            </p>
            <div className="pt-2">
              <Link
                to={
                  representationPage.bottomCtaLink ||
                  '/contact?inquiryType=Agency%20Representation'
                }
                className="group inline-flex items-center gap-4 border border-white/35 px-6 py-3 text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8] hover:bg-[#F5F0E8] hover:text-[#0C0C0C] transition-colors"
              >
                <span>{representationPage.bottomCtaText}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          <ul className="space-y-4">
            {representationPage.bottomCtaHighlights.map((item) => (
              <li key={item} className="flex items-center gap-4">
                <span className="h-px w-8 bg-white/35" />
                <span className="text-[10px] font-medium tracking-[0.24em] uppercase text-[#F5F0E8]/85">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
