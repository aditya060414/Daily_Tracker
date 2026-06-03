import React from 'react';

interface TagChipProps {
  category: string;
  small?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({ category, small = false }) => {
  const cat = category.toLowerCase();
  
  let colorClasses = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  if (cat === 'work') {
    colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  } else if (cat === 'health') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (cat === 'learning') {
    colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (cat === 'personal') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (cat === 'rest') {
    colorClasses = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold border rounded uppercase select-none tracking-wider ${
        small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'
      } ${colorClasses}`}
    >
      {category}
    </span>
  );
};
export default TagChip;
