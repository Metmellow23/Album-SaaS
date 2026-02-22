// components/ui/Card.tsx
'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      selected = false,
      hoverable = true,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative bg-white rounded-lg border-2 shadow-md transition-all duration-300';

    const interactiveStyles = cn(
      hoverable && 'hover:shadow-lg hover:-translate-y-1',
      clickable && 'cursor-pointer'
    );

    const selectedStyles = selected
      ? 'border-blue-900 shadow-[0_0_0_3px_rgba(30,58,138,0.2)]'
      : 'border-gray-200';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, interactiveStyles, selectedStyles, className)}
        {...props}
      >
        {children}
        {selected && (
          <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;