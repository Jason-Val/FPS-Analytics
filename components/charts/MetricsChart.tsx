'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface MetricsChartProps {
  data: {
    name: string
    grossSales: number
    ppcClicks: number
    organicVisits: number
    incomingCalls: number
  }[]
}

const METRICS_CONFIG = [
  { key: 'grossSales', label: 'Gross Sales', color: '#89acff', yAxisId: 'left' },
  { key: 'ppcClicks', label: 'PPC Clicks', color: '#f28b82', yAxisId: 'right' },
  { key: 'organicVisits', label: 'Organic Visits', color: '#a7ff83', yAxisId: 'right' },
  { key: 'incomingCalls', label: 'Direct Calls', color: '#e489ff', yAxisId: 'right' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2056] border border-[#2b306b] rounded-lg p-4 shadow-2xl min-w-[150px]">
        <p className="text-[#a4a8d5] border-b border-[#2b306b] pb-2 mb-3 text-xs font-bold uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => {
            const isCurrency = entry.dataKey === 'grossSales'
            const formattedValue = isCurrency 
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)
              : new Intl.NumberFormat('en-US').format(entry.value)
            
            const config = METRICS_CONFIG.find(c => c.key === entry.dataKey)

            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }}></div>
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

export default function MetricsChart({ data }: MetricsChartProps) {
  const [visibleMetrics, setVisibleMetrics] = useState<Record<string, boolean>>({
    grossSales: true,
    ppcClicks: false,
    organicVisits: false,
    incomingCalls: false
  })

  const toggleMetric = (key: string) => {
    setVisibleMetrics(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Ensure Right Y Axis only renders scaling if at least one right-axis metric is visible
  const showRightAxis = visibleMetrics.ppcClicks || visibleMetrics.organicVisits || visibleMetrics.incomingCalls

  return (
    <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden group hover:bg-surface-container-high transition-colors col-span-1 lg:col-span-2">
       <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
         <div>
           <h2 className="text-2xl font-display font-medium text-on-surface">Conversion Convergence</h2>
           <p className="text-on-surface-variant text-sm mt-2 max-w-none md:max-w-sm">Aggregated comparison of financial volume against specific marketing channels.</p>
         </div>
         
         {/* Interactive Legend Key */}
         <div className="flex flex-wrap gap-2">
            {METRICS_CONFIG.map(metric => {
               const isActive = visibleMetrics[metric.key]
               return (
                 <button 
                   key={metric.key}
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

       <div className="h-80 mt-12 cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {METRICS_CONFIG.map(metric => (
                  <linearGradient key={metric.key} id={`color_${metric.key}`} x1="0" y1="0" x2="0" y2="1">
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
                tick={{ fill: '#41456c', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}
                dy={10}
              />
              
              <YAxis 
                yAxisId="left" 
                orientation="left" 
                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                tick={{ fill: '#41456c', fontSize: 10, fontWeight: 600 }}
                axisLine={false} 
                tickLine={false} 
              />
              
              {showRightAxis && (
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fill: '#41456c', fontSize: 10, fontWeight: 600 }}
                  axisLine={false} 
                  tickLine={false} 
                />
              )}

              <Tooltip 
                 content={<CustomTooltip />} 
                 cursor={{ stroke: '#41456c', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              
              {METRICS_CONFIG.map(metric => (
                visibleMetrics[metric.key] && (
                  <Area 
                    key={metric.key}
                    yAxisId={metric.yAxisId}
                    type="monotone" 
                    dataKey={metric.key} 
                    stroke={metric.color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#color_${metric.key})`} 
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
