import { supabase } from '@/integrations/supabase/client';

/**
 * Get a signed URL for a private storage file
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns The signed URL or null if error
 */
export async function getSignedUrl(
  bucket: string,
  path: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null;
  
  // If it's already a full URL (legacy data), extract the path
  let filePath = path;
  if (path.includes('/storage/v1/object/public/')) {
    // Extract path after bucket name
    const bucketMarker = `/storage/v1/object/public/${bucket}/`;
    const idx = path.indexOf(bucketMarker);
    if (idx !== -1) {
      filePath = path.substring(idx + bucketMarker.length);
    }
  }
  
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Exception creating signed URL:', err);
    return null;
  }
}

/**
 * Upload a file and return just the path (not the public URL)
 * @param bucket - The storage bucket name
 * @param filePath - The file path to store the file at
 * @param file - The file to upload
 * @returns The file path or throws an error
 */
export async function uploadFile(
  bucket: string,
  filePath: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);
    
  if (error) throw error;
  
  // Return just the path, not the public URL
  return filePath;
}
