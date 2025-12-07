import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiFileUploadProps {
  label: string;
  files: File[];
  existingUrls?: string[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting?: (url: string) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function MultiFileUpload({
  label,
  files,
  existingUrls = [],
  onFilesChange,
  onRemoveExisting,
  accept = 'image/*',
  maxFiles = 10,
  maxSize = 5,
  required = false,
  disabled = false,
  className
}: MultiFileUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles: File[] = [];
    const currentTotal = files.length + existingUrls.length;

    Array.from(newFiles).forEach((file, index) => {
      if (currentTotal + validFiles.length >= maxFiles) return;
      
      if (file.size > maxSize * 1024 * 1024) {
        return;
      }
      
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      onFilesChange(updatedFiles);

      // Generate previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    onFilesChange(updatedFiles);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const totalFiles = files.length + existingUrls.length;
  const canAddMore = totalFiles < maxFiles;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        <span className="text-xs text-muted-foreground">
          {totalFiles}/{maxFiles} files
        </span>
      </div>

      {/* Upload Area */}
      {canAddMore && !disabled && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag & drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxSize}MB per file
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled}
          />
        </div>
      )}

      {/* File Previews */}
      {(existingUrls.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {/* Existing URLs */}
          {existingUrls.map((url, index) => (
            <div key={`existing-${index}`} className="relative group aspect-square">
              <img
                src={url}
                alt={`Existing ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              {onRemoveExisting && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(url)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* New File Previews */}
          {previews.map((preview, index) => (
            <div key={`preview-${index}`} className="relative group aspect-square">
              <img
                src={preview}
                alt={`New ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {totalFiles === 0 && disabled && (
        <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/20">
          <FileImage className="h-5 w-5 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">No files uploaded</span>
        </div>
      )}
    </div>
  );
}
