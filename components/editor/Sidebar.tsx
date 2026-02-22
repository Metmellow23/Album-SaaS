// components/editor/Sidebar.tsx
'use client';

import React, { useRef } from 'react';
import { Upload, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import ImageList from './ImageList';
import { ImageData } from '@/lib/types';

interface SidebarProps {
  images: ImageData[];
  selectedImageIds: string[];
  onImagesUpload: (files: FileList) => void;
  onImageClick: (imageId: string) => void;
  onImageDelete: (imageId: string) => void;
  isLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  images,
  selectedImageIds,
  onImagesUpload,
  onImageClick,
  onImageDelete,
  isLoading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImagesUpload(files);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  };

  return (
    <aside className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Photo Library
        </h3>
        <p className="text-xs text-gray-500">
          {images.length} {images.length === 1 ? 'photo' : 'photos'} uploaded
        </p>
      </div>

      {/* Upload Button */}
      <div className="p-4 border-b border-gray-200">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload photos"
        />
        <Button
          variant="primary"
          fullWidth
          leftIcon={<Upload className="w-4 h-4" />}
          onClick={handleUploadClick}
          isLoading={isLoading}
        >
          Upload Photos
        </Button>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto p-4">
        <ImageList
          images={images}
          selectedImageIds={selectedImageIds}
          onImageClick={onImageClick}
          onImageDelete={onImageDelete}
        />
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <div className="flex gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            Click on photos to add them to your album. Selected photos will be
            highlighted.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;