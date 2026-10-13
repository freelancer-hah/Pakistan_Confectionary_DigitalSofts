'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  Menu,
  X,
  TrendingUp,
  CheckCircle2,
  LogOut,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavItem {
  name: string;
  urduName: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard Overview',
    urduName: 'ڈیش بورڈ جائزہ',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventory & Stock',
    urduName: 'اسٹاک و مال',
    href: '/admin/products',
    icon: Package,
  },
  {
    name: 'Add New Product',
    urduName: 'نیا پروڈکٹ',
    href: '/admin/products/new',
    icon: PlusCircle,
  },
  {
    name: 'Customer Orders',
    urduName: 'کسٹمر آرڈرز',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // If this is the login route, render children directly without admin layout chrome
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (isMounted) {
            setIsAuthenticated(false);
            router.replace('/admin/login');
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Admin Auth Guard error:', err);
        if (isMounted) {
          router.replace('/admin/login');
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    checkAuth();

    // Listen for auth state changes (e.g. user logs out in another tab)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      } else if (session) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [pathname, isLoginPage, router]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.replace('/admin/login');
    }
  }

  // Bypass layout completely on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex text-slate-800 font-sans antialiased selection:bg-amber-200">
      {/* ========================================================================= */}
      {/* 1. FIXED DESKTOP SIDEBAR - Docked, Elegant SaaS Style */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white flex-col h-screen sticky top-0 z-30 border-r border-slate-200/80 shadow-[2px_0_20px_rgba(0,0,0,0.03)] flex-shrink-0">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100 bg-white">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm shadow-amber-400/25 group-hover:scale-105 transition-transform duration-200">
              🍬
            </div>
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight block group-hover:text-amber-600 transition">
                PAKISTAN <span className="text-amber-500">CONFECTIONARY</span>
              </span>
              <span className="text-xs text-slate-400 font-urdu block -mt-0.5 leading-snug">
                ایڈمن پورٹل • Admin Console
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="p-4 flex-1 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
              Operations & Management
            </p>

            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition duration-150 relative group ${isActive
                      ? 'bg-amber-50 text-amber-950 border border-amber-200/90 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 border border-transparent'
                      }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-amber-500 rounded-r-full shadow-xs"></span>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${isActive
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-900'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs tracking-tight">{item.name}</span>
                    </div>

                    <span
                      className={`text-xs font-urdu font-medium leading-none ${isActive ? 'text-amber-800 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                    >
                      {item.urduName}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Bottom Logout Action */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 hover:border-rose-200 transition group active:scale-98"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
              <span>Log Out</span>
            </div>
            <span className="font-urdu text-[11px] text-slate-400 group-hover:text-rose-500">
              لاگ آؤٹ
            </span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Header with Soft Blur */}
        <header className="h-20 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-5 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          {/* Mobile Menu Trigger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h1 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                  Store Management Console
                </h1>
              </div>
              <span className="text-xs text-slate-500 font-urdu block -mt-0.5 leading-snug">
                پاکستان کنفیکشنری • ایڈمن کنٹرول روم
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-sm active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
              <span className="font-urdu text-[11px] font-normal hidden sm:inline">| نیا پروڈکٹ</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition border border-slate-200/80 active:scale-95"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
              <span className="font-urdu text-[11px] font-normal hidden md:inline">| لاگ آؤٹ</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${isActive ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs font-urdu font-medium">{item.urduName}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </div>
                <span className="text-xs font-urdu font-medium">لاگ آؤٹ</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Session verification overlay */}
      {(authLoading || !isAuthenticated) && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl shadow-md shadow-amber-400/20 animate-pulse">
              🍬
            </div>
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Verifying Admin Access / ایڈمن رسائی کی تصدیق...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
