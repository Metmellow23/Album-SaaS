// components/editor/RightPanel.tsx
'use client';

import React from 'react';
import { ImageData, PhotoBox } from '@/lib/types';
import { Image as ImageIcon, Maximize2, RotateCw, Droplet, Square } from 'lucide-react';

interface RightPanelProps {
  selectedBox: PhotoBox | null;
  selectedImage: ImageData | null;
  onBoxUpdate: (updates: Partial<PhotoBox>) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  selectedBox,
  selectedImage,
  onBoxUpdate,
}) => {
  if (!selectedBox || !selectedImage) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a photo to edit properties</p>
          </div>
        </div>
      </aside>
    );
  }

  const imgWidth = selectedImage.naturalWidth;
  const imgHeight = selectedImage.naturalHeight;
  const imgRatio = imgWidth / imgHeight;
  
  const boxRatio = selectedBox.width / selectedBox.height;
  
  // ========================================
  // CORRECTED: CSS object-position compatible calculation
  // ========================================
  
  // 1. Determine which offset is relevant based on fit mode
  let relevantOffsetX: number;
  let relevantOffsetY: number;
  
  if (boxRatio > imgRatio) {
    // Canvas box wider - only vertical panning possible
    relevantOffsetX = 50; // Fixed center
    relevantOffsetY = selectedImage.offsetY; // Active
  } else if (boxRatio < imgRatio) {
    // Canvas box narrower - only horizontal panning possible
    relevantOffsetX = selectedImage.offsetX; // Active
    relevantOffsetY = 50; // Fixed center
  } else {
    // Same ratio - no panning
    relevantOffsetX = 50;
    relevantOffsetY = 50;
  }
  
  // 2. Calculate indicator dimensions (as percentage of image)
  let indicatorW_Percent: number;
  let indicatorH_Percent: number;
  
  if (boxRatio > imgRatio) {
    // Box wider - fits to width
    indicatorW_Percent = 100 / selectedBox.scale;
    indicatorH_Percent = (imgRatio / boxRatio) * (100 / selectedBox.scale);
  } else {
    // Box narrower - fits to height
    indicatorW_Percent = (boxRatio / imgRatio) * (100 / selectedBox.scale);
    indicatorH_Percent = 100 / selectedBox.scale;
  }
  
  // 3. ✅ CORRECTED: CSS object-position compatible formula
  // Position = Offset × (Total Space - Visible Space) / 100
  const indicatorLeft = relevantOffsetX * (100 - indicatorW_Percent) / 100;
  const indicatorTop = relevantOffsetY * (100 - indicatorH_Percent) / 100;

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <p className="text-xs text-gray-500 mt-1">
          Yellow frame shows canvas box area
        </p>
      </div>

      {/* Image Preview */}
      <div className="p-4 border-b border-gray-200">
        {/* Dynamic aspect ratio - matches image exactly */}
        <div 
          className="relative w-full rounded-lg bg-gray-800 border-2 overflow-hidden"
          style={{
            aspectRatio: `${imgWidth} / ${imgHeight}`,
            maxHeight: '400px',
            borderWidth: `${Math.max(selectedBox.borderWidth, 2)}px`,
            borderColor: selectedBox.borderWidth > 0 ? '#1e3a8a' : '#374151',
          }}
        >
          {/* Full Image */}
          <img
            src={selectedImage.src}
            alt={selectedImage.fileName}
            className="absolute inset-0 w-full h-full object-cover select-none"
            style={{
              opacity: selectedBox.opacity / 100,
              objectPosition: `${relevantOffsetX}% ${relevantOffsetY}%`,
            }}
            draggable={false}
          />

          {/* Crop Indicator - CSS object-position compatible */}
          <div
            className="absolute pointer-events-none transition-none z-10"
            style={{
              width: `${indicatorW_Percent}%`,
              height: `${indicatorH_Percent}%`,
              left: `${indicatorLeft}%`,
              top: `${indicatorTop}%`,
              transform: `rotate(${selectedBox.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div 
              className="absolute inset-0 border-[3px] border-yellow-400"
              style={{
                boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.6)',
              }}
            />
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            
            {/* Corner markers */}
            <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md" />
            <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md" />
            <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md" />

            {/* Crosshair */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-400/50" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-400/50" />
            </div>
          </div>

          {/* Info Badges */}
          <div className="absolute top-2 left-2 flex gap-1 z-20">
            {selectedBox.scale !== 1 && (
              <div className="bg-blue-900/90 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm">
                {selectedBox.scale.toFixed(1)}×
              </div>
            )}
            <div className="bg-gray-900/90 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
              {indicatorW_Percent.toFixed(0)}% × {indicatorH_Percent.toFixed(0)}%
            </div>
          </div>

          {selectedBox.rotation !== 0 && (
            <div className="absolute top-2 right-2 bg-yellow-400/90 text-gray-900 text-xs font-bold px-2 py-1 rounded backdrop-blur-sm z-20">
              {selectedBox.rotation.toFixed(0)}°
            </div>
          )}

          <div className="absolute bottom-2 left-2 bg-purple-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20">
            {boxRatio > imgRatio ? 'Fit: Width' : 'Fit: Height'}
          </div>

          <div className="absolute bottom-2 right-2 bg-green-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20">
            Pan: {selectedImage.offsetX.toFixed(0)}%, {selectedImage.offsetY.toFixed(0)}%
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-700 font-medium truncate" title={selectedImage.fileName}>
          {selectedImage.fileName}
        </p>
        <p className="text-xs text-gray-500">
          {selectedImage.naturalWidth} × {selectedImage.naturalHeight}px
        </p>
      </div>

      {/* Controls */}
      <div className="flex-1 p-4 space-y-6">
        <PropertySlider
          icon={<Maximize2 className="w-4 h-4" />}
          label="Scale (Zoom)"
          value={selectedBox.scale}
          min={1}
          max={3}
          step={0.1}
          unit="×"
          onChange={(value) => onBoxUpdate({ scale: value })}
        />

        <PropertySlider
          icon={<RotateCw className="w-4 h-4" />}
          label="Rotation"
          value={selectedBox.rotation}
          min={0}
          max={360}
          step={1}
          unit="°"
          onChange={(value) => onBoxUpdate({ rotation: value })}
        />

        <PropertySlider
          icon={<Droplet className="w-4 h-4" />}
          label="Opacity"
          value={selectedBox.opacity}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(value) => onBoxUpdate({ opacity: value })}
        />

        <PropertySlider
          icon={<Square className="w-4 h-4" />}
          label="Border"
          value={selectedBox.borderWidth}
          min={0}
          max={20}
          step={1}
          unit="px"
          onChange={(value) => onBoxUpdate({ borderWidth: value })}
        />
      </div>
    </aside>
  );
};

interface PropertySliderProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const PropertySlider: React.FC<PropertySliderProps> = ({
  icon,
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-sm font-semibold text-blue-900">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #1e3a8a 0%, #1e3a8a ${
            ((value - min) / (max - min)) * 100
          }%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
        }}
      />
    </div>
  );
};

export default RightPanel;