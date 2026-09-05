import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { addPost, listPosts } from '@/lib/store';
import { createShareLink, tossKeysConfigured, type BestSellingItem } from '@/lib/toss-api';

interface ImportItem extends BestSellingItem {
  categoryName?: string | null;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: '관리자만 사용할 수 있습니다.' }, { status: 401 });
  }
  if (!tossKeysConfigured()) {
    return NextResponse.json({ error: '.env.local에 토스 API 키를 먼저 입력하세요.' }, { status: 400 });
  }
  const body = await request.json().catch(() => null);
  const items: BestSellingItem[] = Array.isArray(body?.items) ? body.items : [];
  const author: string = (body?.author || '오늘도핫딜').trim();
  if (items.length === 0) {
    return NextResponse.json({ error: '등록할 상품을 선택하세요.' }, { status: 400 });
  }
  if (items.length > 30) {
    return NextResponse.json({ error: '한 번에 30개까지 등록할 수 있습니다.' }, { status: 400 });
  }

  const created: { tacaItemId: number; title: string; shortUrl: string }[] = [];
  const failed: { tacaItemId: number; reason: string }[] = [];
  const skipped: { tacaItemId: number; reason: string }[] = [];

  const postsNow = await listPosts();
  const existing = new Set(postsNow.map((p) => p.tacaItemId).filter(Boolean));
  const existingTitles = new Set(postsNow.map((p) => p.title));

  for (const item of items as ImportItem[]) {
    try {
      if (!item?.tacaItemId || !item?.displayName) throw new Error('잘못된 상품 데이터');
      if (existing.has(item.tacaItemId) || existingTitles.has(`토스) ${item.displayName}`)) {
        skipped.push({ tacaItemId: item.tacaItemId, reason: '이미 등록됨' });
        continue;
      }
      const link = await createShareLink(Number(item.tacaItemId));
      const post = await addPost({
        title: `토스) ${item.displayName}`,
        description: '',
        image: item.thumbnailUrl || '',
        url: link.shortUrl,
        price: item.displayPrice != null ? Number(item.displayPrice) : null,
        rating: item.reviewScore != null ? Number(item.reviewScore) : null,
        reviewCount: item.reviewCount != null ? Number(item.reviewCount) : null,
        categoryName: item.categoryName || (item.discountRate ? `할인 ${item.discountRate}%` : null),
        tacaItemId: Number(item.tacaItemId),
        rank: item.rank != null ? Number(item.rank) : null,
        arrivalDate: null,
        merchant: item.originalPrice && item.displayPrice && item.originalPrice > item.displayPrice
          ? `${Number(item.originalPrice).toLocaleString()}원 →`
          : null,
        source: '토스',
        author,
      });
      existing.add(item.tacaItemId);
      existingTitles.add(post.title);
      created.push({ tacaItemId: item.tacaItemId, title: post.title, shortUrl: link.shortUrl });
    } catch (e: any) {
      failed.push({ tacaItemId: item?.tacaItemId ?? 0, reason: e.message || '실패' });
    }
  }

  return NextResponse.json({ created, failed, skipped }, { status: created.length > 0 || skipped.length > 0 ? 201 : 502 });
}
