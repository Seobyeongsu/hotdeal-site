import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { fetchBestSelling, tossHealth, tossKeysConfigured } from '@/lib/toss-api';

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: '관리자만 사용할 수 있습니다.' }, { status: 401 });
  }
  if (!tossKeysConfigured()) {
    return NextResponse.json({ error: '.env.local에 TOSS_ACCESS_KEY / TOSS_SECRET_KEY를 먼저 입력하세요.' }, { status: 400 });
  }
  const size = Number(request.nextUrl.searchParams.get('size') || 20);
  const cursor = request.nextUrl.searchParams.get('cursor') || undefined;
  const mode = request.nextUrl.searchParams.get('mode');
  try {
    if (mode === 'health') {
      return NextResponse.json({ health: await tossHealth() });
    }
    const result = await fetchBestSelling(Math.min(Math.max(size, 1), 100), cursor);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || '조회 실패' }, { status: 502 });
  }
}
