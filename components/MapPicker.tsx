'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  center?: [number, number];
  height?: string;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
  center = [50.4501, 30.5234],
  height = '320px',
}: MapPickerProps) {
  const markerPos = useMemo((): [number, number] | null => {
    if (latitude == null || longitude == null) return null;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return [latitude, longitude];
  }, [latitude, longitude]);

  const mapCenter: [number, number] = markerPos ?? center;

  return (
    <div>
      <p className="mb-2 text-sm text-gray-600">
        Нажмите на карту, чтобы указать точное место проведения мероприятия
      </p>
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="w-full rounded-xl border border-gray-200"
        style={{ height }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {markerPos && <Marker position={markerPos} />}
      </MapContainer>
      {markerPos && (
        <p className="mt-2 text-xs text-gray-500">
          Координаты: {markerPos[0].toFixed(5)}, {markerPos[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
