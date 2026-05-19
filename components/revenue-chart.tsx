'use client'

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
  data: { mes: string; valor: number }[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="mes"
          stroke="oklch(0.554 0.0219 264.53)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.554 0.0219 264.53)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          cursor={{ fill: 'oklch(0.156 0.0118 264.53 / 0.5)' }}
          contentStyle={{
            backgroundColor: 'oklch(0.0981 0.0075 264.53)',
            border: '1px solid oklch(0.213 0.0134 264.53)',
            borderRadius: '8px',
            color: 'oklch(0.968 0.003 264.54)',
          }}
          labelStyle={{ color: 'oklch(0.968 0.003 264.54)' }}
          formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
        />
        <Bar
          dataKey="valor"
          fill="oklch(0.623 0.214 259.14)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
