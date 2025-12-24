/**
 * Storage URL utility functions
 * Converts relative storage paths to full public URLs
 */

const SUPABASE_PROJECT_ID = 'lsyzbxogbjourwgchisg';
const SUPABASE_STORAGE_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;

/**
 * Convert a relative storage path to a full public URL
 * @param bucket - The storage bucket name (e.g., 'customer-documents', 'loan-assets')
 * @param path - The file path (can be relative or absolute)
 * @returns The full public URL
 */
export function getPublicStorageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path) return null;
  
  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${SUPABASE_STORAGE_BASE}/${bucket}/${cleanPath}`;
}

/**
 * Get public URL for customer document (aadhaar, pan, photo)
 */
export function getCustomerDocumentUrl(path: string | null | undefined): string | null {
  return getPublicStorageUrl('customer-documents', path);
}

/**
 * Get public URL for loan assets (jewel photos, appraiser sheets)
 */
export function getLoanAssetUrl(path: string | null | undefined): string | null {
  return getPublicStorageUrl('loan-assets', path);
}
