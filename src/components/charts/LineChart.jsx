import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts'
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
      <p style={{ color: '#888890', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  )
}

// Dual line: income (green) vs expenses (coral)
export const DualLineChart = ({ data, height = 160 }) => {
  if (!data || data.length === 0) return <div style={{ height }} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888890' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 10, color: '#888890', paddingTop: 8 }}
          formatter={(v) => <span style={{ color: '#888890' }}>{v}</span>}
        />
        <Line type="monotone" dataKey="receita" name="Receita" stroke="#1d9e75" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="gasto"   name="Gastos"  stroke="#d85a30" strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
      </ReLineChart>
    </ResponsiveContainer>
  )
}

// Single line with fill (for patrimony)
const LineChart = ({ data, color = '#1d9e75', height = 140 }) => {
  if (!data || data.length === 0) return <div style={{ height }} />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888890' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill="url(#lineGrad)" dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default LineChart
