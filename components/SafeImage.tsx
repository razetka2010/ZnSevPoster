"use client";

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  useNextImage?: boolean;
}

export default function SafeImage({ src, alt, className, useNextImage = false, ...rest }: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  const finalSrc = !src || errored ? '/fallback.jpg' : src;

  if (useNextImage) {
    return (
      // next/image used with unoptimized to avoid build-time processing
      // keeps lazy loading and placeholders in client
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Image
        src={finalSrc}
        alt={alt || ''}
        className={className}
        unoptimized
        onError={() => setErrored(true)}
        {...(rest as any)}
      />
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/alt-text, react/jsx-props-no-spreading
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
