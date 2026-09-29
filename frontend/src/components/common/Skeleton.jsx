const Skeleton = ({ className = '', width, height, rounded = 'rounded-lg' }) => (
  <div
    className={`shimmer ${rounded} ${className}`}
    style={{ width, height: height || '1rem' }}
  />
);

export const SkeletonCard = ({ rows = 3 }) => (
  <div className="card p-5 flex flex-col gap-3">
    <Skeleton height="1.25rem" width="40%" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height="1rem" width={`${60 + (i % 3) * 15}%`} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 5 }) => (
  <div className="card overflow-hidden">
    <div className="p-4 border-b border-[#1e2130]">
      <Skeleton height="1.1rem" width="30%" />
    </div>
    <div className="divide-y divide-[#1e2130]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="0.9rem" width={`${12 + (j * 7) % 20}%`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
