import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CloudUpload,
  Eye,
  EyeOff,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { HeroSlide, PageHero, PageSlug } from '../../types/cms.ts';

const PAGE_SLUGS: Array<{ slug: PageSlug; label: string }> = [
  { slug: 'home', label: 'Home (/)' },
  { slug: 'portfolio', label: 'Portfolio (/portfolio)' },
  { slug: 'digitals', label: 'Digitals (/digitals)' },
  { slug: 'about', label: 'About (/about)' },
  { slug: 'experience', label: 'Experience (/experience)' },
  { slug: 'representation', label: 'Representation (/representation)' },
  { slug: 'contact', label: 'Contact (/contact)' },
];

export function HeroSlideshowPanel() {
  const { state, getAssetById, updateState, adminToken, configStatus } = useCms();
  const [activeSlug, setActiveSlug] = useState<PageSlug>('home');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hero = state.pageHeroes[activeSlug];

  const updateHeroField = (patch: Partial<PageHero>) => {
    updateState((prev) => ({
      ...prev,
      pageHeroes: {
        ...prev.pageHeroes,
        [activeSlug]: {
          ...prev.pageHeroes[activeSlug],
          ...patch,
        },
      },
    }));
  };

  const updateSlide = (slideId: string, patch: Partial<HeroSlide>) => {
    updateHeroField({
      slides: hero.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
    });
  };

  const updateAssetAltText = (assetId: string, altText: string) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, altText } : a)),
    }));
  };

  const moveSlide = (index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= hero.slides.length) return;
    const copy = [...hero.slides];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, moved);
    updateHeroField({
      slides: copy.map((s, idx) => ({ ...s, sortOrder: idx })),
    });
  };

  const removeSlide = (slideId: string) => {
    updateHeroField({
      slides: hero.slides
        .filter((s) => s.id !== slideId)
        .map((s, idx) => ({ ...s, sortOrder: idx })),
    });
  };

  const handleDirectUploadSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const asset = await uploadFileToCloudinary(
        file,
        {
          assetName: `${activeSlug.toUpperCase()} Hero — ${file.name.replace(/\.[^.]+$/, '')}`,
          altText: `${activeSlug} hero slide photograph`,
          folder: 'abibat/heroes',
          tags: ['hero', activeSlug],
        },
        adminToken
      );

      const newSlide: HeroSlide = {
        id: `slide-${crypto.randomUUID().slice(0, 8)}`,
        assetId: asset.id,
        title: '',
        caption: asset.assetName,
        locationTag: '',
        ctaText: '',
        ctaLink: '',
        isActive: true,
        sortOrder: hero.slides.length,
      };

      await updateState((prev) => ({
        ...prev,
        mediaAssets: [asset, ...prev.mediaAssets],
        pageHeroes: {
          ...prev.pageHeroes,
          [activeSlug]: {
            ...prev.pageHeroes[activeSlug],
            slides: [...prev.pageHeroes[activeSlug].slides, newSlide],
          },
        },
      }));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#141414]/15 pb-4">
        {PAGE_SLUGS.map(({ slug, label }) => {
          const active = slug === activeSlug;
          const count = state.pageHeroes[slug].slides.length;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveSlug(slug)}
              className={`px-3.5 py-2 text-[10px] font-medium tracking-[0.2em] uppercase whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-[#141414] text-[#F3F1ED]'
                  : 'bg-white border border-[#141414]/15 text-[#141414]/70 hover:text-[#141414]'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Hero Text & Default CTA Editor */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            INDEPENDENT HERO SETTINGS
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            {activeSlug.toUpperCase()} HERO HEADLINE &amp; DEFAULT CTA
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              Kicker
            </span>
            <input
              type="text"
              value={hero.kicker}
              onChange={(e) => updateHeroField({ kicker: e.target.value })}
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              Headline
            </span>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => updateHeroField({ title: e.target.value })}
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              Subtitle / Markets Line
            </span>
            <input
              type="text"
              value={hero.subtitle}
              onChange={(e) => updateHeroField({ subtitle: e.target.value })}
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              CTA Text
            </span>
            <input
              type="text"
              value={hero.ctaText}
              onChange={(e) => updateHeroField({ ctaText: e.target.value })}
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              CTA Destination Route
            </span>
            <input
              type="text"
              value={hero.ctaLink}
              onChange={(e) => updateHeroField({ ctaLink: e.target.value })}
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>
      </div>

      {/* Slides List */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#141414]/10 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-light uppercase">
              SLIDESHOW FRAMES ({hero.slides.length})
            </h3>
            <p className="text-xs text-[#141414]/60">
              Select slides from the Cloudinary Media Library or upload directly. Reorder, edit alt
              text, set optional per-slide copy, or activate/deactivate slides.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 border border-[#141414]/30 px-4 py-2.5 text-[10px] font-medium tracking-[0.2em] uppercase hover:border-[#141414] ${
                !configStatus.cloudinaryConfigured ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <CloudUpload className="h-3.5 w-3.5" />
              <span>{uploading ? 'UPLOADING...' : 'UPLOAD TO CLOUDINARY'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDirectUploadSlide}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setEditingSlideId(null);
                setPickerOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a]"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              <span>ADD FROM LIBRARY</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="border border-red-800/30 bg-red-50 px-4 py-3 text-xs text-red-900">
            {uploadError}
          </div>
        )}

        <div className="space-y-4">
          {hero.slides.map((slide, idx) => {
            const asset = getAssetById(slide.assetId);
            const active = slide.isActive !== false;
            return (
              <div
                key={slide.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 border p-4 items-start ${
                  active
                    ? 'border-[#141414]/15 bg-[#F3F1ED]/35'
                    : 'border-amber-800/30 bg-amber-50/35 opacity-80'
                }`}
              >
                <div className="md:col-span-3 space-y-2">
                  <div className="aspect-[16/10] bg-[#141414] overflow-hidden">
                    <EditorialMediaFrame
                      asset={asset}
                      preset="portfolio-card"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlideId(slide.id);
                        setPickerOpen(true);
                      }}
                      className="flex-1 border border-[#141414]/30 bg-white px-2.5 py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                    >
                      Swap Image
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSlide(slide.id, { isActive: !active })}
                      className={`inline-flex items-center gap-1 border px-2.5 py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase ${
                        active
                          ? 'border-emerald-800/35 bg-emerald-50 text-emerald-900'
                          : 'border-amber-800/35 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Optional Slide Title Override
                    </span>
                    <input
                      type="text"
                      value={slide.title || ''}
                      onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                      placeholder="Leave blank to use default page headline"
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Location / Tag
                    </span>
                    <input
                      type="text"
                      value={slide.locationTag}
                      onChange={(e) => updateSlide(slide.id, { locationTag: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Optional Slide Caption
                    </span>
                    <input
                      type="text"
                      value={slide.caption}
                      onChange={(e) => updateSlide(slide.id, { caption: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Image Alt Text
                    </span>
                    <input
                      type="text"
                      value={asset?.altText || ''}
                      onChange={(e) => asset && updateAssetAltText(asset.id, e.target.value)}
                      placeholder="Accessibility alt text"
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Optional CTA Text
                    </span>
                    <input
                      type="text"
                      value={slide.ctaText || ''}
                      onChange={(e) => updateSlide(slide.id, { ctaText: e.target.value })}
                      placeholder="Uses page hero CTA when empty"
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/60">
                      Optional CTA Destination
                    </span>
                    <input
                      type="text"
                      value={slide.ctaLink || ''}
                      onChange={(e) => updateSlide(slide.id, { ctaLink: e.target.value })}
                      placeholder="/portfolio"
                      className="mt-1 w-full border border-[#141414]/20 bg-white px-3 py-1.5 text-xs"
                    />
                  </label>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move slide up"
                    className="flex h-8 w-8 items-center justify-center border border-[#141414]/20 bg-white disabled:opacity-35"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(idx, 1)}
                    disabled={idx === hero.slides.length - 1}
                    aria-label="Move slide down"
                    className="flex h-8 w-8 items-center justify-center border border-[#141414]/20 bg-white disabled:opacity-35"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    aria-label="Remove slide"
                    className="flex h-8 w-8 items-center justify-center border border-red-800/30 bg-white text-red-700 hover:bg-red-50"
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
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => {
          if (editingSlideId) {
            updateSlide(editingSlideId, { assetId: asset.id });
          } else {
            const newSlide: HeroSlide = {
              id: `slide-${crypto.randomUUID().slice(0, 8)}`,
              assetId: asset.id,
              title: '',
              caption: asset.assetName,
              locationTag: '',
              ctaText: '',
              ctaLink: '',
              isActive: true,
              sortOrder: hero.slides.length,
            };
            updateHeroField({ slides: [...hero.slides, newSlide] });
          }
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
