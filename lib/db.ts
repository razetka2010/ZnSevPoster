import { Pool, QueryResultRow } from 'pg';
import type { Event, EventCategory, EventFilters, EventInput, Ticket, TicketInfo } from '@/types';
import { filterEvents } from '@/lib/event-filters';
import { filterByRadius, withDistance } from '@/lib/geo';
import { mapEventRow } from '@/lib/event-mapper';
import {
  mockCreateEvent,
  mockCreateOrUpdateTicket,
  mockDeleteEvent,
  mockGetEventById,
  mockGetEventTickets,
  mockGetEvents,
  mockGetUserEvents,
  mockGetUserTickets,
  mockToggleUserEvent,
  mockUpdateEvent,
} from '@/lib/mock-store';

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
  dbReachable?: boolean;
  mockModeLogged?: boolean;
};

export function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true' || !process.env.DATABASE_URL;
}

function useMockOnly(): boolean {
  return useMockData();
}

function getPgCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return (error as { code?: string }).code;
}

function isConnectionError(error: unknown): boolean {
  const code = getPgCode(error);
  return (
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENETUNREACH'
  );
}

function isMissingTableError(error: unknown): boolean {
  return getPgCode(error) === '42P01';
}

function shouldFallbackToMock(error: unknown): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    (isConnectionError(error) || isMissingTableError(error))
  );
}

function handleDbFallback(error: unknown, reason: string): void {
  globalForPg.dbReachable = false;
  logMockMode(reason);
}

function logMockMode(reason: string) {
  if (globalForPg.mockModeLogged) return;
  globalForPg.mockModeLogged = true;
  console.warn(`[znaniesevera] ${reason} Using demo data (USE_MOCK_DATA=true).`);
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  return globalForPg.pgPool;
}

async function canUseDatabase(): Promise<boolean> {
  if (useMockOnly()) return false;
  if (globalForPg.dbReachable === false) return false;
  if (globalForPg.dbReachable === true) return true;

  try {
    await getPool().query('SELECT 1');
    globalForPg.dbReachable = true;
    return true;
  } catch (error) {
    globalForPg.dbReachable = false;
    if (process.env.NODE_ENV === 'development') {
      const message = isConnectionError(error)
        ? 'Cannot reach PostgreSQL (check internet / Neon dashboard).'
        : 'PostgreSQL unavailable.';
      logMockMode(message);
    }
    return false;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  const start = Date.now();
  const res = await getPool().query<T>(text, params);
  if (process.env.DEBUG_DB === 'true') {
    console.log('executed query', { text, duration: Date.now() - start, rows: res.rowCount });
  }
  return res;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function applyGeoFilters(events: Event[], filters?: EventFilters): Event[] {
  if (filters?.lat == null || filters?.lng == null) return events;
  let result = withDistance(events, filters.lat, filters.lng);
  if (filters.radius_km && filters.radius_km > 0) {
    result = filterByRadius(result, filters.radius_km);
  }
  return result;
}

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  if (!(await canUseDatabase())) {
    return applyGeoFilters(filterEvents(mockGetEvents(), filters), filters);
  }

  let sql = 'SELECT * FROM events WHERE 1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters?.category && filters.category !== 'all') {
    sql += ` AND category = $${paramIndex}`;
    params.push(filters.category);
    paramIndex++;
  }

  if (filters?.price_type === 'free') {
    sql += ' AND is_free = true';
  } else if (filters?.price_type === 'paid') {
    sql += ' AND is_free = false';
  }

  const dateFilter = filters?.date;
  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    if (dateFilter === 'today') {
      const tomorrow = new Date(startOfDay(now));
      tomorrow.setDate(tomorrow.getDate() + 1);
      sql += ` AND date >= $${paramIndex} AND date < $${paramIndex + 1}`;
      params.push(startOfDay(now).toISOString(), tomorrow.toISOString());
      paramIndex += 2;
    } else if (dateFilter === 'week') {
      const weekLater = new Date(now);
      weekLater.setDate(weekLater.getDate() + 7);
      sql += ` AND date >= $${paramIndex} AND date <= $${paramIndex + 1}`;
      params.push(now.toISOString(), weekLater.toISOString());
      paramIndex += 2;
    } else if (dateFilter === 'month') {
      const monthLater = new Date(now);
      monthLater.setMonth(monthLater.getMonth() + 1);
      sql += ` AND date >= $${paramIndex} AND date <= $${paramIndex + 1}`;
      params.push(now.toISOString(), monthLater.toISOString());
      paramIndex += 2;
    }
  }

  sql += ' ORDER BY date ASC';

  try {
    const result = await query(sql, params);
    const events = result.rows.map((row) => mapEventRow(row));
    return applyGeoFilters(events, filters);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      const reason = isMissingTableError(error)
        ? 'Tables missing. Run: npm run db:init'
        : 'Connection lost.';
      handleDbFallback(error, reason);
      return applyGeoFilters(filterEvents(mockGetEvents(), filters), filters);
    }
    throw error;
  }
}

export async function getEventById(id: number): Promise<Event | null> {
  if (!(await canUseDatabase())) {
    return mockGetEventById(id);
  }

  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);
    return result.rows[0] ? mapEventRow(result.rows[0]) : null;
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      handleDbFallback(
        error,
        isMissingTableError(error) ? 'Tables missing. Run: npm run db:init' : 'Connection lost.'
      );
      return mockGetEventById(id);
    }
    throw error;
  }
}

export async function createEvent(input: EventInput, createdBy: number): Promise<Event> {
  if (!(await canUseDatabase())) {
    return mockCreateEvent(input, createdBy);
  }

  const result = await query(
    `INSERT INTO events (
      title, description, category, date, price, is_free,
      latitude, longitude, venue, address, image_url, images, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
    RETURNING *`,
    [
      input.title,
      input.description,
      input.category,
      input.date,
      input.price,
      input.is_free,
      input.latitude,
      input.longitude,
      input.venue,
      input.address ?? null,
      input.image_url,
      JSON.stringify(input.images),
      createdBy,
    ]
  );
  return mapEventRow(result.rows[0]);
}

export async function updateEvent(id: number, input: EventInput): Promise<Event | null> {
  if (!(await canUseDatabase())) {
    return mockUpdateEvent(id, input);
  }

  const result = await query(
    `UPDATE events SET
      title=$1, description=$2, category=$3, date=$4, price=$5, is_free=$6,
      latitude=$7, longitude=$8, venue=$9, address=$10, image_url=$11, images=$12::jsonb
    WHERE id=$13 RETURNING *`,
    [
      input.title,
      input.description,
      input.category,
      input.date,
      input.price,
      input.is_free,
      input.latitude,
      input.longitude,
      input.venue,
      input.address ?? null,
      input.image_url,
      JSON.stringify(input.images),
      id,
    ]
  );
  return result.rows[0] ? mapEventRow(result.rows[0]) : null;
}

export async function deleteEvent(id: number): Promise<boolean> {
  if (!(await canUseDatabase())) {
    return mockDeleteEvent(id);
  }

  const result = await query('DELETE FROM events WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getUserEvents(userId: number, type: string): Promise<number[]> {
  if (!(await canUseDatabase())) {
    return mockGetUserEvents(userId, type);
  }

  try {
    const result = await query<{ event_id: number }>(
      'SELECT event_id FROM user_events WHERE user_id = $1 AND type = $2',
      [userId, type]
    );
    return result.rows.map((row) => row.event_id);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      handleDbFallback(
        error,
        isMissingTableError(error) ? 'Tables missing. Run: npm run db:init' : 'Connection lost.'
      );
      return mockGetUserEvents(userId, type);
    }
    throw error;
  }
}

export async function toggleUserEvent(
  userId: number,
  eventId: number,
  type: string,
  forceOn = false
): Promise<{ added: boolean }> {
  if (!(await canUseDatabase())) {
    return mockToggleUserEvent(userId, eventId, type);
  }

  try {
    const existing = await query(
      'SELECT id FROM user_events WHERE user_id = $1 AND event_id = $2 AND type = $3',
      [userId, eventId, type]
    );

    if (existing.rows.length > 0) {
      if (forceOn) {
        return { added: false };
      }
      await query(
        'DELETE FROM user_events WHERE user_id = $1 AND event_id = $2 AND type = $3',
        [userId, eventId, type]
      );
      return { added: false };
    }

    await query(
      'INSERT INTO user_events (user_id, event_id, type) VALUES ($1, $2, $3)',
      [userId, eventId, type]
    );
    return { added: true };
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      handleDbFallback(
        error,
        isMissingTableError(error) ? 'Tables missing. Run: npm run db:init' : 'Connection lost.'
      );
      return mockToggleUserEvent(userId, eventId, type, forceOn);
    }
    throw error;
  }
}

function mapTicketRow(row: {
  id: number;
  user_id: number;
  event_id: number;
  name: string;
  email: string;
  phone: string | null;
  is_paid: boolean;
  created_at: string;
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  price?: string | number;
  is_free?: boolean;
  latitude?: number;
  longitude?: number;
  venue?: string;
  address?: string | null;
  image_url?: string;
  images?: string | any[];
}): Ticket {
  const ticket: Ticket = {
    id: row.id,
    user_id: row.user_id,
    event_id: row.event_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    is_paid: row.is_paid,
    created_at: row.created_at,
  };

  if (row.title) {
    ticket.event = {
      id: row.event_id,
      title: row.title,
      description: row.description ?? '',
      category: row.category as EventCategory,
      date: row.date ?? '',
      price: Number(row.price ?? 0),
      is_free: Boolean(row.is_free),
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      venue: row.venue ?? '',
      address: row.address ?? null,
      image_url: row.image_url ?? '',
      images: Array.isArray(row.images)
        ? row.images
        : typeof row.images === 'string'
        ? (() => {
            try {
              return JSON.parse(row.images);
            } catch {
              return [row.images];
            }
          })()
        : [],
      created_at: row.created_at,
    };
  }

  return ticket;
}

export async function createTicket(
  userId: number,
  eventId: number,
  ticketInfo: TicketInfo,
  isPaid: boolean
): Promise<Ticket> {
  if (!(await canUseDatabase())) {
    return mockCreateOrUpdateTicket(userId, eventId, ticketInfo, isPaid);
  }

  const result = await query<{
    id: number;
    user_id: number;
    event_id: number;
    name: string;
    email: string;
    phone: string | null;
    is_paid: boolean;
    created_at: string;
  }>(
    `INSERT INTO tickets (user_id, event_id, name, email, phone, is_paid)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, eventId, ticketInfo.name, ticketInfo.email, ticketInfo.phone || null, isPaid]
  );
  return mapTicketRow(result.rows[0]);
}

export async function getTicketsForUser(userId: number): Promise<Ticket[]> {
  if (!(await canUseDatabase())) {
    return mockGetUserTickets(userId);
  }

  try {
    const result = await query<{
      id: number;
      user_id: number;
      event_id: number;
      name: string;
      email: string;
      phone: string | null;
      is_paid: boolean;
      created_at: string;
      title: string;
      description: string;
      category: string;
      date: string;
      price: string;
      is_free: boolean;
      latitude: number;
      longitude: number;
      venue: string;
      address: string | null;
      image_url: string;
      images: string;
    }>(
      `SELECT t.*, e.title, e.description, e.category, e.date, e.price, e.is_free,
        e.latitude, e.longitude, e.venue, e.address, e.image_url, e.images
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    return result.rows.map(mapTicketRow);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      handleDbFallback(
        error,
        isMissingTableError(error) ? 'Tables missing. Run: npm run db:init' : 'Connection lost.'
      );
      return mockGetUserTickets(userId);
    }
    throw error;
  }
}

export async function getTicketsForEvent(eventId: number): Promise<Ticket[]> {
  if (!(await canUseDatabase())) {
    return mockGetEventTickets(eventId);
  }

  try {
    const result = await query<{
      id: number;
      user_id: number;
      event_id: number;
      name: string;
      email: string;
      phone: string | null;
      is_paid: boolean;
      created_at: string;
      title: string;
      description: string;
      category: string;
      date: string;
      price: string;
      is_free: boolean;
      latitude: number;
      longitude: number;
      venue: string;
      address: string | null;
      image_url: string;
      images: string;
    }>(
      `SELECT t.*, e.title, e.description, e.category, e.date, e.price, e.is_free,
        e.latitude, e.longitude, e.venue, e.address, e.image_url, e.images
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       WHERE t.event_id = $1
       ORDER BY t.created_at DESC`,
      [eventId]
    );
    return result.rows.map(mapTicketRow);
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      handleDbFallback(
        error,
        isMissingTableError(error) ? 'Tables missing. Run: npm run db:init' : 'Connection lost.'
      );
      return mockGetEventTickets(eventId);
    }
    throw error;
  }
}

export async function upsertTicket(
  userId: number,
  eventId: number,
  ticketInfo: TicketInfo,
  isPaid: boolean
): Promise<Ticket> {
  if (!(await canUseDatabase())) {
    return mockCreateOrUpdateTicket(userId, eventId, ticketInfo, isPaid);
  }

  const existing = await query('SELECT id FROM tickets WHERE user_id = $1 AND event_id = $2', [
    userId,
    eventId,
  ]);

  if (existing.rows.length > 0) {
    const result = await query<{
      id: number;
      user_id: number;
      event_id: number;
      name: string;
      email: string;
      phone: string | null;
      is_paid: boolean;
      created_at: string;
    }>(
      `UPDATE tickets SET name = $1, email = $2, phone = $3, is_paid = $4, created_at = NOW()
       WHERE user_id = $5 AND event_id = $6 RETURNING *`,
      [ticketInfo.name, ticketInfo.email, ticketInfo.phone || null, isPaid, userId, eventId]
    );
    return mapTicketRow(result.rows[0]);
  }

  return createTicket(userId, eventId, ticketInfo, isPaid);
}
