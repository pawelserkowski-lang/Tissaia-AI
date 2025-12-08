import React, { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[60] px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider text-black bg-tissaia-accent rounded shadow-[0_0_15px_rgba(0,255,163,0.4)] whitespace-nowrap animate-fade-in pointer-events-none ${positionClasses[position]}`}>
          {content}
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-tissaia-accent rotate-45 
            ${position === 'top' ? 'bottom-[-3px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-[-3px] left-1/2 -translate-x-1/2' : ''}
            ${position === 'right' ? 'left-[-3px] top-1/2 -translate-y-1/2' : ''}
            ${position === 'left' ? 'right-[-3px] top-1/2 -translate-y-1/2' : ''}
          `}></div>
        </div>
      )}
    </div>
  );
};
