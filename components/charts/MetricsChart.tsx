'use client'

import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'MON', value: 4000 },
  { name: 'TUE', value: 3000 },
  { name: 'WED', value: 2000 },
  { name: 'THU', value: 2780 },
  { name: 'FRI', value: 1890 },
  { name: 'SAT', value: 2390 },
  { name: 'SUN', value: 3490 },
]

export default function MetricsChart() {
  return (
    <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden group hover:bg-surface-container-high transition-colors col-span-1 lg:col-span-2">
       <div className="relative z-10 flex justify-between items-start">
         <div>
           <h2 className="text-2xl font-display font-medium text-on-surface">Conversion Convergence</h2>
           <p className="text-on-surface-variant text-sm mt-2 max-w-none md:max-w-sm">Aggregated data across all active channels</p>
         </div>
         <div className="hidden sm:flex bg-surface-container-low rounded-lg p-1 ghost-border">
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface rounded-md transition-colors">Today</button>
            <button className="px-4 py-1.5 text-xs font-bold text-primary bg-surface-container rounded-md transition-colors shadow-sm">Last 7 Days</button>
            <button className="px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:text-on-surface rounded-md transition-colors">Last 30 Days</button>
         </div>
       </div>

       <div className="h-64 mt-12 cursor-crosshair">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#89acff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#89acff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#41456c', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}
                dy={10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a2056', border: 'none', borderRadius: '8px', color: '#e3e3ff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                itemStyle={{ color: '#89acff', fontWeight: 600 }}
                labelStyle={{ color: '#a4a8d5', marginBottom: '4px', fontSize: '12px' }}
                cursor={{ stroke: '#41456c', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#89acff" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                activeDot={{ r: 6, fill: '#89acff', stroke: '#1a2056', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
       </div>
    </div>
  )
}
