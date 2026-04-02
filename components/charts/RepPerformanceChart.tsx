'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface RepPerformanceChartProps {
  data: any[]
  reps: string[]
}

const REP_COLORS = [
  '#89acff', // Blue
  '#ffcc5c', // Yellow
  '#f28b82', // Red
  '#a7ff83', // Green
  '#e489ff', // Purple
  '#7ee1ff', // Cyan
  '#ff9b71'  // Orange
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2056] border border-[#2b306b] rounded-lg p-4 shadow-2xl min-w-[150px]">
        <p className="text-[#a4a8d5] border-b border-[#2b306b] pb-2 mb-3 text-xs font-bold uppercase tracking-wider">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }}></div>
                <span className="text-gray-300 text-xs font-medium">{entry.name}:</span>
              </div>
              <span className="font-bold text-sm tracking-wide" style={{ color: entry.color }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function RepPerformanceChart({ data, reps }: RepPerformanceChartProps) {
  // Initialize visibility: if a rep is selected (only 1 rep data exists in 'reps' would be a special case but here 'reps' is all unique reps found)
  // Actually, we'll just show all by default
  const [visibleReps, setVisibleReps] = useState<Record<string, boolean>>(
    reps.reduce((acc, rep) => ({ ...acc, [rep]: true }), {})
  )

  const toggleRep = (rep: string) => {
    setVisibleReps(prev => ({
      ...prev,
      [rep]: !prev[rep]
    }))
  }

  return (
    <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden group hover:bg-surface-container-high transition-colors col-span-1 lg:col-span-3">
       <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
         <div>
           <h2 className="text-2xl font-display font-medium text-on-surface">Representative Performance</h2>
           <p className="text-on-surface-variant text-sm mt-2 max-w-none md:max-w-sm">Comparing individual gross sales volume across the selected timeframe.</p>
         </div>
         
         {/* Interactive Legend Key */}
         <div className="flex flex-wrap gap-2">
            {reps.map((rep, idx) => {
               const isActive = visibleReps[rep]
               const color = REP_COLORS[idx % REP_COLORS.length]
               return (
                 <button 
                   key={rep}
                   onClick={() => toggleRep(rep)}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isActive 
                        ? 'bg-surface-container-highest border-transparent text-on-surface shadow-sm' 
                        : 'bg-transparent border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant'
                   }`}
                 >
                   <div 
                     className={`w-2 h-2 rounded-full ${isActive ? 'scale-100' : 'scale-75 opacity-50'}`} 
                     style={{ backgroundColor: color, boxShadow: isActive ? `0 0 8px ${color}` : 'none' }}
                   />
                   {rep}
                 </button>
               )
            })}
         </div>
       </div>

       <div className="h-80 mt-12 cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {reps.map((rep, idx) => {
                  const color = REP_COLORS[idx % REP_COLORS.length]
                  return (
                    <linearGradient key={rep} id={`color_${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  )
                })}
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
                orientation="left" 
                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                tick={{ fill: '#41456c', fontSize: 10, fontWeight: 600 }}
                axisLine={false} 
                tickLine={false} 
              />
              
              <Tooltip 
                 content={<CustomTooltip />} 
                 cursor={{ stroke: '#41456c', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              
              {reps.map((rep, idx) => {
                const color = REP_COLORS[idx % REP_COLORS.length]
                return visibleReps[rep] && (
                  <Area 
                    key={rep}
                    type="monotone" 
                    dataKey={rep} 
                    name={rep}
                    stroke={color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#color_${idx})`} 
                    activeDot={{ r: 6, fill: color, stroke: '#1a2056', strokeWidth: 3 }}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
       </div>
    </div>
  )
}
