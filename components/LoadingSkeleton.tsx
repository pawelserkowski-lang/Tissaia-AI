import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '20px',
  animation = 'pulse',
}) => {
  const baseClass = 'bg-gray-800/50';
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }[animation];

  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClass} ${variantClass} ${animationClass} ${className}`}
      style={style}
    />
  );
};

export const FileListSkeleton: React.FC = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800"
      >
        <Skeleton variant="rectangular" width={80} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
          <Skeleton width="30%" height={16} />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>
    ))}
  </div>
);

export const GallerySkeleton: React.FC = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <div key={i} className="space-y-2">
        <Skeleton height={200} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={16} />
      </div>
    ))}
  </div>
);

export const CropMapSkeleton: React.FC = () => (
  <div className="flex flex-col h-full p-4 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton width={200} height={32} />
      <div className="flex gap-2">
        <Skeleton width={100} height={36} />
        <Skeleton width={100} height={36} />
      </div>
    </div>
    <div className="flex-1 bg-gray-900/30 rounded-lg border border-gray-800 relative">
      <Skeleton height="100%" />
      {/* Simulate crop boxes */}
      <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-tissaia-accent/30 rounded"></div>
      <div className="absolute top-1/2 right-1/4 w-1/4 h-1/4 border-2 border-tissaia-accent/30 rounded"></div>
    </div>
  </div>
);

export const DetailsSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="space-y-2">
      <Skeleton width="30%" height={20} />
      <Skeleton width="80%" height={32} />
    </div>
    <div className="space-y-2">
      <Skeleton width="30%" height={20} />
      <Skeleton width="60%" height={24} />
    </div>
    <div className="space-y-2">
      <Skeleton width="30%" height={20} />
      <Skeleton width="90%" height={60} />
    </div>
    <div className="flex gap-4">
      <Skeleton width="48%" height={44} />
      <Skeleton width="48%" height={44} />
    </div>
  </div>
);

// Add shimmer animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
    .animate-shimmer {
      background: linear-gradient(
        90deg,
        rgba(31, 41, 55, 0.3) 0%,
        rgba(55, 65, 81, 0.5) 50%,
        rgba(31, 41, 55, 0.3) 100%
      );
      background-size: 1000px 100%;
      animation: shimmer 2s infinite linear;
    }
  `;
  document.head.appendChild(style);
}

export default Skeleton;
