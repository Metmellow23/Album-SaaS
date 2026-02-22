// lib/types.ts

// 1. ALBUM SIZE TANIMI (Burası eksikti!)
export interface AlbumSize {
  id: string;
  name: string;
  dimensions: string;
  canvasWidth: number;
  canvasHeight: number;
  pdfWidth: number;
  pdfHeight: number;
  previewAspectRatio: number;
}

// 2. ALBÜM LİSTESİ
export const ALBUM_SIZES: AlbumSize[] = [
  {
    id: 'square-30',
    name: 'Square Album',
    dimensions: '30 × 30 cm',
    canvasWidth: 2290,
    canvasHeight: 1146,
    pdfWidth: 606,
    pdfHeight: 303,
    previewAspectRatio: 2290 / 1146,
  },
  {
    id: 'landscape-20-30',
    name: 'Landscape Album',
    dimensions: '20 × 30 cm',
    canvasWidth: 2290,
    canvasHeight: 770,
    pdfWidth: 606,
    pdfHeight: 206,
    previewAspectRatio: 2290 / 770,
  },
  {
    id: 'medium-square-20',
    name: 'Medium Square',
    dimensions: '20 × 20 cm',
    canvasWidth: 1536,
    canvasHeight: 768,
    pdfWidth: 406,
    pdfHeight: 206,
    previewAspectRatio: 1536 / 768,
  },
  {
    id: 'compact-15-20',
    name: 'Compact Album',
    dimensions: '15 × 20 cm',
    canvasWidth: 1536,
    canvasHeight: 590,
    pdfWidth: 406,
    pdfHeight: 156,
    previewAspectRatio: 1536 / 590,
  },
  {
    id: 'standard-15-22',
    name: 'Standard Album',
    dimensions: '15 × 22 cm',
    canvasWidth: 1726,
    canvasHeight: 590,
    pdfWidth: 456,
    pdfHeight: 156,
    previewAspectRatio: 1726 / 590,
  },
  {
    id: 'large-square-25',
    name: 'Large Square',
    dimensions: '25 × 25 cm',
    canvasWidth: 1916,
    canvasHeight: 968,
    pdfWidth: 506,
    pdfHeight: 256,
    previewAspectRatio: 1916 / 968,
  },
  {
    id: 'premium-landscape-25-38',
    name: 'Premium Landscape',
    dimensions: '25 × 38 cm',
    canvasWidth: 2866,
    canvasHeight: 968,
    pdfWidth: 756,
    pdfHeight: 256,
    previewAspectRatio: 2866 / 968,
  },
];

// 3. RESİM VERİSİ
export interface ImageData {
  id: string;
  src: string;
  width: number;
  height: number;
  aspectRatio: number;
  offsetX: number;
  offsetY: number;
  naturalWidth: number;
  naturalHeight: number;
  fileName: string;
}

// 4. PHOTOBOX (Yeni özelliklerle beraber)
export interface PhotoBox {
  id: string;
  imageId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
  // Yeni özellikler
  scale: number;
  rotation: number;
  opacity: number;
  borderWidth: number;
}