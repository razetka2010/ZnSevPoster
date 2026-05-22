'use client';

import { MapPin, RefreshCw } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false });

interface LocationPromptProps {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  onManualPick?: (lat: number, lng: number) => void;
  onClearManual?: () => void;
}

export default function LocationPrompt({
  position,
  error,
  loading,
  onRetry,
  onManualPick,
  onClearManual,
}: LocationPromptProps) {
  const [showPicker, setShowPicker] = useState(false);
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
      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>{error}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-amber-200 px-3 py-1 font-medium hover:bg-amber-300"
            >
              Повторить
            </button>
            <button
              type="button"
              onClick={() => setShowPicker((s) => !s)}
              className="rounded-lg bg-blue-100 px-3 py-1 font-medium text-blue-700 hover:bg-blue-200"
            >
              Выбрать на карте
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-amber-700">
          На мобильном телефоне убедитесь, что сайт открыт по HTTPS и разрешён доступ к местоположению в настройках браузера.
        </p>
        {showPicker && (
          <div className="mt-4">
            <MapPicker
              latitude={position?.lat ?? null}
              longitude={position?.lng ?? null}
              onChange={(lat, lng) => {
                setShowPicker(false);
                onManualPick?.(lat, lng);
              }}
            />
          </div>
        )}
        </div>
      );
  }

  return (
    <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />
          <span>{position ? 'Местоположение определено' : 'Местоположение не определено'}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            className="rounded-lg bg-blue-100 px-3 py-1 font-medium text-blue-700 hover:bg-blue-200"
          >
            Выбрать на карте
          </button>
          <button
            type="button"
            onClick={() => {
              onClearManual?.();
              onRetry();
            }}
            className="rounded-lg bg-amber-100 px-3 py-1 font-medium text-amber-800 hover:bg-amber-200"
          >
            Определить автоматически
          </button>
        </div>
      </div>
      {showPicker && (
        <div className="mt-4">
          <MapPicker
            latitude={position?.lat ?? null}
            longitude={position?.lng ?? null}
            onChange={(lat, lng) => {
              setShowPicker(false);
              onManualPick?.(lat, lng);
            }}
          />
        </div>
      )}
    </div>
  );
}
