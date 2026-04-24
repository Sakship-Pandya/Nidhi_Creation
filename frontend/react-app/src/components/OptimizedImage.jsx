import React from 'react';

/**
 * OptimizedImage component that renders a <picture> tag with AVIF and WebP support.
 * @param {string} baseUrl - The base URL for the image (e.g., /api/images/123 or /api/project/45/cover)
 * @param {string} alt - Alt text for the image
 * @param {string} className - Additional CSS classes
 * @param {string} sizes - HTML sizes attribute for responsive images
 */
const OptimizedImage = ({ baseUrl, alt, className, sizes = "100vw", ...props }) => {
  // If no baseUrl, return a placeholder
  if (!baseUrl) return <div className={`bg-gray-200 animate-pulse ${className}`} />;

  // Remove existing query params if any
  const cleanUrl = baseUrl.split('?')[0];
  const version = baseUrl.includes('v=') ? baseUrl.split('v=')[1].split('&')[0] : null;
  const vParam = version ? `&v=${version}` : '';

  return (
    <picture className={className}>
      {/* AVIF Sources */}
      <source
        type="image/avif"
        srcSet={`
          ${cleanUrl}?size=small&format=avif${vParam} 400w,
          ${cleanUrl}?size=medium&format=avif${vParam} 800w,
          ${cleanUrl}?size=large&format=avif${vParam} 1200w
        `}
        sizes={sizes}
      />
      
      {/* WebP Sources */}
      <source
        type="image/webp"
        srcSet={`
          ${cleanUrl}?size=small&format=webp${vParam} 400w,
          ${cleanUrl}?size=medium&format=webp${vParam} 800w,
          ${cleanUrl}?size=large&format=webp${vParam} 1200w
        `}
        sizes={sizes}
      />
      
      {/* Fallback Image (Original Format) */}
      <img
        src={`${cleanUrl}?size=medium${vParam}`}
        alt={alt}
        loading="lazy"
        className={className}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;
