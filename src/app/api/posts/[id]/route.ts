import { NextRequest, NextResponse } from 'next/server';
import { getPost, bumpViews, deletePost } from '@/lib/store';
import { isAdminRequest } from '@/lib/auth';

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: '관리자만 삭제할 수 있습니다.' }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await deletePost(id);
  if (!deleted) {
    return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
