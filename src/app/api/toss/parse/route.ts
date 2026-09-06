import { NextRequest, NextResponse } from 'next/server';
import { parseTossLink, isTossLink } from '@/lib/toss';
import { enrichDealPrice } from '@/lib/toss-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url: string = (body.url || '').trim();

    if (!/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: 'http(s) 링크를 입력하세요.' }, { status: 400 });
    }
    if (!isTossLink(url)) {
      return NextResponse.json(
        { error: '토스 쉐어링크(toss.im / toss.shopping)만 자동 분석됩니다.' },
        { status: 400 },
      );
    }

    const deal = await parseTossLink(url);
    const priceInfo = await enrichDealPrice(deal.canonicalUrl);
    return NextResponse.json({ ...deal, ...priceInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '분석 실패' }, { status: 500 });
  }
}
