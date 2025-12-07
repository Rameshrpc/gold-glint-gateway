import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File, preview: string) => void;
  label?: string;
}

export default function CameraCapture({ open, onClose, onCapture, label = 'Photo' }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please check permissions.');
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream, onClose]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [open]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && stream) {
      startCamera();
    }
  }, [facingMode]);

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

    // Calculate font size based on image width
    const fontSize = Math.max(16, Math.floor(canvas.width / 40));
    ctx.font = `bold ${fontSize}px Arial`;
    
    // Measure text for background
    const textMetrics = ctx.measureText(timestamp);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    const padding = 8;
    const margin = 10;

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      margin - padding, 
      canvas.height - textHeight - margin - padding, 
      textWidth + padding * 2, 
      textHeight + padding * 2
    );

    // Draw timestamp text in orange
    ctx.fillStyle = '#FF8C00'; // Dark orange color
    ctx.textBaseline = 'bottom';
    ctx.fillText(timestamp, margin, canvas.height - margin);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add timestamp overlay
    addTimestampToCanvas(canvas);

    // Convert to blob and create file
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
          
          {/* Camera switch button */}
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
            onClick={capturePhoto}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            disabled={!stream}
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
