import { NextRequest, NextResponse } from 'next/server';
import { getPost, bumpViews } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
  }
  bumpViews(id).catch(() => {});
  return NextResponse.json(post);
}
