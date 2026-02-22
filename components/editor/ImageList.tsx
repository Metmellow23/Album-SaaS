// components/editor/ImageList.tsx
'use client';

import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { ImageData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ImageListProps {
  images: ImageData[];
  selectedImageIds: string[];
  onImageClick: (imageId: string) => void;
  onImageDelete: (imageId: string) => void;
}

const ImageList: React.FC<ImageListProps> = ({
  images,
  selectedImageIds,
  onImageClick,
  onImageDelete,
}) => {
  const handleDelete = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this photo?')) {
      onImageDelete(imageId);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm">Upload photos to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((image) => {
        const isSelected = selectedImageIds.includes(image.id);

        return (
          <div
            key={image.id}
            onClick={() => onImageClick(image.id)}
            className={cn(
              'relative group aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
              'border-2 bg-white shadow-sm hover:shadow-md hover:scale-105',
              isSelected
                ? 'border-blue-900 ring-2 ring-blue-900/20'
                : 'border-gray-200 hover:border-gray-300'
            )}
            title={image.fileName}
          >
            {/* Thumbnail Image */}
            <img
              src={image.src}
              alt={image.fileName}
              className="w-full h-full object-cover"
            />

            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(e, image.id)}
              className={cn(
                'absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full',
                'flex items-center justify-center transition-all duration-200',
                'opacity-0 group-hover:opacity-100 hover:bg-red-700 hover:scale-110',
                'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
              aria-label="Delete image"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ImageList;