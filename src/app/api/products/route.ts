import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProductById } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'price_asc';

  // 특정 상품 조회
  if (id) {
    const product = getProductById(parseInt(id));
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  // 상품 목록 조회
  const products = getProducts(category || undefined, sort);
  return NextResponse.json(products);
}
