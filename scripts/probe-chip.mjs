const BASE = 'https://hotdeal-site.sxc4566.workers.dev';
(async () => {
  const h = await (await fetch(BASE + '/', { headers: { 'cache-control': 'no-cache' } })).text();
  const chip = h.includes('오늘의 특가');
  const idx = h.indexOf('오늘의 특가');
  console.log('hasTodayChip:', chip);
  if (idx >= 0) console.log('chip context:', JSON.stringify(h.slice(idx - 60, idx + 30)));
  // 칩 행 영역 추출
  const m = h.match(/flex flex-wrap gap-1\.5 mb-2[\s\S]{0,600}/);
  console.log('chipRow:', m ? m[0].replace(/\s+/g, ' ').slice(0, 400) : '없음');
})();
