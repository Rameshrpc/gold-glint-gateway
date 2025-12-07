import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageCaptureProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  clientId: string;
}

export default function ImageCapture({ label, value, onChange, folder, clientId }: ImageCaptureProps) {
  const [uploading, setUploading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMobile = useIsMobile();

  // Fetch signed URL when value changes
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (value) {
        const { data, error } = await supabase.storage
          .from('loan-documents')
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
  }, [value]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${clientId}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      onChange(filePath);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      uploadImage(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCameraClick = () => {
    if (isMobile) {
      // On mobile, use native camera input with capture attribute
      cameraInputRef.current?.click();
    } else {
      // On desktop, use WebRTC
      startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCapturing(true);
    } catch (error) {
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            uploadImage(file);
          }
        }, 'image/jpeg', 0.8);
      }
      stopCamera();
    }
  };

  const removeImage = () => {
    onChange(null);
    setImageUrl(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {capturing ? (
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-48 object-cover rounded"
            />
            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-1" /> Capture
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : value && imageUrl ? (
        <Card className="overflow-hidden">
          <CardContent className="p-2 relative">
            <img 
              src={imageUrl} 
              alt={label} 
              className="w-full h-48 object-cover rounded"
            />
            <Button 
              type="button"
              variant="destructive" 
              size="icon" 
              className="absolute top-3 right-3 h-8 w-8"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleCameraClick} disabled={uploading}>
                <Camera className="h-4 w-4 mr-1" /> Camera
              </Button>
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* File picker input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {/* Camera capture input for mobile - uses native camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
