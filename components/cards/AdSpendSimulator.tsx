import { DollarSign, Percent, TrendingUp, MousePointerClick, PhoneCall } from 'lucide-react'

interface AdSpendSimulatorProps {
  dailySpend: number
  onDailySpendChange: (val: number) => void
  pctChangeClicks: number
  pctChangeCalls: number
  pctChangeRevenue: number
}

export default function AdSpendSimulator({
  dailySpend,
  onDailySpendChange,
  pctChangeClicks,
  pctChangeCalls,
  pctChangeRevenue
}: AdSpendSimulatorProps) {
  
  const formatPct = (val: number) => {
    const sign = val > 0 ? '+' : ''
    return `${sign}${val.toFixed(1)}%`
  }

  const getTrendColor = (val: number) => {
    if (val > 0) return 'text-tertiary'
    if (val < 0) return 'text-error'
    return 'text-on-surface-variant'
  }

  return (
    <div className="bg-surface-container rounded-xl p-8 cursor-default flex flex-col justify-between hover:bg-surface-container-high transition-colors h-full">
      <div>
        <div className="flex justify-between items-start">
           <span className="bg-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">Forecaster</span>
        </div>
        <h3 className="text-xl font-display font-medium text-on-surface mt-4 mb-2 leading-snug">
          Growth Simulator
        </h3>
        <p className="text-sm text-on-surface-variant">Adjust your daily weekday ad spend to see how it multiplies across projected channels.</p>
      </div>
      
      <div className="mt-8 flex-1 flex flex-col justify-center">
        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Fixed Daily Budget (Mon-Fri)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <DollarSign size={20} className="text-primary" />
          </div>
          <input
            type="number"
            min="0"
            step="10"
            value={dailySpend}
            onChange={(e) => onDailySpendChange(Number(e.target.value))}
            className="w-full bg-surface-container-low text-3xl font-display font-bold text-primary rounded-lg pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ghost-border"
          />
        </div>
      </div>

      <div className="mt-8 border-t border-outline-variant/10 pt-6">
        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Expected Impact (30 Day)</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
               <TrendingUp size={16} className="text-on-surface-variant" />
               <span className="text-sm font-medium">Gross Revenue</span>
            </div>
            <span className={`font-bold ${getTrendColor(pctChangeRevenue)}`}>{formatPct(pctChangeRevenue)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
               <MousePointerClick size={16} className="text-on-surface-variant" />
               <span className="text-sm font-medium">PPC Clicks</span>
            </div>
            <span className={`font-bold ${getTrendColor(pctChangeClicks)}`}>{formatPct(pctChangeClicks)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
               <PhoneCall size={16} className="text-on-surface-variant" />
               <span className="text-sm font-medium">Direct Calls</span>
            </div>
            <span className={`font-bold ${getTrendColor(pctChangeCalls)}`}>{formatPct(pctChangeCalls)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
