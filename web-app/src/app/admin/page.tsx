'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  ArrowRight, 
  PhoneCall, 
  MessageCircle, 
  Boxes,
  TrendingUp,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Order } from '@/types/wholesale';

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (prodData) setProducts(prodData);

        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .order('created_at', { ascending: false })
          .limit(8);

        if (orderData) setOrders(orderData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const wholesaleProducts = products.filter(p => p.product_type === 'wholesale');
  const retailProducts = products.filter(p => p.product_type === 'retail');
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const lowStockProducts = products.filter(p => p.stock <= 10);

  // Revenue calculation
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider bg-amber-100/70 px-2.5 py-0.5 rounded-full">
              Live Operations Control
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu leading-normal">
            اسٹاک مینجمنٹ، ہول سیل ریٹس اور کسٹمر کیش آن ڈیلیوری آرڈرز کا مرکزی کنٹرول
          </p>
        </div>
      </div>

      {/* Low Stock Urgent Warning Banner (if applicable) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/30 text-amber-900 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950">
                Low Stock Alert / اسٹاک کی کمی کا انتباہ
              </h4>
              <p className="text-[11px] font-urdu text-amber-900 mt-0.5">
                <strong>{lowStockProducts.length} پروڈکٹس</strong> کا اسٹاک 10 یا اس سے کم ہے۔ فوری مال کا انتظام فرمائیں۔
              </p>
            </div>
          </div>
          <Link
            href="/admin/products"
            className="text-xs font-bold text-amber-950 bg-white hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-300 transition shadow-2xs self-end sm:self-auto"
          >
            Manage Stock / اسٹاک دیکھیں →
          </Link>
        </div>
      )}

      {/* 4 Soft Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Wholesale */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-white p-5 rounded-3xl border border-amber-200/70 shadow-2xs hover:border-amber-400 transition hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Wholesale Cartons</span>
              <span className="text-xs font-urdu text-amber-800 font-bold">ہول سیل کارٹن لسٹ</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition">
              📦
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">{loading ? '...' : wholesaleProducts.length}</div>
            <span className="text-[11px] text-amber-800 font-black bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              B2B Cartons
            </span>
          </div>
        </div>

        {/* Card 2: Retail */}
        <div className="bg-gradient-to-br from-sky-50/80 via-white to-white p-5 rounded-3xl border border-sky-200/70 shadow-2xs hover:border-sky-400 transition hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Retail Items</span>
              <span className="text-xs font-urdu text-sky-800 font-bold">ریٹیل پیکٹس و دانے</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition">
              🛍️
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900">{loading ? '...' : retailProducts.length}</div>
            <span className="text-[11px] text-sky-800 font-black bg-sky-100/80 px-2.5 py-0.5 rounded-full">
              Consumer Packs
            </span>
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-gradient-to-br from-rose-50/80 via-white to-white p-5 rounded-3xl border border-rose-200/70 shadow-2xs hover:border-rose-400 transition hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Pending Orders</span>
              <span className="text-xs font-urdu text-rose-800 font-bold">تصدیق طلب آرڈرز</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-100/90 text-rose-700 flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition">
              <Clock className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-3xl font-black text-rose-600">{loading ? '...' : pendingOrders.length}</div>
            <span className="text-[11px] text-rose-800 font-black bg-rose-100/80 px-2.5 py-0.5 rounded-full">
              Need Action
            </span>
          </div>
        </div>

        {/* Card 4: Total Orders & Revenue */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-white p-5 rounded-3xl border border-emerald-200/70 shadow-2xs hover:border-emerald-400 transition hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recorded Revenue</span>
              <span className="text-xs font-urdu text-emerald-800 font-bold">کل آرڈر والیوم</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              Rs. {loading ? '...' : totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-800 font-black bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              {orders.length} Orders
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Action Shortcuts Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/products/new"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 shadow-2xs hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <Plus className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block group-hover:text-amber-600 transition">
              Add New Product / نیا مال شامل کریں
            </span>
            <span className="text-[11px] text-slate-400 font-urdu block">
              نئے کارٹن ریٹ، تصویر اور اسٹاک درج کریں
            </span>
          </div>
        </Link>

        <Link
          href="/admin/products"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 shadow-2xs hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <Boxes className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block group-hover:text-amber-600 transition">
              Inventory & Stock / گودام کا اسٹاک
            </span>
            <span className="text-[11px] text-slate-400 font-urdu block">
              فوری اسٹاک اپ ڈیٹ اور پروڈکٹ ترمیم
            </span>
          </div>
        </Link>

        <Link
          href="/admin/orders"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 shadow-2xs hover:shadow-xs transition flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold group-hover:scale-105 transition">
            <ShoppingCart className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="font-black text-xs text-slate-900 block group-hover:text-emerald-700 transition">
              Customer Orders / تمام آرڈرز ڈیسک
            </span>
            <span className="text-[11px] text-slate-400 font-urdu block">
              کسٹمر سے رابطہ، تصدیق اور انوائس پرنٹ
            </span>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg">
              Recent Orders / تازہ آرڈرز
            </h3>
            <p className="text-xs text-slate-500 font-urdu mt-0.5">
              فون یا واٹس ایپ پر رابطہ کر کے ترسیل کی تصدیق فرمائیں
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-black text-amber-950 hover:text-amber-900 flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 px-3.5 py-2 rounded-xl transition shadow-2xs"
          >
            <span>View All Orders ({orders.length}) / تمام آرڈرز</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-urdu">آرڈرز لوڈ ہو رہے ہیں...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No orders recorded yet</p>
              <p className="text-xs font-urdu text-slate-400">فی الحال کوئی آرڈر موصول نہیں ہوا۔ نیا آرڈر آتے ہی یہاں نمودار ہو گا۔</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => {
                const isPending = o.status === 'Pending';
                const isConfirmed = o.status === 'Confirmed';
                const isDelivered = o.status === 'Delivered';

                const statusColor = isPending
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isConfirmed
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isDelivered
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200';

                return (
                  <div
                    key={o.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs transition"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-800 flex items-center justify-center font-black text-sm flex-shrink-0">
                        {o.customer_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-slate-900 text-sm">{o.order_number}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            o.order_type === 'wholesale' 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : 'bg-sky-100 text-sky-900 border-sky-300'
                          }`}>
                            {o.order_type === 'wholesale' ? '📦 Wholesale Carton' : '🛍️ Retail'}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                            ● {o.status}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{o.customer_name}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700">{o.phone}</span>
                          <span>•</span>
                          <span className="text-slate-500">{o.city}</span>
                          {o.order_items && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.2 rounded-md">
                                {o.order_items.length} items
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
                      <div className="text-left lg:text-right">
                        <div className="text-base font-black text-slate-900 font-mono">
                          Rs. {Number(o.total_amount).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-urdu">کیش آن ڈیلیوری (COD)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${o.whatsapp || o.phone}?text=${encodeURIComponent(
                            `السلام علیکم ${o.customer_name}! پاکستان کنفیکشنری سے آپ کے آرڈر (${o.order_number}) مالیت Rs. ${Number(o.total_amount).toLocaleString()} کی تصدیق کے لیے رابطہ کیا جا رہا ہے۔ کیا آپ کا پتہ (${o.address}, ${o.city}) درست ہے؟`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${o.phone}`}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition"
                          title="Call Customer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
