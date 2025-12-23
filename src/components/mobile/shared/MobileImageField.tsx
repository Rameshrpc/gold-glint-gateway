import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MobileImageFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  clientId: string;
  bucket?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function MobileImageField({
  label,
  value,
  onChange,
  folder,
  clientId,
  bucket = 'customer-documents',
  required = false,
  error,
  className,
}: MobileImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch signed URL when value changes
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (value) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(value, 3600); // 1 hour expiry
        if (data && !error) {
          setImageUrl(data.signedUrl);
        } else {
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };
    fetchSignedUrl();
  }, [value, bucket]);

  const addTimestampToCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const fontSize = Math.max(14, Math.floor(canvas.width / 45));
    ctx.font = `bold ${fontSize}px Arial`;

    const textMetrics = ctx.measureText(timestamp);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = 6;
    const margin = 8;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      margin - padding,
      canvas.height - textHeight - margin - padding,
      textWidth + padding * 2,
      textHeight + padding * 2
    );

    ctx.fillStyle = '#FF8C00';
    ctx.textBaseline = 'bottom';
    ctx.fillText(timestamp, margin, canvas.height - margin);
  };

  const processAndUpload = async (file: File) => {
    setUploading(true);
    try {
      // Create image from file and add timestamp
      const img = new Image();
      const reader = new FileReader();

      await new Promise<void>((resolve, reject) => {
        reader.onload = (e) => {
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
              reject(new Error('Canvas not available'));
              return;
            }

            // Resize if too large (max 1920px)
            let width = img.width;
            let height = img.height;
            const maxDim = 1920;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context not available'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            addTimestampToCanvas(canvas);

            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  const timestamp = Date.now();
                  const fileExt = 'jpg';
                  const fileName = `${folder}_${timestamp}.${fileExt}`;
                  const filePath = `${clientId}/${folder}/${fileName}`;

                  const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, blob, { contentType: 'image/jpeg' });

                  if (uploadError) {
                    reject(uploadError);
                    return;
                  }

                  onChange(filePath);
                  toast.success('Image uploaded');
                  resolve();
                } else {
                  reject(new Error('Failed to create blob'));
                }
              },
              'image/jpeg',
              0.85
            );
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      processAndUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const removeImage = async () => {
    if (value) {
      try {
        await supabase.storage.from(bucket).remove([value]);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    onChange(null);
    setImageUrl(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {value && imageUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
          <img
            src={imageUrl}
            alt={label}
            className="w-full h-40 object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-4 bg-muted/30 transition-colors',
            error ? 'border-destructive' : 'border-border',
            uploading && 'opacity-60'
          )}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Camera className="w-4 h-4" />
                    Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted text-foreground text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Upload className="w-4 h-4" />
                    Gallery
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
