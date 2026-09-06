import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminPassword, adminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ password: '' }));
  const password: string = (body.password || '').toString();
  const configuredPassword = adminPassword();

  if (!configuredPassword || !password || password !== configuredPassword) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const token = await adminToken();
  if (!token) {
    return NextResponse.json({ error: '관리자 로그인을 사용할 수 없습니다.' }, { status: 503 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
