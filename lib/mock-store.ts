import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import type { Event, EventInput, SessionUser } from '@/types';
import { DEMO_EVENTS } from '@/lib/mock-data';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'mock-db.json');

interface MockUserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface MockTicketRow {
  id: number;
  user_id: number;
  event_id: number;
  name: string;
  email: string;
  phone?: string | null;
  is_paid: boolean;
  created_at: string;
}

interface MockDbFile {
  events: Event[];
  nextEventId: number;
  favorites: Record<string, number[]>;
  going: Record<string, number[]>;
  users: MockUserRow[];
  nextUserId: number;
  tickets: MockTicketRow[];
  nextTicketId: number;
}

interface MockState {
  events: Event[];
  nextEventId: number;
  favorites: Map<number, Set<number>>;
  going: Map<number, Set<number>>;
  users: MockUserRow[];
  nextUserId: number;
  tickets: MockTicketRow[];
  nextTicketId: number;
}

const globalForMock = globalThis as typeof globalThis & {
  znanieseveraMockState?: MockState;
};

function mapToRecord(map: Map<number, Set<number>>): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  Array.from(map.entries()).forEach(([key, value]) => {
    out[String(key)] = Array.from(value);
  });
  return out;
}

function recordToMap(record: Record<string, number[]>): Map<number, Set<number>> {
  const map = new Map<number, Set<number>>();
  for (const [key, value] of Object.entries(record)) {
    map.set(Number(key), new Set(value));
  }
  return map;
}

function saveMockDb(state: MockState) {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const payload: MockDbFile = {
      events: state.events,
      nextEventId: state.nextEventId,
      favorites: mapToRecord(state.favorites),
      going: mapToRecord(state.going),
      users: state.users,
      nextUserId: state.nextUserId,
      tickets: state.tickets,
      nextTicketId: state.nextTicketId,
    };
    writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.error('[znaniesevera] Failed to save mock DB:', error);
  }
}

function loadMockDbFromFile(): MockState | null {
  if (!existsSync(DATA_FILE)) return null;
  try {
    const raw = readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw) as MockDbFile;
    return {
      events: data.events ?? [],
      nextEventId: data.nextEventId ?? 1,
      favorites: recordToMap(data.favorites ?? {}),
      going: recordToMap(data.going ?? {}),
      users: data.users ?? [],
      nextUserId: data.nextUserId ?? 1,
      tickets: data.tickets ?? [],
      nextTicketId: data.nextTicketId ?? 1,
    };
  } catch (error) {
    console.error('[znaniesevera] Failed to load mock DB, using defaults:', error);
    return null;
  }
}

function createDefaultState(): MockState {
  return {
    events: [...DEMO_EVENTS],
    nextEventId: DEMO_EVENTS.length + 1,
    favorites: new Map(),
    going: new Map(),
    users: [],
    nextUserId: 1,
    tickets: [],
    nextTicketId: 1,
  };
}

function getState(): MockState {
  if (globalForMock.znanieseveraMockState) {
    return globalForMock.znanieseveraMockState;
  }

  const fromFile = loadMockDbFromFile();
  const state = fromFile ?? createDefaultState();
  globalForMock.znanieseveraMockState = state;

  if (!fromFile) {
    saveMockDb(state);
  }

  return state;
}

function persist() {
  const state = getState();
  saveMockDb(state);
}

async function ensureAdmin() {
  const state = getState();
  if (state.users.some((u) => u.role === 'admin')) return;
  state.users.push({
    id: state.nextUserId++,
    email: 'admin@znaniesevera.com',
    password_hash: await bcrypt.hash('admin123', 10),
    name: 'Администратор',
    role: 'admin',
    created_at: new Date().toISOString(),
  });
  persist();
}

export async function mockFindUserByEmail(email: string) {
  await ensureAdmin();
  return getState().users.find((u) => u.email === email.toLowerCase().trim()) ?? null;
}

export async function mockCreateUser(
  email: string,
  password: string,
  name: string
): Promise<SessionUser> {
  await ensureAdmin();
  const state = getState();
  const normalized = email.toLowerCase().trim();
  if (state.users.some((u) => u.email === normalized)) {
    throw new Error('EMAIL_EXISTS');
  }
  const user: MockUserRow = {
    id: state.nextUserId++,
    email: normalized,
    password_hash: await bcrypt.hash(password, 10),
    name: name.trim(),
    role: 'user',
    created_at: new Date().toISOString(),
  };
  state.users.push(user);
  persist();
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function mockVerifyUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await mockFindUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function getSet(map: Map<number, Set<number>>, userId: number) {
  if (!map.has(userId)) map.set(userId, new Set());
  return map.get(userId)!;
}

export function mockGetUserEvents(userId: number, type: string): number[] {
  const state = getState();
  const set =
    type === 'favorite'
      ? state.favorites.get(userId)
      : type === 'going'
        ? state.going.get(userId)
        : null;
  return set ? Array.from(set) : [];
}

export function mockToggleUserEvent(
  userId: number,
  eventId: number,
  type: string,
  forceOn = false
): { added: boolean } {
  const state = getState();
  const map = type === 'favorite' ? state.favorites : type === 'going' ? state.going : null;
  if (!map) return { added: false };
  const set = getSet(map, userId);
  if (set.has(eventId)) {
    if (forceOn) {
      return { added: false };
    }
    set.delete(eventId);
    persist();
    return { added: false };
  }
  set.add(eventId);
  persist();
  return { added: true };
}

export function mockGetUserTickets(userId: number) {
  const state = getState();
  return state.tickets
    .filter((ticket) => ticket.user_id === userId)
    .map((ticket) => ({ ...ticket }));
}

export function mockGetEventTickets(eventId: number) {
  const state = getState();
  return state.tickets
    .filter((ticket) => ticket.event_id === eventId)
    .map((ticket) => ({ ...ticket }));
}

export function mockCreateOrUpdateTicket(
  userId: number,
  eventId: number,
  ticketInfo: { name: string; email: string; phone?: string },
  isPaid: boolean
) {
  const state = getState();
  const existing = state.tickets.find((ticket) => ticket.user_id === userId && ticket.event_id === eventId);
  if (existing) {
    existing.name = ticketInfo.name;
    existing.email = ticketInfo.email;
    existing.phone = ticketInfo.phone ?? null;
    existing.is_paid = isPaid;
    existing.created_at = new Date().toISOString();
    persist();
    return existing;
  }

  const ticket = {
    id: state.nextTicketId++,
    user_id: userId,
    event_id: eventId,
    name: ticketInfo.name,
    email: ticketInfo.email,
    phone: ticketInfo.phone ?? null,
    is_paid: isPaid,
    created_at: new Date().toISOString(),
  };
  state.tickets.push(ticket);
  persist();
  return ticket;
}

export function mockGetEvents(): Event[] {
  return [...getState().events];
}

export function mockGetEventById(id: number): Event | null {
  return getState().events.find((e) => e.id === id) ?? null;
}

export function mockCreateEvent(input: EventInput, _createdBy: number): Event {
  const state = getState();
  const event: Event = {
    id: state.nextEventId++,
    ...input,
    address: input.address ?? null,
    created_at: new Date().toISOString(),
  };
  state.events.push(event);
  persist();
  return event;
}

export function mockUpdateEvent(id: number, input: EventInput): Event | null {
  const state = getState();
  const index = state.events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  state.events[index] = {
    ...state.events[index],
    ...input,
    address: input.address ?? null,
  };
  persist();
  return state.events[index];
}

export function mockDeleteEvent(id: number): boolean {
  const state = getState();
  const before = state.events.length;
  state.events = state.events.filter((e) => e.id !== id);
  if (state.events.length < before) {
    persist();
    return true;
  }
  return false;
}

export function isMockPersistenceActive(): boolean {
  return existsSync(DATA_FILE) || globalForMock.znanieseveraMockState != null;
}
