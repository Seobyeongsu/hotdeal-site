import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const period = searchParams.get('period') || '3';
  const sort = searchParams.get('sort') || 'price_asc';

  const db = getDb();

  let query = `
    SELECT p.*,
      ph.price as latest_price,
      (SELECT MIN(price) FROM price_history WHERE product_id = p.id) as min_price,
      (SELECT MAX(price) FROM price_history WHERE product_id = p.id) as max_price,
      (SELECT AVG(price) FROM price_history WHERE product_id = p.id) as avg_price
    FROM products p
    LEFT JOIN price_history ph ON p.id = ph.product_id
      AND ph.recorded_at = (
        SELECT MAX(recorded_at) FROM price_history WHERE product_id = p.id
      )
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (category) {
    conditions.push('p.category = ?');
    params.push(category);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  switch (sort) {
    case 'price_asc':
      query += ' ORDER BY p.unit_price ASC';
      break;
    case 'price_desc':
      query += ' ORDER BY p.unit_price DESC';
      break;
    case 'discount':
      query += ' ORDER BY p.discount_rate DESC';
      break;
    case 'name':
      query += ' ORDER BY p.name ASC';
      break;
    default:
      query += ' ORDER BY p.unit_price ASC';
  }

  const products = db.prepare(query).all(...params);

  return NextResponse.json(products);
}
