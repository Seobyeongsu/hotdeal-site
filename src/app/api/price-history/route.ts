import { NextRequest, NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get('productId');
  const period = searchParams.get('period') || '3';

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  const history = getPriceHistory(parseInt(productId), period);
  return NextResponse.json(history);
}
