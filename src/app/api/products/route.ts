import { NextRequest, NextResponse } from 'next/server';
import { fetchAllHotDeals, HotDeal } from '@/lib/hotdeals';

// 메모리 캐시 (Vercel 서버리스용)
let cachedDeals: HotDeal[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const source = searchParams.get('source');
  const search = searchParams.get('search');

  // 캐시 확인
  const now = Date.now();
  if (cachedDeals.length === 0 || now - lastFetchTime > CACHE_DURATION) {
    cachedDeals = await fetchAllHotDeals();
    lastFetchTime = now;
  }

  let deals = [...cachedDeals];

  // 소스 필터
  if (source && source !== '전체') {
    deals = deals.filter(d => d.source === source);
  }

  // 검색 필터
  if (search) {
    const searchLower = search.toLowerCase();
    deals = deals.filter(d => d.title.toLowerCase().includes(searchLower));
  }

  return NextResponse.json(deals);
}
