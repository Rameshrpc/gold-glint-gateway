/**
 * Storage URL utility functions
 * Converts relative storage paths to full public URLs or signed URLs for private buckets
 */

import { supabase } from '@/integrations/supabase/client';

const SUPABASE_PROJECT_ID = 'lsyzbxogbjourwgchisg';
const SUPABASE_STORAGE_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;

/**
 * Convert a relative storage path to a full public URL
 * @param bucket - The storage bucket name (e.g., 'customer-documents', 'loan-documents')
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
 * Get public URL for customer document (aadhaar, pan, photo) - for public buckets only
 */
export function getCustomerDocumentUrl(path: string | null | undefined): string | null {
  return getPublicStorageUrl('customer-documents', path);
}

/**
 * Get public URL for loan assets (jewel photos, appraiser sheets) - for public buckets only
 */
export function getLoanAssetUrl(path: string | null | undefined): string | null {
  return getPublicStorageUrl('loan-documents', path);
}

/**
 * Get signed URL for customer document (aadhaar, pan, photo) - for private buckets
 * @param path - The file path in the bucket
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL or null
 */
export async function getSignedCustomerDocumentUrl(
  path: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const { data, error } = await supabase.storage
    .from('customer-documents')
    .createSignedUrl(cleanPath, expiresIn);
  
  if (error) {
    console.error('Error creating signed URL for customer document:', error);
    return null;
  }
  
  return data?.signedUrl || null;
}

/**
 * Get signed URL for loan document (jewel photos, appraiser sheets) - for private buckets
 * @param path - The file path in the bucket
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Promise with signed URL or null
 */
export async function getSignedLoanDocumentUrl(
  path: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  const { data, error } = await supabase.storage
    .from('loan-documents')
    .createSignedUrl(cleanPath, expiresIn);
  
  if (error) {
    console.error('Error creating signed URL for loan document:', error);
    return null;
  }
  
  return data?.signedUrl || null;
}
