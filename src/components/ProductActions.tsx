'use client';

import { useState } from 'react';

export default function ProductActions({ url, source, title }: { url: string; source: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const disclosure =
    source === '토스'
      ? '이 콘텐츠는 토스쇼핑 쉐어링크 활동의 일환으로, 링크를 통한 구매가 발생하면 일정 수수료를 지급받습니다.'
      : '';
  const shareText = [title, url, disclosure].filter(Boolean).join('\n\n');

  const share = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: title || document.title, text: disclosure, url });
        return;
      }
      throw new Error('no-share-api');
    } catch {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-lg transition"
      >
        {source === '토스' ? '🛒 구매하기' : '🛒 구매하기'}
      </a>
      <button
        onClick={share}
        className="flex-1 text-center border-2 border-[#e3e6eb] hover:border-gray-400 hover:bg-[#f1f2f5] text-gray-800 font-bold py-3 rounded-lg transition"
      >
        {copied ? '✅ 링크 복사됨!' : '🔗 공유하기'}
      </button>
    </div>
  );
}
