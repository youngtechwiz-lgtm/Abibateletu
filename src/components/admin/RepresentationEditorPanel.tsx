import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CloudUpload,
  Eye,
  EyeOff,
  ImagePlus,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { getOptimizedCloudinaryUrl, uploadFileToCloudinary } from '../../lib/cloudinary.ts';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import { AssetPickerModal } from './AssetPickerModal.tsx';
import type {
  MediaAsset,
  RepresentationAgency,
  RepresentationPageSettings,
} from '../../types/cms.ts';

export function RepresentationEditorPanel() {
  const { state, getAssetById, updateState, adminToken, configStatus } = useCms();
  const { representationAgencies, representationPage } = state;

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [pickerState, setPickerState] = useState<{
    target: 'logo' | 'photo' | 'backdrop';
    agencyId?: string;
  } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedAgencies = useMemo(
    () => [...representationAgencies].sort((a, b) => a.sortOrder - b.sortOrder),
    [representationAgencies]
  );

  const visibleAgencies = useMemo(() => {
    if (statusFilter === 'active') return orderedAgencies.filter((a) => a.isActive !== false);
    if (statusFilter === 'inactive') return orderedAgencies.filter((a) => a.isActive === false);
    return orderedAgencies;
  }, [orderedAgencies, statusFilter]);

  const patchPage = (patch: Partial<RepresentationPageSettings>) => {
    updateState((prev) => ({
      ...prev,
      representationPage: { ...prev.representationPage, ...patch },
    }));
  };

  const addAgency = () => {
    const newAgency: RepresentationAgency = {
      id: `rep-${crypto.randomUUID().slice(0, 8)}`,
      agencyName: '',
      city: '',
      country: '',
      website: '',
      email: '',
      phone: '',
      agentName: '',
      address: '',
      description: '',
      logoAssetId: '',
      photoAssetId: '',
      specialties: [],
      statusNote: '',
      sortOrder: orderedAgencies.length,
      isActive: true,
      isPlaceholder: false,
    };

    updateState((prev) => ({
      ...prev,
      representationAgencies: [...prev.representationAgencies, newAgency],
    }));
  };

  const patchAgency = (id: string, patch: Partial<RepresentationAgency>) => {
    updateState((prev) => ({
      ...prev,
      representationAgencies: prev.representationAgencies.map((a) =>
        a.id === id ? { ...a, ...patch, isPlaceholder: false } : a
      ),
    }));
  };

  const moveAgency = (id: string, direction: -1 | 1) => {
    const idx = orderedAgencies.findIndex((a) => a.id === id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= orderedAgencies.length) return;

    const reordered = [...orderedAgencies];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    const normalized = reordered.map((a, i) => ({ ...a, sortOrder: i }));
    updateState((prev) => ({
      ...prev,
      representationAgencies: normalized,
    }));
  };

  const removeAgency = (id: string) => {
    const remaining = orderedAgencies
      .filter((a) => a.id !== id)
      .map((a, i) => ({ ...a, sortOrder: i }));
    updateState((prev) => ({
      ...prev,
      representationAgencies: remaining,
    }));
  };

  const handleUploadAgencyMedia = async (
    agency: RepresentationAgency,
    kind: 'logo' | 'photo',
    files: FileList | null
  ) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingKey(`${agency.id}-${kind}`);
    setError(null);

    try {
      const label = agency.agencyName || agency.city || 'Agency';
      const asset: MediaAsset = await uploadFileToCloudinary(
        file,
        {
          assetName: `${label} — ${kind === 'logo' ? 'Logo' : 'Photo'}`,
          altText: `${label} ${kind === 'logo' ? 'agency logo' : 'representation photograph'}`,
          folder: kind === 'logo' ? 'abibat/agencies/logos' : 'abibat/agencies/photos',
          tags: ['representation', kind],
        },
        adminToken
      );

      await updateState((prev) => ({
        ...prev,
        mediaAssets: [asset, ...prev.mediaAssets],
        representationAgencies: prev.representationAgencies.map((a) =>
          a.id === agency.id
            ? {
                ...a,
                ...(kind === 'logo' ? { logoAssetId: asset.id } : { photoAssetId: asset.id }),
                isPlaceholder: false,
              }
            : a
        ),
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="border border-red-700/30 bg-red-50 px-4 py-3 text-xs text-red-900">
          {error}
        </div>
      )}

      {/* Page Editorial Copy & Closing CTA Settings */}
      <div className="border border-[#141414]/15 bg-white p-6 space-y-5">
        <div className="border-b border-[#141414]/10 pb-3">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            PAGE PRESENTATION
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            REPRESENTATION PAGE COPY &amp; CLOSING BANNER
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Hero Corner Caption
            </span>
            <input
              type="text"
              value={representationPage.heroCornerCaption}
              onChange={(e) => patchPage({ heroCornerCaption: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Section Kicker
            </span>
            <input
              type="text"
              value={representationPage.sectionKicker}
              onChange={(e) => patchPage({ sectionKicker: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Section Heading
            </span>
            <input
              type="text"
              value={representationPage.sectionTitle}
              onChange={(e) => patchPage({ sectionTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block md:col-span-3">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Section Description
            </span>
            <textarea
              rows={2}
              value={representationPage.sectionDescription}
              onChange={(e) => patchPage({ sectionDescription: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Kicker
            </span>
            <input
              type="text"
              value={representationPage.bottomCtaKicker}
              onChange={(e) => patchPage({ bottomCtaKicker: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Headline
            </span>
            <input
              type="text"
              value={representationPage.bottomCtaTitle}
              onChange={(e) => patchPage({ bottomCtaTitle: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Button Label
            </span>
            <input
              type="text"
              value={representationPage.bottomCtaText}
              onChange={(e) => patchPage({ bottomCtaText: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom CTA Description
            </span>
            <textarea
              rows={2}
              value={representationPage.bottomCtaDescription}
              onChange={(e) => patchPage({ bottomCtaDescription: e.target.value })}
              className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
            />
          </label>

          <div className="space-y-2">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
              Bottom Banner Backdrop
            </span>
            <div className="flex items-center gap-3">
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
                onClick={() => setPickerState({ target: 'backdrop' })}
                className="border border-[#141414]/30 px-3 py-2 text-[10px] font-medium tracking-[0.18em] uppercase hover:border-[#141414]"
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agencies Directory Header */}
      <div className="border border-[#141414]/15 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
            DYNAMIC PARTNER NETWORK
          </p>
          <h3 className="font-serif text-2xl font-light uppercase">
            AGENCIES ({orderedAgencies.length})
          </h3>
          <p className="mt-1 text-xs text-[#141414]/60">
            Add international agencies, assign Cloudinary logos or optional photographs, set display
            order, and toggle active/inactive visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-[#141414]/20 text-[10px] uppercase tracking-[0.16em]">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 ${
                  statusFilter === status
                    ? 'bg-[#141414] text-white'
                    : 'bg-white text-[#141414]/70 hover:text-[#141414]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={addAgency}
            className="inline-flex items-center gap-2 bg-[#141414] px-4 py-2.5 text-[10px] font-medium tracking-[0.22em] uppercase text-[#F3F1ED] hover:bg-[#2a2a2a]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD AGENCY</span>
          </button>
        </div>
      </div>

      {/* Agency Cards List */}
      {visibleAgencies.length === 0 ? (
        <div className="border border-[#141414]/15 bg-white p-10 text-center space-y-3">
          <p className="font-serif text-2xl font-light uppercase text-[#141414]/75">
            {orderedAgencies.length === 0
              ? 'NO AGENCIES ADDED YET'
              : `NO ${statusFilter.toUpperCase()} AGENCIES`}
          </p>
          <p className="text-xs text-[#141414]/60 max-w-md mx-auto">
            Click &ldquo;Add Agency&rdquo; to publish a partner agency on the Global Representation
            page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleAgencies.map((agency) => {
            const globalIdx = orderedAgencies.findIndex((a) => a.id === agency.id);
            const logoAsset = agency.logoAssetId ? getAssetById(agency.logoAssetId) : undefined;
            const logoUrl = logoAsset ? getOptimizedCloudinaryUrl(logoAsset, 'thumbnail') : '';
            const photoAsset = agency.photoAssetId ? getAssetById(agency.photoAssetId) : undefined;
            const isActive = agency.isActive !== false;

            return (
              <div
                key={agency.id}
                className={`border bg-white p-6 space-y-5 ${
                  isActive ? 'border-[#141414]/20' : 'border-[#141414]/15 opacity-80'
                }`}
              >
                {/* Card Top Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#141414]/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-[#141414]/55">
                      #{String(globalIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-xl uppercase">
                      {agency.agencyName || 'New Agency Record'}
                    </span>
                    {agency.city && (
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#141414]/55">
                        · {agency.city}
                        {agency.country ? `, ${agency.country}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => patchAgency(agency.id, { isActive: !isActive })}
                      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-[10px] font-medium tracking-[0.16em] uppercase ${
                        isActive
                          ? 'border-emerald-800/30 bg-emerald-50 text-emerald-900'
                          : 'border-[#141414]/25 bg-[#F3F1ED] text-[#141414]/70'
                      }`}
                    >
                      {isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{isActive ? 'Active' : 'Inactive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => moveAgency(agency.id, -1)}
                      disabled={globalIdx === 0}
                      aria-label="Move agency up"
                      className="border border-[#141414]/25 p-1.5 disabled:opacity-30 hover:border-[#141414]"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveAgency(agency.id, 1)}
                      disabled={globalIdx === orderedAgencies.length - 1}
                      aria-label="Move agency down"
                      className="border border-[#141414]/25 p-1.5 disabled:opacity-30 hover:border-[#141414]"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeAgency(agency.id)}
                      aria-label={`Remove ${agency.agencyName || 'agency'}`}
                      className="border border-red-800/25 p-1.5 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Grid: Cloudinary Media + Agency Metadata */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Logo + Optional Photograph */}
                  <div className="lg:col-span-4 space-y-5">
                    {/* Agency Logo */}
                    <div className="border border-[#141414]/12 bg-[#F3F1ED]/40 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#141414]/65">
                          Agency Logo (Cloudinary)
                        </span>
                        {agency.logoAssetId && (
                          <button
                            type="button"
                            onClick={() => patchAgency(agency.id, { logoAssetId: '' })}
                            className="text-[9px] uppercase tracking-[0.16em] text-red-700 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="h-16 bg-white border border-[#141414]/10 flex items-center justify-center p-2 overflow-hidden">
                        {logoAsset && logoUrl && !logoAsset.isPlaceholder ? (
                          <img
                            src={logoUrl}
                            alt={logoAsset.altText || 'Agency logo preview'}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] tracking-[0.18em] uppercase text-[#141414]/40">
                            {logoAsset ? logoAsset.assetName : 'No logo assigned'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <label
                          className={`inline-flex cursor-pointer items-center justify-center gap-1.5 border border-[#141414]/25 bg-white py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414] ${
                            !configStatus.cloudinaryConfigured
                              ? 'opacity-50 pointer-events-none'
                              : ''
                          }`}
                        >
                          <CloudUpload className="h-3 w-3" />
                          <span>
                            {uploadingKey === `${agency.id}-logo` ? 'Uploading...' : 'Upload Logo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadAgencyMedia(agency, 'logo', e.target.files)}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setPickerState({ target: 'logo', agencyId: agency.id })}
                          className="inline-flex items-center justify-center gap-1.5 border border-[#141414]/25 bg-white py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                        >
                          <ImagePlus className="h-3 w-3" />
                          <span>Library</span>
                        </button>
                      </div>
                    </div>

                    {/* Optional Agency Photograph */}
                    <div className="border border-[#141414]/12 bg-[#F3F1ED]/40 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#141414]/65">
                          Optional Photograph
                        </span>
                        {agency.photoAssetId && (
                          <button
                            type="button"
                            onClick={() => patchAgency(agency.id, { photoAssetId: '' })}
                            className="text-[9px] uppercase tracking-[0.16em] text-red-700 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="aspect-[16/10] bg-[#181715] overflow-hidden flex items-center justify-center">
                        {photoAsset ? (
                          <EditorialMediaFrame
                            asset={photoAsset}
                            preset="portfolio-card"
                            className="h-full w-full"
                          />
                        ) : (
                          <span className="text-[10px] tracking-[0.18em] uppercase text-[#F3F1ED]/45">
                            No photograph (optional)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <label
                          className={`inline-flex cursor-pointer items-center justify-center gap-1.5 border border-[#141414]/25 bg-white py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414] ${
                            !configStatus.cloudinaryConfigured
                              ? 'opacity-50 pointer-events-none'
                              : ''
                          }`}
                        >
                          <CloudUpload className="h-3 w-3" />
                          <span>
                            {uploadingKey === `${agency.id}-photo`
                              ? 'Uploading...'
                              : 'Upload Photo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleUploadAgencyMedia(agency, 'photo', e.target.files)
                            }
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setPickerState({ target: 'photo', agencyId: agency.id })}
                          className="inline-flex items-center justify-center gap-1.5 border border-[#141414]/25 bg-white py-1.5 text-[9px] font-medium tracking-[0.16em] uppercase hover:border-[#141414]"
                        >
                          <ImagePlus className="h-3 w-3" />
                          <span>Library</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Metadata Fields */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Agency Name *
                      </span>
                      <input
                        type="text"
                        value={agency.agencyName}
                        onChange={(e) => patchAgency(agency.id, { agencyName: e.target.value })}
                        placeholder="Enter agency name"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        City *
                      </span>
                      <input
                        type="text"
                        value={agency.city}
                        onChange={(e) => patchAgency(agency.id, { city: e.target.value })}
                        placeholder="e.g. Paris"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Country *
                      </span>
                      <input
                        type="text"
                        value={agency.country}
                        onChange={(e) => patchAgency(agency.id, { country: e.target.value })}
                        placeholder="e.g. France"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Website
                      </span>
                      <input
                        type="url"
                        value={agency.website}
                        onChange={(e) => patchAgency(agency.id, { website: e.target.value })}
                        placeholder="https://agency.com"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Email
                      </span>
                      <input
                        type="email"
                        value={agency.email}
                        onChange={(e) => patchAgency(agency.id, { email: e.target.value })}
                        placeholder="bookings@agency.com"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Phone
                      </span>
                      <input
                        type="text"
                        value={agency.phone}
                        onChange={(e) => patchAgency(agency.id, { phone: e.target.value })}
                        placeholder="+33 ..."
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Booker / Agent (Optional)
                      </span>
                      <input
                        type="text"
                        value={agency.agentName}
                        onChange={(e) => patchAgency(agency.id, { agentName: e.target.value })}
                        placeholder="Agent contact name"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Divisions / Boards (Optional, comma-separated)
                      </span>
                      <input
                        type="text"
                        value={(agency.specialties || []).join(', ')}
                        onChange={(e) =>
                          patchAgency(agency.id, {
                            specialties: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="e.g. Fashion, Editorial, Commercial, Runway"
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>

                    <label className="block sm:col-span-2">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#141414]/65">
                        Description (Optional)
                      </span>
                      <textarea
                        rows={3}
                        value={agency.description}
                        onChange={(e) => patchAgency(agency.id, { description: e.target.value })}
                        placeholder="Division focus, territory notes, or representation summary..."
                        className="mt-1 w-full border border-[#141414]/25 px-3 py-2 text-xs"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssetPickerModal
        open={Boolean(pickerState)}
        onClose={() => setPickerState(null)}
        onSelect={(asset) => {
          if (!pickerState) return;
          if (pickerState.target === 'backdrop') {
            patchPage({ bottomCtaBackdropAssetId: asset.id });
          } else if (pickerState.agencyId) {
            patchAgency(
              pickerState.agencyId,
              pickerState.target === 'logo'
                ? { logoAssetId: asset.id }
                : { photoAssetId: asset.id }
            );
          }
        }}
      />
    </div>
  );
}
