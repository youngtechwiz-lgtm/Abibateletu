import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { useCms } from '../../context/CmsContext.tsx';
import { EditorialMediaFrame } from '../EditorialMediaFrame.tsx';
import type { MediaAsset } from '../../types/cms.ts';

interface AssetPickerModalProps {
  open: boolean;
  selectedAssetId?: string;
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  title?: string;
}

export function AssetPickerModal({
  open,
  selectedAssetId,
  onSelect,
  onClose,
  title = 'Select from Central Media Library',
}: AssetPickerModalProps) {
  const { state } = useCms();
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');

  const folders = useMemo(() => {
    const set = new Set(state.mediaAssets.map((a) => a.folder));
    return ['all', ...Array.from(set)];
  }, [state.mediaAssets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.mediaAssets.filter((asset) => {
      if (folderFilter !== 'all' && asset.folder !== folderFilter) return false;
      if (!q) return true;
      return (
        asset.assetName.toLowerCase().includes(q) ||
        asset.cloudinaryPublicId.toLowerCase().includes(q) ||
        asset.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [state.mediaAssets, query, folderFilter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col bg-[#F3F1ED] text-[#141414] border border-[#141414]/20">
        <div className="flex items-center justify-between border-b border-[#141414]/15 px-6 py-4">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#141414]/55">
              CLOUDINARY MEDIA LIBRARY
            </p>
            <h3 className="font-serif text-2xl font-light uppercase">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="flex h-9 w-9 items-center justify-center border border-[#141414]/20 hover:border-[#141414]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 border-b border-[#141414]/10 px-6 py-3.5 bg-white/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#141414]/45" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset name, folder, or tag..."
              className="w-full border border-[#141414]/20 bg-white pl-9 pr-3 py-2 text-xs focus:border-[#141414] focus:outline-none"
            />
          </div>
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="border border-[#141414]/20 bg-white px-3 py-2 text-xs focus:border-[#141414] focus:outline-none"
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder === 'all' ? 'All Folders' : folder}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((asset) => {
              const selected = asset.id === selectedAssetId;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
                  className={`group text-left border transition-colors ${
                    selected
                      ? 'border-[#141414] bg-white'
                      : 'border-[#141414]/15 bg-white/60 hover:border-[#141414]/60'
                  }`}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#1a1918]">
                    <EditorialMediaFrame
                      asset={asset}
                      preset="thumbnail"
                      showPlaceholderBadge={true}
                      className="h-full w-full"
                    />
                    {selected && (
                      <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center bg-[#141414] text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-[11px] font-medium text-[#141414]">
                      {asset.assetName}
                    </p>
                    <p className="truncate text-[10px] text-[#141414]/55">
                      {asset.folder}
                      {asset.isPlaceholder ? ' · Placeholder' : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
