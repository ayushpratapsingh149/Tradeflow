const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-[#1a1d27] border border-[#1e2130] flex items-center justify-center mb-4 text-2xl">
        {icon}
      </div>
    )}
    <h3 className="text-[#e8eaf0] font-semibold mb-1.5">{title}</h3>
    {description && <p className="text-[#7a7f96] text-sm max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
