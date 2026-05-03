import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="flex w-full animate-pulse flex-col gap-4">
      {/* Wrapper to maintain aspect-ratio avoiding layout shift */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200 md:aspect-[4/3]" />

      {/* Details wrapper */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="h-5 w-2/3 rounded-md bg-gray-200" />
          <div className="h-5 w-10 shrink-0 rounded-md bg-gray-200" />
        </div>

        <div className="h-4 w-1/2 rounded-md bg-gray-200" />

        <div className="mt-2 flex items-center gap-2">
          <div className="h-4 w-1/4 rounded-md bg-gray-200" />
          <div className="h-4 w-1/4 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;






