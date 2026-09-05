import { NextRequest, NextResponse } from 'next/server';
import { listPosts, addPost } from '@/lib/store';
import { parseTossLink, isTossLink } from '@/lib/toss';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  const posts = await listPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: '관리자만 등록할 수 있습니다.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const url: string = (body.url || '').trim();
    const author: string = (body.author || '오늘도핫딜').trim();
    const price: number | null = body.price ? Number(body.price) : null;

    if (!/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: '링크를 입력하세요.' }, { status: 400 });
    }

    if (isTossLink(url)) {
      const deal = await parseTossLink(url);
      const post = await addPost({
        title: deal.title,
        description: deal.description,
        image: deal.image,
        url: deal.url,
        price,
        rating: deal.rating,
        reviewCount: deal.reviewCount,
        categoryName: deal.categoryName,
        rank: deal.rank,
        arrivalDate: deal.arrivalDate,
        merchant: deal.merchant,
        source: deal.source,
        author,
      });
      return NextResponse.json(post, { status: 201 });
    }

    // 토스 외 링크는 직접 입력 정보로 게시
    const title: string = (body.title || '').trim();
    if (!title) {
      return NextResponse.json(
        { error: '토스 링크가 아닙니다. 제목을 직접 입력하세요.' },
        { status: 400 },
      );
    }
    const post = await addPost({
      title,
      description: (body.description || '').trim(),
      image: (body.image || '').trim(),
      url,
      price,
      rating: null,
      reviewCount: null,
      categoryName: null,
      rank: null,
      arrivalDate: null,
      merchant: null,
      source: (body.source || '직접입력').trim(),
      author,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '등록 실패' }, { status: 500 });
  }
}
