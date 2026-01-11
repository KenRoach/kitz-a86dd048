import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: "square" | "video" | "auto";
  priority?: boolean; // Skip lazy loading for above-the-fold images
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon,
  aspectRatio = "auto",
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  // No image provided
  if (!src || hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "bg-muted flex items-center justify-center",
          aspectClasses[aspectRatio],
          containerClassName
        )}
      >
        {fallbackIcon || <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* Blur placeholder - animated gradient shimmer */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/5 to-muted animate-pulse transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Actual image - only load when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
}
