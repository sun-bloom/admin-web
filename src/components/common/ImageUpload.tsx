import { useState, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
  className?: string;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'products';

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

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
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
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
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
          
          <div className="space-y-3">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 mx-auto text-blue-500 animate-spin" />
                <p className="text-sm text-gray-600">{uploadProgress}</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  {value.length === 0 ? (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  ) : (
                    <Upload className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {value.length === 0 ? 'Upload product images' : 'Add more images'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB • {value.length} of {maxImages} images
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {value.length >= maxImages && (
        <p className="text-sm text-gray-500 text-center">
          Maximum {maxImages} images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
