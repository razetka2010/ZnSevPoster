'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import type { EventFilters } from '@/types';

interface FiltersProps {
  onFilterChange: (filters: EventFilters) => void;
  hasLocation: boolean;
  locationLat?: number;
  locationLng?: number;
}

const categories = [
  { value: 'all', label: 'Все' },
  { value: 'concert', label: 'Концерты' },
  { value: 'exhibition', label: 'Выставки' },
  { value: 'theater', label: 'Театр' },
  { value: 'lecture', label: 'Лекции' },
  { value: 'festival', label: 'Фестивали' },
];

const priceTypes = [
  { value: 'all', label: 'Все' },
  { value: 'free', label: 'Бесплатно' },
  { value: 'paid', label: 'Платно' },
] as const;

const dateRanges = [
  { value: 'all', label: 'Все даты' },
  { value: 'today', label: 'Сегодня' },
  { value: 'week', label: 'На неделю' },
  { value: 'month', label: 'На месяц' },
] as const;

export default function Filters({
  onFilterChange,
  hasLocation,
  locationLat,
  locationLng,
}: FiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState<EventFilters['price_type']>('all');
  const [selectedDate, setSelectedDate] = useState<EventFilters['date']>('all');
  const [radius, setRadius] = useState(15);

  const applyFilters = () => {
    const filters: EventFilters = {};
    if (selectedCategory !== 'all') filters.category = selectedCategory as EventFilters['category'];
    if (selectedPrice !== 'all') filters.price_type = selectedPrice;
    if (selectedDate !== 'all') filters.date = selectedDate;
    if (hasLocation && locationLat != null && locationLng != null) {
      filters.lat = locationLat;
      filters.lng = locationLng;
      filters.radius_km = radius;
    }
    onFilterChange(filters);
  };

  return (
    <div className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Фильтры</h3>
      </div>

      {!hasLocation && (
        <p className="mb-4 text-sm text-amber-700">
          Разрешите геолокацию, чтобы видеть события рядом с вами на карте и в ленте.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              selectedCategory === cat.value
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Цена</label>
          <select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value as EventFilters['price_type'])}
            className="w-full rounded-2xl border border-gray-300 bg-slate-50 px-3 py-2"
          >
            {priceTypes.map((price) => (
              <option key={price.value} value={price.value}>
                {price.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Дата</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value as EventFilters['date'])}
            className="w-full rounded-2xl border border-gray-300 bg-slate-50 px-3 py-2"
          >
            {dateRanges.map((date) => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Радиус: {radius} км
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            disabled={!hasLocation}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full rounded-full accent-blue-600 disabled:opacity-40"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={applyFilters}
        className="mt-4 w-full rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Применить фильтры
      </button>
    </div>
  );
}
