import { NextRequest, NextResponse } from 'next/server';
import { viewPassword, GUEST_COOKIE, guestToken } from '@/lib/gate';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = String(body?.password || '');
  const expected = viewPassword();
  if (!expected || password !== expected) {
    await new Promise((r) => setTimeout(r, 300));
    return NextResponse.json({ error: '비밀번호가 다릅니다.' }, { status: 401 });
  }
  const token = await guestToken();
  if (!token) {
    return NextResponse.json({ error: '서버 설정 오류' }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GUEST_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
