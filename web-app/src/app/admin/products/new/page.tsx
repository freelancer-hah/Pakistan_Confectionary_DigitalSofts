'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductType } from '@/types/wholesale';
import { useToast } from '@/components/ToastProvider';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [productType, setProductType] = useState<ProductType>('wholesale');
  const [unit, setUnit] = useState('Carton');
  const [price, setPrice] = useState<number | ''>(5000);
  const [stock, setStock] = useState<number | ''>(50);
  const [description, setDescription] = useState('');
  
  // Image Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTypeChange = (type: ProductType) => {
    setProductType(type);
    if (type === 'wholesale') {
      setUnit('Carton');
    } else {
      setUnit('Piece');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File Size Too Large', 'فائل کا سائز 5MB سے کم ہونا چاہیے', 'Maximum image size is 5MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  async function uploadImageToSupabase(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${cleanFileName}`;

    const { data, error } = await supabase.storage
      .from('product_images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('product_images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || price === '' || stock === '') {
      setErrorMsg('Please fill in product name, price and stock / پروڈکٹ کا نام، قیمت اور اسٹاک درج کریں');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      let finalImageUrl: string | null = null;

      if (selectedFile) {
        setUploading(true);
        finalImageUrl = await uploadImageToSupabase(selectedFile);
        setUploading(false);
      }

      const { error } = await supabase.from('products').insert({
        name: name.trim(),
        product_type: productType,
        unit: unit.trim() || (productType === 'wholesale' ? 'Carton' : 'Piece'),
        price: Number(price),
        stock: Number(stock),
        image_url: finalImageUrl,
        description: description.trim() || null,
        is_active: true,
      });

      if (error) throw error;
      toast.success(
        'Product Created!',
        'نیا پروڈکٹ کامیابی سے شامل ہو گیا',
        `${name.trim()} (${Number(price).toLocaleString()} PKR)`
      );
      router.push('/admin/products');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to Save', 'پروڈکٹ محفوظ نہیں ہو سکی', err.message);
      setErrorMsg(err.message || 'Failed to save product / پروڈکٹ محفوظ کرنے میں مسئلہ پیش آیا');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200/80 rounded-2xl transition shadow-2xs hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Add New Product
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-urdu mt-0.5">
              نیا کنفیکشنری مال شامل کریں اور ہول سیل ریٹس درج فرمائیں
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-medium font-urdu leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* Product Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
          {/* Step 1: Select Type */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              1. Product Category / پروڈکٹ کی نوعیت *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('wholesale')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  productType === 'wholesale'
                    ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-400/20 shadow-xs'
                    : 'border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1.5">📦</div>
                <div>
                  <p className="font-black text-sm text-slate-900">Wholesale (Carton)</p>
                  <p className="text-xs text-amber-900 font-urdu mt-0.5 font-bold">ہول سیل کارٹن (دکاندار حضرات)</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Min Order Target: Rs. 15,000</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('retail')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                  productType === 'retail'
                    ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1.5">🛍️</div>
                <div>
                  <p className="font-black text-sm text-slate-900">Retail (Packs & Pieces)</p>
                  <p className="text-xs text-blue-900 font-urdu mt-0.5 font-bold">ریٹیل پیکٹ (گھریلو استعمال)</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">Min Order Target: Rs. 2,500</p>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Name & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Product Title / نام *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dairy Milk Chocolate Master Carton"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-semibold transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Unit / یونٹ *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Carton, Box, Pack"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-bold transition"
              />
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400">Presets:</span>
            {['Eclairs Carton', 'Chocolate Box', 'Jelly Pack', 'Wafer Master Pack'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setName(preset)}
                className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 transition"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Step 3: Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Price (PKR) / قیمت *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">Rs.</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5000"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-black focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Per {unit.toLowerCase()}</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Warehouse Stock / موجودہ اسٹاک *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-black focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 font-mono transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Order place hone per auto deduct hoga</p>
            </div>
          </div>

          {/* Step 4: Product Image Upload */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Product Image / تصویر</span>
              <span className="font-normal text-slate-400 text-[11px]">Direct Supabase Bucket</span>
            </label>

            {previewUrl ? (
              <div className="relative w-full h-48 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-2 flex items-center justify-center overflow-hidden group">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeSelectedFile}
                  className="absolute top-3 right-3 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition shadow-md"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 bg-slate-950/85 text-white text-[11px] px-3 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ready to Upload: {selectedFile?.name}</span>
                </div>
              </div>
            ) : (
              <label className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-200/90 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/40 flex flex-col items-center justify-center cursor-pointer transition group p-4">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:scale-105 transition mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-slate-700 group-hover:text-amber-950">
                  Select Photo from Computer / تصویر اپ لوڈ کریں
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP (Max 5MB)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Step 5: Description */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Description / پیکنگ و تفصیل
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Packaging details (e.g. 24 inner packs per master carton, 100% Halal)..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-900 transition"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/products"
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel / واپس
            </Link>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-2xl transition shadow-sm disabled:opacity-50 active:scale-95"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Product / محفوظ ہو رہا ہے...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save to Catalog / پروڈکٹ محفوظ کریں</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
