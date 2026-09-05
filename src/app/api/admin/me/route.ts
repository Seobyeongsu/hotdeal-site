import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const ok = await isAdminRequest(request);
  return NextResponse.json({ ok });
}
