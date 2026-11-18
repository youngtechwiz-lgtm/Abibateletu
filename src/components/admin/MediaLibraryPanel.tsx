import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CloudUpload,
  Eye,
  Link2,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { getAssetReferences } from '../../lib/assetReferences.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import type { AssetReference, MediaAsset } from '../../types/cms.ts';

const DEFAULT_FOLDERS = [
  'abibat/heroes',
  'abibat/portfolio',
  'abibat/digitals',
  'abibat/about',
  'abibat/experience',
  'abibat/representation',
  'abibat/contact',
];

function formatBytes(bytes: number): string {
  if (!bytes) return 'Placeholder';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibraryPanel() {
  const { state, configStatus, adminToken, updateState, deleteAsset } = useCms();
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'cloudinary' | 'placeholder'>('all');
  const [tagFilter, setTagFilter] = useState('all');

  // Upload state (supports single & multiple files)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [assetName, setAssetName] = useState('');
  const [altText, setAltText] = useState('');
  const [folder, setFolder] = useState('abibat/portfolio');
  const [tagsInput, setTagsInput] = useState('');
  const [replaceAssetId, setReplaceAssetId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // URL registration state
  const [manualUrl, setManualUrl] = useState('');
  const [manualPublicId, setManualPublicId] = useState('');

  // Preview lightbox & delete confirmation modal
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    asset: MediaAsset;
    references: AssetReference[];
  } | null>(null);

  const folders = useMemo(() => {
    const unique = new Set([...DEFAULT_FOLDERS, ...state.mediaAssets.map((a) => a.folder)]);
    return ['all', ...Array.from(unique)];
  }, [state.mediaAssets]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const a of state.mediaAssets) {
      for (const t of a.tags || []) {
        if (t.trim()) set.add(t.trim().toLowerCase());
      }
    }
    return ['all', ...Array.from(set).sort()];
  }, [state.mediaAssets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.mediaAssets.filter((asset) => {
      if (folderFilter !== 'all' && asset.folder !== folderFilter) return false;
      if (typeFilter === 'cloudinary' && asset.isPlaceholder) return false;
      if (typeFilter === 'placeholder' && !asset.isPlaceholder) return false;
      if (
        tagFilter !== 'all' &&
        !(asset.tags || []).some((t) => t.toLowerCase() === tagFilter.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        asset.assetName.toLowerCase().includes(q) ||
        asset.cloudinaryPublicId.toLowerCase().includes(q) ||
        asset.altText.toLowerCase().includes(q) ||
        asset.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.mediaAssets, searchQuery, folderFilter, typeFilter, tagFilter]);

  const patchAsset = (assetId: string, patch: Partial<MediaAsset>) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, ...patch } : a)),
    }));
  };

  const handleSignedUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadError('Select at least one image file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadNotice(null);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const uploadedAssets: MediaAsset[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const baseName =
          selectedFiles.length === 1 && assetName.trim()
            ? assetName.trim()
            : file.name.replace(/\.[^.]+$/, '');
        const newAsset = await uploadFileToCloudinary(
          file,
          {
            assetName: baseName,
            altText: altText.trim() || baseName,
            folder: folder.trim() || 'abibat/portfolio',
            tags,
          },
          adminToken
        );
        uploadedAssets.push(newAsset);
      }

      await updateState((prev) => {
        if (replaceAssetId && uploadedAssets.length === 1) {
          return {
            ...prev,
            mediaAssets: prev.mediaAssets.map((a) =>
              a.id === replaceAssetId ? { ...uploadedAssets[0], id: replaceAssetId } : a
            ),
          };
        }
        return {
          ...prev,
          mediaAssets: [...uploadedAssets, ...prev.mediaAssets],
        };
      });

      setUploadNotice(
        replaceAssetId && uploadedAssets.length === 1
          ? `Replaced slot with "${uploadedAssets[0].assetName}" via signed Cloudinary upload.`
          : `Uploaded ${uploadedAssets.length} photograph${
              uploadedAssets.length > 1 ? 's' : ''
            } to Cloudinary and saved metadata.`
      );
      setSelectedFiles([]);
      setAssetName('');
      setAltText('');
      setTagsInput('');
      setReplaceAssetId('');
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRegisterCloudinaryUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setUploadError(null);
    setUploadNotice(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newAsset: MediaAsset = {
      id: replaceAssetId || `asset-${crypto.randomUUID().slice(0, 8)}`,
      assetName: assetName.trim() || 'Cloudinary Media Asset',
      cloudinaryPublicId:
        manualPublicId.trim() || `abibat/manual/${crypto.randomUUID().slice(0, 6)}`,
      cloudinaryAssetId: '',
      secureUrl: manualUrl.trim(),
      resourceType: 'image',
      format: manualUrl.split('.').pop()?.split('?')[0] || 'jpg',
      width: 0,
      height: 0,
      fileSize: 0,
      altText: altText.trim() || assetName.trim() || 'ABIBAT editorial photograph',
      folder: folder.trim() || 'abibat/portfolio',
      tags,
      isPlaceholder: false,
      createdAt: new Date().toISOString(),
    };

    await updateState((prev) => {
      if (replaceAssetId) {
        return {
          ...prev,
          mediaAssets: prev.mediaAssets.map((a) => (a.id === replaceAssetId ? newAsset : a)),
        };
      }
      return {
        ...prev,
        mediaAssets: [newAsset, ...prev.mediaAssets],
      };
    });

    setManualUrl('');
    setManualPublicId('');
    setAssetName('');
    setAltText('');
    setReplaceAssetId('');
    setUploadNotice('Cloudinary secure URL registered in Central Media Library.');
  };

  const handleDeleteClick = async (asset: MediaAsset) => {
    const refs = getAssetReferences(state, asset.id);
    if (refs.length > 0) {
      setPendingDelete({ asset, references: refs });
      return;
    }
    await deleteAsset(asset.id, false);
  };

  const handleForceDelete = async () => {
    if (!pendingDelete) return;
    await deleteAsset(pendingDelete.asset.id, true);
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8">
      {/* Architecture & Upload Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signed Cloudinary Upload Form */}
        <form
          onSubmit={handleSignedUpload}
          className="lg:col-span-7 border border-[#141414]/15 bg-white p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#141414]/10 pb-3">
            <div>
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
                SIGNED UPLOAD WORKFLOW (SINGLE OR BATCH)
              </p>
              <h3 className="font-serif text-2xl font-light uppercase">
                UPLOAD TO CLOUDINARY
              </h3>
            </div>
            <span
              className={`text-[10px] font-medium tracking-[0.18em] uppercase ${
                configStatus.cloudinaryConfigured ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {configStatus.cloudinaryConfigured
                ? `Connected: ${configStatus.cloudinaryCloudName}`
                : 'Awaiting Cloudinary Secrets'}
            </span>
          </div>

          {uploadError && (
            <div className="border border-red-700/30 bg-red-50 px-4 py-3 text-xs text-red-900">
              {uploadError}
            </div>
          )}
          {uploadNotice && (
            <div className="border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
              {uploadNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Select One or Multiple Photographs (JPEG, PNG, WEBP, AVIF · Max 15 MB) *
              </span>
              <input
                type="file"
                multiple={!replaceAssetId}
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setSelectedFiles(files);
                  if (files.length === 1 && !assetName) {
                    setAssetName(files[0].name.replace(/\.[^.]+$/, ''));
                  }
                }}
                className="mt-1.5 block w-full border border-[#141414]/25 bg-[#F3F1ED]/50 px-3 py-2 text-xs"
              />
              {selectedFiles.length > 0 && (
                <span className="mt-1 block text-[11px] text-[#141414]/65">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} queued for
                  signed Cloudinary upload
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Asset Name (Single Upload)
              </span>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Paris Editorial Look 01"
                className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Destination Folder
              </span>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="mt-1.5 w-full border border-[#141414]/25 bg-white px-3 py-2 text-xs"
              >
                {DEFAULT_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Alt Text
              </span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive accessibility text"
                className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Tags (comma-separated)
              </span>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="editorial, paris, bw"
                className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
                Optional: Replace Existing Asset Directly
              </span>
              <select
                value={replaceAssetId}
                onChange={(e) => setReplaceAssetId(e.target.value)}
                className="mt-1.5 w-full border border-[#141414]/25 bg-white px-3 py-2 text-xs"
              >
                <option value="">Create as new reusable Media Library asset(s)</option>
                {state.mediaAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    Replace: {a.assetName} ({a.isPlaceholder ? 'Placeholder' : 'Active'})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading || !configStatus.cloudinaryConfigured}
            className="inline-flex items-center gap-2.5 bg-[#141414] px-5 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a] disabled:opacity-45"
          >
            <CloudUpload className="h-3.5 w-3.5" />
            <span>{uploading ? 'SIGNING & UPLOADING...' : 'SIGNED UPLOAD TO CLOUDINARY'}</span>
          </button>
        </form>

        {/* Link Existing Cloudinary Secure URL */}
        <form
          onSubmit={handleRegisterCloudinaryUrl}
          className="lg:col-span-5 border border-[#141414]/15 bg-white p-6 space-y-4"
        >
          <div className="border-b border-[#141414]/10 pb-3">
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              CLOUDINARY SECURE URL
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">LINK EXISTING ASSET</h3>
          </div>

          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              Cloudinary Secure URL *
            </span>
            <input
              type="url"
              required
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://res.cloudinary.com/<cloud>/image/upload/..."
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/70">
              Cloudinary Public ID
            </span>
            <input
              type="text"
              value={manualPublicId}
              onChange={(e) => setManualPublicId(e.target.value)}
              placeholder="abibat/portfolio/look-01"
              className="mt-1.5 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <p className="text-[11px] leading-relaxed text-[#141414]/65">
            Linked Cloudinary URLs automatically receive responsive transformations (
            <code>f_auto,q_auto</code>, face-centered crops, and thumbnails) across every page.
          </p>

          <button
            type="submit"
            className="inline-flex items-center gap-2 border border-[#141414] px-4 py-2 text-[10px] font-medium tracking-[0.22em] uppercase text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>SAVE TO MEDIA LIBRARY</span>
          </button>
        </form>
      </div>

      {/* Media Grid & Reference Inspector */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#141414]/10 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-light uppercase">
              CENTRAL MEDIA LIBRARY ({filteredAssets.length})
            </h3>
            <p className="text-xs text-[#141414]/60">
              Edit names, alt text, and folders inline. Assets are reusable across pages and
              protected against accidental deletion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#141414]/45" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, alt, tags..."
                className="border border-[#141414]/20 pl-8 pr-3 py-1.5 text-xs"
              />
            </div>

            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              aria-label="Filter by folder"
              className="border border-[#141414]/20 bg-white px-2.5 py-1.5 text-xs"
            >
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f === 'all' ? 'All Folders' : f}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as 'all' | 'cloudinary' | 'placeholder')
              }
              aria-label="Filter by asset type"
              className="border border-[#141414]/20 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="all">All Types</option>
              <option value="cloudinary">Cloudinary Live</option>
              <option value="placeholder">Placeholders</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="Filter by tag"
              className="border border-[#141414]/20 bg-white px-2.5 py-1.5 text-xs"
            >
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Tags' : `#${t}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const refs = getAssetReferences(state, asset.id);
            return (
              <div
                key={asset.id}
                className="border border-[#141414]/15 bg-[#F8F7F4] flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-[#1a1918] overflow-hidden group">
                    <EditorialMediaFrame
                      asset={asset}
                      preset="portfolio-card"
                      className="h-full w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setPreviewAsset(asset)}
                      aria-label={`Preview ${asset.assetName}`}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-[0.16em] text-[#141414]/55">
                        {asset.isPlaceholder ? 'Placeholder Slot' : asset.format.toUpperCase()} ·{' '}
                        {formatBytes(asset.fileSize)}
                      </span>
                      <span className="font-mono tabular-nums text-[9px] text-[#141414]/50">
                        {asset.width}×{asset.height}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={asset.assetName}
                      onChange={(e) => patchAsset(asset.id, { assetName: e.target.value })}
                      aria-label="Image name"
                      placeholder="Image name"
                      className="w-full border border-[#141414]/20 bg-white px-2 py-1 text-xs font-medium text-[#141414]"
                    />

                    <input
                      type="text"
                      value={asset.altText}
                      onChange={(e) => patchAsset(asset.id, { altText: e.target.value })}
                      aria-label="Alt text"
                      placeholder="Alt text description"
                      className="w-full border border-[#141414]/20 bg-white px-2 py-1 text-[11px] text-[#141414]/80"
                    />

                    <select
                      value={asset.folder}
                      onChange={(e) => patchAsset(asset.id, { folder: e.target.value })}
                      aria-label="Organize into folder"
                      className="w-full border border-[#141414]/20 bg-white px-2 py-1 text-[11px] text-[#141414]/80"
                    >
                      {folders
                        .filter((f) => f !== 'all')
                        .map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                    </select>

                    {refs.length > 0 && (
                      <div className="border-t border-[#141414]/10 pt-2">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/50">
                          Used on {refs.length} location{refs.length > 1 ? 's' : ''}:
                        </p>
                        <p className="text-[10px] text-[#141414]/75 line-clamp-2">
                          {refs.map((r) => r.label).join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#141414]/10 px-3.5 py-2.5 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceAssetId(asset.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#141414]/75 hover:text-[#141414]"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(asset)}
                    aria-label={`Delete ${asset.assetName}`}
                    className="inline-flex items-center gap-1 text-[10px] font-medium tracking-[0.16em] uppercase text-red-700 hover:text-red-900"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={previewAsset.assetName}
        >
          <div className="relative max-w-3xl w-full bg-[#121212] text-[#F3F1ED] border border-white/15 p-5 space-y-4">
            <button
              type="button"
              onClick={() => setPreviewAsset(null)}
              aria-label="Close asset preview"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center border border-white/25 bg-black/60 text-white hover:bg-white hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-[16/10] bg-[#080808] overflow-hidden">
              <EditorialMediaFrame
                asset={previewAsset}
                preset="portfolio-lightbox"
                className="h-full w-full"
                imgClassName="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-medium">{previewAsset.assetName}</p>
                <p className="text-[11px] text-[#F3F1ED]/65">{previewAsset.altText}</p>
              </div>
              <p className="font-mono text-[10px] text-[#F3F1ED]/55">
                {previewAsset.cloudinaryPublicId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reference Warning Dialog */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md w-full bg-[#F3F1ED] text-[#141414] border border-[#141414]/25 p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="font-serif text-xl uppercase">ASSET CURRENTLY IN USE</h4>
            </div>
            <p className="text-xs leading-relaxed text-[#141414]/80">
              <strong>{pendingDelete.asset.assetName}</strong> is currently referenced in the
              following active sections:
            </p>
            <ul className="border-t border-b border-[#141414]/15 py-3 space-y-1 text-xs text-[#141414]/75">
              {pendingDelete.references.map((r, i) => (
                <li key={i}>
                  • {r.label} ({r.route})
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-[#141414]/65">
              Deleting will remove the image from Cloudinary and unlink it from those pages.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="border border-[#141414]/30 px-4 py-2 text-[10px] font-medium tracking-[0.2em] uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForceDelete}
                className="bg-red-800 px-4 py-2 text-[10px] font-medium tracking-[0.2em] uppercase text-white hover:bg-red-900"
              >
                Delete &amp; Unlink
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
