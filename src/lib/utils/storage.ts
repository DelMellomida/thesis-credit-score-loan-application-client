// Minimal local persistence helper for pending uploads and drafts.
// Uses localStorage for metadata. For storing file blobs use IndexedDB (not implemented here).

const PENDING_UPLOADS_KEY = 'pending_uploads_v1';

export interface PendingUploadMeta {
  id: string; // idempotency key
  applicationId: string;
  field?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: number;
  status?: 'pending' | 'uploading' | 'completed' | 'failed';
}

export function getPendingUploads(): PendingUploadMeta[] {
  try {
    const raw = localStorage.getItem(PENDING_UPLOADS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingUploadMeta[];
  } catch (e) {
    console.error('Failed to read pending uploads from localStorage', e);
    return [];
  }
}

export function setPendingUpload(meta: PendingUploadMeta) {
  const list = getPendingUploads();
  const filtered = list.filter(item => item.id !== meta.id);
  filtered.push(meta);
  try {
    localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save pending upload to localStorage', e);
  }
}

export function removePendingUpload(id: string) {
  const list = getPendingUploads();
  const filtered = list.filter(item => item.id !== id);
  try {
    localStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to remove pending upload from localStorage', e);
  }
}

export function clearPendingUploads() {
  try {
    localStorage.removeItem(PENDING_UPLOADS_KEY);
  } catch (e) {
    console.error('Failed to clear pending uploads', e);
  }
}
