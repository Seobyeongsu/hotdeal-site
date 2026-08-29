import axios from 'axios';
import { parseString } from 'xml2js';

export interface HotDeal {
  id: string;
  title: string;
  url: string;
  source: string;
  price: number | null;
  date: string;
  thumbnail: string | null;
}

async function fetchRSS(url: string): Promise<any[]> {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      responseType: 'text',
    });

    return new Promise((resolve) => {
      parseString(response.data, (err: any, result: any) => {
        if (err) {
          console.error('XML 파싱 에러:', err);
          resolve([]);
          return;
        }

        try {
          // RSS 2.0
          if (result?.rss?.channel?.[0]?.item) {
            resolve(result.rss.channel[0].item);
            return;
          }
          // Atom
          if (result?.feed?.entry) {
            resolve(result.feed.entry);
            return;
          }
          resolve([]);
        } catch {
          resolve([]);
        }
      });
    });
  } catch (error) {
    console.error('RSS 가져오기 실패:', url, error);
    return [];
  }
}

// 뽐뿌
async function fetchPpomppu(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://www.ppomppu.co.kr/rss/rss_board.php?id=ppomppu');
  return items.slice(0, 30).map((item, i) => ({
    id: `ppomppu_${i}`,
    title: item.title?.[0] || '',
    url: item.link?.[0] || '',
    source: '뽐뿌',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
    thumbnail: null,
  }));
}

// 클리앙
async function fetchClien(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://www.clien.net/service/board/jirum/rss');
  return items.slice(0, 30).map((item, i) => ({
    id: `clien_${i}`,
    title: item.title?.[0] || '',
    url: item.link?.[0] || '',
    source: '클리앙',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
    thumbnail: null,
  }));
}

// 쿨앤조이
async function fetchCoolenjoy(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://coolenjoy.net/bbs/rss.php?bo_table=jirum');
  return items.slice(0, 30).map((item, i) => ({
    id: `coolenjoy_${i}`,
    title: item.title?.[0] || '',
    url: item.link?.[0] || '',
    source: '쿨앤조이',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
    thumbnail: null,
  }));
}

// 에펨코리아
async function fetchFmkorea(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://www.fmkorea.com/index.php?mid=hotdeal&act=rss');
  return items.slice(0, 30).map((item, i) => ({
    id: `fmkorea_${i}`,
    title: item.title?.[0] || '',
    url: item.link?.[0] || '',
    source: '에펨코리아',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
    thumbnail: null,
  }));
}

// 제목에서 가격 추출
function extractPrice(title: string): number | null {
  const match = title.match(/[\d,]+원/);
  if (match) {
    const priceStr = match[0].replace(/원/g, '').replace(/,/g, '');
    const price = parseInt(priceStr, 10);
    return isNaN(price) ? null : price;
  }
  return null;
}

// 전체 핫딜 가져오기
export async function fetchAllHotDeals(): Promise<HotDeal[]> {
  const results = await Promise.allSettled([
    fetchPpomppu(),
    fetchClien(),
    fetchCoolenjoy(),
    fetchFmkorea(),
  ]);

  const allDeals: HotDeal[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allDeals.push(...result.value);
    }
  });

  // 날짜순 정렬
  allDeals.sort((a, b) => {
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
      return 0;
    }
  });

  return allDeals;
}
