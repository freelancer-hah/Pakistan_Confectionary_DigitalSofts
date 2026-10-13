'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  Sparkles,
  X,
  RotateCcw
} from 'lucide-react';

export interface VerifiedCustomer {
  name: string;
  phone: string;
  email: string;
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
  const [step, setStep] = useState<'info' | 'otp'>('info');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [city, setCity] = useState('Karachi');
  const [address, setAddress] = useState('');

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function formatPakistaniPhone(num: string): string {
    const cleaned = num.replace(/[\s-]/g, '');
    if (cleaned.startsWith('03')) return '+92' + cleaned.substring(1);
    if (cleaned.startsWith('923')) return '+' + cleaned;
    if (cleaned.startsWith('+923')) return cleaned;
    if (cleaned.startsWith('+')) return cleaned;
    return '+92' + cleaned;
  }

  // Instant 1-Click Bypass / Direct Access
  function handleDirectBypass() {
    const bypassCustomer: VerifiedCustomer = {
      name: name.trim() || 'Valued Wholesale Client',
      phone: rawPhone.trim() ? formatPakistaniPhone(rawPhone) : '+923001234567',
      email: email.trim() || 'customer@wholesale.com',
      city: city.trim() || 'Karachi',
      address: address.trim() || 'Main Confectionery Market, Shop # 4',
      verifiedAt: new Date().toISOString(),
    };

    localStorage.setItem('pak_confectionary_customer', JSON.stringify(bypassCustomer));
    onVerified(bypassCustomer);
  }

  // Step 1: Send OTP to Gmail via Supabase Auth
  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!name.trim() || !email.trim() || !rawPhone.trim() || !address.trim() || !city.trim()) {
      setErrorMsg('Please enter your Name, Gmail, Phone, and Address / برائے مہربانی نام، ای میل، فون نمبر اور پتہ درج فرمائیں۔');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid Gmail / Email address / درست ای میل یا جی میل درج فرمائیں۔');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setStep('otp');
      setResendCooldown(60);
      setSuccessMsg(`OTP Code sent to ${email.trim()}! Check your Gmail Inbox or Spam folder.`);
    } catch (err: any) {
      console.error('Supabase OTP Error:', err);
      setErrorMsg(err.message || 'Failed to send OTP code to Gmail / جی میل پر کوڈ بھیجنے میں مسئلہ پیش آیا۔');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP via Supabase Auth
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code / برائے مہربانی 6 ہندسوں کا کوڈ درج کریں۔');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode.trim(),
        type: 'email',
      });

      if (error) throw error;

      const verifiedCustomer: VerifiedCustomer = {
        name: name.trim(),
        phone: formatPakistaniPhone(rawPhone),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        address: address.trim(),
        verifiedAt: new Date().toISOString(),
      };

      localStorage.setItem('pak_confectionary_customer', JSON.stringify(verifiedCustomer));
      onVerified(verifiedCustomer);
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      setErrorMsg('Invalid or expired OTP code. Please recheck your Gmail / غلط یا ایکسپائرڈ کوڈ ہے، جی میل چیک کر کے دوبارہ درج کریں۔');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Top Direct Demo Banner */}
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-5 py-2.5 flex items-center justify-between text-xs border-b border-amber-200/70 flex-shrink-0">
          <span className="text-amber-950 font-black flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Fast Entry / تیز ترین رسائی</span>
          </span>
          <button
            type="button"
            onClick={handleDirectBypass}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-3.5 py-1 rounded-xl transition active:scale-95 text-[11px] flex items-center gap-1.5 shadow-2xs"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Direct Access / بغیر کوڈ کے داخل ہوں</span>
          </button>
        </div>

        {/* Brand Banner Header */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-100/50 p-6 text-center border-b border-amber-100/80 relative overflow-hidden flex-shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-sm shadow-amber-400/30 mb-2">
            🍬
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pakistan Confectionary
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-900 font-urdu mt-0.5">
            تھوک و پرچون کسٹمر پورٹل میں خوش آمدید
          </p>
          <p className="text-[11px] text-slate-500 font-urdu mt-1 max-w-sm mx-auto leading-relaxed">
            کارٹن اور ریٹیل نرخ دیکھنے اور کیش آن ڈیلیوری آرڈر کے لیے جی میل او ٹی پی تصدیق مکمل فرمائیں
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-4">
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

          {step === 'info' ? (
            /* STEP 1: Enter Customer Information */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Full Name</span>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Gmail / Email Address (for OTP)</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">جی میل ای میل (او ٹی پی کے لیے)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Mobile Phone / WhatsApp</span>
                  <span className="font-urdu font-normal text-slate-400 text-xs">موبائل فون نمبر (کال و واٹس ایپ)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Delivery Address</span>
                    <span className="font-urdu font-normal text-slate-400 text-xs">مکمل دکان یا گھر کا پتہ</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shop / House #, Market Name, Area"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-medium transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>City</span>
                    <span className="font-urdu font-normal text-slate-400 text-xs">شہر</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Karachi, Lahore..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
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
              <div className="space-y-2.5 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      <span className="font-urdu">او ٹی پی بھیجا جا رہا ہے...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send OTP to Gmail / جی میل پر کوڈ بھیجیں</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDirectBypass}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Direct Access without Code / بغیر کوڈ کے آرڈر کریں</span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Enter OTP Code from Gmail */
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
              <div>
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  Check Your Gmail Inbox
                </h3>
                <p className="text-xs font-urdu text-amber-800 font-bold mt-0.5">
                  اپنے جی میل پر آیا 6 ہندسوں کا کوڈ درج فرمائیں
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  OTP sent to: <strong className="font-mono text-slate-800">{email}</strong>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full py-3.5 text-center tracking-[0.5em] text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white focus:outline-none text-slate-900 font-mono transition"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>تصدیق ہو رہی ہے...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Open Store / تصدیق مکمل کریں</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('info');
                      setOtpCode('');
                      setErrorMsg(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 underline font-medium"
                  >
                    ← Change Email / واپس جائیں
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="text-amber-700 hover:text-amber-800 font-bold disabled:text-slate-400 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code / دوبارہ بھیجیں'}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDirectBypass}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 underline font-urdu"
                  >
                    براہ راست اسٹور کھولیں (Bypass & Continue)
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
