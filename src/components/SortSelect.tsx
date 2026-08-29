'use client';

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">정렬</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#1e1e2e] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
      >
        <option value="price_asc">저점가격순</option>
        <option value="price_desc">고점가격순</option>
        <option value="discount">할인율순</option>
        <option value="name">이름순</option>
      </select>
    </div>
  );
}
