'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Trash2, 
  Boxes, 
  Edit, 
  Package, 
  Check, 
  AlertCircle,
  X,
  PlusCircle,
  MinusCircle,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/wholesale';
import { useToast } from '@/components/ToastProvider';

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wholesale' | 'retail'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickStockUpdate(id: string, name: string) {
    if (newStockVal < 0) return;
    setUpdatingStock(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStockVal })
        .eq('id', id);

      if (!error) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStockVal } : p));
        setEditingStockId(null);
        toast.success(
          'Stock Updated!',
          'اسٹاک کامیابی سے اپ ڈیٹ ہو گیا',
          `${name}: ${newStockVal} units`
        );
      } else {
        toast.error('Stock Update Failed', 'اسٹاک اپ ڈیٹ نہیں ہو سکا', error.message);
      }
    } catch (err: any) {
      console.error('Stock update failed:', err);
      toast.error('Stock Update Failed', 'اسٹاک اپ ڈیٹ نہیں ہو سکا', err?.message);
    } finally {
      setUpdatingStock(false);
    }
  }

  async function handleQuickStockDelta(id: string, name: string, delta: number) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const targetVal = Math.max(0, product.stock + delta);

    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: targetVal })
        .eq('id', id);

      if (!error) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: targetVal } : p));
        toast.info('Stock Adjusted', `${name}`, `${targetVal} ${product.unit}s remaining`);
      }
    } catch (err: any) {
      toast.error('Failed to adjust stock', err.message);
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? / کیا آپ واقعی اس پروڈکٹ کو ختم کرنا چاہتے ہیں؟`)) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        setProducts(products.filter(p => p.id !== id));
        toast.info(
          'Product Deleted',
          'پروڈکٹ فہرست سے ہٹا دی گئی',
          `"${name}" removed from catalog`
        );
      } else {
        toast.error('Delete Failed', 'پروڈکٹ ڈیلیٹ نہیں ہو سکی', error.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Delete Failed', 'پروڈکٹ ڈیلیٹ نہیں ہو سکی', err?.message);
    }
  }

  const wholesaleCount = products.filter(p => p.product_type === 'wholesale').length;
  const retailCount = products.filter(p => p.product_type === 'retail').length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const filtered = products.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchType = filterType === 'all' || p.product_type === filterType;

    let matchStock = true;
    if (stockFilter === 'low') {
      matchStock = p.stock > 0 && p.stock <= 10;
    } else if (stockFilter === 'out') {
      matchStock = p.stock <= 0;
    }

    return matchSearch && matchType && matchStock;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Warehouse Catalog
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Inventory & Stock Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
            ہول سیل کارٹن اور ریٹیل اسٹاک کی تفصیلات، قیمتیں اور فوری مقدار میں تبدیلی
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
          <span className="font-urdu text-[11px] font-normal">| نیا پروڈکٹ</span>
        </Link>
      </div>

      {/* 4 Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Items</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
          <span className="text-[11px] font-urdu text-slate-500">کل پروڈکٹس</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Wholesale Cartons</span>
          <div className="text-2xl font-black text-amber-950 mt-1">{wholesaleCount}</div>
          <span className="text-[11px] font-urdu text-amber-800">ہول سیل کارٹن</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">Retail Products</span>
          <div className="text-2xl font-black text-sky-950 mt-1">{retailCount}</div>
          <span className="text-[11px] font-urdu text-sky-800">ریٹیل پیکٹس</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-2xs">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">Needs Restock</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{lowStockCount + outOfStockCount}</div>
          <span className="text-[11px] font-urdu text-rose-800">کم یا ختم اسٹاک</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title or description / تلاش کریں..."
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50/70 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl text-xs flex-shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === 'all' 
                  ? 'bg-white text-slate-950 shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              All Types ({products.length})
            </button>
            <button
              onClick={() => setFilterType('wholesale')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === 'wholesale' 
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              📦 Wholesale ({wholesaleCount})
            </button>
            <button
              onClick={() => setFilterType('retail')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filterType === 'retail' 
                  ? 'bg-blue-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              🛍️ Retail ({retailCount})
            </button>
          </div>
        </div>

        {/* Stock Filter Sub-chips */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Stock Filter:</span>
          <button
            onClick={() => setStockFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Stock Levels
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              stockFilter === 'low'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⚠️ Low Stock (≤ 10)
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
              stockFilter === 'out'
                ? 'bg-rose-600 text-white font-black'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ❌ Out of Stock (0)
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                <th className="py-4 px-5">Product Details / پروڈکٹ</th>
                <th className="py-4 px-4">Type / نوعیت</th>
                <th className="py-4 px-4">Price / قیمت</th>
                <th className="py-4 px-4">Stock & Quick Stepper / موجودہ اسٹاک</th>
                <th className="py-4 px-5 text-right">Action / کارروائی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-urdu">اسٹاک لسٹ لوڈ ہو رہی ہے...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No products match your search or filters</p>
                    <p className="text-xs font-urdu text-slate-400">کوئی پروڈکٹ موجود نہیں۔ تلاش یا فلٹر تبدیل کریں۔</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isWholesale = p.product_type === 'wholesale';
                  const isLow = p.stock > 0 && p.stock <= 10;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                      {/* Image & Title */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                            ) : (
                              <span className="text-2xl">
                                {isWholesale ? '📦' : '🍬'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm group-hover:text-amber-700 transition">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                              {p.description || 'معیاری کنفیکشنری پروڈکٹ'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${
                          isWholesale
                            ? 'bg-amber-100/80 text-amber-950 border-amber-300'
                            : 'bg-blue-100/80 text-blue-950 border-blue-300'
                        }`}>
                          <span>{isWholesale ? '📦' : '🛍️'}</span>
                          <span>{isWholesale ? `Wholesale (${p.unit})` : `Retail (${p.unit})`}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4">
                        <div className="font-black text-slate-900 text-sm font-mono">
                          Rs. {Number(p.price).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-normal">per {p.unit.toLowerCase()}</span>
                      </td>

                      {/* Stock with Steppers & Quick Edit */}
                      <td className="py-4 px-4">
                        {editingStockId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={newStockVal}
                              onChange={(e) => setNewStockVal(Number(e.target.value))}
                              className="w-20 px-2.5 py-1.5 text-xs border border-amber-400 rounded-xl font-bold bg-white text-slate-900"
                            />
                            <button
                              onClick={() => handleQuickStockUpdate(p.id, p.name)}
                              disabled={updatingStock}
                              className="p-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-2xs"
                              title="Save Stock"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {/* Stock Badge */}
                            <span className={`font-mono font-black text-xs px-3 py-1 rounded-full border ${
                              isOut 
                                ? 'bg-rose-100 text-rose-700 border-rose-200' 
                                : isLow
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {p.stock} {p.unit}s
                            </span>

                            {/* Micro Stepper Buttons for instant 1-click update */}
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleQuickStockDelta(p.id, p.name, -1)}
                                disabled={p.stock <= 0}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 font-bold flex items-center justify-center text-xs transition"
                                title="Subtract 1 unit"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleQuickStockDelta(p.id, p.name, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs transition"
                                title="Add 1 unit"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                setEditingStockId(p.id);
                                setNewStockVal(p.stock);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                              title="Type custom stock number"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
