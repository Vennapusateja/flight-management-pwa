'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { login } from '@/actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await login(data);
      if (result?.error) setServerError(result.error);
    });
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-50">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your bookings</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card flex flex-col gap-5 p-6"
          noValidate
        >
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
            required
            autoComplete="current-password"
          />

          {serverError && (
            <p role="alert" className="text-center text-sm text-red-400">
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={isPending} className="mt-2 w-full">
            Sign In
          </Button>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
