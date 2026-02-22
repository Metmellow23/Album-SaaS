'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AlbumSize, PhotoBox as PhotoBoxType, ImageData } from '@/lib/types';
import PhotoBox from './PhotoBox';
import { cn } from '@/lib/utils';

interface CanvasProps {
  albumSize: AlbumSize;
  boxes: PhotoBoxType[];
  images: ImageData[];
  activeBoxId: string | null;
  isPanMode: boolean;
  isExporting?: boolean;
  onBoxUpdate: (boxId: string, updates: Partial<PhotoBoxType>) => void;
  onImageUpdate: (imageId: string, updates: Partial<ImageData>) => void; // EKLENDİ
  onBoxActivate: (boxId: string | null) => void;
  onBoxDelete: (boxId: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  albumSize,
  boxes,
  images,
  activeBoxId,
  isPanMode,
  isExporting,
  onBoxUpdate,
  onImageUpdate, // EKLENDİ
  onBoxActivate,
  onBoxDelete,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const calculateScale = () => {
    if (!wrapperRef.current || !canvasRef.current) return;

    const wrapper = wrapperRef.current;
    const availableWidth = wrapper.clientWidth - 80;
    const availableHeight = wrapper.clientHeight - 80;

    const scaleW = availableWidth / albumSize.canvasWidth;
    const scaleH = availableHeight / albumSize.canvasHeight;
    const newScale = Math.min(scaleW, scaleH, 1);

    setScale(Math.max(newScale, 0.1));
  };

  useEffect(() => {
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [albumSize]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onBoxActivate(null);
    }
  };

  const handleBoxUpdate = (boxId: string, updates: Partial<PhotoBoxType>) => {
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    let newLeft = updates.left ?? box.left;
    let newTop = updates.top ?? box.top;
    const newWidth = updates.width ?? box.width;
    const newHeight = updates.height ?? box.height;

    // Canvas sınırları içinde tutma
    newLeft = Math.max(0, Math.min(newLeft, albumSize.canvasWidth - newWidth));
    newTop = Math.max(0, Math.min(newTop, albumSize.canvasHeight - newHeight));

    onBoxUpdate(boxId, {
      ...updates,
      left: newLeft,
      top: newTop,
    });
  };

  const MM_TO_PX = 3.78;
  const bleedSize = 3 * MM_TO_PX;

  return (
    <div
      ref={wrapperRef}
      className="flex-1 flex items-center justify-center p-10 bg-gray-100 overflow-auto"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className="transition-transform duration-300"
      >
        <div
          ref={canvasRef}
          id="album-canvas"
          className={cn(
            'relative bg-white shadow-2xl',
            'border-2 border-gray-800'
          )}
          style={{
            width: `${albumSize.canvasWidth}px`,
            height: `${albumSize.canvasHeight}px`,
            backgroundImage: `
              linear-gradient(45deg, #f5f5f5 25%, transparent 25%),
              linear-gradient(-45deg, #f5f5f5 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
              linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }}
          onClick={handleCanvasClick}
        >
          {/* Photo Boxes */}
          {boxes.map((box) => {
            const imageData = images.find((img) => img.id === box.imageId);
            if (!imageData) return null;

            return (
              // components/editor/Canvas.tsx - PhotoBox render kısmı

// components/editor/Canvas.tsx - PhotoBox render kısmını güncelleyin

<PhotoBox
  key={box.id}
  box={box}
  imageData={imageData}
  isActive={activeBoxId === box.id}
  isPanMode={isPanMode}
  canvasScale={scale}
  albumSize={albumSize}
  allBoxes={boxes}  // ✅ ADD THIS!
  onUpdate={(updates) => handleBoxUpdate(box.id, updates)}
  onImageUpdate={onImageUpdate}
  onActivate={() => onBoxActivate(box.id)}
  onDelete={() => onBoxDelete(box.id)}
/>
            );
          })}

          {!isExporting && (
            <div
              className="absolute inset-0 border-red-600/30 pointer-events-none z-[100]"
              style={{ borderWidth: `${bleedSize}px` }}
            />
          )}
          {!isExporting && (
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-900/50 pointer-events-none z-[101]" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Canvas;