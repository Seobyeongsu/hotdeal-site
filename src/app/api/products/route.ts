import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHotDeals, HotDeal } from '@/lib/hotdeals';

let cachedDeals: HotDeal[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source');
  const search = searchParams.get('search');

  const now = Date.now();
  if (cachedDeals.length === 0 || now - lastFetchTime > CACHE_DURATION) {
    cachedDeals = await fetchAllHotDeals();
    lastFetchTime = now;
  }

  let deals = [...cachedDeals];

  if (source && source !== '전체') {
    deals = deals.filter(d => d.source === source);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    deals = deals.filter(d =>
      d.name.toLowerCase().includes(searchLower) ||
      d.brand.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json(deals);
}
