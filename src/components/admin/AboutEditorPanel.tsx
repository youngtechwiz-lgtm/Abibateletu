import { useState } from 'react';
import { ArrowDown, ArrowLeftRight, ArrowUp, Image, ImagePlus, Trash2 } from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { AboutPageContent, HeroSlide, MediaAsset } from '../../types/cms.ts';

type AboutImageSlotKey =
  | 'storyPortraitAssetId'
  | 'drivesBackdropAssetId'
  | 'bigPictureLeftAssetId'
  | 'bigPictureTopRightAssetId'
  | 'bigPictureBottomRightAssetId';

export function AboutEditorPanel() {
  const { state, getAssetById, updateState } = useCms();
  const { aboutPage, pageHeroes } = state;
  const aboutHero = pageHeroes.about;

  const [slotPicker, setSlotPicker] = useState<AboutImageSlotKey | null>(null);
  const [slidePickerOpen, setSlidePickerOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  const patchAbout = (patch: Partial<AboutPageContent>) => {
    updateState((prev) => ({
      ...prev,
      aboutPage: {
        ...prev.aboutPage,
        ...patch,
      },
    }));
  };

  const patchAssetMetadata = (assetId: string, patch: Partial<MediaAsset>) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)),
    }));
  };

  const updateAboutSlide = (slideId: string, patch: Partial<HeroSlide>) => {
    updateState((prev) => ({
      ...prev,
      pageHeroes: {
        ...prev.pageHeroes,
        about: {
          ...prev.pageHeroes.about,
          slides: prev.pageHeroes.about.slides.map((s) =>
            s.id === slideId ? { ...s, ...patch } : s
          ),
        },
      },
    }));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= aboutHero.slides.length) return;
    const copy = [...aboutHero.slides];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, moved);
    updateState((prev) => ({
      ...prev,
      pageHeroes: {
        ...prev.pageHeroes,
        about: {
          ...prev.pageHeroes.about,
          slides: copy.map((s, idx) => ({ ...s, sortOrder: idx })),
        },
      },
    }));
  };

  const removeSlide = (slideId: string) => {
    updateState((prev) => ({
      ...prev,
      pageHeroes: {
        ...prev.pageHeroes,
        about: {
          ...prev.pageHeroes.about,
          slides: prev.pageHeroes.about.slides
            .filter((s) => s.id !== slideId)
            .map((s, idx) => ({ ...s, sortOrder: idx })),
        },
      },
    }));
  };

  const imageSlots: Array<{ key: AboutImageSlotKey; label: string }> = [
    { key: 'storyPortraitAssetId', label: 'My Story Portrait' },
    { key: 'drivesBackdropAssetId', label: 'Passion · Discipline · Growth Backdrop' },
    { key: 'bigPictureLeftAssetId', label: 'Big Picture — Vertical Feature Portrait' },
    { key: 'bigPictureTopRightAssetId', label: 'Big Picture — B&W Profile Portrait' },
    { key: 'bigPictureBottomRightAssetId', label: 'Big Picture — Wide Landscape Portrait' },
  ];

  return (
    <div className="space-y-8">
      {/* Biography Text & Section Copy */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-6">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            ABOUT PAGE BIOGRAPHY
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            HERO, STORY, VALUES &amp; SECTIONS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Hero Headline
            </span>
            <input
              type="text"
              value={aboutHero.title}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  pageHeroes: {
                    ...prev.pageHeroes,
                    about: { ...prev.pageHeroes.about, title: e.target.value },
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Hero Subtitle
            </span>
            <input
              type="text"
              value={aboutHero.subtitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  pageHeroes: {
                    ...prev.pageHeroes,
                    about: { ...prev.pageHeroes.about, subtitle: e.target.value },
                  },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              My Story Heading
            </span>
            <input
              type="text"
              value={aboutPage.storyTitle}
              onChange={(e) => patchAbout({ storyTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Quick Facts Pull-Quote
            </span>
            <input
              type="text"
              value={aboutPage.quickFactsQuote}
              onChange={(e) => patchAbout({ quickFactsQuote: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              My Story Biography (One paragraph per line)
            </span>
            <textarea
              rows={4}
              value={aboutPage.storyParagraphs.join('\n\n')}
              onChange={(e) =>
                patchAbout({
                  storyParagraphs: e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              What Drives Me Heading
            </span>
            <input
              type="text"
              value={aboutPage.drivesTitle}
              onChange={(e) => patchAbout({ drivesTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              The Big Picture Heading
            </span>
            <input
              type="text"
              value={aboutPage.bigPictureTitle}
              onChange={(e) => patchAbout({ bigPictureTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              What Drives Me Copy (Separate paragraphs with blank line)
            </span>
            <textarea
              rows={3}
              value={aboutPage.drivesParagraphs.join('\n\n')}
              onChange={(e) =>
                patchAbout({
                  drivesParagraphs: e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              More Than a Model Copy (Separate paragraphs with blank line)
            </span>
            <textarea
              rows={3}
              value={aboutPage.bigPictureParagraphs.join('\n\n')}
              onChange={(e) =>
                patchAbout({
                  bigPictureParagraphs: e.target.value
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean),
                })
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              Handwritten Script Note
            </span>
            <input
              type="text"
              value={aboutPage.bigPictureHandwrittenNote}
              onChange={(e) => patchAbout({ bigPictureHandwrittenNote: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#141414]/70">
              CTA Text
            </span>
            <input
              type="text"
              value={aboutPage.bigPictureCtaText}
              onChange={(e) => patchAbout({ bigPictureCtaText: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>
      </div>

      {/* Image Position Controls */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-4">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            PORTRAIT POSITIONING
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            CHANGE IMAGE POSITIONS
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() =>
              patchAbout({
                storyLayoutOrder:
                  aboutPage.storyLayoutOrder === 'text-portrait-facts'
                    ? 'portrait-text-facts'
                    : 'text-portrait-facts',
              })
            }
            className="flex items-center justify-between border border-[#141414]/25 px-4 py-3 text-left text-xs hover:border-[#141414]"
          >
            <div>
              <p className="font-medium uppercase tracking-[0.12em]">My Story Portrait Position</p>
              <p className="text-[11px] text-[#141414]/65">
                Current:{' '}
                {aboutPage.storyLayoutOrder === 'text-portrait-facts'
                  ? 'Text Left · Portrait Center'
                  : 'Portrait Left · Text Center'}
              </p>
            </div>
            <ArrowLeftRight className="h-4 w-4 text-[#141414]/60" />
          </button>

          <button
            type="button"
            onClick={() =>
              patchAbout({
                bigPictureLayoutOrder:
                  aboutPage.bigPictureLayoutOrder === 'portrait-text-collage'
                    ? 'collage-text-portrait'
                    : 'portrait-text-collage',
              })
            }
            className="flex items-center justify-between border border-[#141414]/25 px-4 py-3 text-left text-xs hover:border-[#141414]"
          >
            <div>
              <p className="font-medium uppercase tracking-[0.12em]">
                Big Picture Collage Position
              </p>
              <p className="text-[11px] text-[#141414]/65">
                Current:{' '}
                {aboutPage.bigPictureLayoutOrder === 'portrait-text-collage'
                  ? 'Portrait Left · Collage Right'
                  : 'Collage Left · Portrait Right'}
              </p>
            </div>
            <ArrowLeftRight className="h-4 w-4 text-[#141414]/60" />
          </button>
        </div>
      </div>

      {/* Portrait Media Slots + Inline Alt Text & Description Editing */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            CLOUDINARY PORTRAITS &amp; METADATA
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            PORTRAITS, DESCRIPTIONS &amp; ALT TEXT
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {imageSlots.map(({ key, label }) => {
            const asset = getAssetById(aboutPage[key]);
            return (
              <div key={key} className="border border-[#141414]/15 bg-[#F3F1ED]/40 p-4 space-y-3">
                <div className="aspect-[4/3] bg-[#141414] overflow-hidden">
                  <EditorialMediaFrame
                    asset={asset}
                    preset="portfolio-card"
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.1em]">{label}</p>

                {asset && (
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                        Description / Asset Name
                      </span>
                      <input
                        type="text"
                        value={asset.assetName}
                        onChange={(e) =>
                          patchAssetMetadata(asset.id, { assetName: e.target.value })
                        }
                        className="mt-1 w-full border border-[#141414]/20 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                        Alt Text
                      </span>
                      <input
                        type="text"
                        value={asset.altText}
                        onChange={(e) =>
                          patchAssetMetadata(asset.id, { altText: e.target.value })
                        }
                        className="mt-1 w-full border border-[#141414]/20 bg-white px-2.5 py-1.5 text-xs"
                      />
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSlotPicker(key)}
                  className="inline-flex w-full items-center justify-center gap-2 border border-[#141414]/30 bg-white py-2 text-[10px] font-medium tracking-[0.2em] uppercase hover:border-[#141414]"
                >
                  <Image className="h-3.5 w-3.5" />
                  <span>Select from Media Library</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* About Hero Slideshow Manager */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/10 pb-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              ABOUT HERO SLIDESHOW
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              SLIDESHOW PHOTOGRAPHS ({aboutHero.slides.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingSlideId(null);
              setSlidePickerOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a]"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>ADD SLIDE FROM LIBRARY</span>
          </button>
        </div>

        <div className="space-y-3">
          {aboutHero.slides.map((slide, idx) => {
            const asset = getAssetById(slide.assetId);
            return (
              <div
                key={slide.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-[#141414]/15 p-3.5 bg-[#F3F1ED]/35 items-center"
              >
                <div className="md:col-span-3 aspect-[16/10] bg-[#141414] overflow-hidden">
                  <EditorialMediaFrame
                    asset={asset}
                    preset="portfolio-card"
                    className="h-full w-full"
                  />
                </div>
                <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={slide.caption}
                    onChange={(e) => updateAboutSlide(slide.id, { caption: e.target.value })}
                    placeholder="Slide caption"
                    className="border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlideId(slide.id);
                      setSlidePickerOpen(true);
                    }}
                    className="border border-[#141414]/30 bg-white px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
                  >
                    Swap Photo
                  </button>
                </div>
                <div className="md:col-span-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, -1)}
                    disabled={idx === 0}
                    className="flex h-8 w-8 items-center justify-center border border-[#141414]/20 bg-white disabled:opacity-35"
                    aria-label="Move slide up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 1)}
                    disabled={idx === aboutHero.slides.length - 1}
                    className="flex h-8 w-8 items-center justify-center border border-[#141414]/20 bg-white disabled:opacity-35"
                    aria-label="Move slide down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    className="flex h-8 w-8 items-center justify-center border border-red-800/30 bg-white text-red-700"
                    aria-label="Remove slide"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AssetPickerModal
        open={Boolean(slotPicker)}
        selectedAssetId={slotPicker ? aboutPage[slotPicker] : undefined}
        onClose={() => setSlotPicker(null)}
        onSelect={(asset) => {
          if (slotPicker) {
            patchAbout({ [slotPicker]: asset.id });
          }
        }}
      />

      <AssetPickerModal
        open={slidePickerOpen}
        onClose={() => setSlidePickerOpen(false)}
        onSelect={(asset) => {
          if (editingSlideId) {
            updateAboutSlide(editingSlideId, { assetId: asset.id });
          } else {
            const newSlide: HeroSlide = {
              id: `slide-${crypto.randomUUID().slice(0, 8)}`,
              assetId: asset.id,
              caption: asset.assetName,
              locationTag: '',
              sortOrder: aboutHero.slides.length,
            };
            updateState((prev) => ({
              ...prev,
              pageHeroes: {
                ...prev.pageHeroes,
                about: {
                  ...prev.pageHeroes.about,
                  slides: [...prev.pageHeroes.about.slides, newSlide],
                },
              },
            }));
          }
        }}
      />
    </div>
  );
}
