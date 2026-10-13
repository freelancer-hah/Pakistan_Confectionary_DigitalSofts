export type ProductType = 'wholesale' | 'retail';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  product_type: ProductType;
  unit: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit: string;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  total_amount: number;
  status: OrderStatus;
  order_type: ProductType;
  created_at: string;
  order_items?: OrderItem[];
}
