import { isSupabaseEnabled, supabase } from './supabase.ts';
import { saveMediaAssetToSupabase } from './supabaseSync.ts';
import type { MediaAsset } from '../types/cms.ts';

export type CloudinaryPreset =
  | 'hero'
  | 'portfolio-card'
  | 'portfolio-lightbox'
  | 'digitals'
  | 'digitals-bw'
  | 'thumbnail'
  | 'portrait';

const PRESET_TRANSFORMS: Record<CloudinaryPreset, string> = {
  hero: 'f_auto,q_auto:good,w_1920,c_limit',
  'portfolio-card': 'f_auto,q_auto:good,w_1000,c_fill,g_face',
  'portfolio-lightbox': 'f_auto,q_auto:best,w_1800,c_limit',
  digitals: 'f_auto,q_auto:good,w_800,c_fill,g_face',
  'digitals-bw': 'f_auto,q_auto:good,w_900,c_fill,g_face,e_grayscale',
  thumbnail: 'f_auto,q_auto,w_240,h_320,c_fill,g_face',
  portrait: 'f_auto,q_auto:good,w_1100,c_fill,g_face',
};

export function getOptimizedCloudinaryUrl(
  asset: MediaAsset | undefined,
  preset: CloudinaryPreset = 'portfolio-card'
): string {
  if (!asset || !asset.secureUrl) return '';
  const url = asset.secureUrl;

  // Apply Cloudinary on-the-fly transformations when served from res.cloudinary.com
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const transform = PRESET_TRANSFORMS[preset];
    // If the transformation is already in place, return as is
    if (url.includes(`/upload/${transform}/`)) {
      return url;
    }
    // If there is an existing transformation segment right after /upload/, replace it
    const existingTransformRegex = /\/upload\/(?:[a-z0-9_:,]+)\/(v\d+\/.*)$/;
    if (existingTransformRegex.test(url)) {
      return url.replace(existingTransformRegex, `/upload/${transform}/$1`);
    }
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  return url;
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
  tags?: string;
}

export async function requestCloudinarySignature(
  folder: string,
  tags: string[],
  adminToken: string | null
): Promise<SignedUploadParams> {
  if (isSupabaseEnabled && supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data, error } = await supabase.functions.invoke('cloudinary-sign', {
        body: { folder, tags },
      });
      if (!error && data?.signature) {
        return data as SignedUploadParams;
      }
    }
  }

  const res = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify({ folder, tags }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || 'Unable to generate Cloudinary upload signature');
  }

  return (await res.json()) as SignedUploadParams;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

export async function uploadFileToCloudinary(
  file: File,
  options: {
    assetName: string;
    altText: string;
    folder: string;
    tags: string[];
  },
  adminToken: string | null
): Promise<MediaAsset> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image format. Please upload JPEG, PNG, WEBP, or AVIF files.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds the 15 MB upload limit.');
  }

  const signed = await requestCloudinarySignature(options.folder, options.tags, adminToken);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.api_key);
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder);
  if (signed.tags) {
    formData.append('tags', signed.tags);
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloud_name}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Cloudinary direct upload failed');
  }

  const result = await uploadRes.json();

  const newAsset: MediaAsset = {
    id: `asset-${crypto.randomUUID().slice(0, 8)}`,
    assetName: options.assetName || file.name.replace(/\.[^.]+$/, ''),
    cloudinaryPublicId: result.public_id,
    cloudinaryAssetId: result.asset_id || '',
    secureUrl: result.secure_url,
    resourceType: result.resource_type || 'image',
    format: result.format || 'jpg',
    width: result.width || 0,
    height: result.height || 0,
    fileSize: result.bytes || file.size,
    altText: options.altText || options.assetName || file.name,
    folder: options.folder,
    tags: options.tags,
    isPlaceholder: false,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseEnabled && supabase) {
    await saveMediaAssetToSupabase(supabase, newAsset).catch(() => null);
  }

  return newAsset;
}

export async function uploadCompCardPdfToCloudinary(
  file: File,
  adminToken: string | null
): Promise<{ secureUrl: string; publicId: string; fileName: string }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Comp-card upload must be a PDF document.');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('Comp-card PDF exceeds the 25 MB limit.');
  }

  const signed = await requestCloudinarySignature('abibat/comp-cards', ['comp-card', 'pdf'], adminToken);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signed.api_key);
  formData.append('timestamp', String(signed.timestamp));
  formData.append('signature', signed.signature);
  formData.append('folder', signed.folder);
  if (signed.tags) {
    formData.append('tags', signed.tags);
  }

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloud_name}/auto/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errData = await uploadRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Cloudinary PDF upload failed');
  }

  const result = await uploadRes.json();
  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    fileName: file.name,
  };
}

