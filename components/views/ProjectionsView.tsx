'use client'

import { useState } from 'react'
import StatCard from '@/components/cards/StatCard'
import MetricsChart from '@/components/charts/MetricsChart'
import AdSpendSimulator from '@/components/cards/AdSpendSimulator'
import { DollarSign, MousePointerClick, Globe, PhoneCall, TrendingUp, Activity, CreditCard, Megaphone } from 'lucide-react'

interface HistoricalData {
  historicalGross: number
  historicalCost: number
  historicalNet: number
  historicalCommission: number
  historicalAdSpend: number
  historicalClicks: number
  historicalOrganic: number
  historicalCalls: number
}

interface ProjectionsViewProps {
  historicalData: HistoricalData
}

function countWeekdays(startDate: Date, days: number): number {
  let count = 0
  let currentDate = new Date(startDate)
  for (let i = 0; i < days; i++) {
    const day = currentDate.getDay()
    if (day !== 0 && day !== 6) count++
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return count
}

export default function ProjectionsView({ historicalData }: ProjectionsViewProps) {
  const [dailySpend, setDailySpend] = useState(237.50)

  // Calculate future weekdays (Next 30 days)
  const futureWeekdays = countWeekdays(new Date(), 30)
  const projectedTotalAdSpend = futureWeekdays * dailySpend

  // Calculate historical baseline multiplier
  const { 
    historicalAdSpend, historicalGross, historicalCost, historicalNet, 
    historicalCommission, historicalClicks, historicalCalls, historicalOrganic 
  } = historicalData

  const ratio = historicalAdSpend > 0 ? (projectedTotalAdSpend / historicalAdSpend) : 0

  // Projected Totals
  const projectedGross = historicalGross * ratio
  const projectedCost = historicalCost * ratio
  const projectedNet = historicalNet * ratio
  const projectedCommission = historicalCommission * ratio
  const projectedClicks = historicalClicks * ratio
  const projectedCalls = historicalCalls * ratio
  const projectedOrganic = historicalOrganic * ratio // Assuming organic scales with brand awareness from spend

  // Calculate % change against the *actual* historical last 30 days
  const getPctChange = (projected: number, historical: number) => {
    if (historical === 0) return 0
    return ((projected - historical) / historical) * 100
  }

  const pctChangeGross = getPctChange(projectedGross, historicalGross)
  const pctChangeAdSpend = getPctChange(projectedTotalAdSpend, historicalAdSpend)
  const pctChangeNet = getPctChange(projectedNet, historicalNet)
  const pctChangeCommission = getPctChange(projectedCommission, historicalCommission)
  
  const pctChangeClicks = getPctChange(projectedClicks, historicalClicks)
  const pctChangeCalls = getPctChange(projectedCalls, historicalCalls)
  const pctChangeOrganic = getPctChange(projectedOrganic, historicalOrganic)

  // Generate 30 Day Chart Data (Future)
  const chartDataArray = []
  let chartDate = new Date()
  for (let i = 1; i <= 30; i++) {
    chartDate.setDate(chartDate.getDate() + 1)
    const dayStr = chartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    // Ad spend is only on weekdays
    const isWeekday = chartDate.getDay() !== 0 && chartDate.getDay() !== 6
    const dayAdSpend = isWeekday ? dailySpend : 0
    
    // We distribute the performance evenly across the 30 days for smoothing
    chartDataArray.push({
      name: dayStr,
      grossSales: projectedGross / 30,
      adSpend: dayAdSpend,
      ppcClicks: projectedClicks / 30,
      organicVisits: projectedOrganic / 30,
      incomingCalls: projectedCalls / 30
    })
  }

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val)

  return (
    <div className="max-w-7xl mx-auto space-y-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
         <div>
           <h1 className="text-4xl font-display font-medium text-on-surface mb-2">30-Day Projections</h1>
           <p className="text-on-surface-variant flex items-center gap-2">
              Forecasting baseline models mapped to dynamically adjusted daily spend.
           </p>
         </div>
         {/* No Date Range filter - rigid 30 day forward projection */}
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart data={chartDataArray} />
          
          <div className="h-full">
            {/* The AdSpendSimulator replaces the LiveIntelChat card here */}
            <AdSpendSimulator 
              dailySpend={dailySpend}
              onDailySpendChange={setDailySpend}
              pctChangeClicks={pctChangeClicks}
              pctChangeCalls={pctChangeCalls}
              pctChangeRevenue={pctChangeGross}
            />
          </div>
       </div>

       <div>
         <h3 className="text-xl font-display font-medium text-on-surface mb-4">Projected Financial Overview</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Proj. Gross Sales" 
             value={formatCurrency(projectedGross)} 
             trendAmount={pctChangeGross.toFixed(1)} 
             trendType={pctChangeGross > 0 ? 'positive' : pctChangeGross < 0 ? 'negative' : 'neutral'}
             icon={<DollarSign size={20} />} 
           />
           <StatCard 
             title="Proj. Cost Of Goods" 
             value={formatCurrency(projectedCost)} 
             trendAmount={pctChangeGross.toFixed(1)} 
             trendType={pctChangeGross > 0 ? 'negative' : pctChangeGross < 0 ? 'positive' : 'neutral'} // Increasing cost is negative trend visually
             icon={<Activity size={20} />} 
           />
           <StatCard 
             title="Proj. Net Sales" 
             value={formatCurrency(projectedNet)} 
             trendAmount={pctChangeNet.toFixed(1)} 
             trendType={pctChangeNet > 0 ? 'positive' : pctChangeNet < 0 ? 'negative' : 'neutral'}
             icon={<TrendingUp size={20} />} 
           />
           <StatCard 
             title="Proj. Commission" 
             value={formatCurrency(projectedCommission)} 
             trendAmount={pctChangeCommission.toFixed(1)} 
             trendType={pctChangeCommission > 0 ? 'negative' : pctChangeCommission < 0 ? 'positive' : 'neutral'}
             icon={<CreditCard size={20} />} 
           />
         </div>
       </div>

       <div>
         <h3 className="text-xl font-display font-medium text-on-surface mb-4 mt-8">Projected Marketing Performance</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Proj. Ad Spend" 
             value={formatCurrency(projectedTotalAdSpend)} 
             trendAmount={pctChangeAdSpend.toFixed(1)}
             trendType={pctChangeAdSpend > 0 ? 'neutral' : 'neutral'} 
             icon={<Megaphone size={20} />} 
           />
           <StatCard 
             title="Proj. PPC Clicks" 
             value={formatNumber(projectedClicks)} 
             trendAmount={pctChangeClicks.toFixed(1)} 
             trendType={pctChangeClicks > 0 ? 'positive' : pctChangeClicks < 0 ? 'negative' : 'neutral'}
             icon={<MousePointerClick size={20} />} 
           />
           <StatCard 
             title="Proj. Organic Visits" 
             value={formatNumber(projectedOrganic)} 
             trendAmount={pctChangeOrganic.toFixed(1)} 
             trendType={pctChangeOrganic > 0 ? 'positive' : pctChangeOrganic < 0 ? 'negative' : 'neutral'}
             icon={<Globe size={20} />} 
           />
           <StatCard 
             title="Proj. Direct Calls" 
             value={formatNumber(projectedCalls)} 
             trendAmount={pctChangeCalls.toFixed(1)} 
             trendType={pctChangeCalls > 0 ? 'positive' : pctChangeCalls < 0 ? 'negative' : 'neutral'}
             icon={<PhoneCall size={20} />} 
           />
         </div>
       </div>
    </div>
  )
}
