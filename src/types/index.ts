export interface Product {
  id: number;
  coupang_id: string;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  current_price: number;
  original_price: number;
  discount_rate: number;
  serving_size: string;
  weight: string;
  unit_price: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface PriceHistory {
  id: number;
  product_id: number;
  price: number;
  recorded_at: string;
}

export interface PriceStats {
  current_price: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  lowest_price_date: string;
}

export interface HotDeal extends Product {
  is_hot_deal: boolean;
  price_change: number;
  price_change_percent: number;
}
