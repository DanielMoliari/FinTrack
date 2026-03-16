import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const DonutChart = ({ data, height = 180 }) => {
  if (!data || data.length === 0) return <div style={{ height }} />

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <ResponsiveContainer width={height} height={height} style={{ flexShrink: 0 }}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatCurrency(v)}
            contentStyle={{
              background: '#1e1e30',
              border: '0.5px solid #2a2a45',
              borderRadius: 8,
              fontSize: 11,
              color: '#e0e0e8'
            }}
            itemStyle={{ color: '#e0e0e8' }}
            labelStyle={{ color: '#e0e0e8' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 11, color: '#888890', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.name}
            </span>
            <span style={{ fontSize: 11, color: '#e0e0e8', fontWeight: 500 }}>
              {total > 0 ? Math.round(d.value / total * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DonutChart
