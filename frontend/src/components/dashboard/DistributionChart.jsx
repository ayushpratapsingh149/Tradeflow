import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, getCategoryColor } from '../../utils/format';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#13151f] border border-[#1e2130] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#7a7f96] mb-1">{d.category}</p>
      <p className="text-sm font-medium text-[#e8eaf0] mono">{formatCurrency(d.current_value)}</p>
      <p className="text-xs text-[#7a7f96] mono">{d.pct?.toFixed(1)}% of portfolio</p>
    </div>
  );
};

const DistributionChart = ({ data = [] }) => {
  if (!data.length) return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-[#e8eaf0] mb-4">Asset Distribution</h3>
      <div className="flex items-center justify-center h-48 text-[#4a4f66] text-sm">
        No data available
      </div>
    </div>
  );

  const totalValue = data.reduce((sum, d) => sum + parseFloat(d.current_value || 0), 0);
  const chartData = data.map((d) => ({
    ...d,
    value: parseFloat(d.current_value || 0),
    pct: totalValue > 0 ? (parseFloat(d.current_value || 0) / totalValue) * 100 : 0,
  }));

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-[#e8eaf0] mb-4">Asset Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getCategoryColor(entry.slug)} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 space-y-2">
        {chartData.map((d) => (
          <div key={d.slug} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(d.slug) }} />
              <span className="text-[#7a7f96]">{d.category}</span>
            </div>
            <span className="mono text-[#e8eaf0]">{d.pct?.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistributionChart;
