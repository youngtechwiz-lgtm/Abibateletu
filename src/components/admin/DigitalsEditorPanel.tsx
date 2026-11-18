import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CloudUpload,
  ExternalLink,
  FileText,
  ImagePlus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { uploadCompCardPdfToCloudinary, uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type { DigitalsItem, DigitalsPageSettings, MediaAsset } from '../../types/cms.ts';

const DIGITALS_ANGLES = [
  'Front Portrait',
  'Side Portrait',
  'Profile',
  'Full Body',
  'Half Body',
  'Close Up',
  'Additional',
];

export function DigitalsEditorPanel() {
  const { state, getAssetById, updateState, adminToken, configStatus } = useCms();
  const { digitalsPage, digitalsItems, homepage } = state;

  const [pickerState, setPickerState] = useState<{
    mode: 'add' | 'replace';
    itemId?: string;
  } | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedItems = useMemo(
    () => [...digitalsItems].sort((a, b) => a.sortOrder - b.sortOrder),
    [digitalsItems]
  );

  const patchPage = (patch: Partial<DigitalsPageSettings>) => {
    updateState((prev) => ({
      ...prev,
      digitalsPage: { ...prev.digitalsPage, ...patch },
    }));
  };

  const patchDigital = (id: string, patch: Partial<DigitalsItem>) => {
    updateState((prev) => ({
      ...prev,
      digitalsItems: prev.digitalsItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const patchAssetAltText = (assetId: string, altText: string) => {
    updateState((prev) => ({
      ...prev,
      mediaAssets: prev.mediaAssets.map((a) => (a.id === assetId ? { ...a, altText } : a)),
    }));
  };

  const moveDigital = (id: string, direction: -1 | 1) => {
    const idx = orderedItems.findIndex((item) => item.id === id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= orderedItems.length) return;

    const reordered = [...orderedItems];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    const normalized = reordered.map((item, i) => ({ ...item, sortOrder: i }));
    updateState((prev) => ({
      ...prev,
      digitalsItems: normalized,
    }));
  };

  const removeDigital = (id: string) => {
    const remaining = orderedItems
      .filter((item) => item.id !== id)
      .map((item, i) => ({ ...item, sortOrder: i }));
    updateState((prev) => ({
      ...prev,
      digitalsItems: remaining,
    }));
  };

  const handleUploadDigitals = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    setError(null);

    try {
      const uploadedAssets: MediaAsset[] = [];
      for (const file of Array.from(files)) {
        const cleanTitle = file.name.replace(/\.[^.]+$/, '');
        const asset = await uploadFileToCloudinary(
          file,
          {
            assetName: `Digitals — ${cleanTitle}`,
            altText: `ABIBAT unretouched digital — ${cleanTitle}`,
            folder: 'abibat/digitals',
            tags: ['digitals', 'polaroid'],
          },
          adminToken
        );
        uploadedAssets.push(asset);
      }

      const startOrder = orderedItems.length;
      const newItems: DigitalsItem[] = uploadedAssets.map((asset, i) => ({
        id: `dig-${crypto.randomUUID().slice(0, 8)}`,
        title: asset.assetName.replace(/^Digitals\s*—\s*/i, '').toUpperCase() || 'NEW DIGITAL',
        angle: 'Additional',
        notes: '',
        assetId: asset.id,
        isBw: false,
        sortOrder: startOrder + i,
        isPlaceholder: false,
      }));

      await updateState((prev) => ({
        ...prev,
        mediaAssets: [...uploadedAssets, ...prev.mediaAssets],
        digitalsItems: [...prev.digitalsItems, ...newItems],
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleUploadPdf = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    setError(null);

    try {
      const uploaded = await uploadCompCardPdfToCloudinary(file, adminToken);
      await patchPage({
        compCardPdfUrl: uploaded.secureUrl,
        compCardPdfName: uploaded.fileName,
        compCardPdfPublicId: uploaded.publicId,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="border border-red-700/30 bg-red-50 px-4 py-3 text-xs text-red-900">
          {error}
        </div>
      )}

      {/* Model Book Header, Bio & Confirmed Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 border border-[#141414]/15 bg-white p-6 space-y-4">
          <div className="border-b border-[#141414]/10 pb-3">
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              MODEL BOOK EDITORIAL COPY
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">DIGITALS PAGE DETAILS</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                About Section Kicker
              </span>
              <input
                type="text"
                value={digitalsPage.aboutKicker}
                onChange={(e) => patchPage({ aboutKicker: e.target.value })}
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Model Name
              </span>
              <input
                type="text"
                value={digitalsPage.aboutName}
                onChange={(e) => patchPage({ aboutName: e.target.value })}
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Caption
            </span>
            <input
              type="text"
              value={digitalsPage.heroCornerCaption}
              onChange={(e) => patchPage({ heroCornerCaption: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              About Me Bio
            </span>
            <textarea
              rows={3}
              value={digitalsPage.aboutBio}
              onChange={(e) => patchPage({ aboutBio: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Editorial Quote
            </span>
            <input
              type="text"
              value={digitalsPage.quote}
              onChange={(e) => patchPage({ quote: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>
        </div>

        {/* Measurements & Optional Fields */}
        <div className="lg:col-span-6 border border-[#141414]/15 bg-white p-6 space-y-4">
          <div className="border-b border-[#141414]/10 pb-3">
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              MEASUREMENTS &amp; QUICK FACTS
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">
              MODEL SPECIFICATIONS
            </h3>
            <p className="mt-1 text-xs text-[#141414]/60">
              Confirmed: <strong>ABIBAT</strong> · <strong>{homepage.modelStats.height}</strong> ·{' '}
              <strong>Lagos, Paris, Milan &amp; Spain</strong>. Leave optional fields blank to keep
              them hidden on the live Digitals page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Bust (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.bust}
                onChange={(e) => patchPage({ bust: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Waist (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.waist}
                onChange={(e) => patchPage({ waist: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Hips (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.hips}
                onChange={(e) => patchPage({ hips: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Shoe Size (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.shoeSize}
                onChange={(e) => patchPage({ shoeSize: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Hair (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.hair}
                onChange={(e) => patchPage({ hair: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                Eyes (Optional)
              </span>
              <input
                type="text"
                value={digitalsPage.eyes}
                onChange={(e) => patchPage({ eyes: e.target.value })}
                placeholder="Hidden if empty"
                className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </label>
          </div>

          {/* Comp Card PDF Upload / Replace */}
          <div className="border-t border-[#141414]/12 pt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#141414]/65">
                  COMP-CARD PDF (CLOUDINARY)
                </p>
                <p className="text-xs text-[#141414]/60">
                  {digitalsPage.compCardPdfUrl
                    ? digitalsPage.compCardPdfName || 'Comp-card PDF active'
                    : 'No comp-card PDF uploaded yet'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 bg-[#141414] px-3.5 py-2 text-[10px] font-medium tracking-[0.18em] uppercase text-white hover:bg-[#2a2a2a] ${
                    !configStatus.cloudinaryConfigured ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    {uploadingPdf
                      ? 'Uploading PDF...'
                      : digitalsPage.compCardPdfUrl
                        ? 'Replace PDF'
                        : 'Upload PDF'}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleUploadPdf(e.target.files)}
                  />
                </label>

                {digitalsPage.compCardPdfUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      patchPage({
                        compCardPdfUrl: '',
                        compCardPdfName: '',
                        compCardPdfPublicId: '',
                      })
                    }
                    className="border border-red-800/30 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-red-700 hover:bg-red-50"
                  >
                    Remove PDF
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <input
                type="url"
                value={digitalsPage.compCardPdfUrl}
                onChange={(e) => patchPage({ compCardPdfUrl: e.target.value })}
                placeholder="Or paste Cloudinary PDF URL (https://res.cloudinary.com/...)"
                className="sm:col-span-8 border border-[#141414]/25 px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={digitalsPage.compCardPdfName}
                onChange={(e) => patchPage({ compCardPdfName: e.target.value })}
                placeholder="Download filename"
                className="sm:col-span-4 border border-[#141414]/25 px-3 py-2 text-xs"
              />
            </div>

            {digitalsPage.compCardPdfUrl && (
              <a
                href={digitalsPage.compCardPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-[#141414] underline"
              >
                <span>Preview Current PDF</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Digitals Photographs Header & Upload Toolbar */}
      <div className="border border-[#141414]/15 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            UNRETOUCHED MODEL BOOK PLATES
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            DIGITALS GALLERY ({orderedItems.length})
          </h3>
          <p className="mt-1 text-xs text-[#141414]/60">
            Upload digitals to Cloudinary, select existing Media Library photos, reorder frames,
            replace shots, and edit alt text. Slots 01–04 populate the top triptych and Close Up
            anchor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 border border-[#141414]/30 px-4 py-2.5 text-[10px] font-medium tracking-[0.2em] uppercase hover:border-[#141414] ${
              !configStatus.cloudinaryConfigured ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <CloudUpload className="h-3.5 w-3.5" />
            <span>{uploadingPhotos ? 'Uploading...' : 'Upload Digitals'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUploadDigitals(e.target.files)}
            />
          </label>

          <button
            type="button"
            onClick={() => setPickerState({ mode: 'add' })}
            className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[10px] font-medium tracking-[0.2em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a]"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            <span>Select from Media Library</span>
          </button>
        </div>
      </div>

      {/* Digitals Frames List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orderedItems.map((item, idx) => {
          const asset = getAssetById(item.assetId);
          return (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-4 border border-[#141414]/15 bg-white p-4"
            >
              <div className="sm:col-span-5 space-y-2">
                <div className="relative aspect-[3/4] bg-[#dedad2] overflow-hidden">
                  <EditorialMediaFrame
                    asset={asset}
                    preset={item.isBw ? 'digitals-bw' : 'digitals'}
                    grayscale={item.isBw}
                    darkSurface={false}
                    className="h-full w-full"
                  />
                  <span className="absolute top-2 left-2 bg-[#141414]/85 px-2 py-0.5 text-[9px] font-mono tabular-nums tracking-[0.18em] text-[#F3F1ED]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickerState({ mode: 'replace', itemId: item.id })}
                    className="inline-flex items-center justify-center gap-1 border border-[#141414]/30 py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Replace</span>
                  </button>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveDigital(item.id, -1)}
                      disabled={idx === 0}
                      aria-label={`Move ${item.title} earlier`}
                      className="flex-1 flex items-center justify-center border border-[#141414]/25 py-1.5 disabled:opacity-30 hover:border-[#141414]"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDigital(item.id, 1)}
                      disabled={idx === orderedItems.length - 1}
                      aria-label={`Move ${item.title} later`}
                      className="flex-1 flex items-center justify-center border border-[#141414]/25 py-1.5 disabled:opacity-30 hover:border-[#141414]"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-7 space-y-2.5">
                <label className="block">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/65">
                    Frame Title
                  </span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => patchDigital(item.id, { title: e.target.value })}
                    className="mt-1 w-full border border-[#141414]/25 px-3 py-1.5 text-xs"
                  />
                </label>

                <label className="block">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/65">
                    Pose / Category
                  </span>
                  <select
                    value={item.angle}
                    onChange={(e) => patchDigital(item.id, { angle: e.target.value })}
                    className="mt-1 w-full border border-[#141414]/25 bg-white px-3 py-1.5 text-xs"
                  >
                    {DIGITALS_ANGLES.map((angle) => (
                      <option key={angle} value={angle}>
                        {angle}
                      </option>
                    ))}
                    {!DIGITALS_ANGLES.includes(item.angle) && (
                      <option value={item.angle}>{item.angle}</option>
                    )}
                  </select>
                </label>

                {asset && (
                  <label className="block">
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/65">
                      Image Alt Text
                    </span>
                    <input
                      type="text"
                      value={asset.altText}
                      onChange={(e) => patchAssetAltText(asset.id, e.target.value)}
                      placeholder="Descriptive alt text for accessibility & SEO"
                      className="mt-1 w-full border border-[#141414]/25 px-3 py-1.5 text-xs"
                    />
                  </label>
                )}

                <label className="block">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#141414]/65">
                    Notes
                  </span>
                  <textarea
                    rows={2}
                    value={item.notes}
                    onChange={(e) => patchDigital(item.id, { notes: e.target.value })}
                    className="mt-1 w-full border border-[#141414]/25 px-3 py-1.5 text-xs"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.isBw}
                      onChange={(e) => patchDigital(item.id, { isBw: e.target.checked })}
                    />
                    <span>B&amp;W (Cloudinary)</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeDigital(item.id)}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-red-700 hover:text-red-900"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
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
          if (pickerState.mode === 'add') {
            const newItem: DigitalsItem = {
              id: `dig-${crypto.randomUUID().slice(0, 8)}`,
              title: asset.assetName.toUpperCase(),
              angle: 'Additional',
              notes: '',
              assetId: asset.id,
              isBw: false,
              sortOrder: orderedItems.length,
              isPlaceholder: asset.isPlaceholder,
            };
            updateState((prev) => ({
              ...prev,
              digitalsItems: [...prev.digitalsItems, newItem],
            }));
          } else if (pickerState.mode === 'replace' && pickerState.itemId) {
            patchDigital(pickerState.itemId, {
              assetId: asset.id,
              isPlaceholder: asset.isPlaceholder,
            });
          }
        }}
      />
    </div>
  );
}
