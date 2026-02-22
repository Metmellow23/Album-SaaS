// app/page.tsx
import React from 'react';
import SizeSelection from '@/components/editor/SizeSelection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SizeSelection />
    </main>
  );
}