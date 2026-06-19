export type EventCategory = 'concert' | 'exhibition' | 'theater' | 'lecture' | 'festival';
export type UserRole = 'user' | 'admin';

export interface Event {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  price: number;
  is_free: boolean;
  latitude: number;
  longitude: number;
  venue: string;
  address?: string | null;
  image_url: string;
  images: string[];
  created_at: string;
  is_completed: boolean;
  distance_km?: number;
}

export interface EventFilters {
  category?: string;
  price_type?: 'all' | 'free' | 'paid';
  date?: 'all' | 'today' | 'week' | 'month';
  lat?: number;
  lng?: number;
  radius_km?: number;
  includeCompleted?: boolean;
}

export interface EventInput {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  price: number;
  is_free: boolean;
  latitude: number;
  longitude: number;
  venue: string;
  address?: string;
  image_url: string;
  images: string[];
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  created_at: string;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
}

export interface TicketInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface Ticket {
  id: number;
  user_id: number;
  event_id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_paid: boolean;
  checked_in: boolean;
  created_at: string;
  event?: Event;
}

export interface UserEvent {
  user_id: number;
  event_id: number;
  type: 'favorite' | 'going';
}
