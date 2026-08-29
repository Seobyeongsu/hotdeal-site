import crypto from 'crypto';

// ==================== 쿠팡 파트너스 API ====================

const COUPANG_ACCESS_KEY = process.env.COUPANG_ACCESS_KEY || '';
const COUPANG_SECRET_KEY = process.env.COUPANG_SECRET_KEY || '';
const COUPANG_AFFILIATE_ID = process.env.COUPANG_AFFILIATE_ID || '';

function generateCoupangHmac(method: string, url: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const message = `${method}${url}${now}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(message);
  return hmac.digest('hex');
}

export async function searchCoupang(keyword: string, limit = 20) {
  const urlPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const hmac = generateCoupangHmac('GET', urlPath, COUPANG_SECRET_KEY);
  const now = Math.floor(Date.now() / 1000);

  try {
    const response = await fetch(`https://api-gateway.coupang.com${urlPath}`, {
      headers: {
        'Authorization': `${COUPANG_ACCESS_KEY}:${hmac}`,
        'Timestamp': now.toString(),
      },
    });

    if (!response.ok) {
      console.error('쿠팡 API 에러:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.data?.products || []).map((p: any) => ({
      id: `coupang_${p.productId}`,
      name: p.productName,
      brand: p.brandName || '',
      category: p.categoryName || '쿠팡',
      image: p.productImage || '',
      price: p.price?.minPrice || 0,
      originalPrice: p.price?.maxPrice || 0,
      discountRate: p.price?.discountRate || 0,
      url: p.productUrl || '',
      source: '쿠팡',
      rating: 0,
      reviewCount: 0,
    }));
  } catch (error) {
    console.error('쿠팡 API 호출 실패:', error);
    return [];
  }
}

export async function fetchCoupangTodayDeals() {
  const urlPath = `/v2/providers/affiliate_open_api/apis/openapi/v1/products/best?categoryId=0&limit=30`;
  const hmac = generateCoupangHmac('GET', urlPath, COUPANG_SECRET_KEY);
  const now = Math.floor(Date.now() / 1000);

  try {
    const response = await fetch(`https://api-gateway.coupang.com${urlPath}`, {
      headers: {
        'Authorization': `${COUPANG_ACCESS_KEY}:${hmac}`,
        'Timestamp': now.toString(),
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data?.products || []).map((p: any) => ({
      id: `coupang_${p.productId}`,
      name: p.productName,
      brand: p.brandName || '',
      category: p.categoryName || '쿠팡',
      image: p.productImage || '',
      price: p.price?.minPrice || 0,
      originalPrice: p.price?.maxPrice || 0,
      discountRate: p.price?.discountRate || 0,
      url: p.productUrl || '',
      source: '쿠팡',
      rating: 0,
      reviewCount: 0,
    }));
  } catch (error) {
    console.error('쿠팡 베스트 API 실패:', error);
    return [];
  }
}

// ==================== 알리익스프레스 API ====================

const ALI_APP_KEY = process.env.ALI_APP_KEY || '';
const ALI_APP_SECRET = process.env.ALI_APP_SECRET || '';

export async function searchAliExpress(keyword: string, limit = 20) {
  // AliExpress Affiliate API
  const url = '/affiliates/product/query';

  try {
    const params = new URLSearchParams({
      keywords: keyword,
      target_currency: 'KRW',
      target_language: 'KR',
      sort: 'SALE_PRICE_ASC',
      limit: limit.toString(),
    });

    const response = await fetch(`https://api-sg.aliexpress.com/sync${url}?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('알리 API 에러:', response.status);
      return [];
    }

    const data = await response.json();
    return (data?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products || []).map((p: any) => ({
      id: `ali_${p.product_id}`,
      name: p.product_title,
      brand: p.first_level_category_name || '알리익스프레스',
      category: p.first_level_category_name || '알리익스프레스',
      image: p.product_main_image_url || '',
      price: parseFloat(p.target_sale_price) || 0,
      originalPrice: parseFloat(p.target_original_price) || 0,
      discountRate: p.discount || 0,
      url: p.product_detail_url || '',
      source: '알리익스프레스',
      rating: parseFloat(p.average_star) || 0,
      reviewCount: p.total_tranpro || 0,
    }));
  } catch (error) {
    console.error('알리 API 호출 실패:', error);
    return [];
  }
}

// ==================== 통합 ====================

export interface HotDeal {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice: number;
  discountRate: number;
  url: string;
  source: string;
  rating: number;
  reviewCount: number;
}

// 인기 카테고리 키워드
const KEYWORDS = [
  '노트북', '이어폰', '충전기', '키보드', '마우스',
  '모니터', 'SSD', '메모리', ' 태블릿', '스마트워치',
  '블루투스', 'USB', '헤드폰', '스피커', '캠핑',
  '운동', '의류', '신발', '가방', '주방',
];

export async function fetchAllHotDeals(): Promise<HotDeal[]> {
  const allDeals: HotDeal[] = [];

  // 쿠팡 API 키가 있으면 실행
  if (COUPANG_ACCESS_KEY && COUPANG_SECRET_KEY) {
    console.log('쿠팡 API 호출 중...');
    const coupangDeals = await fetchCoupangTodayDeals();
    allDeals.push(...coupangDeals);
    console.log(`쿠팡: ${coupangDeals.length}개`);

    // 랜덤 키워드 3개로 검색
    const shuffled = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const keyword of shuffled) {
      const results = await searchCoupang(keyword, 10);
      allDeals.push(...results);
    }
  }

  // 알리익스프레스 API 키가 있으면 실행
  if (ALI_APP_KEY && ALI_APP_SECRET) {
    console.log('알리 API 호출 중...');
    const shuffled = KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const keyword of shuffled) {
      const results = await searchAliExpress(keyword, 10);
      allDeals.push(...results);
    }
  }

  // API 키가 없으면 샘플 데이터 반환
  if (allDeals.length === 0) {
    console.log('API 키 미설정 - 샘플 데이터 반환');
    return getSampleDeals();
  }

  // 할인율 높은 순 정렬
  allDeals.sort((a, b) => b.discountRate - a.discountRate);

  // 중복 제거
  const seen = new Set<string>();
  return allDeals.filter((deal) => {
    const key = deal.name.substring(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// API 키가 없을 때 보여줄 샘플 데이터
function getSampleDeals(): HotDeal[] {
  return [
    {
      id: 'sample_1',
      name: '쿠팡 파트너스 API 키를 설정하세요',
      brand: '설정 필요',
      category: '안내',
      image: '',
      price: 0,
      originalPrice: 0,
      discountRate: 0,
      url: 'https://partners.coupang.com',
      source: '쿠팡',
      rating: 0,
      reviewCount: 0,
    },
    {
      id: 'sample_2',
      name: '알리익스프레스 API 키를 설정하세요',
      brand: '설정 필요',
      category: '안내',
      image: '',
      price: 0,
      originalPrice: 0,
      discountRate: 0,
      url: 'https://developers.aliexpress.com',
      source: '알리익스프레스',
      rating: 0,
      reviewCount: 0,
    },
  ];
}
