import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  trendAmount?: string
  trendType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
}

export default function StatCard({ title, value, trendAmount, trendType, icon }: StatCardProps) {
  const isPositive = trendType === 'positive'
  const isNegative = trendType === 'negative'
  
  return (
    <div className="bg-surface-container rounded-xl p-6 transition-all duration-300 hover:bg-surface-container-high group cursor-default">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary ghost-border group-hover:bg-primary/10 transition-colors">
           {icon}
        </div>
        
        {trendAmount && (
          <div className="text-right">
             <p className={`font-bold text-sm ${isPositive ? 'text-tertiary' : isNegative ? 'text-error' : 'text-on-surface-variant'}`}>
               {isPositive ? '+' : ''}{trendAmount}%
             </p>
             <p className="text-[10px] uppercase text-on-surface-variant tracking-wider mt-1">VS PREV</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs uppercase text-on-surface-variant font-bold tracking-wider mb-2">{title}</h3>
        <p className="text-3xl font-display font-medium text-on-surface">{value}</p>
      </div>

      <div className="mt-8 flex items-end justify-between space-x-1 h-8 opacity-70 group-hover:opacity-100 transition-opacity">
         {/* Decorative mini bar chart mapping tonal background levels */}
         {[40, 60, 45, 80, 50, 90, 100].map((height, i) => (
           <div 
              key={i} 
              className={`w-full rounded-t-sm ${i === 6 ? (isPositive ? 'bg-tertiary' : isNegative ? 'bg-error' : 'bg-primary') : 'bg-surface-container-low'}`} 
              style={{ height: `${height}%` }}
           />
         ))}
      </div>
    </div>
  )
}
