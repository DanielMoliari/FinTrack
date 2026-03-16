import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#131320',
      border: '0.5px solid #1e1e30',
      borderRadius: 8,
      padding: '6px 10px',
      fontSize: 11,
      color: '#e0e0e8'
    }}>
      <p style={{ color: '#888890', marginBottom: 2 }}>{label}</p>
      <p>{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

const BarChart = ({ data, activeColor = '#378add', defaultColor = '#1e1e35', height = 140 }) => {
  if (!data || data.length === 0) return <div style={{ height }} />
  const maxIdx = data.reduce((mi, d, i) => d.value > data[mi].value ? i : mi, 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="30%">
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888890' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === maxIdx ? activeColor : defaultColor} />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart
