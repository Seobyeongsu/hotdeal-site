import { useEffect, useMemo, useState } from 'react';
import { fetchPosts } from './api';
import type { BoardPost } from './types';

const TODAY = '오늘의 특가';

function isLiveToday(p: BoardPost): boolean {
  return p.todayDeal === true && (!p.endAt || new Date(p.endAt).getTime() > Date.now());
}

function untilLabel(endAt?: string | null): string {
  if (!endAt) return '';
  const ms = new Date(endAt).getTime() - Date.now();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  if (h >= 1) return `${h}시간`;
  const m = Math.max(1, Math.floor(ms / 60000));
  return `${m}분`;
}

function won(n?: number | null): string {
  return n == null ? '' : `${n.toLocaleString()}원`;
}

export default function App() {
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cat, setCat] = useState('전체');
  const [q, setQ] = useState('');
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<BoardPost | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPosts()
      .then((d) => {
        setPosts(d);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '불러오기 실패');
        setLoading(false);
      });
  }, []);

  const hasToday = useMemo(() => posts.some(isLiveToday), [posts]);
  const cats = useMemo(
    () => Array.from(new Set(posts.map((p) => p.categoryName).filter((c): c is string => !!c))),
    [posts],
  );

  const shown = useMemo(() => {
    let list = posts;
    if (cat === TODAY) list = list.filter(isLiveToday);
    else if (cat !== '전체') list = list.filter((p) => p.categoryName === cat && !isLiveToday(p));
    else if (!q.trim()) list = list.filter((p) => !isLiveToday(p));
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((p) => p.title.toLowerCase().includes(s));
    return list;
  }, [posts, cat, q]);

  const share = async (post: BoardPost) => {
    const text = `${post.title}\n${post.url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: post.url });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 사용자 취소 등 무시 */
    }
  };

  if (selected) {
    const p = selected;
    return (
      <div className="detail">
        <div className="detail-inner">
          <button className="btn ghost" onClick={() => setSelected(null)} style={{ marginBottom: 12 }}>
            ← 목록으로
          </button>
          {p.image && <img className="detail-img" src={p.image} alt={p.title} />}
          <h2 className="detail-title">{p.title}</h2>
          <div className="detail-price">
            {p.discountRate ? <span className="off">{p.discountRate}%</span> : null}
            <span className="now">{won(p.price) || '가격 정보 없음'}</span>
            {p.originalPrice && p.price && p.originalPrice > p.price ? (
              <span className="orig">{won(p.originalPrice)}</span>
            ) : null}
          </div>
          <div className="rows">
            {p.categoryName && (
              <div className="row">
                <span className="k">카테고리</span>
                <span className="v">{p.categoryName}</span>
              </div>
            )}
            {p.rating != null && (
              <div className="row">
                <span className="k">평점</span>
                <span className="v">
                  ★ {p.rating}
                  {p.reviewCount != null ? ` (${p.reviewCount.toLocaleString()})` : ''}
                </span>
              </div>
            )}
            {isLiveToday(p) && (
              <div className="row">
                <span className="k">오늘특가</span>
                <span className="v" style={{ color: '#f97316' }}>
                  ⏰ {untilLabel(p.endAt)} 남음
                </span>
              </div>
            )}
            {p.source && (
              <div className="row">
                <span className="k">출처</span>
                <span className="v">{p.source}</span>
              </div>
            )}
          </div>
          <div className="actions">
            <a className="btn" href={p.url} target="_blank" rel="noreferrer">
              구매하기
            </a>
            <button className="btn ghost" onClick={() => share(p)}>
              {copied ? '복사됨!' : '공유하기'}
            </button>
          </div>
          <p className="foot-note">
            이 콘텐츠는 토스쇼핑 쉐어링크 활동의 일환으로, 링크를 통한 구매가 발생하면 일정 수수료를
            지급받습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="header">
        <img className="logo" src="/logo.png" alt="" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        <h1>더파인드핫딜</h1>
      </div>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="상품 검색 (예: 화장지, 계란)"
        />
        <button className="btn" type="submit">
          검색
        </button>
      </form>

      <div className="chips">
        <button className={`chip ${cat === '전체' ? 'active' : ''}`} onClick={() => setCat('전체')}>
          전체
        </button>
        {hasToday && (
          <button className={`chip today ${cat === TODAY ? 'active' : ''}`} onClick={() => setCat(TODAY)}>
            ⏰ 오늘의 특가
          </button>
        )}
        {cats.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {loading && <p className="center">불러오는 중...</p>}
      {error && <p className="center">⚠️ {error}</p>}
      {!loading && !error && shown.length === 0 && <p className="center">상품이 없습니다.</p>}

      <div className="grid">
        {shown.map((p) => (
          <div className="card" key={p.id} onClick={() => setSelected(p)}>
            <div className="thumb">
              {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : null}
              {p.discountRate ? <span className="badge discount">{p.discountRate}%</span> : null}
              {isLiveToday(p) ? <span className="badge today">⏰ {untilLabel(p.endAt)}</span> : null}
              {p.soldOut ? (
                <div className="overlay">
                  <span>품절</span>
                </div>
              ) : null}
            </div>
            <div className="card-body">
              <p className="title">{p.title}</p>
              <div className="price-row">
                <span className="price">{won(p.price) || '가격 미정'}</span>
                {p.originalPrice && p.price && p.originalPrice > p.price ? (
                  <span className="orig">{won(p.originalPrice)}</span>
                ) : null}
              </div>
              {p.rating != null && (
                <span className="meta">
                  ★ {p.rating}
                  {p.reviewCount != null ? ` (${p.reviewCount.toLocaleString()})` : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
