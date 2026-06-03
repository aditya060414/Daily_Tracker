import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading system logs...',
  fullscreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      {/* Animated Terminal brackets loader */}
      <div className="relative w-12 h-12 flex items-center justify-center font-mono text-lg text-accent">
        <span className="animate-spin duration-1000">⚡</span>
        <div className="absolute inset-0 border border-dashed border-accent/30 rounded-full animate-spin duration-3000"></div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono tracking-widest uppercase text-accent">{message}</p>
        <div className="flex justify-center gap-1">
          <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce delay-75"></span>
          <span className="w-1.5 h-1.5 bg-accent/70 rounded-full animate-bounce delay-150"></span>
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-300"></span>
        </div>
      </div>

      {/* Pulsing Skeleton Lines */}
      <div className="w-48 flex flex-col gap-2 mt-2 opacity-55">
        <div className="h-2 bg-border rounded animate-pulse"></div>
        <div className="h-2 bg-border rounded w-2/3 mx-auto animate-pulse"></div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-darkbg text-off-white">
        {content}
      </div>
    );
  }

  return <div className="w-full h-full flex items-center justify-center min-h-[250px]">{content}</div>;
};

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 w-full animate-pulse">
      <div className="h-8 bg-card border border-border rounded-lg w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 h-72 bg-card border border-border rounded-lg"></div>
        <div className="h-72 bg-card border border-border rounded-lg"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
