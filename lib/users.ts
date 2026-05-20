import bcrypt from 'bcryptjs';
import { query, useMockData } from '@/lib/db';
import { mockCreateUser, mockFindUserByEmail, mockVerifyUser } from '@/lib/mock-store';
import type { SessionUser } from '@/types';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  if (useMockData()) return mockFindUserByEmail(email);
  const result = await query<UserRow>('SELECT * FROM users WHERE email = $1', [
    email.toLowerCase().trim(),
  ]);
  return result.rows[0] ?? null;
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<SessionUser> {
  if (useMockData()) return mockCreateUser(email, password, name);

  const normalized = email.toLowerCase().trim();
  const existing = await findUserByEmail(normalized);
  if (existing) throw new Error('EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query<UserRow>(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'user') RETURNING *`,
    [normalized, passwordHash, name.trim()]
  );
  return toSessionUser(result.rows[0]);
}

export async function verifyUser(email: string, password: string): Promise<SessionUser | null> {
  if (useMockData()) return mockVerifyUser(email, password);

  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return toSessionUser(user);
}
