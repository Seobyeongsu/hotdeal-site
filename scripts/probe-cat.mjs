(async () => {
  const posts = await (await fetch('https://hotdeal-site.sxc4566.workers.dev/api/posts')).json();
  const dist = {};
  let nullCat = 0;
  for (const p of posts) {
    const c = p.categoryName;
    if (!c) nullCat++;
    else dist[c] = (dist[c] || 0) + 1;
  }
  console.log('전체', posts.length, '| categoryName 없음', nullCat);
  console.log('분포:', Object.entries(dist).map(([k, v]) => `${k}:${v}`).join(', ') || '(없음)');
  console.log('sample keys:', Object.keys(posts[0] || {}).join(','));
})();
