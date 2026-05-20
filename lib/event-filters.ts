import type { Event, EventFilters } from '@/types';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterEvents(events: Event[], filters?: EventFilters): Event[] {
  let result = [...events];

  if (filters?.category && filters.category !== 'all') {
    result = result.filter((e) => e.category === filters.category);
  }

  if (filters?.price_type === 'free') {
    result = result.filter((e) => e.is_free);
  } else if (filters?.price_type === 'paid') {
    result = result.filter((e) => !e.is_free);
  }

  const dateFilter = filters?.date;
  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    if (dateFilter === 'today') {
      const start = startOfDay(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d >= start && d < end;
      });
    } else if (dateFilter === 'week') {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= end;
      });
    } else if (dateFilter === 'month') {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      result = result.filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= end;
      });
    }
  }

  return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
