'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, User, Mail, Phone } from 'lucide-react';
import type { SessionUser } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) return;
      const data = await res.json();
      setUser(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
    };
    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!name.trim() || !email.trim()) {
      setError('Введите имя и email');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Не удалось сохранить профиль');
      }
      const data = await res.json();
      setUser(data);
      setStatus('Данные профиля сохранены');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-[var(--brand-soft)] bg-[var(--brand-soft)] p-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-[var(--brand)] text-white">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--brand-dark)]">Личный кабинет</h1>
            <p className="text-sm text-[var(--brand-muted)]">Здесь сохраняются ваши данные для быстрого «Пойду».</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {status && (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">Имя</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Pencil className="h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="Ваше имя"
              />
            </div>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-2 block">Email</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none"
                placeholder="example@mail.com"
              />
            </div>
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-2 block">Телефон</span>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Phone className="h-4 w-4 text-slate-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent outline-none"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Заполните профиль один раз, чтобы быстро регистрироваться на события.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`inline-flex items-center justify-center rounded-2xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-dark)] ${
              saving ? 'cursor-not-allowed opacity-80' : ''
            }`}
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
