'use client';

import { useState } from 'react';

export default function GuestGate() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || '비밀번호가 다릅니다.');
    } catch {
      setError('잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white border border-[#e3e6eb] rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg object-cover" />
          <h1 className="text-lg font-bold">더파인드핫딜</h1>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          지인 전용 비공개 핫딜방입니다.
          <br />
          공유받은 접속 비밀번호를 입력해 주세요.
        </p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="접속 비밀번호"
          autoFocus
          className="w-full bg-[#f7f8fa] border border-[#e3e6eb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 mb-3"
        />
        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading || !pw}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </main>
  );
}
