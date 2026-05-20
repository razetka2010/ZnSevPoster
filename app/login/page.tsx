'use client';

import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-xl bg-white" />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
