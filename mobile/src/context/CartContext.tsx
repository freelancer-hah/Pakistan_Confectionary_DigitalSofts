import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, ProductType } from '../types/wholesale';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address: string;
}

export const MIN_ORDER_WHOLESALE = 15000;
export const MIN_ORDER_RETAIL = 2500;

interface CartContextType {
  cart: CartItem[];
  activeTab: ProductType;
  setActiveTab: (tab: ProductType) => void;
  customer: CustomerProfile | null;
  setCustomer: (cust: CustomerProfile | null) => void;
  addToCart: (product: Product) => { success: boolean; message?: string };
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  totalItemsCount: number;
  minRequired: number;
  isMinOrderMet: boolean;
  progressPercent: number;
  recentOrders: string[];
  addRecentOrder: (orderNumber: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY_CUSTOMER = '@wholesale_customer_profile';
const STORAGE_KEY_ORDERS = '@wholesale_recent_orders';
const STORAGE_KEY_CART = '@wholesale_customer_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<ProductType>('wholesale');
  const [customer, setCustomerState] = useState<CustomerProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);

  useEffect(() => {
    loadSavedData();
  }, []);

  async function loadSavedData() {
    try {
      const [savedCust, savedOrders, savedCart] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_CUSTOMER),
        AsyncStorage.getItem(STORAGE_KEY_ORDERS),
        AsyncStorage.getItem(STORAGE_KEY_CART),
      ]);

      if (savedCust) setCustomerState(JSON.parse(savedCust));
      if (savedOrders) setRecentOrders(JSON.parse(savedOrders));
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.warn('Error loading cart data from storage:', e);
    }
  }

  const setCustomer = async (cust: CustomerProfile | null) => {
    setCustomerState(cust);
    if (cust) {
      await AsyncStorage.setItem(STORAGE_KEY_CUSTOMER, JSON.stringify(cust));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_CUSTOMER);
    }
  };

  const addRecentOrder = async (orderNumber: string) => {
    const updated = [orderNumber, ...recentOrders.filter((id) => id !== orderNumber)];
    setRecentOrders(updated);
    await AsyncStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updated));
  };

  const saveCart = async (newCart: CartItem[]) => {
    setCart(newCart);
    await AsyncStorage.setItem(STORAGE_KEY_CART, JSON.stringify(newCart));
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      return { success: false, message: 'Out of stock / مال ختم ہے' };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart: CartItem[];

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        return { success: false, message: `Only ${product.stock} units available / زیادہ سے زیادہ ${product.stock} دستیاب ہیں` };
      }
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart = [...cart, { product, quantity: 1 }];
    }

    saveCart(updatedCart);
    return { success: true };
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          if (nextQty > item.product.stock) return item;
          if (nextQty <= 0) return null;
          return { ...item, quantity: nextQty };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const minRequired = activeTab === 'wholesale' ? MIN_ORDER_WHOLESALE : MIN_ORDER_RETAIL;
  const isMinOrderMet = cartTotal >= minRequired;
  const progressPercent = Math.min(100, Math.round((cartTotal / minRequired) * 100));

  return (
    <CartContext.Provider
      value={{
        cart,
        activeTab,
        setActiveTab,
        customer,
        setCustomer,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        totalItemsCount,
        minRequired,
        isMinOrderMet,
        progressPercent,
        recentOrders,
        addRecentOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
