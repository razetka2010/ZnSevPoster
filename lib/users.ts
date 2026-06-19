import bcrypt from 'bcryptjs';
import { query, useMockData } from '@/lib/db';
import {
  mockCreateUser,
  mockFindUserByEmail,
  mockGetUserById,
  mockVerifyUser,
  mockUpdateUserProfile,
} from '@/lib/mock-store';
import type { SessionUser } from '@/types';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone?: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
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

export async function getUserById(userId: number): Promise<SessionUser | null> {
  try {
    if (useMockData()) {
      return mockGetUserById(userId);
    }

    const result = await query<UserRow>(
      'SELECT id, email, name, phone, role FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] ? toSessionUser(result.rows[0]) : null;
  } catch (error) {
    console.error('[users] getUserById failed:', {
      userId,
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function updateUserProfile(
  userId: number,
  email: string,
  name: string,
  phone?: string | null
): Promise<SessionUser> {
  try {
    if (useMockData()) return mockUpdateUserProfile(userId, email, name, phone);

    const normalized = email.toLowerCase().trim();
    const existing = await query<UserRow>(
      'SELECT id FROM users WHERE email = $1 AND id <> $2',
      [normalized, userId]
    );
    if (existing.rows.length > 0) {
      throw new Error('EMAIL_EXISTS');
    }

    const result = await query<UserRow>(
      `UPDATE users SET email = $1, name = $2, phone = $3
       WHERE id = $4 RETURNING id, email, name, phone, role`,
      [normalized, name.trim(), phone || null, userId]
    );

    return toSessionUser(result.rows[0]);
  } catch (error) {
    console.error('[users] updateUserProfile failed:', {
      userId,
      email,
      userName: name,
      phone,
      errorName: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function verifyUser(email: string, password: string): Promise<SessionUser | null> {
  if (useMockData()) return mockVerifyUser(email, password);

  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;
  return toSessionUser(user);
}
