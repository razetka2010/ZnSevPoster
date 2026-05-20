'use client';

import { MapPin, RefreshCw } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';

interface LocationPromptProps {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
}

export default function LocationPrompt({
  position,
  error,
  loading,
  onRetry,
}: LocationPromptProps) {
  if (loading) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Определяем ваше местоположение...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <span>{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-amber-200 px-3 py-1 font-medium hover:bg-amber-300"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (position) {
    return null;
  }

  return null;
}
