'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollFadeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollFadeWrapper({ children, className }: ScrollFadeWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isScrollable = el.scrollHeight > el.clientHeight + 4;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    setShowFade(isScrollable && !isAtBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div
        ref={scrollRef}
        className={cn('h-full overflow-y-auto custom-scrollbar', className)}
      >
        {children}
      </div>

      {/* Fade gradient + bounce arrow */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-500',
          showFade ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="h-20 bg-gradient-to-t from-card via-card/80 to-transparent" />
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center gap-0.5 animate-bounce">
            <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
            <ChevronDown className="w-4 h-4 text-muted-foreground/30 -mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
