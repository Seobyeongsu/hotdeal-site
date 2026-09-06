import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: '관리자만' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. 현재 공인 IP
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipRes.json();
    results.currentIP = ip;
  } catch {
    results.currentIP = '조회 실패';
  }

  // 2. 토스 토큰 발급 + health
  try {
    const env: Record<string, string> = {};
    const fs = await import('node:fs');
    const raw = fs.readFileSync('.env.local', 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }

    if (!env.TOSS_ACCESS_KEY || env.TOSS_ACCESS_KEY.startsWith('여기에')) {
      results.tossAPI = '❌ API 키 미설정';
    } else {
      const tokenRes = await fetch('https://oauth2.cert.toss.im/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: env.TOSS_ACCESS_KEY,
          client_secret: env.TOSS_SECRET_KEY,
          scope: 'sharelink:read',
        }),
      });
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        results.tossAPI = `❌ 토큰 발급 실패 (${tokenData.error || tokenRes.status})`;
      } else {
        const healthRes = await fetch('https://sharelink.toss.im/openapi/health', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const healthData = await healthRes.json();

        if (healthRes.ok && healthData.resultType === 'SUCCESS') {
          results.tossAPI = '✅ 연결 정상';
        } else if (healthRes.status === 403) {
          results.tossAPI = `🚫 IP 미등록 (${results.currentIP})`;
        } else {
          results.tossAPI = `⚠️ 오류 (${healthRes.status}): ${JSON.stringify(healthData.error || healthData).slice(0, 100)}`;
        }
      }
    }
  } catch (e: any) {
    results.tossAPI = `❌ ${e.message}`;
  }

  // 3. 추천
  const needsIP = typeof results.tossAPI === 'string' && results.tossAPI.includes('미등록');
  results.recommendation = needsIP
    ? `토스 어드민(sharelink.admin.toss.im) → 설정 → 출발 IP 관리에 "${results.currentIP}" 추가 필요. 또는 LG U+ 고정 IP(월 5,500원) 신청 권장.`
    : '현재 정상 동작 중';

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } });
}
