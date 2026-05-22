'use client';

import { useCallback, useEffect, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается браузером');
      return;
    }

    if (!window.isSecureContext) {
      setError('Геопозиция работает только по HTTPS или на localhost. Откройте сайт через защищённое соединение.');
      return;
    }

    setLoading(true);
    setError(null);

    const PERMISSION_DENIED = 1;
    const POSITION_UNAVAILABLE = 2;
    const TIMEOUT = 3;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === PERMISSION_DENIED) {
          setError('Разрешите доступ к местоположению в настройках браузера');
        } else if (err.code === TIMEOUT) {
          setError('Не удалось определить местоположение. Попробуйте ещё раз.');
        } else if (err.code === POSITION_UNAVAILABLE) {
          setError('Местоположение временно недоступно. Проверьте интернет и попробуйте снова.');
        } else {
          setError('Не удалось определить местоположение');
        }
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { position, error, loading, requestLocation };
}
