export interface BoardPost {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  url: string;
  price?: number | null;
  originalPrice?: number | null;
  discountRate?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  categoryName?: string | null;
  rank?: number | null;
  arrivalDate?: string | null;
  merchant?: string | null;
  source?: string | null;
  author?: string | null;
  createdAt?: string | null;
  views?: number | null;
  tacaItemId?: number | null;
  soldOut?: boolean | null;
  todayDeal?: boolean | null;
  endAt?: string | null;
}
