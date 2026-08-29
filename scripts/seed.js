const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'hotdeal.db');
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS price_history;
  DROP TABLE IF EXISTS products;

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coupang_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    image_url TEXT,
    current_price INTEGER,
    original_price INTEGER,
    discount_rate REAL,
    serving_size TEXT,
    weight TEXT,
    unit_price INTEGER,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE INDEX idx_price_history_product ON price_history(product_id);
  CREATE INDEX idx_price_history_date ON price_history(recorded_at);
  CREATE INDEX idx_products_category ON products(category);
`);

const sampleProducts = [
  // 디지털/가전
  {
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
  },
  {
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
  },
  // 가구/인테리어
  {
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
  },
  // 출산/육아
  {
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
  },
  // 식품/생필품
  {
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
  },
  // 뷰티/미용
  {
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
  },
  // 의류/잡화
  {
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
  },
  // 스포츠/건강
  {
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
  },
  // 반려동물
  {
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
  },
];

const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (coupang_id, name, brand, category, image_url, current_price, original_price, discount_rate, serving_size, weight, unit_price, url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertHistory = db.prepare(`
  INSERT INTO price_history (product_id, price, recorded_at) VALUES (?, ?, ?)
`);

const insertMany = db.transaction(() => {
  for (const product of sampleProducts) {
    const result = insertProduct.run(
      product.coupang_id,
      product.name,
      product.brand,
      product.category,
      product.image_url,
      product.current_price,
      product.original_price,
      product.discount_rate,
      product.serving_size,
      product.weight,
      product.unit_price,
      product.url
    );

    const productId = Number(result.lastInsertRowid);

    // Generate 90 days of price history
    const now = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const fluctuation = (Math.random() - 0.5) * 0.3;
      const historicalPrice = Math.round(product.current_price * (1 + fluctuation));

      insertHistory.run(productId, historicalPrice, date.toISOString());
    }
  }
});

insertMany();

console.log('Sample data inserted successfully!');
db.close();
