'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  X, 
  Package, 
  PackageCheck, 
  ShoppingBag, 
  Truck, 
  UserCheck, 
  LogOut, 
  Sparkles, 
  Search, 
  Store, 
  Clock, 
  Check, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Phone
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, ProductType, MIN_ORDER_WHOLESALE, MIN_ORDER_RETAIL } from '@/types/wholesale';
import CustomerAuthModal, { VerifiedCustomer } from '@/components/CustomerAuthModal';
import { useToast } from '@/components/ToastProvider';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function StorefrontPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<ProductType>('wholesale');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Verified Customer State
  const [customer, setCustomer] = useState<VerifiedCustomer | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Checkout State
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Order Tracking State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [markingReceived, setMarkingReceived] = useState(false);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [customerReceivedIds, setCustomerReceivedIds] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(2025);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    const savedCustomer = localStorage.getItem('pak_confectionary_customer');
    if (savedCustomer) {
      try {
        const parsed = JSON.parse(savedCustomer);
        setCustomer(parsed);
      } catch (e) {
        setAuthModalOpen(true);
      }
    } else {
      setAuthModalOpen(true);
    }

    const savedOrders = localStorage.getItem('pak_confectionary_my_orders');
    if (savedOrders) {
      try {
        setRecentOrders(JSON.parse(savedOrders));
      } catch (e) {}
    }

    const savedCustomerReceived = localStorage.getItem('pak_confectionary_customer_received');
    if (savedCustomerReceived) {
      try {
        setCustomerReceivedIds(JSON.parse(savedCustomerReceived));
      } catch (e) {}
    }

    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomerVerified(verifiedData: VerifiedCustomer) {
    setCustomer(verifiedData);
    setAuthModalOpen(false);
  }

  function handleLogout() {
    if (confirm('Are you sure you want to change customer details? / کیا آپ لاگ آؤٹ کرنا چاہتے ہیں؟')) {
      localStorage.removeItem('pak_confectionary_customer');
      setCustomer(null);
      setCart([]);
      setAuthModalOpen(true);
    }
  }

  // Cart operations
  function addToCart(product: Product) {
    if (!customer) {
      setAuthModalOpen(true);
      return;
    }

    if (product.stock <= 0) {
      toast.error('Out of Stock', 'معذرت، پروڈکٹ ختم ہے', 'یہ آئٹم فی الحال اسٹاک میں دستیاب نہیں ہے۔');
      return;
    }

    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          toast.error('Stock Limit', 'اسٹاک کی حد مکمل', `اسٹاک میں صرف ${product.stock} دستیاب ہیں`);
          return prev;
        }
        toast.cart('Cart Updated', 'تعداد بڑھا دی گئی', `${product.name} (${exists.quantity + 1} ${product.unit}s)`);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.cart('Added to Cart!', 'کارٹ میں شامل ہو گیا', `${product.name} (1 ${product.unit})`);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              toast.error('Stock Limit', 'اسٹاک کی حد مکمل', `زیادہ سے زیادہ ${item.product.stock} دستیاب ہیں`);
              return item;
            }
            if (newQty <= 0) {
              toast.info('Item Removed', 'کارٹ سے ہٹا دیا گیا', item.product.name);
              return null;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function removeFromCart(productId: string) {
    const item = cart.find(i => i.product.id === productId);
    setCart(prev => prev.filter(i => i.product.id !== productId));
    if (item) {
      toast.info('Item Removed', 'کارٹ سے ہٹا دیا گیا', item.product.name);
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const minRequired = activeTab === 'wholesale' ? MIN_ORDER_WHOLESALE : MIN_ORDER_RETAIL;
  const isMinOrderMet = cartTotal >= minRequired;
  const progressPercent = Math.min(100, Math.round((cartTotal / minRequired) * 100));

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) {
      setAuthModalOpen(true);
      return;
    }

    if (cart.length === 0) return;

    if (!isMinOrderMet) {
      toast.error(
        'Minimum Order Limit',
        'کم از کم آرڈر کی حد پوری کریں',
        `کم از کم Rs. ${minRequired.toLocaleString()} کا آرڈر لازمی ہے۔ موجودہ بل: Rs. ${cartTotal.toLocaleString()}`
      );
      return;
    }

    setPlacingOrder(true);
    try {
      const orderNumber = `PKC-${Date.now().toString().slice(-6)}`;

      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customer.name,
          phone: customer.phone,
          whatsapp: customer.phone,
          address: customer.address,
          city: customer.city,
          order_type: activeTab,
          total_amount: cartTotal,
          payment_method: 'Cash on Delivery (COD)',
          status: 'Pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      if (orderData?.id) {
        const orderItems = cart.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          product_name: item.product.name,
          unit: item.product.unit,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        }));

        await supabase.from('order_items').insert(orderItems);

        for (const item of cart) {
          const remainingStock = Math.max(0, item.product.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: remainingStock })
            .eq('id', item.product.id);
        }
      }

      // Save order number to recent orders
      const updatedOrders = [orderNumber, ...recentOrders.filter(id => id !== orderNumber)];
      setRecentOrders(updatedOrders);
      localStorage.setItem('pak_confectionary_my_orders', JSON.stringify(updatedOrders));

      setOrderSuccess(orderNumber);
      setCart([]);
      fetchProducts();
      toast.success(
        'Order Placed Successfully!',
        'آرڈر کامیابی سے بک ہو گیا',
        `ٹریکنگ کوڈ: ${orderNumber}`
      );
    } catch (err: any) {
      console.error('Order placing failed:', err);
      toast.error('Order Failed', 'آرڈر میں خرابی', err.message || 'Error placing order');
    } finally {
      setPlacingOrder(false);
    }
  }

  // =========================================================================
  // ORDER TRACKING FUNCTIONS
  // =========================================================================
  async function searchOrder(idToQuery?: string) {
    const query = (idToQuery || trackingInput).trim();
    if (!query) return;

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackedOrder(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', query)
        .single();

      if (error || !data) {
        setTrackingError('Order not found. Please check your Tracking ID / آرڈر نہیں ملا، درست ٹریکنگ آئی ڈی درج کریں۔');
      } else {
        setTrackedOrder(data);
        setTrackingInput(data.order_number);
      }
    } catch (err: any) {
      setTrackingError('Failed to fetch order: ' + err.message);
    } finally {
      setTrackingLoading(false);
    }
  }

  function handleCustomerAcknowledgeReceived(orderNumber: string) {
    const updated = [orderNumber, ...customerReceivedIds.filter(id => id !== orderNumber)];
    setCustomerReceivedIds(updated);
    localStorage.setItem('pak_confectionary_customer_received', JSON.stringify(updated));
    toast.success('Order Received!', 'وصولی کی تصدیق ہو گئی', `شکریہ! آرڈر ${orderNumber} کی وصولی نوٹ کر لی گئی ہے۔`);
  }

  function openTrackingWithId(orderId: string) {
    setTrackingInput(orderId);
    setTrackingModalOpen(true);
    searchOrder(orderId);
  }

  // Filter products by tab, search, and category
  const displayedProducts = products.filter(p => {
    const matchesTab = p.product_type === activeTab;
    const matchesSearch = searchQuery.trim() === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      const nameAndDesc = (p.name + ' ' + (p.description || '')).toLowerCase();
      if (selectedCategory === 'chocolate') {
        matchesCategory = nameAndDesc.includes('chocolate') || nameAndDesc.includes('silk') || nameAndDesc.includes('dairy');
      } else if (selectedCategory === 'toffee') {
        matchesCategory = nameAndDesc.includes('toffee') || nameAndDesc.includes('eclairs') || nameAndDesc.includes('caramel') || nameAndDesc.includes('candy');
      } else if (selectedCategory === 'bakery') {
        matchesCategory = nameAndDesc.includes('biscuit') || nameAndDesc.includes('cookie') || nameAndDesc.includes('wafer') || nameAndDesc.includes('rolls');
      } else if (selectedCategory === 'jelly') {
        matchesCategory = nameAndDesc.includes('jelly') || nameAndDesc.includes('gummy') || nameAndDesc.includes('pop') || nameAndDesc.includes('gum') || nameAndDesc.includes('lollipop');
      }
    }

    return matchesTab && matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-amber-200 flex flex-col justify-between">
      {/* Customer Gatekeeper Modal */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onVerified={handleCustomerVerified}
        onClose={customer ? () => setAuthModalOpen(false) : undefined}
      />

      <div>
        {/* TOP UTILITY BAR */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 border-b border-amber-200/60 text-slate-700 py-1.5 px-4 text-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* Left: WhatsApp Helpline */}
            <a
              href="https://wa.me/923192800479?text=Assalam-o-Alaikum%20Pakistan%20Confectionary%20Wholesale%20Inquiry"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold bg-white px-3 py-1 rounded-full border border-emerald-200/90 shadow-2xs hover:bg-emerald-50/80 transition text-[11px]"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Helpline: +92 319 2800479</span>
              <span className="font-urdu text-[11px] text-emerald-700 font-semibold border-l border-emerald-200 pl-1.5 ml-0.5">
                واٹس ایپ
              </span>
            </a>

            {/* Right: Order Tracking & Customer Profile */}
            <div className="flex items-center gap-2.5 text-[11px]">
              {/* Track Order Button */}
              <button
                onClick={() => {
                  setTrackingModalOpen(true);
                  if (recentOrders.length > 0 && !trackedOrder) {
                    searchOrder(recentOrders[0]);
                  }
                }}
                className="flex items-center gap-1.5 text-amber-950 hover:text-amber-900 font-black bg-amber-400 hover:bg-amber-500 px-3 py-1 rounded-full shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5 text-amber-950" />
                <span>Track Order</span>
                <span className="font-urdu text-[11px] font-semibold border-l border-amber-500/80 pl-1.5 ml-0.5">آرڈر ٹریک کریں</span>
              </button>

              {customer ? (
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-black text-slate-800">{customer.name}</span>
                  <span className="text-slate-400 font-mono text-[10px]">({customer.phone})</span>
                  <span className="font-urdu text-[11px] text-emerald-700 font-bold border-l border-slate-200 pl-1.5 ml-0.5">
                    تصدیق شدہ
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Switch / Log out"
                    className="text-slate-400 hover:text-rose-500 transition ml-1 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 font-bold px-3 py-1 rounded-full border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Log In / Sign Up</span>
                  <span className="font-urdu text-[11px] text-slate-500 font-normal border-l border-slate-200 pl-1.5 ml-0.5">لاگ ان</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
        <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm shadow-amber-400/25 group-hover:scale-105 transition-transform duration-200">
                🍬
              </div>
              <div>
                <span className="font-black text-slate-900 text-xl tracking-tight block group-hover:text-amber-600 transition">
                  PAKISTAN <span className="text-amber-500">CONFECTIONARY</span>
                </span>
                <span className="text-xs text-slate-500 font-urdu block -mt-0.5 leading-snug">
                  پاکستان کنفیکشنری • معیاری تھوک و پرچون سپلائی پورٹل
                </span>
              </div>
            </Link>

            {/* Quick Search on larger screens */}
            <div className="hidden lg:flex items-center relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sweets / پروڈکٹ تلاش کریں..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Header Actions: Track Order & Cart */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setTrackingModalOpen(true);
                  if (recentOrders.length > 0 && !trackedOrder) {
                    searchOrder(recentOrders[0]);
                  }
                }}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition active:scale-95"
              >
                <PackageCheck className="w-4 h-4 text-amber-600" />
                <span>Track Order / ٹریک کریں</span>
              </button>

              {/* Cart Trigger Button with Live Total */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
              >
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>Cart / کارٹ</span>
                {totalItemsCount > 0 ? (
                  <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-xs animate-bounce">
                    {totalItemsCount}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px] font-normal">0</span>
                )}
                {cartTotal > 0 && (
                  <span className="hidden sm:inline border-l border-slate-700 pl-2 text-amber-300 font-mono font-black">
                    Rs. {cartTotal.toLocaleString()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <div className="bg-gradient-to-b from-amber-100/60 via-amber-50/40 to-slate-50/70 py-8 lg:py-12 px-4 border-b border-amber-200/60 relative overflow-hidden">
          {/* Ambient Confectionery Glows */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* LEFT COLUMN: Headings, Urdu Copy, Switcher & Value Props (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col items-start text-left space-y-4">
                {/* Top Badge */}
                <div className="inline-flex items-center gap-2 bg-white/95 border border-amber-300/80 text-amber-950 px-3.5 py-1.5 rounded-full text-xs font-black shadow-2xs backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Direct Manufacturer Rates</span>
                  <span className="font-urdu text-xs font-bold text-amber-800">| فیکٹری ریٹ پر کارٹن و ریٹیل سپلائی</span>
                </div>

                {/* Main Heading */}
                <div>
                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    Pakistan Confectionary
                  </h1>
                  <p className="text-xl sm:text-2xl font-black text-amber-900 font-urdu leading-normal mt-1">
                    اعلیٰ معیار کی مٹھائیاں، ٹافیاں، چاکلیٹ اور کنفیکشنری آئٹمز
                  </p>
                  <p className="text-slate-600 text-xs sm:text-sm font-urdu leading-relaxed max-w-lg mt-1 font-medium">
                    دکان داروں اور ہول سیلرز کے لیے مکمل کارٹن پیکنگ، جبکہ گھریلو تقاریب اور عام گاہکوں کے لیے آسان ریٹیل پیکٹس
                  </p>
                </div>

                {/* Mode Switcher Tabs (Wholesale vs Retail) */}
                <div className="w-full max-w-lg bg-white/95 backdrop-blur-xs p-1.5 rounded-2xl border border-slate-200/90 shadow-sm grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('wholesale');
                      setCart([]);
                      setSelectedCategory('all');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center relative ${
                      activeTab === 'wholesale'
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-black scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-950" />
                      <span>Wholesale (Cartons)</span>
                    </span>
                    <span className="text-[11px] font-urdu font-bold mt-0.5">ہول سیل کارٹن (دکاندار حضرات)</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('retail');
                      setCart([]);
                      setSelectedCategory('all');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center relative ${
                      activeTab === 'retail'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-md font-black scale-[1.01]'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>Retail (Packs & Pieces)</span>
                    </span>
                    <span className="text-[11px] font-urdu font-bold mt-0.5">ریٹیل پیکٹس (گھریلو استعمال)</span>
                  </button>
                </div>

                {/* Minimum Order Notice Badge */}
                <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-xs text-slate-700 text-xs px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs font-medium">
                  {activeTab === 'wholesale' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="font-bold">Minimum Order:</span>
                      <strong className="text-amber-950 font-mono text-sm font-black">Rs. {MIN_ORDER_WHOLESALE.toLocaleString()}</strong>
                      <span className="font-urdu text-slate-500 text-xs font-semibold">(کم از کم ہول سیل آرڈر حد)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span className="font-bold">Minimum Order:</span>
                      <strong className="text-blue-700 font-mono text-sm font-black">Rs. {MIN_ORDER_RETAIL.toLocaleString()}</strong>
                      <span className="font-urdu text-slate-500 text-xs font-semibold">(کم از کم ریٹیل آرڈر حد)</span>
                    </>
                  )}
                </div>

                {/* 4 Feature Value Props */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg pt-1">
                  <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-amber-200/70 shadow-2xs flex items-center gap-2.5">
                    <span className="text-xl">🚚</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">Pakistan Delivery</h4>
                      <p className="text-[11px] font-urdu text-slate-500 font-medium mt-0.5">پورے پاکستان میں ترسیل</p>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-amber-200/70 shadow-2xs flex items-center gap-2.5">
                    <span className="text-xl">🏭</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">Factory Rates</h4>
                      <p className="text-[11px] font-urdu text-slate-500 font-medium mt-0.5">فیکٹری ہول سیل ریٹس</p>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-amber-200/70 shadow-2xs flex items-center gap-2.5">
                    <span className="text-xl">✨</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">Fresh Stock</h4>
                      <p className="text-[11px] font-urdu text-slate-500 font-medium mt-0.5">تازہ تیار کردہ مال</p>
                    </div>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xs p-3 rounded-2xl border border-amber-200/70 shadow-2xs flex items-center gap-2.5">
                    <span className="text-xl">💵</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">Cash on Delivery</h4>
                      <p className="text-[11px] font-urdu text-slate-500 font-medium mt-0.5">ڈلیوری پر تسلی سے ادائیگی</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Confectionery Showcase Photography Card (5 Cols) */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-[0_20px_50px_rgba(245,158,11,0.22)] bg-amber-100 group">
                  <div className="aspect-[4/3] w-full relative overflow-hidden">
                    <img 
                      src="/hero-banner.jpg" 
                      alt="Pakistan Confectionary - Wholesale Sweets & Cartons" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent flex flex-col justify-between p-5 text-left">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                          ⭐ 100% Fresh Batch / تازہ مال
                        </span>
                        <span className="bg-white/95 backdrop-blur-xs text-slate-900 text-xs font-black px-2.5 py-1 rounded-xl shadow-md border border-white/60">
                          Halal Certified / حلال
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                          Premium Confectionery
                        </h3>
                        <p className="text-xs text-amber-200 font-urdu drop-shadow-md font-medium mt-0.5">
                          چاکلیٹ، ٹافیاں، لالی پاپ، بسکٹ و کنفیکشنری کارٹن سپلائی
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* PRODUCT CATALOG MAIN AREA */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Mobile Search Bar */}
          <div className="lg:hidden mb-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products / پروڈکٹ تلاش کریں..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition"
            />
          </div>

          {/* Catalog Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'wholesale' ? 'Wholesale Cartons Supply' : 'Retail Confectionery Store'}
              </h2>
              <p className="text-xs sm:text-sm text-amber-900 font-urdu mt-0.5 font-bold">
                {activeTab === 'wholesale' 
                  ? 'دکان داروں کے لیے تازہ ترین مٹھائیوں اور ٹافیوں کے کارٹن' 
                  : 'گھریلو استعمال اور چھوٹی تقاریب کے لیے کنفیکشنری پیکٹس'}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-700 font-bold bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                {displayedProducts.length} Products Available
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
            {[
              { id: 'all', label: 'All Items / تمام پروڈکٹس', icon: '✨' },
              { id: 'chocolate', label: 'Chocolates / چاکلیٹ', icon: '🍫' },
              { id: 'toffee', label: 'Toffees & Candies / ٹافیاں', icon: '🍬' },
              { id: 'bakery', label: 'Biscuits & Wafers / بسکٹ و ویفر', icon: '🍪' },
              { id: 'jelly', label: 'Jelly & Pops / جیلی و ببل', icon: '🍭' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15 scale-[1.02] font-black'
                    : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-400 text-sm font-urdu">پروڈکٹس لوڈ ہو رہے ہیں، برائے مہربانی انتظار فرمائیں...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3 shadow-2xs max-w-lg mx-auto">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800">
                {searchQuery ? `No products matching "${searchQuery}"` : 'No products available in this category'}
              </p>
              <p className="text-xs text-slate-500 font-urdu">
                {searchQuery ? 'تلاش کے مطابق کوئی پروڈکٹ نہیں ملی' : 'اس کیٹیگری میں فی الحال کوئی پروڈکٹ موجود نہیں ہے'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-amber-700 underline font-bold"
                >
                  Clear Search / تلاش ختم کریں
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((p) => {
                const inCartItem = cart.find(item => item.product.id === p.id);
                const inCartQty = inCartItem?.quantity || 0;

                // Confectionery fallback theme
                const lowerName = (p.name + ' ' + (p.description || '')).toLowerCase();
                const isChoc = lowerName.includes('chocolate') || lowerName.includes('silk');
                const isToffee = lowerName.includes('toffee') || lowerName.includes('eclairs') || lowerName.includes('caramel');
                const isBakery = lowerName.includes('biscuit') || lowerName.includes('cookie') || lowerName.includes('wafer');
                const isJelly = lowerName.includes('jelly') || lowerName.includes('gummy') || lowerName.includes('pop') || lowerName.includes('bubble');

                const fallbackEmoji = isChoc ? '🍫' : isToffee ? '🍬' : isBakery ? '🍪' : isJelly ? '🍭' : '📦';
                const fallbackBg = isChoc 
                  ? 'from-amber-950/20 via-amber-900/10 to-amber-100/30' 
                  : isToffee 
                  ? 'from-amber-200/50 via-orange-100/30 to-amber-50' 
                  : isBakery 
                  ? 'from-yellow-100/60 via-amber-50 to-orange-50' 
                  : 'from-pink-100/50 via-rose-50 to-amber-50';

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200/80 hover:border-amber-400 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_35px_rgba(245,158,11,0.12)] group relative"
                  >
                    {/* Product Image Frame */}
                    <div className={`h-56 bg-gradient-to-br ${fallbackBg} relative overflow-hidden flex items-center justify-center`}>
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <span className="text-5xl group-hover:scale-120 transition-transform duration-300 filter drop-shadow-sm">
                            {fallbackEmoji}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-2 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200/60">
                            Pakistan Confectionary
                          </span>
                        </div>
                      )}

                      {/* Unit Tag (Carton / Pack) */}
                      <span className={`absolute top-3.5 left-3.5 text-[11px] font-black px-3 py-1 rounded-full uppercase shadow-xs flex items-center gap-1 ${
                        p.product_type === 'wholesale' 
                          ? 'bg-amber-400 text-slate-950' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        <span>{p.product_type === 'wholesale' ? '📦' : '🛍️'}</span>
                        <span>{p.unit}</span>
                      </span>

                      {/* In Stock Badge */}
                      <span className={`absolute top-3.5 right-3.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 ${
                        p.stock <= 0
                          ? 'bg-rose-100 text-rose-700 font-bold'
                          : 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80 shadow-2xs'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span>{p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                      </span>
                    </div>

                    {/* Product Details & Actions */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-bold font-urdu mb-1">
                          <span>✨</span>
                          <span>{p.product_type === 'wholesale' ? 'ہول سیل فیکٹری ریٹ' : 'ریٹیل تازہ سپلائی'}</span>
                        </div>
                        <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-amber-800 transition line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description || 'اعلیٰ معیار اور حفظان صحت کے اصولوں کے مطابق تیار کردہ لذیذ کنفیکشنری آئٹم۔'}
                        </p>
                      </div>

                      <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                            Rate / قیمت
                          </span>
                          <div className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight">
                            Rs. {Number(p.price).toLocaleString()}
                            <span className="text-[11px] text-slate-500 font-normal"> /{p.unit.toLowerCase()}</span>
                          </div>
                        </div>

                        {/* Interactive Cart Stepper or Button */}
                        {inCartQty > 0 ? (
                          <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-2xl border border-amber-200 shadow-2xs">
                            <button
                              onClick={() => updateQuantity(p.id, -1)}
                              className="w-7 h-7 rounded-xl bg-white text-slate-800 flex items-center justify-center hover:bg-slate-100 transition shadow-2xs font-bold active:scale-90"
                              title="Minus"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-black text-xs text-amber-950 w-6 text-center font-mono">
                              {inCartQty}
                            </span>
                            <button
                              onClick={() => updateQuantity(p.id, 1)}
                              className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center hover:bg-amber-500 transition shadow-2xs font-bold active:scale-90"
                              title="Plus"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(p)}
                            disabled={p.stock <= 0}
                            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-sm shadow-amber-400/25 hover:shadow-amber-400/40"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FLOATING CART BAR */}
      {totalItemsCount > 0 && !cartOpen && (
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-slate-950 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between active:scale-98 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-300">{totalItemsCount} items selected</p>
                <p className="text-sm font-black text-amber-400 font-mono">Rs. {cartTotal.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl">
              <span>View Cart / کارٹ</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* CART & CHECKOUT SLIDE-OVER DRAWER */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Cart Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Shopping Cart</h3>
                  <p className="text-xs font-urdu text-slate-500">آپ کا کارٹ ({cart.length} پروڈکٹس)</p>
                </div>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Minimum Order Limit Live Progress Bar */}
            {cart.length > 0 && (
              <div className="px-5 py-3.5 bg-amber-50/70 border-b border-amber-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">Target: Rs. {minRequired.toLocaleString()}</span>
                  <span className={isMinOrderMet ? 'text-emerald-700 font-black' : 'text-amber-800 font-black'}>
                    {progressPercent}% Complete
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-amber-200/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      isMinOrderMet ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="text-[11px] font-urdu leading-tight">
                  {isMinOrderMet ? (
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      کم از کم آرڈر کی حد مکمل! آپ آرڈر کنفرم کر سکتے ہیں۔
                    </span>
                  ) : (
                    <span className="text-amber-900">
                      مزید <strong>Rs. {(minRequired - cartTotal).toLocaleString()}</strong> کا سامان شامل کریں تاکہ آرڈر بُک ہو سکے۔
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="py-24 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Your cart is currently empty</p>
                  <p className="text-xs font-urdu text-slate-400">آپ کا کارٹ خالی ہے، پروڈکٹ شامل کریں</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 font-semibold">
                        Rs. {Number(item.product.price).toLocaleString()} × {item.quantity} {item.product.unit}s
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-900 w-4 text-center font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold hover:bg-slate-100 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Verified Checkout Details & Submit */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-600 block">Total Bill / کل بل</span>
                    <span className="text-[11px] text-slate-400 font-urdu">کیش آن ڈیلیوری (COD)</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 font-mono">Rs. {cartTotal.toLocaleString()}</span>
                </div>

                {customer ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">Delivery Address:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1 font-urdu text-xs">
                        <CheckCircle className="w-3 h-3" /> تصدیق شدہ کسٹمر
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{customer.name} ({customer.phone})</p>
                    <p className="text-slate-600 truncate">{customer.address}, {customer.city}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition"
                  >
                    Verify Phone to Place Order / آرڈر کے لیے فون تصدیق کریں
                  </button>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={placingOrder || !isMinOrderMet || !customer}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Truck className="w-4 h-4" />
                  <span>
                    {placingOrder
                      ? 'Placing Order / آرڈر درج ہو رہا ہے...'
                      : !isMinOrderMet
                      ? `Minimum Order: Rs. ${minRequired.toLocaleString()}`
                      : 'Confirm Order (Cash on Delivery) / آرڈر کنفرم کریں'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDER TRACKING MODAL */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                  <PackageCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Track Your Order</h3>
                  <p className="text-xs font-urdu text-slate-500">آرڈر ٹریکنگ و موصولی کی تصدیق</p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              {/* Search Bar for Tracking ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Enter Order Tracking ID</span>
                  <span className="font-urdu text-slate-400 text-xs">ٹریکنگ نمبر درج کریں</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="e.g. PKC-724489"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-amber-500 uppercase transition"
                    />
                  </div>
                  <button
                    onClick={() => searchOrder()}
                    disabled={trackingLoading || !trackingInput.trim()}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Search className="w-4 h-4 text-amber-400" />}
                    <span>Search / تلاش</span>
                  </button>
                </div>
              </div>

              {/* Quick Recent Orders Chips */}
              {recentOrders.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-slate-400 text-[11px] font-bold">Recent Orders:</span>
                  {recentOrders.map((id) => (
                    <button
                      key={id}
                      onClick={() => openTrackingWithId(id)}
                      className={`px-2.5 py-0.5 rounded-lg border font-mono text-[11px] transition ${
                        trackingInput === id 
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}

              {/* Error Message */}
              {trackingError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-urdu font-medium leading-relaxed">{trackingError}</span>
                </div>
              )}

              {/* Tracked Order Details */}
              {trackedOrder && (
                <div className="space-y-5 pt-2">
                  {/* Order Overview Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Tracking ID</span>
                      <span className="text-base font-black text-slate-900 font-mono">{trackedOrder.order_number}</span>
                      <p className="text-[11px] text-slate-500 font-urdu mt-0.5">
                        گاہک: <strong>{trackedOrder.customer_name}</strong> ({trackedOrder.city})
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Bill (COD)</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        Rs. {Number(trackedOrder.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 3-PHASE VISUAL TIMELINE STEPPER */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Delivery Phase Progress</span>
                      <span className="font-urdu text-slate-500 text-xs">ڈلیوری کے مراحل</span>
                    </h4>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                      {/* STEP 1: Pending / Placed */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          trackedOrder.status === 'Pending' || trackedOrder.status === 'Confirmed' || trackedOrder.status === 'Delivered'
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          ✓
                        </div>
                        <div className="pl-2">
                          <p className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                            <span>1. Order Placed</span>
                            <span className="font-urdu text-[11px] text-amber-800">| آرڈر بک ہو گیا</span>
                          </p>
                          <p className="text-[11px] font-urdu text-slate-500 mt-0.5">
                            آرڈر موصول ہو چکا ہے، اسٹور کی ٹیم پیکنگ اور تصدیق کر رہی ہے۔
                          </p>
                        </div>
                      </div>

                      {/* STEP 2: Confirmed & Dispatched */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          trackedOrder.status === 'Confirmed' || trackedOrder.status === 'Delivered'
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {trackedOrder.status === 'Confirmed' || trackedOrder.status === 'Delivered' ? '✓' : '2'}
                        </div>
                        <div className="pl-2">
                          <p className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                            <span>2. Confirmed & Dispatched</span>
                            <span className="font-urdu text-[11px] text-blue-700">| روانہ ہو گیا</span>
                          </p>
                          <p className="text-[11px] font-urdu text-slate-500 mt-0.5">
                            {trackedOrder.status === 'Confirmed' || trackedOrder.status === 'Delivered'
                              ? 'پارسل تصدیق کے بعد کیش آن ڈیلیوری رائیڈر کو روانہ کر دیا گیا ہے۔'
                              : 'تصدیق کے بعد پارسل جلد روانہ کیا جائے گا۔'}
                          </p>
                        </div>
                      </div>

                      {/* STEP 3: Delivered */}
                      <div className="relative">
                        <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          trackedOrder.status === 'Delivered'
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-slate-200 text-slate-400'
                        }`}>
                          {trackedOrder.status === 'Delivered' ? '✓' : '3'}
                        </div>
                        <div className="pl-2">
                          <p className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                            <span>3. Delivered & Received</span>
                            <span className="font-urdu text-[11px] text-emerald-700">| موصول شدہ</span>
                          </p>
                          <p className="text-[11px] font-urdu text-slate-500 mt-0.5">
                            {trackedOrder.status === 'Delivered'
                              ? 'پارسل کامیابی سے موصول ہو چکا ہے اور ادائیگی مکمل۔'
                              : 'پارسل ملنے پر نیچے دیے گئے بٹن سے موصولی کی تصدیق فرمائیں۔'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BLOCK: Enabled when Delivered */}
                  {trackedOrder.status !== 'Delivered' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-slate-700 font-bold text-xs">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>
                          {trackedOrder.status === 'Pending' 
                            ? 'Phase 1: Order Under Review / آرڈر زیر جائزہ' 
                            : 'Phase 2: Out for Delivery / پارسل راستے میں ہے'}
                        </span>
                      </div>
                      <p className="text-[11px] font-urdu text-slate-500 leading-relaxed">
                        ایڈمن پینل سے ڈلیوری مکمل ہوتے ہی آپ کے لیے وصولی کا تصدیقی بٹن فعال ہو جائے گا۔
                      </p>
                    </div>
                  ) : customerReceivedIds.includes(trackedOrder.order_number) ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Order Received & Acknowledged / وصولی کی تصدیق مکمل</span>
                      </div>
                      <p className="text-[11px] font-urdu text-emerald-700">
                        آپ نے وصولی کی تصدیق کر دی ہے۔ پاکستان کنفیکشنری پر خریداری کا شکریہ!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-2.5 text-center animate-in zoom-in-95">
                      <div className="flex items-center justify-center gap-1.5 text-emerald-900 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Admin Confirmed: Order Delivered / ایڈمن نے ڈلیور کر دیا ہے</span>
                      </div>
                      <p className="text-[11px] font-urdu text-emerald-800 leading-relaxed">
                        اسٹور کی طرف سے پارسل آپ کو پہنچا دیا گیا ہے۔ برائے مہربانی وصولی کی تصدیق کے لیے نیچے بٹن دبائیں:
                      </p>
                      <button
                        onClick={() => handleCustomerAcknowledgeReceived(trackedOrder.order_number)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 animate-pulse cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm: I Have Received My Order / مجھے آرڈر موصول ہو گیا ہے</span>
                      </button>
                    </div>
                  )}

                  {/* Order Items Summary */}
                  {trackedOrder.order_items && trackedOrder.order_items.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Ordered Items ({trackedOrder.order_items.length}):
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {trackedOrder.order_items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <span className="font-semibold text-slate-800">{item.product_name}</span>
                            <span className="font-mono text-slate-600">
                              {item.quantity} × Rs. {Number(item.price).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Order Placed Successfully!</h3>
              <p className="text-sm font-bold text-emerald-700 font-urdu mt-0.5">آرڈر کامیابی سے درج ہو گیا ہے</p>
              <p className="text-xs text-slate-500 mt-2">
                Order Tracking ID: <strong className="font-mono text-slate-900">{orderSuccess}</strong>
              </p>
              <p className="text-xs text-slate-600 font-urdu mt-2 leading-relaxed">
                پاکستان کنفیکشنری کی ٹیم ڈلیوری روانہ کرنے سے قبل آپ سے فون یا واٹس ایپ پر رابطہ کرے گی۔
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const id = orderSuccess;
                  setOrderSuccess(null);
                  openTrackingWithId(id);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Track Your Order Now / ابھی آرڈر ٹریک کریں</span>
              </button>

              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
              >
                Continue Shopping / مزید خریداری جاری رکھیں
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RICH MODERN FOOTER */}
      <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800 mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            {/* Col 1: About */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                  🍬
                </div>
                <span className="font-black text-white text-base tracking-tight">
                  PAKISTAN <span className="text-amber-400">CONFECTIONARY</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-urdu leading-relaxed">
                پاکستان بھر کے دکانداروں، ہول سیلرز اور ریٹیل صارفین کے لیے اعلیٰ معیار کی ٹافیاں، چاکلیٹ اور کنفیکشنری سپلائی کا سب سے بااعتماد نیٹ ورک۔
              </p>
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% Halal Certified Ingredients</span>
              </div>
            </div>

            {/* Col 2: Fast Portals */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Store Portals / مینو
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('wholesale');
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-amber-400 transition flex items-center gap-1.5"
                  >
                    <span>📦 Wholesale Cartons (ہول سیل کارٹن)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setActiveTab('retail');
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="hover:text-amber-400 transition flex items-center gap-1.5"
                  >
                    <span>🛍️ Retail Packets (ریٹیل پیکٹس)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setTrackingModalOpen(true)}
                    className="hover:text-amber-400 transition flex items-center gap-1.5"
                  >
                    <span>🚚 Track Live Order (آرڈر ٹریکنگ)</span>
                  </button>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-amber-400 hover:text-amber-300 font-bold transition flex items-center gap-1.5"
                  >
                    <span>⚙️ Admin Management Portal</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Delivery Coverage */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Nationwide Delivery / ترسیل
              </h4>
              <p className="text-xs text-slate-400 font-urdu leading-relaxed">
                کراچی، لاہور، فیصل آباد، راولپنڈی، اسلام آباد، ملتان، پشاور، کوئٹہ، حیدرآباد، گوجرانوالہ اور تمام ملحقہ اضلاع میں کیش آن ڈیلیوری ترسیل۔
              </p>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                💵 <strong>Cash on Delivery:</strong> ادائیگی صرف مال وصولی کے وقت
              </div>
            </div>

            {/* Col 4: Helpline */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Support & Contact / رابطہ
              </h4>
              <div className="space-y-2 text-xs">
                <a
                  href="https://wa.me/923192800479"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold bg-slate-800 p-2.5 rounded-xl transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp: +92 319 2800479</span>
                </a>

                <a
                  href="tel:+923192800479"
                  className="flex items-center gap-2 text-slate-300 hover:text-white p-2.5 rounded-xl transition"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>Call: +92 319 2800479</span>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {currentYear} Pakistan Confectionary Wholesale & Retail. All Rights Reserved.</p>
            <p className="font-urdu text-[11px] text-slate-400">
              اعلیٰ معیاری کنفیکشنری مصنوعات کی تھوک و پرچون ترسیل
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
