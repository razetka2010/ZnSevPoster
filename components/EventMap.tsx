'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/types';
import { Heart } from 'lucide-react';
import type { GeoPosition } from '@/hooks/useGeolocation';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface EventMapProps {
  events: Event[];
  favorites: number[];
  userPosition: GeoPosition | null;
  radiusKm?: number;
  onToggleFavorite: (eventId: number) => void;
}

const DEFAULT_CENTER: [number, number] = [50.4501, 30.5234];

export default function EventMap({
  events,
  favorites,
  userPosition,
  radiusKm = 15,
  onToggleFavorite,
}: EventMapProps) {
  const eventsWithCoords = events.filter(
    (e) => Number.isFinite(e.latitude) && Number.isFinite(e.longitude)
  );

  const center: [number, number] = userPosition
    ? [userPosition.lat, userPosition.lng]
    : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={userPosition ? 12 : 11} className="h-[500px] w-full rounded-xl">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userPosition && (
        <>
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>Вы здесь</Popup>
          </Marker>
          <Circle
            center={[userPosition.lat, userPosition.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.1 }}
          />
        </>
      )}
      {eventsWithCoords.map((event) => (
        <Marker key={event.id} position={[event.latitude, event.longitude]}>
          <Popup>
            <div className="max-w-xs">
              <img
                src={event.image_url}
                alt={event.title}
                className="mb-2 h-28 w-full rounded object-cover"
              />
              <h3 className="font-bold">{event.title}</h3>
              <p className="text-sm text-gray-600">{event.venue}</p>
              {event.distance_km != null && (
                <p className="text-xs text-blue-600">
                  {event.distance_km < 1
                    ? `${Math.round(event.distance_km * 1000)} м`
                    : `${event.distance_km.toFixed(1)} км`}
                </p>
              )}
              <Link
                href={`/events/${event.id}`}
                className="mt-2 block text-sm font-medium text-blue-600 hover:underline"
              >
                Подробнее →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
