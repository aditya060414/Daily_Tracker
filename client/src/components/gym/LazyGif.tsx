import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell } from 'lucide-react';

interface LazyGifProps {
  src?: string;
  alt: string;
}

export const LazyGif: React.FC<LazyGifProps> = ({ src, alt }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (!src) {
    return (
      <div
        className="w-16 h-16 bg-card border border-border rounded flex items-center justify-center shrink-0"
        title="No animation guide available"
      >
        <Dumbbell className="w-5 h-5 text-off-white-muted opacity-40" />
      </div>
    );
  }

  const fullUrl = src.startsWith('http') ? src : `${window.location.origin.replace(':5173', ':5000')}${src}`;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-16 h-16 bg-card border border-border rounded overflow-hidden relative flex items-center justify-center shrink-0 cursor-pointer"
      title="Hover to animate guide"
    >
      {isVisible ? (
        isHovered ? (
          <img
            src={fullUrl}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = src; // fallback
            }}
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            <img
              src={fullUrl}
              alt={alt}
              className="w-full h-full object-cover opacity-60 filter grayscale"
              onError={(e) => {
                e.currentTarget.src = src; // fallback
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[8px] font-bold text-accent uppercase tracking-wider font-mono">HOVER</span>
            </div>
          </div>
        )
      ) : (
        <div className="w-4 h-4 border border-accent/25 border-t-accent rounded-full animate-spin"></div>
      )}
    </div>
  );
};
export default LazyGif;
