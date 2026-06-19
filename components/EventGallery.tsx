'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';

interface EventGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export default function EventGallery({ images, title, className = '' }: EventGalleryProps) {
  const list = images.filter(Boolean);
  const [index, setIndex] = useState(0);

  if (list.length === 0) {
    return (
      <div
        className={`flex h-72 items-center justify-center rounded-xl bg-gray-100 text-gray-500 ${className}`}
      >
        Нет фото
      </div>
    );
  }

  const prev = () => setIndex((i) => (i === 0 ? list.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === list.length - 1 ? 0 : i + 1));

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-100 ${className}`}>
      <SafeImage
        src={list[index]}
        alt={`${title} — фото ${index + 1}`}
        className="h-72 w-full object-cover md:h-96"
      />

      {list.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Следующее фото"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Фото ${i + 1}`}
              />
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
            {index + 1} / {list.length}
          </span>
        </>
      )}
    </div>
  );
}
