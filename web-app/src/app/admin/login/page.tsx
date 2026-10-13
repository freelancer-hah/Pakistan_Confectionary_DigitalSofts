'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/admin');
          return;
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setCheckingSession(false);
      }
    }
    checkExistingSession();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both email and password / برائے مہربانی ای میل اور پاس ورڈ درج کریں');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message || 'Invalid email or password / غلط ای میل یا پاس ورڈ');
        setLoading(false);
        return;
      }

      if (data.session) {
        router.replace('/admin');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl shadow-md shadow-amber-400/20 animate-pulse">
            🍬
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>Verifying session / تصدیق جاری ہے...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-amber-50/50 flex flex-col justify-center items-center p-3 sm:p-4 overflow-hidden relative select-none">
      {/* Subtle ambient light glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-5 right-10 w-72 h-72 bg-orange-200/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[22rem] sm:max-w-sm relative z-10 flex flex-col justify-center my-auto">
        {/* Brand Header */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 text-2xl shadow-md shadow-amber-400/25 mb-1.5 border border-amber-300/60">
            🍬
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
            PAKISTAN <span className="text-amber-500">CONFECTIONARY</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-urdu leading-tight">
            ایڈمنسٹریشن و اسٹور مینجمنٹ پورٹل
          </p>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-800 mt-1 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>Admin Console Access Only</span>
          </div>
        </div>

        {/* Compact Smooth Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900">Sign In to Dashboard</h2>
            <p className="text-[11px] text-slate-500">
              Enter your authorized admin credentials.
            </p>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2 animate-in fade-in-50">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Admin Email / ای میل پتہ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pakconfectionary.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Password / خفیہ پاس ورڈ
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1.5 py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl transition duration-150 shadow-sm shadow-amber-500/25 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Secure System Footer Note */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Encrypted Supabase Session</span>
            </span>
            <span className="font-urdu text-[10px] text-slate-400">
              محفوظ سیشن کنٹرول
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
