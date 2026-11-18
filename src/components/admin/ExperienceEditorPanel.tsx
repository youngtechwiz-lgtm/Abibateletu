import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CloudUpload,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { ExperienceCategory, ExperienceEntry, MediaAsset } from '../../types/cms.ts';

const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  'Campaigns',
  'Runway',
  'Editorials',
  'Publications',
  'Collaborations',
];

export function ExperienceEditorPanel() {
  const { state, getAssetById, updateState, adminToken, configStatus } = useCms();
  const [pickerState, setPickerState] = useState<
    | { kind: 'entry-cover'; entryId: string }
    | { kind: 'entry-gallery-add'; entryId: string }
    | { kind: 'category-cover'; category: ExperienceCategory }
    | { kind: 'bottom-backdrop' }
    | null
  >(null);
  const [uploadingEntryId, setUploadingEntryId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sortedEntries = [...state.experienceEntries].sort((a, b) => a.sortOrder - b.sortOrder);

  const addEntry = () => {
    const newEntry: ExperienceEntry = {
      id: `exp-${crypto.randomUUID().slice(0, 8)}`,
      year: '2026',
      season: state.portfolioSeasons[0] || 'Spring / Summer',
      category: 'Campaigns',
      title: 'NEW EXPERIENCE CREDIT',
      clientOrPublication: '',
      location: 'Paris, France',
      notes: '',
      description: '',
      coverAssetId: state.mediaAssets[0]?.id || '',
      galleryAssetIds: state.mediaAssets[0]?.id ? [state.mediaAssets[0].id] : [],
      externalLink: '',
      featured: false,
      featuredOnHome: true,
      isPublished: true,
      sortOrder: 0,
      isPlaceholder: false,
    };
    updateState((prev) => ({
      ...prev,
      experienceEntries: [newEntry, ...prev.experienceEntries].map((item, idx) => ({
        ...item,
        sortOrder: idx,
      })),
    }));
  };

  const patchEntry = (id: string, patch: Partial<ExperienceEntry>) => {
    updateState((prev) => ({
      ...prev,
      experienceEntries: prev.experienceEntries.map((e) =>
        e.id === id ? { ...e, ...patch, isPlaceholder: false } : e
      ),
    }));
  };

  const removeEntry = (id: string) => {
    updateState((prev) => ({
      ...prev,
      experienceEntries: prev.experienceEntries
        .filter((e) => e.id !== id)
        .map((item, idx) => ({ ...item, sortOrder: idx })),
    }));
  };

  const moveEntry = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sortedEntries.length) return;
    const reordered = [...sortedEntries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    updateState((prev) => ({
      ...prev,
      experienceEntries: reordered.map((item, idx) => ({ ...item, sortOrder: idx })),
    }));
  };

  const moveGalleryAsset = (entry: ExperienceEntry, index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    const gallery = [...(entry.galleryAssetIds || [])];
    if (nextIdx < 0 || nextIdx >= gallery.length) return;
    const [moved] = gallery.splice(index, 1);
    gallery.splice(nextIdx, 0, moved);
    patchEntry(entry.id, { galleryAssetIds: gallery });
  };

  const removeGalleryAsset = (entry: ExperienceEntry, assetId: string) => {
    const nextGallery = (entry.galleryAssetIds || []).filter((id) => id !== assetId);
    const nextCover =
      entry.coverAssetId === assetId ? nextGallery[0] || '' : entry.coverAssetId;
    patchEntry(entry.id, {
      galleryAssetIds: nextGallery,
      coverAssetId: nextCover,
    });
  };

  const patchAssetAlt = (assetId: string, altText: string) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, altText } : a)),
    }));
  };

  const handleMultiUpload = async (entry: ExperienceEntry, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingEntryId(entry.id);
    setUploadError(null);
    try {
      const uploaded: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const asset = await uploadFileToCloudinary(
          file,
          {
            assetName: `${entry.title} — ${file.name.replace(/\.[^.]+$/, '')}`,
            altText: `${entry.title} ${entry.category} photograph`,
            folder: 'abibat/experience',
            tags: ['experience', entry.category.toLowerCase(), entry.year].filter(Boolean),
          },
          adminToken
        );
        uploaded.push(asset);
      }
      const newIds = uploaded.map((a) => a.id);
      await updateState((prev) => ({
        ...prev,
        mediaAssets: [...uploaded, ...prev.mediaAssets],
        experienceEntries: prev.experienceEntries.map((item) => {
          if (item.id !== entry.id) return item;
          const mergedGallery = Array.from(
            new Set([...(item.galleryAssetIds || []), ...newIds])
          );
          return {
            ...item,
            coverAssetId: item.coverAssetId || newIds[0] || '',
            galleryAssetIds: mergedGallery,
            isPlaceholder: false,
          };
        }),
      }));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploadingEntryId(null);
    }
  };

  const handleCategoryUpload = async (
    category: ExperienceCategory,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEntryId(`cat-${category}`);
    setUploadError(null);
    try {
      const asset = await uploadFileToCloudinary(
        file,
        {
          assetName: `Experience Category — ${category}`,
          altText: `${category} career archive category cover`,
          folder: 'abibat/experience',
          tags: ['experience', 'category', category.toLowerCase()],
        },
        adminToken
      );
      await updateState((prev) => ({
        ...prev,
        mediaAssets: [asset, ...prev.mediaAssets],
        experiencePage: {
          ...prev.experiencePage,
          categoryCoverAssetIds: {
            ...prev.experiencePage.categoryCoverAssetIds,
            [category]: asset.id,
          },
        },
      }));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploadingEntryId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#141414]/15 bg-white p-6">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            CAREER IN MOTION · CLOUDINARY ARCHIVE
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            EXPERIENCE ARCHIVE ({sortedEntries.length})
          </h3>
          <p className="mt-1 text-xs text-[#141414]/65">
            Manage published/unpublished entries, featured showcases, display order, and reusable
            Media Library galleries.
          </p>
        </div>

        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center gap-2 bg-[#141414] px-5 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a] shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>ADD EXPERIENCE</span>
        </button>
      </div>

      {uploadError && (
        <div className="border border-red-800/30 bg-red-50 px-4 py-3 text-xs text-red-900">
          {uploadError}
        </div>
      )}

      {/* Experience Page Visual Settings */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            EXPERIENCE PAGE SETTINGS
          </p>
          <h4 className="font-serif text-xl font-light uppercase">
            CATEGORY CARDS &amp; EDITORIAL COPY
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Caption
            </span>
            <input
              type="text"
              value={state.experiencePage.heroCornerCaption}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, heroCornerCaption: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Timeline Title
            </span>
            <input
              type="text"
              value={state.experiencePage.timelineTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, timelineTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Title
            </span>
            <input
              type="text"
              value={state.experiencePage.bottomCtaTitle}
              onChange={(e) =>
                updateState((prev) => ({
                  ...prev,
                  experiencePage: { ...prev.experiencePage, bottomCtaTitle: e.target.value },
                }))
              }
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {EXPERIENCE_CATEGORIES.map((cat) => {
            const coverId = state.experiencePage.categoryCoverAssetIds?.[cat];
            const asset = coverId ? getAssetById(coverId) : undefined;
            return (
              <div key={cat} className="border border-[#141414]/12 bg-[#F8F7F4] p-3 space-y-2">
                <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]">
                  {cat}
                </p>
                <div className="aspect-[3/4] overflow-hidden bg-[#141414]">
                  <EditorialMediaFrame
                    asset={asset}
                    preset="thumbnail"
                    className="h-full w-full"
                    showPlaceholderBadge={false}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerState({ kind: 'category-cover', category: cat })}
                    className="flex-1 border border-[#141414]/25 bg-white px-2 py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                  >
                    Library
                  </button>
                  <label className="flex-1 cursor-pointer border border-[#141414]/25 bg-white px-2 py-1.5 text-center text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]">
                    {uploadingEntryId === `cat-${cat}` ? '...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!configStatus.cloudinaryConfigured}
                      onChange={(e) => handleCategoryUpload(cat, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-[#141414]/10">
          <div className="h-14 w-24 bg-[#141414] overflow-hidden shrink-0">
            <EditorialMediaFrame
              asset={getAssetById(state.experiencePage.bottomCtaBackdropAssetId)}
              preset="thumbnail"
              className="h-full w-full"
              showPlaceholderBadge={false}
            />
          </div>
          <button
            type="button"
            onClick={() => setPickerState({ kind: 'bottom-backdrop' })}
            className="border border-[#141414]/30 px-3 py-2 text-[10px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
          >
            Select Bottom Portfolio Banner Image
          </button>
        </div>
      </div>

      {/* Experience Entries List */}
      <div className="space-y-5">
        {sortedEntries.map((entry, idx) => {
          const coverAsset = entry.coverAssetId ? getAssetById(entry.coverAssetId) : undefined;
          const galleryIds = entry.galleryAssetIds || [];

          return (
            <div
              key={entry.id}
              className={`border bg-white p-6 space-y-5 ${
                entry.isPublished === false ? 'border-amber-700/35 opacity-85' : 'border-[#141414]/15'
              }`}
            >
              {/* Entry Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#141414]/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-[11px] text-[#141414]/55">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <h4 className="font-serif text-xl font-light uppercase text-[#141414]">
                    {entry.title || 'Untitled Experience'}
                  </h4>
                  {entry.isPublished === false && (
                    <span className="border border-amber-700/40 bg-amber-50 px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase text-amber-900">
                      Unpublished Draft
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveEntry(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move entry up"
                    className="border border-[#141414]/25 p-1.5 text-[#141414]/75 hover:border-[#141414] disabled:opacity-35"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEntry(idx, 1)}
                    disabled={idx === sortedEntries.length - 1}
                    aria-label="Move entry down"
                    className="border border-[#141414]/25 p-1.5 text-[#141414]/75 hover:border-[#141414] disabled:opacity-35"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => patchEntry(entry.id, { featured: !entry.featured })}
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase ${
                      entry.featured
                        ? 'border-[#141414] bg-[#141414] text-white'
                        : 'border-[#141414]/25 text-[#141414]/75 hover:border-[#141414]'
                    }`}
                  >
                    <Star className="h-3 w-3" />
                    <span>{entry.featured ? 'Featured' : 'Feature'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      patchEntry(entry.id, { isPublished: !(entry.isPublished !== false) })
                    }
                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase ${
                      entry.isPublished !== false
                        ? 'border-emerald-800/35 bg-emerald-50 text-emerald-900'
                        : 'border-amber-800/35 bg-amber-50 text-amber-900'
                    }`}
                  >
                    {entry.isPublished !== false ? (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Unpublished</span>
                      </>
                    )}
                  </button>

                  <label className="inline-flex items-center gap-1.5 border border-[#141414]/20 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[#141414]/80">
                    <input
                      type="checkbox"
                      checked={entry.featuredOnHome}
                      onChange={(e) => patchEntry(entry.id, { featuredOnHome: e.target.checked })}
                    />
                    <span>Home</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`Delete ${entry.title}`}
                    className="border border-red-800/25 p-1.5 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Fields Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cover Preview */}
                <div className="lg:col-span-3 space-y-2.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/60">
                    Cover Photograph
                  </p>
                  <div className="aspect-[3/4] overflow-hidden bg-[#141414]">
                    <EditorialMediaFrame
                      asset={coverAsset}
                      preset="portrait"
                      className="h-full w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerState({ kind: 'entry-cover', entryId: entry.id })}
                    className="w-full border border-[#141414]/30 px-3 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
                  >
                    Select Cover from Library
                  </button>
                </div>

                {/* Metadata Inputs */}
                <div className="lg:col-span-9 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Project Title
                      </span>
                      <input
                        type="text"
                        value={entry.title}
                        onChange={(e) => patchEntry(entry.id, { title: e.target.value })}
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Brand or Client
                      </span>
                      <input
                        type="text"
                        value={entry.clientOrPublication}
                        onChange={(e) =>
                          patchEntry(entry.id, { clientOrPublication: e.target.value })
                        }
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Category
                      </span>
                      <select
                        value={entry.category}
                        onChange={(e) =>
                          patchEntry(entry.id, { category: e.target.value as ExperienceCategory })
                        }
                        className="mt-1 w-full border border-[#141414]/25 bg-white px-3 py-2 text-xs"
                      >
                        {EXPERIENCE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Year
                      </span>
                      <input
                        type="text"
                        value={entry.year}
                        onChange={(e) => patchEntry(entry.id, { year: e.target.value })}
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs font-mono"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Season
                      </span>
                      <input
                        type="text"
                        value={entry.season}
                        onChange={(e) => patchEntry(entry.id, { season: e.target.value })}
                        placeholder="Spring / Summer, Fall / Winter..."
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Location
                      </span>
                      <input
                        type="text"
                        value={entry.location}
                        onChange={(e) => patchEntry(entry.id, { location: e.target.value })}
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        External Link (Optional)
                      </span>
                      <input
                        type="url"
                        value={entry.externalLink}
                        onChange={(e) => patchEntry(entry.id, { externalLink: e.target.value })}
                        placeholder="https://..."
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Short Credit / Notes
                      </span>
                      <input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => patchEntry(entry.id, { notes: e.target.value })}
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Description
                    </span>
                    <textarea
                      rows={3}
                      value={entry.description}
                      onChange={(e) => patchEntry(entry.id, { description: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  {/* Gallery Management */}
                  <div className="border-t border-[#141414]/12 pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        GALLERY PHOTOGRAPHS ({galleryIds.length})
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPickerState({ kind: 'entry-gallery-add', entryId: entry.id })
                          }
                          className="inline-flex items-center gap-1.5 border border-[#141414]/30 px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>Add from Media Library</span>
                        </button>

                        <label
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase cursor-pointer ${
                            configStatus.cloudinaryConfigured
                              ? 'bg-[#141414] text-white hover:bg-[#2a2a2a]'
                              : 'border border-[#141414]/20 text-[#141414]/45'
                          }`}
                        >
                          <CloudUpload className="h-3.5 w-3.5" />
                          <span>
                            {uploadingEntryId === entry.id ? 'Uploading...' : 'Upload to Cloudinary'}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            disabled={
                              !configStatus.cloudinaryConfigured || uploadingEntryId === entry.id
                            }
                            onChange={(e) => handleMultiUpload(entry, e.target.files)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {galleryIds.length === 0 ? (
                      <p className="text-xs text-[#141414]/55">
                        No gallery photographs assigned yet. Select existing Cloudinary images or
                        upload new ones.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {galleryIds.map((assetId, gIdx) => {
                          const asset = getAssetById(assetId);
                          const isCover = entry.coverAssetId === assetId;
                          return (
                            <div
                              key={`${assetId}-${gIdx}`}
                              className="border border-[#141414]/15 bg-[#F8F7F4] p-2.5 space-y-2"
                            >
                              <div className="aspect-[4/3] overflow-hidden bg-[#141414]">
                                <EditorialMediaFrame
                                  asset={asset}
                                  preset="thumbnail"
                                  className="h-full w-full"
                                  showPlaceholderBadge={false}
                                />
                              </div>

                              <input
                                type="text"
                                value={asset?.altText || ''}
                                onChange={(e) => patchAssetAlt(assetId, e.target.value)}
                                placeholder="Image alt text / description"
                                className="w-full border border-[#141414]/20 bg-white px-2 py-1 text-[11px]"
                              />

                              <div className="flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => patchEntry(entry.id, { coverAssetId: assetId })}
                                  className={`px-2 py-1 text-[9px] font-medium tracking-[0.14em] uppercase ${
                                    isCover
                                      ? 'bg-[#141414] text-white'
                                      : 'border border-[#141414]/25 text-[#141414]/75 hover:border-[#141414]'
                                  }`}
                                >
                                  {isCover ? 'Cover' : 'Set Cover'}
                                </button>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveGalleryAsset(entry, gIdx, -1)}
                                    disabled={gIdx === 0}
                                    aria-label="Move gallery photo left"
                                    className="border border-[#141414]/20 p-1 disabled:opacity-35"
                                  >
                                    <ArrowLeft className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveGalleryAsset(entry, gIdx, 1)}
                                    disabled={gIdx === galleryIds.length - 1}
                                    aria-label="Move gallery photo right"
                                    className="border border-[#141414]/20 p-1 disabled:opacity-35"
                                  >
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeGalleryAsset(entry, assetId)}
                                    aria-label="Remove gallery photo"
                                    className="border border-red-800/25 p-1 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {pickerState && (
        <AssetPickerModal
          open={Boolean(pickerState)}
          onClose={() => setPickerState(null)}
          onSelect={(asset) => {
            if (pickerState.kind === 'entry-cover') {
              const target = state.experienceEntries.find((e) => e.id === pickerState.entryId);
              const gallery = Array.from(
                new Set([asset.id, ...(target?.galleryAssetIds || [])])
              );
              patchEntry(pickerState.entryId, {
                coverAssetId: asset.id,
                galleryAssetIds: gallery,
              });
            } else if (pickerState.kind === 'entry-gallery-add') {
              const target = state.experienceEntries.find((e) => e.id === pickerState.entryId);
              const gallery = Array.from(
                new Set([...(target?.galleryAssetIds || []), asset.id])
              );
              patchEntry(pickerState.entryId, {
                coverAssetId: target?.coverAssetId || asset.id,
                galleryAssetIds: gallery,
              });
            } else if (pickerState.kind === 'category-cover') {
              updateState((prev) => ({
                ...prev,
                experiencePage: {
                  ...prev.experiencePage,
                  categoryCoverAssetIds: {
                    ...prev.experiencePage.categoryCoverAssetIds,
                    [pickerState.category]: asset.id,
                  },
                },
              }));
            } else if (pickerState.kind === 'bottom-backdrop') {
              updateState((prev) => ({
                ...prev,
                experiencePage: {
                  ...prev.experiencePage,
                  bottomCtaBackdropAssetId: asset.id,
                },
              }));
            }
            setPickerState(null);
          }}
        />
      )}
    </div>
  );
}
