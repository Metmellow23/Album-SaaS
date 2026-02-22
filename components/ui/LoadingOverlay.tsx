// components/ui/LoadingOverlay.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Processing...',
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
      role="dialog"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 p-8">
        {/* Spinning loader */}
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-4 border-blue-900/20 rounded-full" />
        </div>

        {/* Loading message */}
        <p className="text-gray-700 font-medium text-base text-center max-w-xs">
          {message}
        </p>

        {/* Optional progress dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-blue-900 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: '1.4s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;