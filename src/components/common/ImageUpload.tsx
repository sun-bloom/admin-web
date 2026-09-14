import { useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mediaApi } from '@/lib/api';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  folder = 'products',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setInputError('Please enter a valid HTTP/HTTPS image URL');
      return;
    }

    if (value.length >= maxImages) {
      setInputError(`Maximum ${maxImages} images reached`);
      return;
    }

    onChange([...value, trimmed]);
    setImageUrlInput('');
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const result = await mediaApi.upload(file, folder);
    return result.secure_url;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxImages) {
        alert(`You can only upload up to ${maxImages} images`);
        return;
      }

      const validFiles = Array.from(files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large (max 5MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      setIsUploading(true);
      setUploadProgress('Uploading...');

      try {
        const uploadedUrls: string[] = [];

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}`);
          
          const url = await uploadToCloudinary(file);
          uploadedUrls.push(url);
        }

        onChange([...value, ...uploadedUrls]);
        setUploadProgress('');
      } catch (error) {
        console.error('Upload error:', error);
        alert(error instanceof Error ? error.message : 'Failed to upload image');
      } finally {
        setIsUploading(false);
        setUploadProgress('');
      }
    },
    [value, onChange, maxImages]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    const newUrls = [...value];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const newUrls = [...value];
    const [moved] = newUrls.splice(fromIndex, 1);
    newUrls.splice(toIndex, 0, moved);
    onChange(newUrls);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
            >
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 disabled:opacity-30"
                  title="Move left"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === value.length - 1}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100 disabled:opacity-30"
                  title="Move right"
                >
                  →
                </button>
              </div>

              {index === 0 && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  Main
                </div>
              )}

              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <div className="space-y-4">
          {/* Direct URL Form */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Paste image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              className="flex-1 px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => handleAddUrl()}
              disabled={!imageUrlInput.trim()}
              className="flex-shrink-0"
            >
              Add URL
            </Button>
          </div>
          {inputError && <p className="text-xs text-red-500">{inputError}</p>}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-border hover:border-muted-foreground/50',
              isUploading && 'opacity-50 pointer-events-none'
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-2">
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 mx-auto bg-muted rounded-full flex items-center justify-center">
                    {value.length === 0 ? (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {value.length === 0 ? 'Upload image files' : 'Upload more images'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground/75 mt-0.5">
                      PNG, JPG, WEBP up to 5MB • {value.length} of {maxImages} images
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {value.length >= maxImages && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum {maxImages} images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
