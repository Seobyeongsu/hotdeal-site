const h = await (await fetch('https://hotdeal-site.sxc4566.workers.dev/')).text();
const pre = h.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
console.log('--- pre ---');
console.log(pre ? pre[1].slice(0, 1200) : 'no pre block');
const rg = h.match(/RuntimeError|Error:([^\"]+)/);
console.log('--- err guess ---', rg ? rg[0] : 'none');
