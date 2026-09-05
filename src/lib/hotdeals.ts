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

// 실제 같은 샘플 핫딜 데이터
const sampleDeals: HotDeal[] = [
  // 디지털/가전
  {
    id: 'sample_001',
    name: '에어팟 프로 2세대 (USB-C) MTFP3KH/A',
    brand: 'Apple',
    category: '디지털/가전',
    image: '',
    price: 259000,
    originalPrice: 359000,
    discountRate: 28,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.8,
    reviewCount: 15234,
  },
  {
    id: 'sample_002',
    name: '갤럭시 버즈3 프로 AI 무선 이어폰',
    brand: 'Samsung',
    category: '디지털/가전',
    image: '',
    price: 199000,
    originalPrice: 299000,
    discountRate: 33,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.6,
    reviewCount: 8921,
  },
  {
    id: 'sample_003',
    name: 'LG 그램 16 2025 인텔 울트라7',
    brand: 'LG',
    category: '디지털/가전',
    image: '',
    price: 1290000,
    originalPrice: 1790000,
    discountRate: 28,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.7,
    reviewCount: 3245,
  },
  {
    id: 'sample_004',
    name: '레노버 ThinkPad X1 Carbon Gen 12',
    brand: 'Lenovo',
    category: '디지털/가전',
    image: '',
    price: 1490000,
    originalPrice: 2190000,
    discountRate: 32,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.5,
    reviewCount: 1876,
  },
  // 의류/잡화
  {
    id: 'sample_005',
    name: '나이키 에어맥스 97 실버 메탈',
    brand: 'Nike',
    category: '의류/잡화',
    image: '',
    price: 139000,
    originalPrice: 189000,
    discountRate: 26,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.7,
    reviewCount: 5432,
  },
  {
    id: 'sample_006',
    name: '아디다스 울트라부스트 24 런닝화',
    brand: 'Adidas',
    category: '의류/잡화',
    image: '',
    price: 119000,
    originalPrice: 199000,
    discountRate: 40,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.6,
    reviewCount: 3211,
  },
  // 뷰티/미용
  {
    id: 'sample_007',
    name: '설화수 자음2크림 듀오 세트',
    brand: '설화수',
    category: '뷰티/미용',
    image: '',
    price: 89000,
    originalPrice: 150000,
    discountRate: 41,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.9,
    reviewCount: 12456,
  },
  {
    id: 'sample_008',
    name: '랑콤뗑뗑 파우더 세트',
    brand: 'Lancôme',
    category: '뷰티/미용',
    image: '',
    price: 65000,
    originalPrice: 95000,
    discountRate: 32,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.8,
    reviewCount: 4532,
  },
  // 식품/생필품
  {
    id: 'sample_009',
    name: 'CJ 비비고 왕만두 450g x 4개',
    brand: 'CJ',
    category: '식품/생필품',
    image: '',
    price: 15800,
    originalPrice: 24000,
    discountRate: 34,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.8,
    reviewCount: 45678,
  },
  {
    id: 'sample_010',
    name: '풀무원 얇은피꽉찬속 고기만두 600g',
    brand: '풀무원',
    category: '식품/생필품',
    image: '',
    price: 12900,
    originalPrice: 18900,
    discountRate: 32,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.7,
    reviewCount: 32145,
  },
  // 가구/인테리어
  {
    id: 'sample_011',
    name: '이케아 마크레슨 데스크 화이트',
    brand: 'IKEA',
    category: '가구/인테리어',
    image: '',
    price: 89000,
    originalPrice: 129000,
    discountRate: 31,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.4,
    reviewCount: 2345,
  },
  {
    id: 'sample_012',
    name: '한샘 유로 501 서랍장 3단',
    brand: '한샘',
    category: '가구/인테리어',
    image: '',
    price: 199000,
    originalPrice: 299000,
    discountRate: 33,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.5,
    reviewCount: 1876,
  },
  // 스포츠/건강
  {
    id: 'sample_013',
    name: '필라테스 매트 183x61cm 두께 15mm',
    brand: 'ADO',
    category: '스포츠/건강',
    image: '',
    price: 29000,
    originalPrice: 49000,
    discountRate: 41,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.6,
    reviewCount: 8765,
  },
  {
    id: 'sample_014',
    name: '유_healthsocks 스포츠 양말 10켤레',
    brand: '유healthsocks',
    category: '스포츠/건강',
    image: '',
    price: 15900,
    originalPrice: 25000,
    discountRate: 36,
    url: 'https://www.coupang.com',
    source: '쿠팡',
    rating: 4.5,
    reviewCount: 6543,
  },
  // 알리익스프레스
  {
    id: 'sample_015',
    name: '무선 블루투스 이어폰 노이즈캔슬링',
    brand: 'QCY',
    category: '디지털/가전',
    image: '',
    price: 15900,
    originalPrice: 39000,
    discountRate: 59,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.4,
    reviewCount: 23456,
  },
  {
    id: 'sample_016',
    name: 'USB C 충전기 65W GaN 고속충전',
    brand: 'Baseus',
    category: '디지털/가전',
    image: '',
    price: 12900,
    originalPrice: 35000,
    discountRate: 63,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.5,
    reviewCount: 18765,
  },
  {
    id: 'sample_017',
    name: '스마트워치 AMOLED 방수 NFC',
    brand: 'Haylou',
    category: '디지털/가전',
    image: '',
    price: 29900,
    originalPrice: 89000,
    discountRate: 66,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.3,
    reviewCount: 12345,
  },
  {
    id: 'sample_018',
    name: '미니 포터블 블루투스 스피커',
    brand: 'JBL',
    category: '디지털/가전',
    image: '',
    price: 19900,
    originalPrice: 49000,
    discountRate: 59,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.6,
    reviewCount: 8765,
  },
  {
    id: 'sample_019',
    name: 'LED 책상 램프 터치식 밝기조절',
    brand: 'BenQ',
    category: '디지털/가전',
    image: '',
    price: 39000,
    originalPrice: 89000,
    discountRate: 56,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.7,
    reviewCount: 5432,
  },
  {
    id: 'sample_020',
    name: '무선 마우스 ergonomic 인체공학',
    brand: 'Logitech',
    category: '디지털/가전',
    image: '',
    price: 29000,
    originalPrice: 69000,
    discountRate: 58,
    url: 'https://www.aliexpress.com',
    source: '알리익스프레스',
    rating: 4.5,
    reviewCount: 7654,
  },
];

function mapCoupangProduct(p: any): HotDeal {
  return {
    id: String(p.id),
    name: p.productName || '',
    brand: p.brand || '',
    category: p.productType || '디지털/가전',
    image: p.imageUrl || '',
    price: p.lowestPrice?.salesPrice ?? 0,
    originalPrice: p.lowestPrice?.purchasePrice ?? p.lowestPrice?.salesPrice ?? 0,
    discountRate: p.lowestPrice?.discountRate ?? 0,
    url: p.affiliateLink?.affiliateUrl || p.productUrl || '',
    source: '쿠팡',
    rating: p.analysis?.averageStarRating ?? 0,
    reviewCount: p.analysis?.reviewCount ?? 0,
  };
}

export async function fetchAllHotDeals(): Promise<HotDeal[]> {
  // API 키가 있으면 실제 API 호출
  const COUPANG_ACCESS_KEY = process.env.COUPANG_ACCESS_KEY || '';
  if (COUPANG_ACCESS_KEY && COUPANG_ACCESS_KEY !== 'your_access_key') {
    try {
      const { getBestProducts } = await import('./coupang');
      const products = await getBestProducts(316, 20);
      if (products.length > 0) return products.map(mapCoupangProduct);
    } catch (error) {
      console.error('쿠팡 API 에러:', error);
    }
  }

  // API 키가 없으면 샘플 데이터 반환
  return sampleDeals;
}
