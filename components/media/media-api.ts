import * as ImagePicker from 'expo-image-picker';

import { apiRequest, type ApiEnvelope } from '@/components/auth/auth-api';

export type MediaFileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
export type PickedImage = ImagePicker.ImagePickerAsset;

export type CreateMediaPayload = {
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  altText?: string | null;
  isPublic: boolean;
};

export type MediaDetailResponse = {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
  altText: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url?: string;
  url?: string;
  resource_type?: string;
  original_filename?: string;
  format?: string;
  bytes?: number;
};

type PickImageOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  allowsMultipleSelection?: boolean;
  quality?: number;
  selectionLimit?: number;
};

type UploadImageOptions = {
  altText?: string | null;
  folder?: string;
  isPublic: boolean;
};

const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
const defaultFolder = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_FOLDER?.trim();

export async function pickImageFromLibrary(options: PickImageOptions = {}): Promise<PickedImage | null> {
  const assets = await pickImagesFromLibrary({
    ...options,
    allowsMultipleSelection: false,
    selectionLimit: 1,
  });

  return assets[0] ?? null;
}

export async function pickImagesFromLibrary(options: PickImageOptions = {}): Promise<PickedImage[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Photo library permission is required to choose an image.');
  }

  const allowsMultipleSelection = options.allowsMultipleSelection ?? false;
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: allowsMultipleSelection ? false : (options.allowsEditing ?? true),
    allowsMultipleSelection,
    aspect: options.aspect,
    mediaTypes: ['images'],
    quality: options.quality ?? 0.88,
    selectionLimit: options.selectionLimit,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets;
}

export async function uploadImageAndCreateMediaRecord(
  accessToken: string,
  asset: PickedImage,
  options: UploadImageOptions
) {
  const upload = await uploadImageToCloudinary(asset, options.folder);
  const response = await createMediaRecord(accessToken, toCreateMediaPayload(asset, upload, options));

  return response;
}

export async function createMediaRecord(accessToken: string, payload: CreateMediaPayload) {
  const response = await apiRequest<ApiEnvelope<MediaDetailResponse>>('/media', {
    accessToken,
    body: JSON.stringify(payload),
    method: 'POST',
  });

  return response.data;
}

async function uploadImageToCloudinary(asset: PickedImage, folder?: string) {
  if (!cloudName || !uploadPreset) {
    throw new Error('Missing Cloudinary config. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
  }

  if (!asset.uri) {
    throw new Error('Selected image is missing a local file URI.');
  }

  const formData = new FormData();
  const fileName = getAssetFileName(asset);
  const mimeType = asset.mimeType ?? guessMimeType(fileName);

  if (asset.file) {
    formData.append('file', asset.file);
  } else {
    formData.append('file', {
      name: fileName,
      type: mimeType,
      uri: asset.uri,
    } as any);
  }

  formData.append('upload_preset', uploadPreset);

  const targetFolder = folder ?? defaultFolder;
  if (targetFolder) {
    formData.append('folder', targetFolder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    body: formData,
    method: 'POST',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === 'string'
        ? payload.error.message
        : 'Cloudinary upload failed.';
    throw new Error(message);
  }

  return payload as CloudinaryUploadResponse;
}

function toCreateMediaPayload(
  asset: PickedImage,
  upload: CloudinaryUploadResponse,
  options: UploadImageOptions
): CreateMediaPayload {
  const fileUrl = upload.secure_url ?? upload.url;

  if (!fileUrl) {
    throw new Error('Cloudinary did not return a media URL.');
  }

  const fileName = getUploadedFileName(asset, upload);
  const mimeType = asset.mimeType ?? guessMimeType(fileName);
  const fileSize = Math.max(1, Number(upload.bytes ?? asset.fileSize ?? 1));

  return {
    altText: options.altText ?? null,
    fileName,
    fileSize,
    fileType: 'IMAGE',
    fileUrl,
    isPublic: options.isPublic,
    mimeType,
  };
}

function getUploadedFileName(asset: PickedImage, upload: CloudinaryUploadResponse) {
  const assetName = normalizeFileName(asset.fileName);

  if (assetName) {
    return assetName;
  }

  const originalName = normalizeFileName(upload.original_filename);
  const extension = upload.format?.replace(/^\./, '').toLowerCase();

  if (originalName && extension && !originalName.toLowerCase().endsWith(`.${extension}`)) {
    return `${originalName}.${extension}`;
  }

  return originalName ?? `helphub-image-${Date.now()}.${extension ?? 'jpg'}`;
}

function getAssetFileName(asset: PickedImage) {
  const fileName = normalizeFileName(asset.fileName);

  if (fileName) {
    return fileName;
  }

  const extension = getExtensionFromUri(asset.uri) ?? 'jpg';
  return `helphub-image-${Date.now()}.${extension}`;
}

function normalizeFileName(fileName?: string | null) {
  const normalized = fileName?.trim();
  return normalized ? normalized : null;
}

function getExtensionFromUri(uri: string) {
  const cleanUri = uri.split('?')[0] ?? uri;
  const match = cleanUri.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function guessMimeType(fileName: string) {
  const extension = getExtensionFromUri(fileName);

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  if (extension === 'gif') {
    return 'image/gif';
  }

  if (extension === 'heic' || extension === 'heif') {
    return 'image/heic';
  }

  return 'image/jpeg';
}
