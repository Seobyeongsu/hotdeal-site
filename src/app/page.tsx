'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import SortSelect from '@/components/SortSelect';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  image_url: string;
  current_price: number;
  original_price: number;
  discount_rate: number;
  unit_price: number;
  weight: string;
  min_price: number;
  max_price: number;
}

const categories = [
  '전체',
  '디지털/가전',
  '가구/인테리어',
  '출산/육아',
  '식품/생필품',
  '뷰티/미용',
  '의류/잡화',
  '스포츠/건강',
  '반려동물',
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('price_asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== '전체') {
        params.set('category', selectedCategory);
      }
      params.set('sort', sortBy);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <CategoryFilter
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="flex justify-end mb-4">
          <SortSelect value={sortBy} onChange={setSortBy} />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">로딩 중...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            상품이 없습니다. 데이터를 수집 중입니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
