// components/editor/PhotoBox.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ImageData, PhotoBox as PhotoBoxType, AlbumSize } from '@/lib/types';
import { cn } from '@/lib/utils';

type SnapLine = { type: 'horizontal' | 'vertical'; position: number };

interface PhotoBoxProps {
  box: PhotoBoxType;
  imageData: ImageData;
  isActive: boolean;
  isPanMode: boolean;
  canvasScale: number;
  albumSize: AlbumSize;
  allBoxes: PhotoBoxType[];
  onUpdate: (updates: Partial<PhotoBoxType>) => void;
  onImageUpdate: (imageId: string, updates: Partial<ImageData>) => void;
  onActivate: () => void;
  onDelete: () => void;
  onSnapLines?: (lines: SnapLine[]) => void;
}

const PhotoBox: React.FC<PhotoBoxProps> = ({
  box,
  imageData,
  isActive,
  isPanMode,
  canvasScale,
  albumSize,
  allBoxes,
  onUpdate,
  onImageUpdate,
  onActivate,
  onDelete,
  onSnapLines,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const SNAP_TOLERANCE = 10;
  const canvasWidth = albumSize.canvasWidth;
  const canvasHeight = albumSize.canvasHeight;

  // Handle drag start (same as before)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).classList.contains('resizer')) return;

    onActivate();

    if (isPanMode) {
      setIsPanning(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startOffsetX = imageData.offsetX;
      const startOffsetY = imageData.offsetY;

      const handlePanMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        const sensitivity = 100 / (box.width * canvasScale);
        const newOffsetX = Math.max(0, Math.min(100, startOffsetX - dx * sensitivity));
        const newOffsetY = Math.max(0, Math.min(100, startOffsetY - dy * sensitivity));

        onImageUpdate(imageData.id, {
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        });
      };

      const handlePanEnd = () => {
        setIsPanning(false);
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
      };

      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
    } else {
      setIsDragging(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = box.left;
      const startTop = box.top;

      const handleDragMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - startX) / canvasScale;
        const dy = (moveEvent.clientY - startY) / canvasScale;

        let newLeft = startLeft + dx;
        let newTop = startTop + dy;

        // --- X-axis snap reference lines ---
        const xRefs: number[] = [0, canvasWidth, canvasWidth / 2];
        allBoxes.forEach((ob) => {
          if (ob.id === box.id) return;
          xRefs.push(ob.left, ob.left + ob.width, ob.left + ob.width / 2);
        });

        let bestXDist = SNAP_TOLERANCE;
        let snapXLine: number | null = null;
        let snappedLeft = newLeft;
        xRefs.forEach((ref) => {
          // left edge → ref
          let d = Math.abs(newLeft - ref);
          if (d < bestXDist) { bestXDist = d; snappedLeft = ref; snapXLine = ref; }
          // center → ref
          d = Math.abs(newLeft + box.width / 2 - ref);
          if (d < bestXDist) { bestXDist = d; snappedLeft = ref - box.width / 2; snapXLine = ref; }
          // right edge → ref
          d = Math.abs(newLeft + box.width - ref);
          if (d < bestXDist) { bestXDist = d; snappedLeft = ref - box.width; snapXLine = ref; }
        });

        // --- Y-axis snap reference lines ---
        const yRefs: number[] = [0, canvasHeight, canvasHeight / 2];
        allBoxes.forEach((ob) => {
          if (ob.id === box.id) return;
          yRefs.push(ob.top, ob.top + ob.height, ob.top + ob.height / 2);
        });

        let bestYDist = SNAP_TOLERANCE;
        let snapYLine: number | null = null;
        let snappedTop = newTop;
        yRefs.forEach((ref) => {
          let d = Math.abs(newTop - ref);
          if (d < bestYDist) { bestYDist = d; snappedTop = ref; snapYLine = ref; }
          d = Math.abs(newTop + box.height / 2 - ref);
          if (d < bestYDist) { bestYDist = d; snappedTop = ref - box.height / 2; snapYLine = ref; }
          d = Math.abs(newTop + box.height - ref);
          if (d < bestYDist) { bestYDist = d; snappedTop = ref - box.height; snapYLine = ref; }
        });

        const activeSnapLines: SnapLine[] = [];
        if (snapXLine !== null) activeSnapLines.push({ type: 'vertical', position: snapXLine });
        if (snapYLine !== null) activeSnapLines.push({ type: 'horizontal', position: snapYLine });
        onSnapLines?.(activeSnapLines);

        onUpdate({ left: snappedLeft, top: snappedTop });
      };

      const handleDragEnd = () => {
        setIsDragging(false);
        onSnapLines?.([]);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };

      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }

    e.preventDefault();
  };

  // Handle resize with snapping to OTHER BOXES
  const handleResizeStart = (
    e: React.MouseEvent,
    direction: 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    e.stopPropagation();
    onActivate();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = box.width;
    const startHeight = box.height;
    const startLeft = box.left;
    const startTop = box.top;
    const aspectRatio = startWidth / startHeight;

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / canvasScale;
      const dy = (moveEvent.clientY - startY) / canvasScale;
      const shiftKey = moveEvent.shiftKey;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      // Corner resizing
      if (direction.includes('-')) {
        const isTop = direction.includes('top');
        const isLeft = direction.includes('left');
        
        const deltaX = isLeft ? -dx : dx;
        const deltaY = isTop ? -dy : dy;
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY)) * (deltaX + deltaY > 0 ? 1 : -1);
        
        newWidth = Math.max(50, startWidth + delta);
        newHeight = newWidth / aspectRatio;
        
        if (isLeft) {
          newLeft = startLeft - (newWidth - startWidth);
        }
        if (isTop) {
          newTop = startTop - (newHeight - startHeight);
        }
      }
      // Edge resizing
      else if (shiftKey) {
        if (direction === 'right' || direction === 'left') {
          newWidth = Math.max(50, direction === 'right' ? startWidth + dx : startWidth - dx);
          newHeight = newWidth / aspectRatio;
          if (direction === 'left') {
            newLeft = startLeft + (startWidth - newWidth);
          }
        } else {
          newHeight = Math.max(50, direction === 'bottom' ? startHeight + dy : startHeight - dy);
          newWidth = newHeight * aspectRatio;
          if (direction === 'top') {
            newTop = startTop + (startHeight - newHeight);
          }
        }
      } else {
        if (direction === 'right') {
          newWidth = Math.max(50, startWidth + dx);
        } else if (direction === 'left') {
          newWidth = Math.max(50, startWidth - dx);
          newLeft = startLeft + dx;
        } else if (direction === 'bottom') {
          newHeight = Math.max(50, startHeight + dy);
        } else if (direction === 'top') {
          newHeight = Math.max(50, startHeight - dy);
          newTop = startTop + dy;
        }
      }

      // Boundary constraints
      if (newLeft < 0) {
        if (direction === 'left' || direction.includes('left')) {
          newWidth = newWidth + newLeft;
          if (direction.includes('-')) {
            newHeight = newWidth / aspectRatio;
          }
        }
        newLeft = 0;
      }
      
      if (newTop < 0) {
        if (direction === 'top' || direction.includes('top')) {
          newHeight = newHeight + newTop;
          if (direction.includes('-')) {
            newWidth = newHeight * aspectRatio;
          }
        }
        newTop = 0;
      }
      
      if (newLeft + newWidth > canvasWidth) {
        newWidth = canvasWidth - newLeft;
        if (shiftKey || direction.includes('-')) {
          newHeight = newWidth / aspectRatio;
        }
      }
      
      if (newTop + newHeight > canvasHeight) {
        newHeight = canvasHeight - newTop;
        if (shiftKey || direction.includes('-')) {
          newWidth = newHeight * aspectRatio;
        }
      }

      // ✅ SNAPPING TO CANVAS EDGES
      if (Math.abs(newLeft) < SNAP_TOLERANCE) {
        newLeft = 0;
      }
      
      if (Math.abs(newTop) < SNAP_TOLERANCE) {
        newTop = 0;
      }
      
      if (Math.abs((newLeft + newWidth) - canvasWidth) < SNAP_TOLERANCE) {
        if (direction === 'right' || direction.includes('right')) {
          newWidth = canvasWidth - newLeft;
          if (shiftKey || direction.includes('-')) {
            newHeight = newWidth / aspectRatio;
          }
        }
      }
      
      if (Math.abs((newTop + newHeight) - canvasHeight) < SNAP_TOLERANCE) {
        if (direction === 'bottom' || direction.includes('bottom')) {
          newHeight = canvasHeight - newTop;
          if (shiftKey || direction.includes('-')) {
            newWidth = newHeight * aspectRatio;
          }
        }
      }

      // ✅ SNAPPING TO OTHER BOXES
      allBoxes.forEach((otherBox) => {
        if (otherBox.id === box.id) return; // Skip self

        const otherLeft = otherBox.left;
        const otherRight = otherBox.left + otherBox.width;
        const otherTop = otherBox.top;
        const otherBottom = otherBox.top + otherBox.height;

        const thisLeft = newLeft;
        const thisRight = newLeft + newWidth;
        const thisTop = newTop;
        const thisBottom = newTop + newHeight;

        // Horizontal snapping (left/right edges)
        if (direction === 'left' || direction.includes('left')) {
          // Snap current LEFT to other's RIGHT
          if (Math.abs(thisLeft - otherRight) < SNAP_TOLERANCE) {
            const diff = thisLeft - otherRight;
            newLeft = otherRight;
            newWidth = newWidth + diff;
          }
          // Snap current LEFT to other's LEFT
          if (Math.abs(thisLeft - otherLeft) < SNAP_TOLERANCE) {
            const diff = thisLeft - otherLeft;
            newLeft = otherLeft;
            newWidth = newWidth + diff;
          }
        }

        if (direction === 'right' || direction.includes('right')) {
          // Snap current RIGHT to other's LEFT
          if (Math.abs(thisRight - otherLeft) < SNAP_TOLERANCE) {
            newWidth = otherLeft - newLeft;
            if (shiftKey || direction.includes('-')) {
              newHeight = newWidth / aspectRatio;
            }
          }
          // Snap current RIGHT to other's RIGHT
          if (Math.abs(thisRight - otherRight) < SNAP_TOLERANCE) {
            newWidth = otherRight - newLeft;
            if (shiftKey || direction.includes('-')) {
              newHeight = newWidth / aspectRatio;
            }
          }
        }

        // Vertical snapping (top/bottom edges)
        if (direction === 'top' || direction.includes('top')) {
          // Snap current TOP to other's BOTTOM
          if (Math.abs(thisTop - otherBottom) < SNAP_TOLERANCE) {
            const diff = thisTop - otherBottom;
            newTop = otherBottom;
            newHeight = newHeight + diff;
          }
          // Snap current TOP to other's TOP
          if (Math.abs(thisTop - otherTop) < SNAP_TOLERANCE) {
            const diff = thisTop - otherTop;
            newTop = otherTop;
            newHeight = newHeight + diff;
          }
        }

        if (direction === 'bottom' || direction.includes('bottom')) {
          // Snap current BOTTOM to other's TOP
          if (Math.abs(thisBottom - otherTop) < SNAP_TOLERANCE) {
            newHeight = otherTop - newTop;
            if (shiftKey || direction.includes('-')) {
              newWidth = newHeight * aspectRatio;
            }
          }
          // Snap current BOTTOM to other's BOTTOM
          if (Math.abs(thisBottom - otherBottom) < SNAP_TOLERANCE) {
            newHeight = otherBottom - newTop;
            if (shiftKey || direction.includes('-')) {
              newWidth = newHeight * aspectRatio;
            }
          }
        }
      });

      // Final safety check
      newWidth = Math.max(50, Math.min(newWidth, canvasWidth - newLeft));
      newHeight = Math.max(50, Math.min(newHeight, canvasHeight - newTop));
      newLeft = Math.max(0, Math.min(newLeft, canvasWidth - newWidth));
      newTop = Math.max(0, Math.min(newTop, canvasHeight - newHeight));

      onUpdate({
        width: newWidth,
        height: newHeight,
        left: newLeft,
        top: newTop,
      });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onDelete]);

  return (
    <div
      ref={boxRef}
      className={cn(
        'absolute overflow-hidden transition-shadow duration-200',
        isActive ? 'ring-2 ring-blue-900/20 z-50' : 'z-10',
        (isDragging || isResizing || isPanning) && 'cursor-grabbing',
        isPanMode && !isPanning && 'cursor-move',
        !isPanMode && !isDragging && 'cursor-move'
      )}
      style={{
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
        border: `${box.borderWidth}px solid ${isActive ? '#1e3a8a' : '#1e3a8a80'}`,
        opacity: box.opacity / 100,
      }}
      onMouseDown={handleMouseDown}
      title={imageData.fileName}
    >
      <img
        src={imageData.src}
        alt={imageData.fileName}
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{
          objectPosition: `${imageData.offsetX}% ${imageData.offsetY}%`,
          transform: `rotate(${box.rotation}deg) scale(${box.scale})`,
          transformOrigin: 'center center',
        }}
        draggable={false}
      />

      {/* Resizers (same large design as before) */}
      {isActive && !isPanMode && (
        <>
          {/* CORNER RESIZERS */}
          <div
            className="resizer absolute -top-3 -left-3 w-12 h-12 bg-blue-900 border-3 border-white rounded-full cursor-nwse-resize hover:scale-110 transition-all shadow-xl z-[80] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            style={{ touchAction: 'none' }}
          >
            <div className="w-5 h-5 border-2 border-white rounded-tl-xl" />
          </div>
          
          <div
            className="resizer absolute -top-3 -right-3 w-12 h-12 bg-blue-900 border-3 border-white rounded-full cursor-nesw-resize hover:scale-110 transition-all shadow-xl z-[80] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            style={{ touchAction: 'none' }}
          >
            <div className="w-5 h-5 border-2 border-white rounded-tr-xl" />
          </div>
          
          <div
            className="resizer absolute -bottom-3 -left-3 w-12 h-12 bg-blue-900 border-3 border-white rounded-full cursor-nesw-resize hover:scale-110 transition-all shadow-xl z-[80] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            style={{ touchAction: 'none' }}
          >
            <div className="w-5 h-5 border-2 border-white rounded-bl-xl" />
          </div>
          
          <div
            className="resizer absolute -bottom-3 -right-3 w-12 h-12 bg-blue-900 border-3 border-white rounded-full cursor-nwse-resize hover:scale-110 transition-all shadow-xl z-[80] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            style={{ touchAction: 'none' }}
          >
            <div className="w-5 h-5 border-2 border-white rounded-br-xl" />
          </div>

          {/* EDGE RESIZERS */}
          <div
            className="resizer absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-10 bg-blue-900 border-3 border-white rounded-lg cursor-ns-resize hover:scale-105 transition-all shadow-xl z-[70] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
            style={{ touchAction: 'none' }}
          >
            <div className="flex gap-1.5">
              <div className="w-1.5 h-5 bg-white rounded-full" />
              <div className="w-1.5 h-5 bg-white rounded-full" />
              <div className="w-1.5 h-5 bg-white rounded-full" />
            </div>
          </div>
          
          <div
            className="resizer absolute top-1/2 -right-3 -translate-y-1/2 w-10 h-20 bg-blue-900 border-3 border-white rounded-lg cursor-ew-resize hover:scale-105 transition-all shadow-xl z-[70] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            style={{ touchAction: 'none' }}
          >
            <div className="flex flex-col gap-1.5">
              <div className="w-5 h-1.5 bg-white rounded-full" />
              <div className="w-5 h-1.5 bg-white rounded-full" />
              <div className="w-5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          
          <div
            className="resizer absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-10 bg-blue-900 border-3 border-white rounded-lg cursor-ns-resize hover:scale-105 transition-all shadow-xl z-[70] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            style={{ touchAction: 'none' }}
          >
            <div className="flex gap-1.5">
              <div className="w-1.5 h-5 bg-white rounded-full" />
              <div className="w-1.5 h-5 bg-white rounded-full" />
              <div className="w-1.5 h-5 bg-white rounded-full" />
            </div>
          </div>
          
          <div
            className="resizer absolute top-1/2 -left-3 -translate-y-1/2 w-10 h-20 bg-blue-900 border-3 border-white rounded-lg cursor-ew-resize hover:scale-105 transition-all shadow-xl z-[70] flex items-center justify-center"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
            style={{ touchAction: 'none' }}
          >
            <div className="flex flex-col gap-1.5">
              <div className="w-5 h-1.5 bg-white rounded-full" />
              <div className="w-5 h-1.5 bg-white rounded-full" />
              <div className="w-5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoBox;