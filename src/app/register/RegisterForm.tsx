'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { useLocale } from '@/lib/i18n/provider';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const inviteToken = searchParams.get('invite');
  const prefilledEmail = searchParams.get('email');

  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          inviteToken,
          orgName: inviteToken ? undefined : orgName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : t.auth.registrationFailed);
        return;
      }
      // If invite was accepted, go to dashboard; otherwise onboarding
      if (data.orgId) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
      router.refresh();
    } catch (err) {
      console.error('RegisterForm submit error:', err);
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo className="h-5 w-5 text-emerald-600" />
          <span className="font-bold text-zinc-950 dark:text-zinc-50">{t.common.appName}</span>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mb-1">{t.auth.createAccount}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{t.auth.createWelcome}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t.auth.fullName}</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="Ahmad Ibrahim"
              />
            </div>
            {!inviteToken && (
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t.auth.orgName}</label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  maxLength={100}
                  autoComplete="organization"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="Al-Noor Mosque Trust"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{t.auth.orgHint}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t.auth.email}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder="ahmad@mosque.org"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">{t.auth.password}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder={t.auth.passwordHint}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 dark:text-red-400 dark:bg-red-950/40 dark:border-red-900" role="alert">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? t.auth.creatingAccount : t.auth.createAccount}
            </button>
          </form>
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-5">
            {t.auth.haveAccount}{' '}
            <Link href="/login" className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">
              {t.auth.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
