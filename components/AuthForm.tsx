'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchCurrentUser,
  getPostAuthRedirect,
  redirectAfterAuth,
} from '@/lib/auth-client';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body =
      mode === 'login' ? { email, password } : { email, password, name };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');

      const user = data.user;
      if (!user) throw new Error('Не удалось получить данные пользователя');

      // Проверяем, что сессия реально установилась
      const confirmed = await fetchCurrentUser();
      if (!confirmed) {
        throw new Error('Сессия не сохранилась. Перезагрузите страницу и попробуйте снова.');
      }

      const target = getPostAuthRedirect(user, next);
      redirectAfterAuth(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {mode === 'login' ? 'Вход' : 'Регистрация'}
      </h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="mb-1 block text-sm font-medium">Имя</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Пароль</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Вход...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>

    </div>
  );
}
