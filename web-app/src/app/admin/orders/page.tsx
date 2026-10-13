'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  CheckCircle2, 
  Clock, 
  Truck, 
  PhoneCall, 
  MessageCircle, 
  MapPin, 
  Eye, 
  X,
  Printer,
  Copy,
  Check,
  AlertCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types/wholesale';
import { useToast } from '@/components/ToastProvider';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const targetOrder = orders.find(o => o.id === orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (!error) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }

        const urduStatus = 
          newStatus === 'Confirmed' ? 'تصدیق شدہ (ڈسپیچ)' :
          newStatus === 'Delivered' ? 'ترسیل مکمل (ڈیلیورڈ)' :
          newStatus === 'Cancelled' ? 'منسوخ' : 'زیر التوا';

        toast.success(
          `Order Status: ${newStatus}`,
          `آرڈر اسٹیٹس تبدیل: ${urduStatus}`,
          `${targetOrder?.order_number || 'Order'} marked as ${newStatus}`
        );
      } else {
        toast.error('Status Update Failed', 'اسٹیٹس اپ ڈیٹ نہیں ہو سکا', error.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Status Update Failed', 'اسٹیٹس اپ ڈیٹ نہیں ہو سکا', err?.message);
    }
  }

  function copyTrackingId(orderNumber: string) {
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
    toast.info('Copied!', 'ٹریکنگ آئی ڈی کاپی ہو گئی', orderNumber);
  }

  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const confirmedCount = orders.filter(o => o.status === 'Confirmed').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

  const filtered = orders.filter(o => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.city.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalFilteredSum = filtered
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Orders Management Desk
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Customer Orders Desk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
            کسٹمر کیش آن ڈیلیوری آرڈرز کی فہرست، تصدیق، کال/واٹس ایپ اور انوائس پرنٹ
          </p>
        </div>

        {/* Live filtered total */}
        <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Filtered Total</span>
          <div className="text-lg font-black text-slate-900 font-mono">
            Rs. {totalFilteredSum.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs font-black'
              : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200/80'
          }`}
        >
          <span>All Orders</span>
          <span className="text-[10px] bg-slate-800 text-white px-2 py-0.2 rounded-full">{orders.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Pending')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === 'Pending'
              ? 'bg-rose-500 text-white shadow-xs font-black'
              : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending / تصدیق طلب</span>
          <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2 rounded-full">{pendingCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Confirmed')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === 'Confirmed'
              ? 'bg-blue-600 text-white shadow-xs font-black'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Confirmed / روانہ</span>
          <span className="text-[10px] bg-blue-700 text-white px-2 py-0.2 rounded-full">{confirmedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Delivered')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === 'Delivered'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Delivered / ترسیل مکمل</span>
          <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.2 rounded-full">{deliveredCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('Cancelled')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            statusFilter === 'Cancelled'
              ? 'bg-slate-700 text-white shadow-xs font-black'
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <span>Cancelled / منسوخ</span>
          <span className="text-[10px] bg-slate-600 text-white px-2 py-0.2 rounded-full">{cancelledCount}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order #, Customer Name, Mobile Number or City / تلاش کریں..."
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3.5 px-4 sm:px-5 whitespace-nowrap min-w-[130px]">Order # & Date</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[180px]">Customer</th>
                <th className="py-3.5 px-3 whitespace-nowrap min-w-[105px]">Type</th>
                <th className="py-3.5 px-4 whitespace-nowrap min-w-[145px]">Status</th>
                <th className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap min-w-[125px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="font-urdu">آرڈرز لسٹ لوڈ ہو رہی ہے...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 space-y-2">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No orders found matching this criteria</p>
                    <p className="text-xs font-urdu text-slate-400">کوئی آرڈر نہیں ملا۔</p>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Order # */}
                    <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-slate-900 text-xs sm:text-sm tracking-tight">{o.order_number}</span>
                        <button
                          onClick={() => copyTrackingId(o.order_number)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                          title="Copy Order ID"
                        >
                          {copiedId === o.order_number ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {o.customer_name ? o.customer_name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0 max-w-[180px]">
                          <p className="font-bold text-slate-900 text-xs truncate" title={o.customer_name}>{o.customer_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono tracking-tight mt-0.5">{o.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                        o.order_type === 'wholesale'
                          ? 'bg-amber-50 text-amber-900 border-amber-200/90'
                          : 'bg-blue-50 text-blue-900 border-blue-200/90'
                      }`}>
                        <span className="text-xs">{o.order_type === 'wholesale' ? '📦' : '🛍️'}</span>
                        <span>{o.order_type === 'wholesale' ? 'Wholesale' : 'Retail'}</span>
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="relative inline-block w-full min-w-[135px] max-w-[145px]">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                          aria-label="Order status update"
                          className={`w-full text-xs font-bold py-1.5 pl-3 pr-7 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-1 transition cursor-pointer appearance-none shadow-2xs ${
                            o.status === 'Pending'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400'
                              : o.status === 'Confirmed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400'
                              : o.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:ring-emerald-400'
                              : 'bg-slate-100 text-slate-600 border-slate-200 focus:ring-slate-400'
                          }`}
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Confirmed">🚚 Confirmed</option>
                          <option value="Delivered">✅ Delivered</option>
                          <option value="Cancelled">❌ Cancelled</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-current opacity-60">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs active:scale-95"
                          title="View Details & Print Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/${o.whatsapp || o.phone}?text=${encodeURIComponent(
                            `السلام علیکم ${o.customer_name}! پاکستان کنفیکشنری سے آپ کے آرڈر (${o.order_number}) مالیت Rs. ${Number(o.total_amount).toLocaleString()} کی تصدیق اور ترسیل کے حوالے سے رابطہ کیا گیا ہے۔`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs active:scale-95"
                          title="Send WhatsApp Message"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={`tel:${o.phone}`}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition active:scale-95"
                          title="Call Customer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Items Modal with Print Invoice */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  🍬
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Order Details ({selectedOrder.order_number})
                  </h3>
                  <p className="text-xs text-slate-500 font-urdu">{selectedOrder.customer_name} • {selectedOrder.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Receipt Header for Print */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 text-sm">Pakistan Confectionary</span>
                  <p className="text-[11px] text-slate-500 font-urdu">کیش آن ڈیلیوری ترسیلی رسید (Delivery Slip)</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sm text-slate-900">{selectedOrder.order_number}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer & Delivery Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-500">Customer Name:</span>
                  <span className="font-black text-slate-900">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-500">Phone / WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedOrder.phone}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-500">City / شہر:</span>
                  <span className="font-bold text-slate-900">{selectedOrder.city}</span>
                </div>
                <div className="space-y-0.5 pt-1">
                  <span className="font-bold text-slate-500 block">Delivery Address / پتہ:</span>
                  <p className="font-semibold text-slate-800 leading-relaxed">{selectedOrder.address}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Ordered Items ({selectedOrder.order_items?.length || 0}):
                </span>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    selectedOrder.order_items.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                        <div>
                          <p className="font-black text-slate-900">{item.product_name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {item.quantity} {item.unit}s × Rs. {Number(item.price).toLocaleString()}
                          </p>
                        </div>
                        <div className="font-mono font-black text-slate-900 text-sm">
                          Rs. {Number(item.total).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">No items recorded in this order</div>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">Total Bill to Collect (COD)</span>
                  <span className="text-[11px] text-amber-300 font-urdu">موصول طلب کل رقم</span>
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  Rs. {Number(selectedOrder.total_amount).toLocaleString()}
                </div>
              </div>

              {/* Status Update Controls in Modal */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">Quick Change Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'Confirmed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedOrder.status === 'Confirmed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    Confirm & Dispatch
                  </button>

                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'Delivered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedOrder.status === 'Delivered'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    Mark Delivered
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer with Print Button */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice / پرنٹ سلپ</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl transition"
              >
                Close / بند کریں
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
