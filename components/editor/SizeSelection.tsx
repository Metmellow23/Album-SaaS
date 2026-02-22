// components/editor/SizeSelection.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { AlbumSize, ALBUM_SIZES } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const SizeSelection: React.FC = () => {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<AlbumSize | null>(null);

  const handleSizeSelect = (size: AlbumSize) => {
    setSelectedSize(size);
  };

  const handleContinue = () => {
    if (!selectedSize) return;

    // Save selected size to localStorage for editor page
    localStorage.setItem('selectedAlbumSize', JSON.stringify(selectedSize));

    // Navigate to editor
    router.push('/editor');
  };

  const renderPreviewBox = (size: AlbumSize) => {
    const maxPreviewWidth = 120;
    const maxPreviewHeight = 60;
    
    let previewWidth = maxPreviewWidth;
    let previewHeight = maxPreviewWidth / size.previewAspectRatio;

    if (previewHeight > maxPreviewHeight) {
      previewHeight = maxPreviewHeight;
      previewWidth = maxPreviewHeight * size.previewAspectRatio;
    }

    return (
      <div className="w-36 h-20 flex items-center justify-center mb-4 border-2 border-blue-900 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 p-2">
        <div
          className="bg-blue-900/40 rounded-sm relative border border-dashed border-white/60 transition-all duration-300"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
          }}
        >
          {/* Center divider line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-semibold text-blue-900 mb-3">
          Album Designer Beta V0.2
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Create professional photo albums with KRM Prints quality. Select your
          album size, upload photos, and arrange them on the pages.
        </p>
      </div>

      {/* Size Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-5xl mx-auto mb-8">
        {ALBUM_SIZES.map((size) => (
          <Card
            key={size.id}
            selected={selectedSize?.id === size.id}
            clickable
            hoverable
            onClick={() => handleSizeSelect(size)}
            className="p-5 flex flex-col items-center text-center cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`Select ${size.name} ${size.dimensions}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSizeSelect(size);
              }
            }}
          >
            {/* Preview Box */}
            {renderPreviewBox(size)}

            {/* Size Info */}
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900 text-base">
                {size.name}
              </h3>
              <p className="text-sm text-gray-500">{size.dimensions}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          variant="primary"
          size="lg"
          disabled={!selectedSize}
          onClick={handleContinue}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="shadow-xl min-w-[200px]"
        >
          Continue to Designer
        </Button>
      </div>

      {/* Help Text */}
      {selectedSize && (
        <p className="text-center text-sm text-gray-500 mt-4 animate-in fade-in duration-300">
          Selected: <span className="font-medium text-blue-900">{selectedSize.name}</span>
        </p>
      )}
    </div>
  );
};

export default SizeSelection;