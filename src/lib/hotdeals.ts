import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
});

export interface HotDeal {
  id: string;
  title: string;
  url: string;
  source: string;
  price: number | null;
  date: string;
  thumbnail: string | null;
}

// 뽐뿌 핫딜 RSS
async function fetchPpomppu(): Promise<HotDeal[]> {
  try {
    const feed = await parser.parseURL('https://www.ppomppu.co.kr/rss/rss_board.php?id=ppomppu');
    return feed.items.slice(0, 20).map((item, index) => ({
      id: `ppomppu_${index}`,
      title: item.title || '',
      url: item.link || '',
      source: '뽐뿌',
      price: extractPrice(item.title || ''),
      date: item.pubDate || new Date().toISOString(),
      thumbnail: null,
    }));
  } catch (error) {
    console.error('뽐뿌 RSS 에러:', error);
    return [];
  }
}

// 클리앙 핫딜 RSS
async function fetchClien(): Promise<HotDeal[]> {
  try {
    const feed = await parser.parseURL('https://www.clien.net/service/board/jirum/rss');
    return feed.items.slice(0, 20).map((item, index) => ({
      id: `clien_${index}`,
      title: item.title || '',
      url: item.link || '',
      source: '클리앙',
      price: extractPrice(item.title || ''),
      date: item.pubDate || new Date().toISOString(),
      thumbnail: null,
    }));
  } catch (error) {
    console.error('클리앙 RSS 에러:', error);
    return [];
  }
}

// 쿨앤조이 핫딜 RSS
async function fetchCoolenjoy(): Promise<HotDeal[]> {
  try {
    const feed = await parser.parseURL('https://coolenjoy.net/bbs/rss.php?bo_table=jirum');
    return feed.items.slice(0, 20).map((item, index) => ({
      id: `coolenjoy_${index}`,
      title: item.title || '',
      url: item.link || '',
      source: '쿨앤조이',
      price: extractPrice(item.title || ''),
      date: item.pubDate || new Date().toISOString(),
      thumbnail: null,
    }));
  } catch (error) {
    console.error('쿨앤조이 RSS 에러:', error);
    return [];
  }
}

// 에펨코리아 핫딜 RSS
async function fetchFmkorea(): Promise<HotDeal[]> {
  try {
    const feed = await parser.parseURL('https://www.fmkorea.com/index.php?mid=hotdeal&act=rss');
    return feed.items.slice(0, 20).map((item, index) => ({
      id: `fmkorea_${index}`,
      title: item.title || '',
      url: item.link || '',
      source: '에펨코리아',
      price: extractPrice(item.title || ''),
      date: item.pubDate || new Date().toISOString(),
      thumbnail: null,
    }));
  } catch (error) {
    console.error('에펨코리아 RSS 에러:', error);
    return [];
  }
}

// 제목에서 가격 추출
function extractPrice(title: string): number | null {
  // 123,456원 또는 123456원 패턴
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
  const [ppomppu, clien, coolenjoy, fmkorea] = await Promise.allSettled([
    fetchPpomppu(),
    fetchClien(),
    fetchCoolenjoy(),
    fetchFmkorea(),
  ]);

  const allDeals: HotDeal[] = [];

  if (ppomppu.status === 'fulfilled') allDeals.push(...ppomppu.value);
  if (clien.status === 'fulfilled') allDeals.push(...clien.value);
  if (coolenjoy.status === 'fulfilled') allDeals.push(...coolenjoy.value);
  if (fmkorea.status === 'fulfilled') allDeals.push(...fmkorea.value);

  // 날짜순 정렬
  allDeals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return allDeals;
}
