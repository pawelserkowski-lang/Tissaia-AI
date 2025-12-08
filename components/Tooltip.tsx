import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8; // Distance from element

    let top = 0;
    let left = 0;

    // Use fixed positioning relative to viewport
    switch (position) {
      case 'top':
        top = rect.top - gap;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - gap;
        break;
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Recalculate on scroll/resize just in case (optional but good for UX)
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  const tooltipClasses = `fixed z-[9999] px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider text-black bg-tissaia-accent rounded shadow-[0_0_15px_rgba(0,255,163,0.4)] whitespace-nowrap animate-fade-in pointer-events-none border border-tissaia-accent/50`;

  // Transform logic to center the tooltip based on position
  const getTransform = () => {
      switch(position) {
          case 'top': return 'translate(-50%, -100%)';
          case 'bottom': return 'translate(-50%, 0)';
          case 'left': return 'translate(-100%, -50%)';
          case 'right': return 'translate(0, -50%)';
          default: return '';
      }
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className={`relative flex items-center justify-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div 
            className={tooltipClasses}
            style={{ 
                top: coords.top, 
                left: coords.left,
                transform: getTransform()
            }}
        >
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-tissaia-accent rotate-45 border-black/20
            ${position === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
            ${position === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
            ${position === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2 border-l border-b' : ''}
            ${position === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2 border-r border-t' : ''}
          `}></div>
        </div>,
        document.body
      )}
    </>
  );
};