import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  const period = searchParams.get('period') || '3';

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  const db = getDb();

  const daysAgo = parseInt(period) * 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  const history = db.prepare(`
    SELECT price, recorded_at
    FROM price_history
    WHERE product_id = ? AND recorded_at >= ?
    ORDER BY recorded_at ASC
  `).all(productId, startDate.toISOString());

  return NextResponse.json(history);
}
