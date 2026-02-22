'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Move } from 'lucide-react';
import { AlbumSize, ImageData, PhotoBox as PhotoBoxType } from '@/lib/types';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Sidebar from '@/components/editor/Sidebar';
import Canvas from '@/components/editor/Canvas';
import RightPanel from '@/components/editor/RightPanel';

export default function EditorPage() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<AlbumSize | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [boxes, setBoxes] = useState<PhotoBoxType[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    const storedSize = localStorage.getItem('selectedAlbumSize');
    if (!storedSize) {
      router.push('/');
      return;
    }
    setSelectedSize(JSON.parse(storedSize));
  }, [router]);

  const handleImagesUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsLoading(true);
    setLoadingMessage('Uploading photos...');

    try {
      const newImages: ImageData[] = [];

      for (const file of fileArray) {
        if (!file.type.match('image.*')) continue;

        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);

        const imageData: ImageData = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          src: dataUrl,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          offsetX: 50,
          offsetY: 50,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          fileName: file.name,
        };

        newImages.push(imageData);
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleImageClick = (imageId: string) => {
    const existingBoxIndex = boxes.findIndex((box) => box.imageId === imageId);

    if (existingBoxIndex > -1) {
      const newBoxes = boxes.filter((box) => box.imageId !== imageId);
      setBoxes(newBoxes);
      setSelectedImageIds((prev) => prev.filter((id) => id !== imageId));
      if (activeBoxId === boxes[existingBoxIndex].id) {
        setActiveBoxId(null);
      }
    } else {
      const imageData = images.find((img) => img.id === imageId);
      if (!imageData || !selectedSize) return;

      const newBox = createPhotoBox(imageData, selectedSize);
      setBoxes((prev) => [...prev, newBox]);
      setSelectedImageIds((prev) => [...prev, imageId]);
      setActiveBoxId(newBox.id);
    }
  };

  const createPhotoBox = (imageData: ImageData, albumSize: AlbumSize): PhotoBoxType => {
    const canvasWidth = albumSize.canvasWidth;
    const canvasHeight = albumSize.canvasHeight;

    let width, height;
    if (imageData.aspectRatio > 1) {
      width = canvasWidth * 0.3;
      height = width / imageData.aspectRatio;
    } else {
      height = canvasHeight * 0.3;
      width = height * imageData.aspectRatio;
    }

    width = Math.max(width, 100);
    height = Math.max(height, 100);

    const left = (canvasWidth - width) / 2;
    const top = (canvasHeight - height) / 2;

    return {
      id: `box-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      imageId: imageData.id,
      left,
      top,
      width,
      height,
      zIndex: 10,
      scale: 1,
      rotation: 0,
      opacity: 100,
      borderWidth: 0,
    };
  };

  const handleBoxUpdate = (boxId: string, updates: Partial<PhotoBoxType>) => {
    setBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, ...updates } : box))
    );
  };

  // YENİ EKLENEN FONKSİYON: Resim verisini (Offset) günceller
  const handleImageUpdate = (imageId: string, updates: Partial<ImageData>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, ...updates } : img))
    );
  };

  const handleBoxDelete = (boxId: string) => {
    const box = boxes.find((b) => b.id === boxId);
    if (!box) return;

    setBoxes((prev) => prev.filter((b) => b.id !== boxId));
    setSelectedImageIds((prev) => prev.filter((id) => id !== box.imageId));
    if (activeBoxId === boxId) {
      setActiveBoxId(null);
    }
  };

  const handleImageDelete = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setBoxes((prev) => prev.filter((box) => box.imageId !== imageId));
    setSelectedImageIds((prev) => prev.filter((id) => id !== imageId));
    const activeBox = boxes.find((box) => box.id === activeBoxId);
    if (activeBox && activeBox.imageId === imageId) {
      setActiveBoxId(null);
    }
  };

  const togglePanMode = () => {
    setIsPanMode((prev) => !prev);
  };

  const handleBack = () => {
    if (images.length > 0) {
      if (!confirm('Are you sure you want to go back? Your work will be lost.')) {
        return;
      }
    }
    router.push('/');
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const activeBox = boxes.find((box) => box.id === activeBoxId) || null;
  const activeImage = activeBox
    ? images.find((img) => img.id === activeBox.imageId) || null
    : null;

  if (!selectedSize) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />

      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={handleBack}
            >
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Album Editor</h1>
              <p className="text-sm text-gray-500">
                {selectedSize.name} ({selectedSize.dimensions})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isPanMode ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Move className="w-4 h-4" />}
              onClick={togglePanMode}
            >
              Move Tool: {isPanMode ? 'On' : 'Off'}
            </Button>
            <span className="text-sm text-gray-600">
              {boxes.length} photo{boxes.length !== 1 ? 's' : ''} on canvas
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          images={images}
          selectedImageIds={selectedImageIds}
          onImagesUpload={handleImagesUpload}
          onImageClick={handleImageClick}
          onImageDelete={handleImageDelete}
          isLoading={isLoading}
        />

        <Canvas
          albumSize={selectedSize}
          boxes={boxes}
          images={images}
          activeBoxId={activeBoxId}
          isPanMode={isPanMode}
          onBoxUpdate={handleBoxUpdate}
          onImageUpdate={handleImageUpdate} // ARTIK BAĞLI!
          onBoxActivate={setActiveBoxId}
          onBoxDelete={handleBoxDelete}
        />

        <RightPanel
          selectedBox={activeBox}
          selectedImage={activeImage}
          onBoxUpdate={(updates) => {
            if (activeBoxId) {
              handleBoxUpdate(activeBoxId, updates);
            }
          }}
        />
      </div>
    </div>
  );
}