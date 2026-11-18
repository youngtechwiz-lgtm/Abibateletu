import { useState } from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCms } from '../../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { ExperienceCategory, PageHero, PageSlug } from '../../types/cms.ts';

function HeroCopyEditor({
  pageSlug,
  pageLabel,
  previewPath,
}: {
  pageSlug: PageSlug;
  pageLabel: string;
  previewPath: string;
}) {
  const { state, updateState } = useCms();
  const hero = state.pageHeroes[pageSlug];

  const updateHeroField = <K extends keyof PageHero>(field: K, value: PageHero[K]) => {
    updateState((prev) => ({
      ...prev,
      pageHeroes: {
        ...prev.pageHeroes,
        [pageSlug]: {
          ...prev.pageHeroes[pageSlug],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            PAGE HERO &amp; HEADLINE
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">{pageLabel}</h3>
        </div>
        <Link
          to={previewPath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-[#141414]/25 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414] hover:border-[#141414]"
        >
          <span>Preview Page</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
            Hero Kicker
          </span>
          <input
            type="text"
            value={hero.kicker}
            onChange={(e) => updateHeroField('kicker', e.target.value)}
            className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
            Hero Headline
          </span>
          <input
            type="text"
            value={hero.title}
            onChange={(e) => updateHeroField('title', e.target.value)}
            className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
            Hero Subtitle / Standfirst
          </span>
          <textarea
            rows={2}
            value={hero.subtitle}
            onChange={(e) => updateHeroField('subtitle', e.target.value)}
            className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
            CTA Button Text
          </span>
          <input
            type="text"
            value={hero.ctaText}
            onChange={(e) => updateHeroField('ctaText', e.target.value)}
            className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
          />
        </label>

        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
            CTA Destination Link
          </span>
          <input
            type="text"
            value={hero.ctaLink}
            onChange={(e) => updateHeroField('ctaLink', e.target.value)}
            className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
          />
        </label>
      </div>
    </div>
  );
}

export function PortfolioPageEditor({
  onOpenManager,
}: {
  onOpenManager?: () => void;
}) {
  const { state, getAssetById, updateState } = useCms();
  const { portfolioPage } = state;
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <HeroCopyEditor
        pageSlug="portfolio"
        pageLabel="PORTFOLIO PAGE EDITOR"
        previewPath="/portfolio"
      />

      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              PAGE SECTIONS &amp; CLOSING BANNER
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              PORTFOLIO EDITORIAL SETTINGS
            </h3>
          </div>
          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="bg-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
            >
              Open Portfolio Manager
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Vertical Tagline
            </span>
            <input
              type="text"
              value={portfolioPage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  portfolioPage: { ...prev.portfolioPage, heroCornerCaption: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Tagline
            </span>
            <input
              type="text"
              value={portfolioPage.bottomCtaTagline}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  portfolioPage: { ...prev.portfolioPage, bottomCtaTagline: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Closing CTA Headline
            </span>
            <input
              type="text"
              value={portfolioPage.bottomCtaTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  portfolioPage: { ...prev.portfolioPage, bottomCtaTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Closing CTA Button
              </span>
              <input
                type="text"
                value={portfolioPage.bottomCtaText}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    portfolioPage: { ...prev.portfolioPage, bottomCtaText: e.target.value },
                  }))
                }
                className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Closing CTA Link
              </span>
              <input
                type="text"
                value={portfolioPage.bottomCtaLink}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    portfolioPage: { ...prev.portfolioPage, bottomCtaLink: e.target.value },
                  }))
                }
                className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
              />
            </label>
          </div>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Closing CTA Description
            </span>
            <textarea
              rows={2}
              value={portfolioPage.bottomCtaDescription}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  portfolioPage: { ...prev.portfolioPage, bottomCtaDescription: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>
        </div>

        <div className="flex items-center gap-4 border-t border-[#141414]/10 pt-4">
          <div className="h-16 w-28 bg-[#141414] overflow-hidden shrink-0">
            <EditorialMediaFrame
              asset={getAssetById(portfolioPage.bottomCtaBackdropAssetId)}
              preset="thumbnail"
              showPlaceholderBadge={false}
              className="h-full w-full"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#141414]/60">
              Closing Banner Photograph
            </p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Select Backdrop Photograph</span>
            </button>
          </div>
        </div>
      </div>

      <AssetPickerModal
        open={pickerOpen}
        selectedAssetId={portfolioPage.bottomCtaBackdropAssetId}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          updateState((prev) => ({
            ...prev,
            portfolioPage: { ...prev.portfolioPage, bottomCtaBackdropAssetId: asset.id },
          }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

export function DigitalsPageEditor({
  onOpenManager,
}: {
  onOpenManager?: () => void;
}) {
  const { state, updateState } = useCms();
  const { digitalsPage } = state;

  return (
    <div className="space-y-6">
      <HeroCopyEditor
        pageSlug="digitals"
        pageLabel="DIGITALS PAGE EDITOR"
        previewPath="/digitals"
      />

      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              MODEL BOOK INTRO, QUOTE &amp; CTA
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              DIGITALS PAGE EDITORIAL COPY
            </h3>
          </div>
          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="bg-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
            >
              Open Digitals Manager
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Vertical Tagline
            </span>
            <input
              type="text"
              value={digitalsPage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  digitalsPage: { ...prev.digitalsPage, heroCornerCaption: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Sidebar Kicker &amp; Heading
            </span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={digitalsPage.aboutKicker}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    digitalsPage: { ...prev.digitalsPage, aboutKicker: e.target.value },
                  }))
                }
                placeholder="ABOUT ME"
                className="border border-[#141414]/20 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={digitalsPage.aboutName}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    digitalsPage: { ...prev.digitalsPage, aboutName: e.target.value },
                  }))
                }
                placeholder="ABIBAT"
                className="border border-[#141414]/20 px-3 py-2 text-xs"
              />
            </div>
          </label>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Model Book Introduction
            </span>
            <textarea
              rows={3}
              value={digitalsPage.aboutBio}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  digitalsPage: { ...prev.digitalsPage, aboutBio: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Footer Specs Quote
            </span>
            <input
              type="text"
              value={digitalsPage.quote}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  digitalsPage: { ...prev.digitalsPage, quote: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Book Button Text
              </span>
              <input
                type="text"
                value={digitalsPage.bookCtaText}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    digitalsPage: { ...prev.digitalsPage, bookCtaText: e.target.value },
                  }))
                }
                className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Book Button Link
              </span>
              <input
                type="text"
                value={digitalsPage.bookCtaLink}
                onChange={(e) =>
                  updateState((prev) => ({
                    ...prev,
                    digitalsPage: { ...prev.digitalsPage, bookCtaLink: e.target.value },
                  }))
                }
                className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

const EXP_CATEGORIES: ExperienceCategory[] = [
  'Campaigns',
  'Runway',
  'Editorials',
  'Publications',
  'Collaborations',
];

export function ExperiencePageEditor({
  onOpenManager,
}: {
  onOpenManager?: () => void;
}) {
  const { state, getAssetById, updateState } = useCms();
  const { experiencePage } = state;
  const [pickerTarget, setPickerTarget] = useState<
    { kind: 'bottomCta' } | { kind: 'category'; category: ExperienceCategory } | null
  >(null);

  return (
    <div className="space-y-6">
      <HeroCopyEditor
        pageSlug="experience"
        pageLabel="EXPERIENCE PAGE EDITOR"
        previewPath="/experience"
      />

      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              TIMELINE SECTION &amp; CATEGORY COVERS
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              EXPERIENCE EDITORIAL SETTINGS
            </h3>
          </div>
          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="bg-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
            >
              Open Experience Manager
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Vertical Tagline
            </span>
            <input
              type="text"
              value={experiencePage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, heroCornerCaption: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Timeline Title
            </span>
            <input
              type="text"
              value={experiencePage.timelineTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, timelineTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Timeline Description
            </span>
            <textarea
              rows={2}
              value={experiencePage.timelineDescription}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, timelineDescription: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>
        </div>

        <div className="border-t border-[#141414]/10 pt-5 space-y-4">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#141414]/65">
            5 Category Cards (Image &amp; Short Description)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXP_CATEGORIES.map((cat) => (
              <div key={cat} className="border border-[#141414]/12 p-3.5 space-y-3 bg-[#FAF9F7]">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-11 bg-[#141414] overflow-hidden shrink-0">
                    <EditorialMediaFrame
                      asset={getAssetById(experiencePage.categoryCoverAssetIds?.[cat] || '')}
                      preset="thumbnail"
                      showPlaceholderBadge={false}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em]">{cat}</p>
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ kind: 'category', category: cat })}
                      className="mt-1 border border-[#141414]/25 bg-white px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] hover:border-[#141414]"
                    >
                      Change Cover
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={experiencePage.categoryDescriptions?.[cat] || ''}
                  onChange={(e) =>
                    updateState((prev) => ({
                      ...prev,
                      experiencePage: {
                        ...prev.experiencePage,
                        categoryDescriptions: {
                          ...prev.experiencePage.categoryDescriptions,
                          [cat]: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full border border-[#141414]/20 bg-white px-2.5 py-1.5 text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#141414]/10 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Closing CTA Title
            </span>
            <input
              type="text"
              value={experiencePage.bottomCtaTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, bottomCtaTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>
          <div className="flex items-center gap-3 pt-4 md:pt-0">
            <div className="h-14 w-24 bg-[#141414] overflow-hidden shrink-0">
              <EditorialMediaFrame
                asset={getAssetById(experiencePage.bottomCtaBackdropAssetId)}
                preset="thumbnail"
                showPlaceholderBadge={false}
                className="h-full w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setPickerTarget({ kind: 'bottomCta' })}
              className="border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
            >
              Change Closing Banner Photo
            </button>
          </div>
        </div>
      </div>

      {pickerTarget && (
        <AssetPickerModal
          open={Boolean(pickerTarget)}
          selectedAssetId={
            pickerTarget.kind === 'bottomCta'
              ? experiencePage.bottomCtaBackdropAssetId
              : experiencePage.categoryCoverAssetIds?.[pickerTarget.category]
          }
          onClose={() => setPickerTarget(null)}
          onSelect={(asset) => {
            updateState((prev) => ({
              ...prev,
              experiencePage:
                pickerTarget.kind === 'bottomCta'
                  ? { ...prev.experiencePage, bottomCtaBackdropAssetId: asset.id }
                  : {
                      ...prev.experiencePage,
                      categoryCoverAssetIds: {
                        ...prev.experiencePage.categoryCoverAssetIds,
                        [pickerTarget.category]: asset.id,
                      },
                    },
            }));
            setPickerTarget(null);
          }}
        />
      )}
    </div>
  );
}

export function RepresentationPageEditor({
  onOpenManager,
}: {
  onOpenManager?: () => void;
}) {
  const { state, getAssetById, updateState } = useCms();
  const { representationPage } = state;
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <HeroCopyEditor
        pageSlug="representation"
        pageLabel="REPRESENTATION PAGE EDITOR"
        previewPath="/representation"
      />

      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              AGENCIES SECTION &amp; CLOSING BANNER
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              REPRESENTATION EDITORIAL SETTINGS
            </h3>
          </div>
          {onOpenManager && (
            <button
              type="button"
              onClick={onOpenManager}
              className="bg-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
            >
              Open Representation Manager
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Vertical Tagline
            </span>
            <input
              type="text"
              value={representationPage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  representationPage: {
                    ...prev.representationPage,
                    heroCornerCaption: e.target.value,
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Directory Heading
            </span>
            <input
              type="text"
              value={representationPage.sectionTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  representationPage: { ...prev.representationPage, sectionTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Directory Intro Copy
            </span>
            <textarea
              rows={2}
              value={representationPage.sectionDescription}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  representationPage: {
                    ...prev.representationPage,
                    sectionDescription: e.target.value,
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Closing CTA Title
            </span>
            <input
              type="text"
              value={representationPage.bottomCtaTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  representationPage: {
                    ...prev.representationPage,
                    bottomCtaTitle: e.target.value,
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <div className="flex items-center gap-3 pt-4 md:pt-0">
            <div className="h-14 w-24 bg-[#141414] overflow-hidden shrink-0">
              <EditorialMediaFrame
                asset={getAssetById(representationPage.bottomCtaBackdropAssetId)}
                preset="thumbnail"
                showPlaceholderBadge={false}
                className="h-full w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
            >
              Change Closing Banner Photo
            </button>
          </div>
        </div>
      </div>

      <AssetPickerModal
        open={pickerOpen}
        selectedAssetId={representationPage.bottomCtaBackdropAssetId}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          updateState((prev) => ({
            ...prev,
            representationPage: {
              ...prev.representationPage,
              bottomCtaBackdropAssetId: asset.id,
            },
          }));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

export function ContactPageEditor({
  onOpenInbox,
}: {
  onOpenInbox?: () => void;
}) {
  const { state, getAssetById, updateState } = useCms();
  const { contactPage } = state;
  const [pickerTarget, setPickerTarget] = useState<'sideCardAssetId' | 'locationBackdropAssetId' | null>(
    null
  );

  return (
    <div className="space-y-6">
      <HeroCopyEditor pageSlug="contact" pageLabel="CONTACT PAGE EDITOR" previewPath="/contact" />

      <div className="border border-[#141414]/12 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              BOOKING SIDEBAR &amp; LOCATION PRESENCE
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">CONTACT EDITORIAL SETTINGS</h3>
          </div>
          {onOpenInbox && (
            <button
              type="button"
              onClick={onOpenInbox}
              className="bg-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
            >
              Open Messages / Inquiries ({state.inquiries.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Vertical Tagline
            </span>
            <input
              type="text"
              value={contactPage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  contactPage: { ...prev.contactPage, heroCornerCaption: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Booking Card Title
            </span>
            <input
              type="text"
              value={contactPage.sideCardTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  contactPage: { ...prev.contactPage, sideCardTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Location Headline
            </span>
            <input
              type="text"
              value={contactPage.locationTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  contactPage: { ...prev.contactPage, locationTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Markets List (one per line)
            </span>
            <textarea
              rows={2}
              value={contactPage.availableMarkets.join('\n')}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  contactPage: {
                    ...prev.contactPage,
                    availableMarkets: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Location Description
            </span>
            <textarea
              rows={2}
              value={contactPage.locationDescription}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  contactPage: { ...prev.contactPage, locationDescription: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/20 px-3 py-2 text-xs"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#141414]/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-12 bg-[#141414] overflow-hidden shrink-0">
              <EditorialMediaFrame
                asset={getAssetById(contactPage.sideCardAssetId)}
                preset="thumbnail"
                showPlaceholderBadge={false}
                className="h-full w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setPickerTarget('sideCardAssetId')}
              className="border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
            >
              Change Booking Card Photo
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-16 w-24 bg-[#141414] overflow-hidden shrink-0">
              <EditorialMediaFrame
                asset={getAssetById(contactPage.locationBackdropAssetId)}
                preset="thumbnail"
                showPlaceholderBadge={false}
                className="h-full w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setPickerTarget('locationBackdropAssetId')}
              className="border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
            >
              Change Location Backdrop
            </button>
          </div>
        </div>
      </div>

      {pickerTarget && (
        <AssetPickerModal
          open={Boolean(pickerTarget)}
          selectedAssetId={contactPage[pickerTarget]}
          onClose={() => setPickerTarget(null)}
          onSelect={(asset) => {
            updateState((prev) => ({
              ...prev,
              contactPage: { ...prev.contactPage, [pickerTarget]: asset.id },
            }));
            setPickerTarget(null);
          }}
        />
      )}
    </div>
  );
}
