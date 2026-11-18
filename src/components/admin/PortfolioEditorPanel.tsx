import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  ImagePlus,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { MediaAsset, PortfolioProject, ProjectCategory } from '../../types/cms.ts';

export function PortfolioEditorPanel() {
  const { state, getAssetById, updateState, adminToken, configStatus } = useCms();
  const [newSeason, setNewSeason] = useState('');
  const [pickerState, setPickerState] = useState<{
    projectId: string;
    mode: 'add' | 'replace' | 'cover';
    replaceIndex?: number;
  } | null>(null);
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addSeason = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newSeason.trim();
    if (!cleaned || state.portfolioSeasons.includes(cleaned)) return;
    updateState((prev) => ({
      ...prev,
      portfolioSeasons: [...prev.portfolioSeasons, cleaned],
    }));
    setNewSeason('');
  };

  const removeSeason = (season: string) => {
    updateState((prev) => ({
      ...prev,
      portfolioSeasons: prev.portfolioSeasons.filter((s) => s !== season),
    }));
  };

  const addProject = () => {
    const newProj: PortfolioProject = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      title: 'NEW PROJECT',
      season: state.portfolioSeasons[0] || 'Spring / Summer',
      category: 'Editorials',
      location: 'Paris, France',
      year: '2026',
      client: '',
      photographer: '',
      externalLink: '',
      description: '',
      credits: '',
      coverAssetId: state.mediaAssets[0]?.id || '',
      galleryAssetIds: state.mediaAssets[0]?.id ? [state.mediaAssets[0].id] : [],
      featured: false,
      isPublished: true,
      sortOrder: state.portfolioProjects.length,
      isPlaceholder: false,
    };
    updateState((prev) => ({
      ...prev,
      portfolioProjects: [newProj, ...prev.portfolioProjects],
    }));
  };

  const patchProject = (id: string, patch: Partial<PortfolioProject>) => {
    updateState((prev) => ({
      ...prev,
      portfolioProjects: prev.portfolioProjects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  };

  const removeProject = (id: string) => {
    updateState((prev) => ({
      ...prev,
      portfolioProjects: prev.portfolioProjects.filter((p) => p.id !== id),
      homepage: {
        ...prev.homepage,
        featuredProjectIds: prev.homepage.featuredProjectIds.filter((fid) => fid !== id),
      },
    }));
  };

  const patchAssetDescription = (assetId: string, patch: Partial<MediaAsset>) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)),
    }));
  };

  const handleMultiUpload = async (project: PortfolioProject, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingProjectId(project.id);
    setUploadError(null);

    try {
      const uploadedAssets: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const asset = await uploadFileToCloudinary(
          file,
          {
            assetName: `${project.title} — ${file.name.replace(/\.[^.]+$/, '')}`,
            altText: `${project.title} ${project.category} photograph`,
            folder: 'abibat/portfolio',
            tags: [project.category.toLowerCase(), project.year].filter(Boolean),
          },
          adminToken
        );
        uploadedAssets.push(asset);
      }

      const newIds = uploadedAssets.map((a) => a.id);
      await updateState((prev) => ({
        ...prev,
        mediaAssets: [...uploadedAssets, ...prev.mediaAssets],
        portfolioProjects: prev.portfolioProjects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                coverAssetId: p.coverAssetId || newIds[0],
                galleryAssetIds: [...p.galleryAssetIds, ...newIds],
                isPlaceholder: false,
              }
            : p
        ),
      }));
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploadingProjectId(null);
    }
  };

  const moveGalleryItem = (project: PortfolioProject, index: number, dir: -1 | 1) => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= project.galleryAssetIds.length) return;
    const copy = [...project.galleryAssetIds];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, moved);
    patchProject(project.id, { galleryAssetIds: copy });
  };

  const removeGalleryItem = (project: PortfolioProject, index: number) => {
    const targetId = project.galleryAssetIds[index];
    const nextGallery = project.galleryAssetIds.filter((_, i) => i !== index);
    patchProject(project.id, {
      galleryAssetIds: nextGallery,
      coverAssetId:
        project.coverAssetId === targetId ? nextGallery[0] || '' : project.coverAssetId,
    });
  };

  return (
    <div className="space-y-8">
      {/* Season Registry & Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-[#141414]/15 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              PORTFOLIO STUDIO
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              PROJECTS &amp; GALLERIES ({state.portfolioProjects.length})
            </h3>
            <p className="mt-1 text-xs text-[#141414]/60">
              Upload multiple Cloudinary photographs, reuse existing Media Library images, and
              reorder galleries.
            </p>
          </div>
          <button
            type="button"
            onClick={addProject}
            className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a] shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD PROJECT</span>
          </button>
        </div>

        {/* Custom Seasons Manager */}
        <div className="lg:col-span-5 border border-[#141414]/15 bg-white p-6 space-y-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            PORTFOLIO SEASONS FILTER
          </p>
          <form onSubmit={addSeason} className="flex gap-2">
            <input
              type="text"
              value={newSeason}
              onChange={(e) => setNewSeason(e.target.value)}
              placeholder="Add season (e.g. Cruise 2027)"
              className="flex-1 border border-[#141414]/25 px-3 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="bg-[#141414] px-3.5 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-white"
            >
              Add
            </button>
          </form>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-xs text-[#141414]/75">
            {state.portfolioSeasons.map((season) => (
              <span key={season} className="inline-flex items-center gap-1.5">
                <span>{season}</span>
                <button
                  type="button"
                  onClick={() => removeSeason(season)}
                  aria-label={`Remove season ${season}`}
                  className="text-[#141414]/40 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="border border-red-700/30 bg-red-50 px-4 py-3 text-xs text-red-900">
          {uploadError}
        </div>
      )}

      {/* Project Cards */}
      <div className="space-y-6">
        {state.portfolioProjects.map((proj) => {
          const gallery =
            proj.galleryAssetIds.length > 0
              ? proj.galleryAssetIds
              : proj.coverAssetId
                ? [proj.coverAssetId]
                : [];
          return (
            <div key={proj.id} className="border border-[#141414]/15 bg-white p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Cover Preview */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="aspect-[3/4] bg-[#141414] overflow-hidden">
                    <EditorialMediaFrame
                      asset={getAssetById(proj.coverAssetId)}
                      preset="portfolio-card"
                      className="h-full w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerState({ projectId: proj.id, mode: 'cover' })}
                    className="w-full border border-[#141414]/30 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
                  >
                    Set Cover from Library
                  </button>
                </div>

                {/* Metadata Form */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Project Title
                    </span>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => patchProject(proj.id, { title: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Category
                    </span>
                    <select
                      value={proj.category}
                      onChange={(e) =>
                        patchProject(proj.id, { category: e.target.value as ProjectCategory })
                      }
                      className="mt-1 w-full border border-[#141414]/25 bg-white px-3 py-2 text-xs"
                    >
                      <option value="Campaigns">Campaigns</option>
                      <option value="Editorials">Editorials</option>
                      <option value="Runway">Runway</option>
                      <option value="Publications">Publications</option>
                      <option value="Collaborations">Collaborations</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Brand / Client
                    </span>
                    <input
                      type="text"
                      value={proj.client}
                      onChange={(e) => patchProject(proj.id, { client: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Photographer
                    </span>
                    <input
                      type="text"
                      value={proj.photographer}
                      onChange={(e) => patchProject(proj.id, { photographer: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Year
                    </span>
                    <input
                      type="text"
                      value={proj.year}
                      onChange={(e) => patchProject(proj.id, { year: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Season
                    </span>
                    <select
                      value={proj.season}
                      onChange={(e) => patchProject(proj.id, { season: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 bg-white px-3 py-2 text-xs"
                    >
                      <option value="">Select Season</option>
                      {state.portfolioSeasons.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Location
                    </span>
                    <input
                      type="text"
                      value={proj.location}
                      onChange={(e) => patchProject(proj.id, { location: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      External Link (Optional)
                    </span>
                    <input
                      type="url"
                      value={proj.externalLink}
                      onChange={(e) => patchProject(proj.id, { externalLink: e.target.value })}
                      placeholder="https://..."
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>

                  <label className="block sm:col-span-2 lg:col-span-3">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Description
                    </span>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => patchProject(proj.id, { description: e.target.value })}
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                    />
                  </label>
                </div>
              </div>

              {/* Multi-Photo Gallery Manager */}
              <div className="border-t border-[#141414]/12 pt-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-[#141414]/60">
                      PROJECT GALLERY ({gallery.length} PHOTOGRAPHS)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 border border-[#141414]/30 px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414] ${
                        !configStatus.cloudinaryConfigured ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <CloudUpload className="h-3.5 w-3.5" />
                      <span>
                        {uploadingProjectId === proj.id
                          ? 'Uploading...'
                          : 'Upload Multiple to Cloudinary'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleMultiUpload(proj, e.target.files)}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setPickerState({ projectId: proj.id, mode: 'add' })}
                      className="inline-flex items-center gap-2 bg-[#141414] px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a]"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      <span>Assign from Media Library</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {gallery.map((assetId, idx) => {
                    const asset = getAssetById(assetId);
                    const isCover = proj.coverAssetId === assetId;
                    return (
                      <div
                        key={`${assetId}-${idx}`}
                        className="border border-[#141414]/15 bg-[#F3F1ED]/40 p-3 space-y-2.5"
                      >
                        <div className="aspect-[4/3] bg-[#141414] overflow-hidden">
                          <EditorialMediaFrame
                            asset={asset}
                            preset="thumbnail"
                            className="h-full w-full"
                          />
                        </div>

                        {asset && (
                          <input
                            type="text"
                            value={asset.altText}
                            onChange={(e) =>
                              patchAssetDescription(asset.id, { altText: e.target.value })
                            }
                            aria-label="Edit image description"
                            placeholder="Image description / alt text"
                            className="w-full border border-[#141414]/20 bg-white px-2.5 py-1.5 text-[11px]"
                          />
                        )}

                        <div className="flex items-center justify-between gap-1 pt-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(proj, idx, -1)}
                              disabled={idx === 0}
                              aria-label="Move photograph left"
                              className="border border-[#141414]/20 bg-white p-1 disabled:opacity-30"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryItem(proj, idx, 1)}
                              disabled={idx === gallery.length - 1}
                              aria-label="Move photograph right"
                              className="border border-[#141414]/20 bg-white p-1 disabled:opacity-30"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPickerState({
                                  projectId: proj.id,
                                  mode: 'replace',
                                  replaceIndex: idx,
                                })
                              }
                              aria-label="Replace photograph"
                              title="Replace photograph"
                              className="border border-[#141414]/20 bg-white p-1"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => patchProject(proj.id, { coverAssetId: assetId })}
                              title="Set as Cover"
                              className={`inline-flex items-center gap-1 px-2 py-1 text-[9px] uppercase tracking-[0.14em] border ${
                                isCover
                                  ? 'bg-[#141414] text-white border-[#141414]'
                                  : 'bg-white text-[#141414]/70 border-[#141414]/20'
                              }`}
                            >
                              <Star className="h-2.5 w-2.5" />
                              <span>{isCover ? 'Cover' : 'Set Cover'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryItem(proj, idx)}
                              aria-label="Remove photograph from gallery"
                              className="border border-red-800/30 bg-white p-1 text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#141414]/10 pt-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        patchProject(proj.id, { isPublished: !(proj.isPublished !== false) })
                      }
                      className={`border px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase ${
                        proj.isPublished !== false
                          ? 'border-emerald-800/35 bg-emerald-50 text-emerald-900'
                          : 'border-amber-800/35 bg-amber-50 text-amber-900'
                      }`}
                    >
                      {proj.isPublished !== false ? 'Published' : 'Unpublished Draft'}
                    </button>

                    <button
                      type="button"
                      onClick={() => patchProject(proj.id, { featured: !proj.featured })}
                      className={`border px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] uppercase ${
                        proj.featured
                          ? 'border-[#141414] bg-[#141414] text-white'
                          : 'border-[#141414]/25 text-[#141414]/75 hover:border-[#141414]'
                      }`}
                    >
                      {proj.featured ? 'Featured Project' : 'Feature Project'}
                    </button>

                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!proj.isPlaceholder}
                        onChange={(e) =>
                          patchProject(proj.id, { isPlaceholder: !e.target.checked })
                        }
                      />
                      <span>Verified Real Credit</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProject(proj.id)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.18em] uppercase text-red-700 hover:text-red-900"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Project</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AssetPickerModal
        open={Boolean(pickerState)}
        onClose={() => setPickerState(null)}
        onSelect={(asset) => {
          if (!pickerState) return;
          const proj = state.portfolioProjects.find((p) => p.id === pickerState.projectId);
          if (!proj) return;

          if (pickerState.mode === 'cover') {
            const gallery = proj.galleryAssetIds.includes(asset.id)
              ? proj.galleryAssetIds
              : [asset.id, ...proj.galleryAssetIds];
            patchProject(proj.id, {
              coverAssetId: asset.id,
              galleryAssetIds: gallery,
              isPlaceholder: asset.isPlaceholder,
            });
          } else if (pickerState.mode === 'add') {
            const gallery = proj.galleryAssetIds.includes(asset.id)
              ? proj.galleryAssetIds
              : [...proj.galleryAssetIds, asset.id];
            patchProject(proj.id, {
              coverAssetId: proj.coverAssetId || asset.id,
              galleryAssetIds: gallery,
              isPlaceholder: asset.isPlaceholder ? proj.isPlaceholder : false,
            });
          } else if (pickerState.mode === 'replace' && pickerState.replaceIndex !== undefined) {
            const baseGallery =
              proj.galleryAssetIds.length > 0
                ? [...proj.galleryAssetIds]
                : proj.coverAssetId
                  ? [proj.coverAssetId]
                  : [];
            const oldId = baseGallery[pickerState.replaceIndex];
            baseGallery[pickerState.replaceIndex] = asset.id;
            patchProject(proj.id, {
              galleryAssetIds: baseGallery,
              coverAssetId: proj.coverAssetId === oldId ? asset.id : proj.coverAssetId,
            });
          }
        }}
      />
    </div>
  );
}
