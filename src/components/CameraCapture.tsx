import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, preview: string) => void;
  label?: string;
}

// Check if device is mobile
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

export default function CameraCapture({ open, onClose, onCapture, label = 'Photo' }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Don't start camera on mobile - we use native input
    if (isMobile) return;
    
    setIsLoading(true);
    try {
      // Stop any existing stream first
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, isMobile, stopCamera, onClose]);

  // Handle dialog open/close
  useEffect(() => {
    if (open && !isMobile) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open, isMobile, startCamera, stopCamera]);

  // Handle facing mode change (desktop only)
  useEffect(() => {
    if (open && !isMobile && streamRef.current) {
      startCamera();
    }
  }, [facingMode, open, isMobile, startCamera]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

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
      hour12: true
    });

    const fontSize = Math.max(16, Math.floor(canvas.width / 40));
    ctx.font = `bold ${fontSize}px Arial`;
    
    const textMetrics = ctx.measureText(timestamp);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = 8;
    const margin = 10;

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

  // Handle native file input for mobile
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Create image from file
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Add timestamp
          addTimestampToCanvas(canvas);

          // Convert to blob and file
          canvas.toBlob((blob) => {
            if (blob) {
              const timestamp = Date.now();
              const newFile = new File([blob], `capture_${timestamp}.jpg`, { type: 'image/jpeg' });
              const preview = canvas.toDataURL('image/jpeg', 0.9);
              
              onCapture(newFile, preview);
              onClose();
            }
          }, 'image/jpeg', 0.9);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process image');
    } finally {
      setIsLoading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Capture from webcam (desktop)
  const captureFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    addTimestampToCanvas(canvas);

    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = Date.now();
        const file = new File([blob], `capture_${timestamp}.jpg`, { type: 'image/jpeg' });
        const preview = canvas.toDataURL('image/jpeg', 0.9);
        
        stopCamera();
        onCapture(file, preview);
        onClose();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Mobile: Use native camera input
  if (isMobile && open) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Capture {label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            {/* Camera capture button */}
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5 cursor-pointer tap-scale transition-all hover:bg-primary/10">
              <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <span className="text-sm font-medium">Take Photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            {/* Gallery option */}
            <label className="flex flex-col items-center justify-center gap-3 p-6 border border-border rounded-2xl bg-card cursor-pointer tap-scale transition-all hover:bg-muted">
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Choose from Gallery</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <Button variant="outline" onClick={handleClose} className="w-full">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: Use WebRTC camera stream
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture {label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-white">Starting camera...</div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 sm:h-80 object-cover"
          />
          
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
            onClick={switchCamera}
          >
            <RotateCcw className="h-4 w-4 text-white" />
          </Button>
        </div>

        <div className="p-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={captureFromWebcam}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            disabled={!streamRef.current}
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
