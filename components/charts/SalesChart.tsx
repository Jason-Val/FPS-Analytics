'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface SalesChartProps {
  data: {
    name: string
    rawDate?: string
    grossSales: number
    netSales: number
    incomingCalls: number
    [key: string]: any
  }[]
}

const SALES_CONFIG = [
  { key: 'grossSales', label: 'Gross Sales', color: '#89acff', yAxisId: 'left', isCurrency: true },
  { key: 'netSales', label: 'Net Sales', color: '#34d399', yAxisId: 'left', isCurrency: true },
  { key: 'incomingCalls', label: 'Direct Calls', color: '#e489ff', yAxisId: 'right', isCurrency: false },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2056] border border-[#2b306b] rounded-lg p-4 shadow-2xl min-w-[170px]">
        <p className="text-[#a4a8d5] border-b border-[#2b306b] pb-2 mb-3 text-xs font-bold uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => {
            const config = SALES_CONFIG.find(c => c.key === entry.dataKey)
            const isCurrency = config?.isCurrency
            const formattedValue = isCurrency 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(entry.value)
              : `${new Intl.NumberFormat('en-US').format(entry.value)} calls`

            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }} />
                  <span className="text-gray-300 text-xs font-medium">{config?.label || entry.name}:</span>
                </div>
                <span className="font-bold text-sm tracking-wide" style={{ color: entry.color }}>{formattedValue}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  return null
}

const aggregateSalesData = (
  data: any[],
  granularity: 'day' | 'week' | 'month'
) => {
  if (!data || data.length === 0) return []
  const map: Record<string, any> = {}

  data.forEach((item) => {
    const rawDateStr = item.rawDate || item.date || item.name
    let dateObj = new Date(rawDateStr)
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date(`${rawDateStr} ${new Date().getFullYear()}`)
    }
    if (isNaN(dateObj.getTime())) return

    let key = ''
    let label = ''

    if (granularity === 'day') {
      key = dateObj.toISOString().split('T')[0]
      label = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    } else if (granularity === 'week') {
      const d = new Date(dateObj)
      const day = d.getUTCDay()
      d.setUTCDate(d.getUTCDate() - day)
      key = d.toISOString().split('T')[0]
      label = `Wk ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
    } else if (granularity === 'month') {
      key = dateObj.toISOString().slice(0, 7)
      label = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }

    if (!map[key]) {
      map[key] = {
        key,
        name: label,
        grossSales: 0,
        netSales: 0,
        incomingCalls: 0,
      }
    }

    map[key].grossSales += Number(item.grossSales) || 0
    map[key].netSales += Number(item.netSales) || 0
    map[key].incomingCalls += Number(item.incomingCalls) || 0
  })

  const res = Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => map[k])

  return res.length > 0 ? res : data
}

export default function SalesChart({ data }: SalesChartProps) {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    grossSales: true,
    netSales: true,
    incomingCalls: true,
  })

  const toggleMetric = (key: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const showLeftAxis = visibleMetrics.grossSales || visibleMetrics.netSales
  const showRightAxis = visibleMetrics.incomingCalls
  const chartData = aggregateSalesData(data, granularity)

  return (
    <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden group hover:bg-surface-container-high transition-colors col-span-1 lg:col-span-2 min-w-0">
       <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded">Sales Graph</span>
           </div>
           <h2 className="text-2xl font-display font-medium text-on-surface">Revenue & Sales Trajectory</h2>
           <p className="text-on-surface-variant text-sm mt-1 max-w-none md:max-w-md">Gross sales and net sales velocity plotted with direct inbound customer calls.</p>
         </div>
         
         <div className="flex flex-col items-end gap-3">
           {/* Granularity Toggle Dropdown */}
           <select
             value={granularity}
             onChange={(e) => setGranularity(e.target.value as any)}
             aria-label="Select Sales Graph Time Granularity"
             className="bg-surface-container-low text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer shadow-sm"
           >
             <option value="day">Daily View</option>
             <option value="week">Weekly View</option>
             <option value="month">Monthly View</option>
           </select>

           {/* Interactive Legend Key */}
           <div className="flex flex-wrap gap-2">
             {SALES_CONFIG.map(metric => {
                const isActive = visibleMetrics[metric.key]
                return (
                  <button 
                    key={metric.key}
                    type="button"
                    onClick={() => toggleMetric(metric.key)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                       isActive 
                         ? 'bg-surface-container-highest border-transparent text-on-surface shadow-sm' 
                         : 'bg-transparent border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                    }`}
                  >
                    <div 
                      className={`w-2 h-2 rounded-full ${isActive ? 'scale-100' : 'scale-75 opacity-50'}`} 
                      style={{ backgroundColor: metric.color, boxShadow: isActive ? `0 0 8px ${metric.color}` : 'none' }}
                    />
                    {metric.label}
                  </button>
                )
             })}
           </div>
         </div>
       </div>

       <div className="h-80 w-full mt-10 cursor-crosshair min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                {SALES_CONFIG.map(metric => (
                  <linearGradient key={metric.key} id={`color_sales_${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metric.color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={metric.color} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2b306b" opacity={0.3} />
              
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#8e92bc', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}
                dy={10}
              />
              
              {showLeftAxis && (
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                  tick={{ fill: '#8e92bc', fontSize: 10, fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false} 
                />
              )}
              
              {showRightAxis && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#8e92bc', fontSize: 10, fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false} 
                />
              )}

              <Tooltip 
                 content={<CustomTooltip />} 
                 cursor={{ stroke: '#41456c', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              
              {SALES_CONFIG.map(metric => (
                visibleMetrics[metric.key] && (
                  <Area 
                    key={metric.key}
                    yAxisId={metric.yAxisId}
                    type="monotone" 
                    dataKey={metric.key} 
                    stroke={metric.color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#color_sales_${metric.key})`} 
                    activeDot={{ r: 6, fill: metric.color, stroke: '#1a2056', strokeWidth: 3 }}
                  />
                 )
              ))}
            </AreaChart>
          </ResponsiveContainer>
       </div>
    </div>
  )
}
