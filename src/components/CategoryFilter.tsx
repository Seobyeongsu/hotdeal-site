'use client';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
            selected === category
              ? 'bg-white text-black'
              : 'bg-[#1e1e2e] text-gray-300 hover:bg-[#2a2a3e]'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
