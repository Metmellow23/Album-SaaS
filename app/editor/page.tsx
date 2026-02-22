'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Move, Plus, Trash2 } from 'lucide-react';
import { AlbumSize, ImageData, Page, PhotoBox as PhotoBoxType } from '@/lib/types';
import Button from '@/components/ui/Button';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Sidebar from '@/components/editor/Sidebar';
import Canvas from '@/components/editor/Canvas';
import RightPanel from '@/components/editor/RightPanel';

export default function EditorPage() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<AlbumSize | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [pages, setPages] = useState<Page[]>([{ id: 'page-1', boxes: [] }]);
  const [activePageId, setActivePageId] = useState<string>('page-1');
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const storedSize = localStorage.getItem('selectedAlbumSize');
    if (!storedSize) {
      router.push('/');
      return;
    }
    setSelectedSize(JSON.parse(storedSize));
  }, [router]);

  // Derived values from active page
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const boxes = activePage.boxes;
  const selectedImageIds = boxes.map((b) => b.imageId);
  const activePageIndex = pages.findIndex((p) => p.id === activePageId);

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
    const existingBox = activePage.boxes.find((box) => box.imageId === imageId);

    if (existingBox) {
      setPages((prev) =>
        prev.map((p) =>
          p.id !== activePageId
            ? p
            : { ...p, boxes: p.boxes.filter((b) => b.imageId !== imageId) }
        )
      );
      if (activeBoxId === existingBox.id) {
        setActiveBoxId(null);
      }
    } else {
      const imageData = images.find((img) => img.id === imageId);
      if (!imageData || !selectedSize) return;

      const newBox = createPhotoBox(imageData, selectedSize);
      setPages((prev) =>
        prev.map((p) =>
          p.id !== activePageId ? p : { ...p, boxes: [...p.boxes, newBox] }
        )
      );
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
    setPages((prev) =>
      prev.map((p) =>
        p.id !== activePageId
          ? p
          : { ...p, boxes: p.boxes.map((b) => (b.id === boxId ? { ...b, ...updates } : b)) }
      )
    );
  };

  const handleImageUpdate = (imageId: string, updates: Partial<ImageData>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, ...updates } : img))
    );
  };

  const handleBoxDelete = (boxId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id !== activePageId
          ? p
          : { ...p, boxes: p.boxes.filter((b) => b.id !== boxId) }
      )
    );
    if (activeBoxId === boxId) {
      setActiveBoxId(null);
    }
  };

  const handleImageDelete = (imageId: string) => {
    // Remove from ALL pages
    setPages((prev) =>
      prev.map((p) => ({ ...p, boxes: p.boxes.filter((b) => b.imageId !== imageId) }))
    );
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    const activeBox = boxes.find((box) => box.id === activeBoxId);
    if (activeBox && activeBox.imageId === imageId) {
      setActiveBoxId(null);
    }
  };

  // Page management
  const handleAddPage = () => {
    const newId = `page-${Date.now()}`;
    setPages((prev) => [...prev, { id: newId, boxes: [] }]);
    setActivePageId(newId);
    setActiveBoxId(null);
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === activePageId);
    const newPages = pages.filter((p) => p.id !== activePageId);
    const newActive = newPages[Math.min(idx, newPages.length - 1)].id;
    setPages(newPages);
    setActivePageId(newActive);
    setActiveBoxId(null);
  };

  const handleNavigate = (dir: 'prev' | 'next') => {
    const idx = pages.findIndex((p) => p.id === activePageId);
    const newIdx = dir === 'prev' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= pages.length) return;
    setActivePageId(pages[newIdx].id);
    setActiveBoxId(null);
  };

  const handleExportPDF = async () => {
    if (!selectedSize) return;

    const originalPageId = activePageId;
    const originalBoxId = activeBoxId;

    setIsExporting(true);
    setActiveBoxId(null);

    try {
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({
        orientation: selectedSize.canvasWidth > selectedSize.canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [selectedSize.canvasWidth, selectedSize.canvasHeight],
        hotfixes: ['px_scaling'],
      });

      for (let i = 0; i < pages.length; i++) {
        setActivePageId(pages[i].id);
        await new Promise((r) => setTimeout(r, 800));

        const canvasEl = document.getElementById('album-canvas');
        if (!canvasEl) continue;

        const imgData = await toJpeg(canvasEl as HTMLElement, {
          pixelRatio: 2.5,
          quality: 0.90,
          backgroundColor: '#ffffff',
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, selectedSize.canvasWidth, selectedSize.canvasHeight);
      }

      pdf.save('My_Album.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setActivePageId(originalPageId);
      setActiveBoxId(originalBoxId);
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

      {isExporting && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-lg font-semibold">Generating High-Quality PDF...</p>
          <p className="text-white/70 text-sm">Please wait, do not close this tab</p>
        </div>
      )}

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
              disabled={isExporting}
            >
              Move Tool: {isPanMode ? 'On' : 'Off'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              Download PDF
            </Button>
            <span className="text-sm text-gray-600">
              Page {activePageIndex + 1} of {pages.length} &middot; {boxes.length} photo{boxes.length !== 1 ? 's' : ''}
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

        {/* Center column: canvas + bottom nav */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Canvas
            albumSize={selectedSize}
            boxes={boxes}
            images={images}
            activeBoxId={activeBoxId}
            isPanMode={isPanMode}
            isExporting={isExporting}
            onBoxUpdate={handleBoxUpdate}
            onImageUpdate={handleImageUpdate}
            onBoxActivate={setActiveBoxId}
            onBoxDelete={handleBoxDelete}
          />

          {/* Bottom Navigation Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
            {/* Left: Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNavigate('prev')}
                disabled={activePageIndex === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => handleNavigate('next')}
                disabled={activePageIndex === pages.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Page dots + label */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                {pages.map((page, idx) => (
                  <button
                    key={page.id}
                    onClick={() => { setActivePageId(page.id); setActiveBoxId(null); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      page.id === activePageId
                        ? 'bg-blue-600 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={`Page ${idx + 1}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                Page {activePageIndex + 1} / {pages.length}
              </span>
            </div>

            {/* Right: Add + Delete */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddPage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Page
              </button>
              {pages.length > 1 && (
                <button
                  onClick={handleDeletePage}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

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
