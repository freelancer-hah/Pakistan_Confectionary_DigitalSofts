'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Phone, 
  User, 
  MapPin, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Sparkles, 
  X, 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff,
  ArrowRight
} from 'lucide-react';

export interface VerifiedCustomer {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
  verifiedAt: string;
}

interface Props {
  isOpen: boolean;
  onVerified: (customer: VerifiedCustomer) => void;
  onClose?: () => void;
}

const POPULAR_CITIES = ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala'];

export default function CustomerAuthModal({ isOpen, onVerified, onClose }: Props) {
  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Form Fields
  const [name, setName] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [pin, setPin] = useState('');
  const [city, setCity] = useState('Karachi');
  const [address, setAddress] = useState('');
  const [showPin, setShowPin] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function formatPakistaniPhone(num: string): string {
    const cleaned = num.replace(/[\s-]/g, '');
    if (cleaned.startsWith('03')) return '+92' + cleaned.substring(1);
    if (cleaned.startsWith('923')) return '+' + cleaned;
    if (cleaned.startsWith('+923')) return cleaned;
    if (cleaned.startsWith('+')) return cleaned;
    return '+92' + cleaned;
  }

  function isValidPakistaniPhone(num: string): boolean {
    const cleaned = num.replace(/[\s-]/g, '');
    const regex = /^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/;
    return regex.test(cleaned);
  }

  // Instant 1-Click Bypass / Direct Access (For Demo & Fast Testing)
  function handleDirectBypass() {
    const bypassCustomer: VerifiedCustomer = {
      name: name.trim() || 'Valued Wholesale Client',
      phone: rawPhone.trim() ? formatPakistaniPhone(rawPhone) : '+923001234567',
      city: city.trim() || 'Karachi',
      address: address.trim() || 'Main Confectionery Market, Shop # 4',
      verifiedAt: new Date().toISOString(),
    };

    localStorage.setItem('pak_confectionary_customer', JSON.stringify(bypassCustomer));
    onVerified(bypassCustomer);
  }

  // Handle Login with Phone & PIN/Password
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!rawPhone.trim() || !pin.trim()) {
      setErrorMsg('Please enter your Phone Number and PIN/Password / برائے مہربانی فون نمبر اور پن کوڈ درج فرمائیں۔');
      return;
    }

    if (!isValidPakistaniPhone(rawPhone)) {
      setErrorMsg('Please enter a valid Pakistani mobile number (e.g. 03001234567) / درست پاکستانی موبائل نمبر درج فرمائیں۔');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedPhone = formatPakistaniPhone(rawPhone);

    try {
      // Find customer by phone in Supabase
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        setErrorMsg('No wholesale account found with this phone number. Please click Sign Up / اس فون نمبر سے کوئی اکاؤنٹ نہیں ملا، برائے مہربانی نیا اکاؤنٹ بنائیں۔');
        return;
      }

      // Verify PIN / Password
      const storedPin = data.pin || '1234';
      if (storedPin !== pin.trim()) {
        setErrorMsg('Incorrect PIN / Password. Please check and try again / غلط پن یا پاس ورڈ درج کیا گیا ہے۔');
        return;
      }

      const verifiedCustomer: VerifiedCustomer = {
        name: data.name || 'Wholesale Client',
        phone: data.phone,
        email: data.email || undefined,
        city: data.city || 'Karachi',
        address: data.address || '',
        verifiedAt: new Date().toISOString(),
      };

      setSuccessMsg(`Welcome back, ${verifiedCustomer.name}! Opening wholesale portal...`);

      localStorage.setItem('pak_confectionary_customer', JSON.stringify(verifiedCustomer));

      setTimeout(() => {
        onVerified(verifiedCustomer);
      }, 400);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Login failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Sign-Up (New Customer Registration)
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !rawPhone.trim() || !address.trim() || !city.trim() || !pin.trim()) {
      setErrorMsg('Please fill in all fields including a 4-digit PIN / برائے مہربانی تمام تفصیلات اور 4 ہندسوں کا پن کوڈ درج فرمائیں۔');
      return;
    }

    if (!isValidPakistaniPhone(rawPhone)) {
      setErrorMsg('Please enter a valid Pakistani mobile number (e.g. 03001234567) / درست پاکستانی موبائل نمبر درج فرمائیں۔');
      return;
    }

    if (pin.trim().length < 4) {
      setErrorMsg('PIN / Password must be at least 4 digits / پن کوڈ کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے۔');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formattedPhone = formatPakistaniPhone(rawPhone);

    try {
      // Check if phone number is already registered
      const { data: existingUser } = await supabase
        .from('customers')
        .select('phone')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg('This phone number is already registered! Please switch to Log In / یہ فون نمبر پہلے سے رجسٹرڈ ہے، برائے مہربانی لاگ ان فرمائیں۔');
        setMode('login');
        setLoading(false);
        return;
      }

      // Save new customer into Supabase 'customers' table
      const { error: dbError } = await supabase
        .from('customers')
        .insert({
          name: name.trim(),
          phone: formattedPhone,
          pin: pin.trim(),
          city: city.trim(),
          address: address.trim(),
          is_verified: true,
          verification_method: 'pin_auth',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        throw dbError;
      }

      const verifiedCustomer: VerifiedCustomer = {
        name: name.trim(),
        phone: formattedPhone,
        city: city.trim(),
        address: address.trim(),
        verifiedAt: new Date().toISOString(),
      };

      setSuccessMsg('Account created successfully! Opening wholesale store... / اکاؤنٹ بن گیا، اسٹور کھولا جا رہا ہے۔');

      localStorage.setItem('pak_confectionary_customer', JSON.stringify(verifiedCustomer));

      setTimeout(() => {
        onVerified(verifiedCustomer);
      }, 400);
    } catch (err: any) {
      console.error('Sign up error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Top Direct Demo Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-5 py-2 flex items-center justify-between text-xs border-b border-amber-200/70 flex-shrink-0">
          <span className="text-amber-950 font-black flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Fast Entry / تیز ترین رسائی</span>
          </span>
          <button
            type="button"
            onClick={handleDirectBypass}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl transition active:scale-95 text-[11px] flex items-center gap-1.5 shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Direct Access / بغیر پاس ورڈ داخل ہوں</span>
          </button>
        </div>

        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-100/50 p-4 sm:p-5 text-center border-b border-amber-100/80 relative overflow-hidden flex-shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-sm shadow-amber-400/30 mb-1.5">
            🍬
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pakistan Confectionary
          </h2>
          <p className="text-xs font-bold text-amber-900 font-urdu mt-0.5">
            تھوک و پرچون کسٹمر پورٹل
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl max-w-xs mx-auto mt-3 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-amber-600" />
              <span>Log In / لاگ ان</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-600" />
              <span>Sign Up / نیا رجسٹریشن</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="font-urdu font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* ============================================================ */
            /* TAB 1: LOG IN (PHONE + 4-DIGIT PIN/PASSWORD)                 */
            /* ============================================================ */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Registered Mobile / WhatsApp</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">رجسٹرڈ موبائل نمبر</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Security PIN or Password</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">4 ہندسوں کا سیکیورٹی پن یا پاس ورڈ</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      <span className="font-urdu">لاگ ان ہو رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-slate-900" />
                      <span>Log In / لاگ ان کریں اور اسٹور کھولیں</span>
                      <ArrowRight className="w-4 h-4 text-slate-900" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    New Wholesale Client?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 font-black hover:underline font-urdu"
                    >
                      نیا اکاؤنٹ رجسٹر کریں (Sign Up)
                    </button>
                  </p>
                </div>
              </div>
            </form>
          ) : (
            /* ============================================================ */
            /* TAB 2: SIGN UP (NEW REGISTRATION)                            */
            /* ============================================================ */
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Mobile Phone / WhatsApp *</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">موبائل نمبر (کال و واٹس ایپ)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Full Name / Shop Name *</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">پورا نام یا دکان کا نام</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kamran Wholesale Traders"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Set 4-Digit Security PIN or Password *</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">4 ہندسوں کا سیکیورٹی پن مقرر کریں</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Delivery Address *</span>
                    <span className="font-urdu font-normal text-slate-400 text-xs">مکمل پتہ (دکان یا گودام)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Shop #, Market Name, Area / مارکیٹ، دکان نمبر"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>City *</span>
                    <span className="font-urdu font-normal text-slate-400 text-xs">شہر</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karachi, Lahore..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
                  />
                </div>

                {/* Popular City Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Popular:</span>
                  {POPULAR_CITIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCity(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                        city === c 
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold' 
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      <span className="font-urdu">اکاؤنٹ بنایا جا رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-slate-900" />
                      <span>Create Account & Enter / اکاؤنٹ بنائیں اور داخل ہوں</span>
                      <ArrowRight className="w-4 h-4 text-slate-900" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                      }}
                      className="text-amber-700 font-black hover:underline font-urdu"
                    >
                      یہاں لاگ ان کریں (Log In)
                    </button>
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
