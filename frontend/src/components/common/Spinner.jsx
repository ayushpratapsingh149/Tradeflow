const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div
      className={`${sizes[size]} rounded-full border-2 border-[#1e2130] border-t-brand-500 animate-spin ${className}`}
    />
  );
};

export const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <span className="text-sm text-[#7a7f96]">Loading…</span>
    </div>
  </div>
);

export default Spinner;
