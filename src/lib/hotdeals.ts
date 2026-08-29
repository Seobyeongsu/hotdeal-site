import axios from 'axios';
import { parseString } from 'xml2js';

export interface HotDeal {
  id: string;
  title: string;
  url: string;
  source: string;
  price: number | null;
  date: string;
}

async function fetchRSS(url: string): Promise<any[]> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      responseType: 'text',
      maxRedirects: 5,
    });

    return new Promise((resolve) => {
      parseString(response.data, { explicitArray: true }, (err: any, result: any) => {
        if (err) {
          console.error('XML 파싱 에러:', url, err);
          resolve([]);
          return;
        }

        try {
          if (result?.rss?.channel?.[0]?.item) {
            resolve(result.rss.channel[0].item);
          } else if (result?.feed?.entry) {
            resolve(result.feed.entry);
          } else {
            resolve([]);
          }
        } catch {
          resolve([]);
        }
      });
    });
  } catch (error: any) {
    console.error('RSS 가져오기 실패:', url, error?.message);
    return [];
  }
}

// HTML에서 핫딜 목록 파싱
async function fetchHTML(url: string, selector: string): Promise<any[]> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      responseType: 'text',
    });

    const items: any[] = [];
    const titleRegex = /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
    let match;

    while ((match = titleRegex.exec(response.data)) !== null) {
      if (match[2].length > 10) {
        items.push({ url: match[1], title: match[2].trim() });
      }
      if (items.length >= 20) break;
    }

    return items;
  } catch (error: any) {
    console.error('HTML 가져오기 실패:', url, error?.message);
    return [];
  }
}

// 쿨앤조이 (RSS 정상 작동)
async function fetchCoolenjoy(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://coolenjoy.net/bbs/rss.php?bo_table=jirum');
  return items.slice(0, 30).map((item, i) => ({
    id: `coolenjoy_${i}`,
    title: cleanText(item.title?.[0] || ''),
    url: cleanUrl(item.link?.[0] || ''),
    source: '쿨앤조이',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
  }));
}

// 퀘이사존 (RSS)
async function fetchQuasarzone(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://quasarzone.com/bbs/qb_saleinfo/rss');
  return items.slice(0, 30).map((item, i) => ({
    id: `quasarzone_${i}`,
    title: cleanText(item.title?.[0] || ''),
    url: cleanUrl(item.link?.[0] || ''),
    source: '퀘이사존',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
  }));
}

// 루리웹 (RSS)
async function fetchRuliweb(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://bbs.ruliweb.com/community/board/300143/rss');
  return items.slice(0, 30).map((item, i) => ({
    id: `ruliweb_${i}`,
    title: cleanText(item.title?.[0] || ''),
    url: cleanUrl(item.link?.[0] || ''),
    source: '루리웹',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
  }));
}

// 아카라이브 (RSS)
async function fetchArca(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://arca.live/b/hotdeal/rss');
  return items.slice(0, 30).map((item, i) => ({
    id: `arca_${i}`,
    title: cleanText(item.title?.[0] || ''),
    url: cleanUrl(item.link?.[0] || ''),
    source: '아카라이브',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
  }));
}

// 다나와 특가 (RSS)
async function fetchDanawa(): Promise<HotDeal[]> {
  const items = await fetchRSS('https://www.danawa.com/rss/?Work=record&Serial=819234');
  return items.slice(0, 30).map((item, i) => ({
    id: `danawa_${i}`,
    title: cleanText(item.title?.[0] || ''),
    url: cleanUrl(item.link?.[0] || ''),
    source: '다나와',
    price: extractPrice(item.title?.[0] || ''),
    date: item.pubDate?.[0] || new Date().toISOString(),
  }));
}

// 텍스트 정리
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanUrl(url: string): string {
  return url.replace(/&amp;/g, '&').trim();
}

// 제목에서 가격 추출
function extractPrice(title: string): number | null {
  const cleaned = cleanText(title);
  const match = cleaned.match(/[\d,]+원/);
  if (match) {
    const priceStr = match[0].replace(/원/g, '').replace(/,/g, '');
    const price = parseInt(priceStr, 10);
    if (isNaN(price) || price < 100) return null;
    return price;
  }
  return null;
}

// 전체 핫딜 가져오기
export async function fetchAllHotDeals(): Promise<HotDeal[]> {
  const results = await Promise.allSettled([
    fetchCoolenjoy(),
    fetchQuasarzone(),
    fetchRuliweb(),
    fetchArca(),
    fetchDanawa(),
  ]);

  const allDeals: HotDeal[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log(`소스 ${i}: ${result.value.length}개`);
      allDeals.push(...result.value);
    } else {
      console.error(`소스 ${i} 실패:`, result.reason);
    }
  });

  // 중복 제거
  const seen = new Set<string>();
  const uniqueDeals = allDeals.filter((deal) => {
    const key = deal.title.substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 날짜순 정렬
  uniqueDeals.sort((a, b) => {
    try {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } catch {
      return 0;
    }
  });

  console.log(`총 핫딜: ${uniqueDeals.length}개`);
  return uniqueDeals;
}
