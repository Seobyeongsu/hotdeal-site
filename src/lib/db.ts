// Vercel 호환 데이터베이스 (프로토타입용)
// 실제 운영 시 Neon/PlanetScale 등으로 교체 필요

import { Product, PriceHistory } from '@/types';

const DB_URL = process.env.DATABASE_URL;

// 샘플 데이터 (실제 운영 시 DB에서 가져옴)
const sampleProducts: Product[] = [
  {
    id: 1,
    coupang_id: 'sample_001',
    name: '에어팟 프로 2세대',
    brand: 'Apple',
    category: '디지털/가전',
    image_url: '',
    current_price: 259000,
    original_price: 359000,
    discount_rate: 28,
    serving_size: '무선 이어폰',
    weight: '50g',
    unit_price: 259000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    coupang_id: 'sample_002',
    name: '갤럭시 버즈3 프로',
    brand: 'Samsung',
    category: '디지털/가전',
    image_url: '',
    current_price: 229000,
    original_price: 299000,
    discount_rate: 23,
    serving_size: '무선 이어폰',
    weight: '45g',
    unit_price: 229000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    coupang_id: 'sample_003',
    name: '마크레슨 데스크',
    brand: '이케아',
    category: '가구/인테리어',
    image_url: '',
    current_price: 89000,
    original_price: 129000,
    discount_rate: 31,
    serving_size: 'PC용 데스크',
    weight: '15kg',
    unit_price: 89000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    coupang_id: 'sample_004',
    name: '유모차 올인원',
    brand: '스토케',
    category: '출산/육아',
    image_url: '',
    current_price: 450000,
    original_price: 650000,
    discount_rate: 31,
    serving_size: '접이식 유모차',
    weight: '8kg',
    unit_price: 450000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    coupang_id: 'sample_005',
    name: '농심 신라면 멀티',
    brand: '농심',
    category: '식품/생필품',
    image_url: '',
    current_price: 4980,
    original_price: 5800,
    discount_rate: 14,
    serving_size: '5개입',
    weight: '625g',
    unit_price: 996,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    coupang_id: 'sample_006',
    name: '비타민C 세럼',
    brand: '铃鹿',
    category: '뷰티/미용',
    image_url: '',
    current_price: 18900,
    original_price: 32000,
    discount_rate: 41,
    serving_size: '30ml',
    weight: '100g',
    unit_price: 18900,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 7,
    coupang_id: 'sample_007',
    name: '나이키 에어맥스 97',
    brand: 'Nike',
    category: '의류/잡화',
    image_url: '',
    current_price: 139000,
    original_price: 189000,
    discount_rate: 26,
    serving_size: '런닝화',
    weight: '350g',
    unit_price: 139000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 8,
    coupang_id: 'sample_008',
    name: '필라테스 매트',
    brand: 'ADO',
    category: '스포츠/건강',
    image_url: '',
    current_price: 29000,
    original_price: 49000,
    discount_rate: 41,
    serving_size: '183x61cm',
    weight: '1.5kg',
    unit_price: 29000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 9,
    coupang_id: 'sample_009',
    name: '皇家卡노 고프리미엄',
    brand: 'Royal Canin',
    category: '반려동물',
    image_url: '',
    current_price: 42000,
    original_price: 56000,
    discount_rate: 25,
    serving_size: '성견용',
    weight: '3kg',
    unit_price: 14000,
    url: '#',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// 샘플 가격 변동 데이터 생성
function generatePriceHistory(productId: number, currentPrice: number): PriceHistory[] {
  const history: PriceHistory[] = [];
  const now = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const fluctuation = (Math.random() - 0.5) * 0.3;
    const price = Math.round(currentPrice * (1 + fluctuation));

    history.push({
      id: i,
      product_id: productId,
      price,
      recorded_at: date.toISOString(),
    });
  }

  return history;
}

export function getProducts(category?: string, sort?: string) {
  let products = [...sampleProducts];

  // 카테고리 필터
  if (category) {
    products = products.filter(p => p.category === category);
  }

  // 정렬
  switch (sort) {
    case 'price_asc':
      products.sort((a, b) => a.unit_price - b.unit_price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.unit_price - a.unit_price);
      break;
    case 'discount':
      products.sort((a, b) => b.discount_rate - a.discount_rate);
      break;
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      products.sort((a, b) => a.unit_price - b.unit_price);
  }

  // 가격 통계 추가
  return products.map(p => {
    const history = generatePriceHistory(p.id, p.current_price);
    const prices = history.map(h => h.price);
    return {
      ...p,
      min_price: Math.min(...prices),
      max_price: Math.max(...prices),
      avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  });
}

export function getProductById(id: number) {
  const products = getProducts();
  return products.find(p => p.id === id) || null;
}

export function getPriceHistory(productId: number, period: string = '3') {
  const product = getProductById(productId);
  if (!product) return [];

  const days = parseInt(period) * 30;
  const history = generatePriceHistory(productId, product.current_price);

  // 기간에 따라 필터링
  return history.slice(-days);
}
