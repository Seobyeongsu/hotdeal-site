import { readFileSync, writeFileSync } from 'node:fs';
const files = [
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/bbs/[id]/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/admin/write/page.tsx',
];
const grayMap = { 300: 'text-gray-700', 400: 'text-gray-500', 500: 'text-gray-600' };
for (const f of files) {
  let s = readFileSync(f, 'utf-8');
  s = s.replace(/bg-\[#0a0a0f\]/g, 'bg-[#f7f8fa]');
  s = s.replace(/bg-\[#12121a\]/g, 'bg-white');
  s = s.replace(/bg-\[#1e1e2e\]/g, 'bg-[#f1f2f5]');
  s = s.replace(/border-\[#1e1e2e\]/g, 'border-[#e3e6eb]');
  s = s.replace(/hover:bg-\[#1e1e2e\]\/50/g, 'hover:bg-[#eef0f4]');
  s = s.replace(/hover:bg-\[#1e1e2e\]/g, 'hover:bg-[#e9ebf0]');
  s = s.replace(/hover:bg-\[#2a2a3e\]/g, 'hover:bg-[#e6e8ee]');
  s = s.replace(/hover:border-gray-600/g, 'hover:border-gray-400');
  s = s.replace(/text-gray-(300|400|500)/g, (m, g) => grayMap[g]);
  s = s.replace(/hover:text-white/g, 'hover:text-gray-900');
  s = s.replace(/text-red-400/g, 'text-red-600');
  s = s.replace(
    '<body className="min-h-full flex flex-col bg-[#0a0a0f] text-white"',
    '<body className="min-h-full flex flex-col bg-[#eef0f4] text-gray-900"'
  );
  writeFileSync(f, s);
  console.log('done', f);
}
