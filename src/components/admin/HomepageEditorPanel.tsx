import { useState } from 'react';
import { Eye, EyeOff, Image } from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { HomepageSettings, SectionVisibility } from '../../types/cms.ts';

type ImageSlotKey =
  | 'aboutPortraitAssetId'
  | 'aboutInsetAssetId'
  | 'digitalsFeatureAssetId'
  | 'experienceFeatureAssetId'
  | 'representationFeatureAssetId'
  | 'contactBackdropAssetId';

const VISIBILITY_LABELS: Array<{ key: keyof SectionVisibility; label: string }> = [
  { key: 'hero', label: 'Hero Banner & Slideshow' },
  { key: 'selectedWork', label: '01 — Selected Work Bento' },
  { key: 'about', label: '02 — About & Model Stats' },
  { key: 'digitals', label: '03 — Digitals Strip' },
  { key: 'experienceRepresentation', label: '04 & 05 — Experience & Representation' },
  { key: 'contact', label: '06 — Let’s Work Together CTA' },
];

export function HomepageEditorPanel() {
  const { state, getAssetById, updateState } = useCms();
  const { homepage, portfolioProjects } = state;
  const [activeSlotPicker, setActiveSlotPicker] = useState<ImageSlotKey | null>(null);

  const patchHomepage = (patch: Partial<HomepageSettings>) => {
    updateState((prev) => ({
      ...prev,
      homepage: {
        ...prev.homepage,
        ...patch,
      },
    }));
  };

  const toggleSection = (key: keyof SectionVisibility) => {
    patchHomepage({
      sectionVisibility: {
        ...homepage.sectionVisibility,
        [key]: !homepage.sectionVisibility[key],
      },
    });
  };

  const toggleFeaturedProject = (projectId: string) => {
    const exists = homepage.featuredProjectIds.includes(projectId);
    const next = exists
      ? homepage.featuredProjectIds.filter((id) => id !== projectId)
      : [...homepage.featuredProjectIds, projectId].slice(0, 5);
    patchHomepage({ featuredProjectIds: next });
  };

  const imageSlots: Array<{ key: ImageSlotKey; label: string }> = [
    { key: 'aboutPortraitAssetId', label: 'About Section Portrait' },
    { key: 'aboutInsetAssetId', label: 'Model Stats Inset' },
    { key: 'digitalsFeatureAssetId', label: 'Digitals Monochrome Feature' },
    { key: 'experienceFeatureAssetId', label: 'Experience Portrait' },
    { key: 'representationFeatureAssetId', label: 'Representation Portrait' },
    { key: 'contactBackdropAssetId', label: 'Contact Section Backdrop' },
  ];

  return (
    <div className="space-y-8">
      {/* Section Visibility Toggles */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-4">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            REAL-TIME LAYOUT CONTROL
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">SECTION VISIBILITY</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VISIBILITY_LABELS.map(({ key, label }) => {
            const visible = homepage.sectionVisibility[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSection(key)}
                className={`flex items-center justify-between border px-4 py-3 text-left text-xs transition-colors ${
                  visible
                    ? 'border-[#141414] bg-[#F3F1ED] text-[#141414]'
                    : 'border-[#141414]/15 bg-white text-[#141414]/45'
                }`}
              >
                <span className="font-medium">{label}</span>
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Work Featured Projects */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-4">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            SECTION 01 — CURATED BENTO (SELECT 3–5 PROJECTS)
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">FEATURED PORTFOLIO PROJECTS</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {portfolioProjects.map((project) => {
            const selected = homepage.featuredProjectIds.includes(project.id);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => toggleFeaturedProject(project.id)}
                className={`border p-3 text-left transition-colors ${
                  selected
                    ? 'border-[#141414] bg-[#F3F1ED]'
                    : 'border-[#141414]/15 bg-white opacity-70 hover:opacity-100'
                }`}
              >
                <p className="text-xs font-medium uppercase">{project.title}</p>
                <p className="mt-1 text-[10px] text-[#141414]/60">
                  {project.category} · {project.location}
                </p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.2em]">
                  {selected ? 'Featured on Home' : 'Click to Feature'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Homepage Copy & CTAs */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-6">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            EDITORIAL COPY &amp; CTAS
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">HOMEPAGE TEXT &amp; STATS</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Brand Wordmark
            </span>
            <input
              type="text"
              value={homepage.wordmark}
              onChange={(e) => patchHomepage({ wordmark: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Hero Right Corner Caption
            </span>
            <input
              type="text"
              value={homepage.heroSideCaption}
              onChange={(e) => patchHomepage({ heroSideCaption: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Selected Work Title
            </span>
            <input
              type="text"
              value={homepage.selectedWorkTitle}
              onChange={(e) => patchHomepage({ selectedWorkTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Selected Work CTA Text
            </span>
            <input
              type="text"
              value={homepage.selectedWorkCtaText}
              onChange={(e) => patchHomepage({ selectedWorkCtaText: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Selected Work Description
            </span>
            <textarea
              rows={2}
              value={homepage.selectedWorkDescription}
              onChange={(e) => patchHomepage({ selectedWorkDescription: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              About Section Title
            </span>
            <input
              type="text"
              value={homepage.aboutTitle}
              onChange={(e) => patchHomepage({ aboutTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              About CTA Text
            </span>
            <input
              type="text"
              value={homepage.aboutCtaText}
              onChange={(e) => patchHomepage({ aboutCtaText: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              About Quote
            </span>
            <textarea
              rows={2}
              value={homepage.aboutQuote}
              onChange={(e) => patchHomepage({ aboutQuote: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Height Stat
            </span>
            <input
              type="text"
              value={homepage.modelStats.height}
              onChange={(e) =>
                patchHomepage({
                  modelStats: { ...homepage.modelStats, height: e.target.value },
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Locations Stat
            </span>
            <input
              type="text"
              value={homepage.modelStats.locations}
              onChange={(e) =>
                patchHomepage({
                  modelStats: { ...homepage.modelStats, locations: e.target.value },
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Agency Representation Note
            </span>
            <input
              type="text"
              value={homepage.modelStats.agencyNote}
              onChange={(e) =>
                patchHomepage({
                  modelStats: { ...homepage.modelStats, agencyNote: e.target.value },
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Specialties
            </span>
            <input
              type="text"
              value={homepage.modelStats.specialties}
              onChange={(e) =>
                patchHomepage({
                  modelStats: { ...homepage.modelStats, specialties: e.target.value },
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Contact Section Title
            </span>
            <input
              type="text"
              value={homepage.contactTitle}
              onChange={(e) => patchHomepage({ contactTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Contact CTA Text &amp; Route
            </span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={homepage.contactCtaText}
                onChange={(e) => patchHomepage({ contactCtaText: e.target.value })}
                className="border border-[#141414]/25 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={homepage.contactCtaLink}
                onChange={(e) => patchHomepage({ contactCtaLink: e.target.value })}
                className="border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </div>
          </label>
        </div>
      </div>

      {/* Homepage Media Library Slot Assignments */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            CLOUDINARY MEDIA ASSIGNMENTS
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">HOMEPAGE FEATURED PLATES</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {imageSlots.map(({ key, label }) => {
            const asset = getAssetById(homepage[key]);
            return (
              <div key={key} className="border border-[#141414]/15 bg-[#F3F1ED]/40 p-3.5 space-y-3">
                <div className="aspect-[4/3] bg-[#141414] overflow-hidden">
                  <EditorialMediaFrame
                    asset={asset}
                    preset="portfolio-card"
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="truncate text-[10px] text-[#141414]/55">
                    {asset?.assetName || 'Unassigned'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlotPicker(key)}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#141414]/30 bg-white py-2 text-[10px] font-medium tracking-[0.2em] uppercase hover:border-[#141414]"
                >
                  <Image className="h-3.5 w-3.5" />
                  <span>Select from Library</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <AssetPickerModal
        open={Boolean(activeSlotPicker)}
        selectedAssetId={activeSlotPicker ? homepage[activeSlotPicker] : undefined}
        onClose={() => setActiveSlotPicker(null)}
        onSelect={(asset) => {
          if (activeSlotPicker) {
            patchHomepage({ [activeSlotPicker]: asset.id });
          }
        }}
      />
    </div>
  );
}
