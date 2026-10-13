export type ProductType = 'wholesale' | 'retail';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

export interface Product {
  id: string;
  name: string;
  product_type: ProductType;
  unit: string; // 'Carton' or 'Piece'
  price: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string | null;
  product_name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  whatsapp: string | null;
  address: string;
  city: string;
  order_type: ProductType;
  total_amount: number;
  payment_method: string;
  status: OrderStatus;
  order_items?: OrderItem[];
  created_at: string;
}

// Minimum limits as specified by user
export const MIN_ORDER_WHOLESALE = 15000; // Rs. 15,000 for wholesale cartons
export const MIN_ORDER_RETAIL = 2500;    // Rs. 2,500 for normal retail orders
