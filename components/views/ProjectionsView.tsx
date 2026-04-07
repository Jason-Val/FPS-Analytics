'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/cards/StatCard'
import MetricsChart from '@/components/charts/MetricsChart'
import AdSpendSimulator from '@/components/cards/AdSpendSimulator'
import { DollarSign, MousePointerClick, Globe, PhoneCall, TrendingUp, Activity, CreditCard, Megaphone } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

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

interface ProjectionConstants {
  cost_per_ppc_click: number
  cost_per_call: number
  cost_per_sale: number
  average_sale_value: number
  paid_ad_sales_pct: number
  cost_of_goods_pct: number
  commission_pct: number
  organic_visits_pct: number
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

function countFridays(startDate: Date, days: number): number {
  let count = 0
  let currentDate = new Date(startDate)
  for (let i = 0; i < days; i++) {
    if (currentDate.getDay() === 5) count++
    currentDate.setDate(currentDate.getDate() + 1)
  }
  return count
}

export default function ProjectionsView({ historicalData }: ProjectionsViewProps) {
  const [dailySpend, setDailySpend] = useState(237.50)
  const [constants, setConstants] = useState<ProjectionConstants | null>(null)
  const [eligibleRepsCount, setEligibleRepsCount] = useState<number>(0)
  const [totalWeeklySalary, setTotalWeeklySalary] = useState<number>(0)
  
  useEffect(() => {
    async function fetchConstants() {
      const supabase = createClient()
      const { data } = await supabase.from('projection_constants').select('*').eq('id', 1).single()
      if (data) {
        setConstants(data)
      } else {
        // Fallback default constants
        setConstants({
          cost_per_ppc_click: 1.37,
          cost_per_call: 17.42,
          cost_per_sale: 76.84,
          average_sale_value: 473.60,
          paid_ad_sales_pct: 12.5,
          cost_of_goods_pct: 30.0,
          commission_pct: 10.0,
          organic_visits_pct: 66.0,
        })
      }
      
      const { data: salesReps } = await supabase.from('sales_reps').select('*')
      const totalEligible = salesReps ? salesReps.filter(r => r.is_eligible).length : 0
      const totalSalary = salesReps ? salesReps.reduce((sum, r) => sum + (Number(r.weekly_salary) || 0), 0) : 0
      
      setEligibleRepsCount(totalEligible)
      setTotalWeeklySalary(totalSalary)
    }
    fetchConstants()
  }, [])

  if (!constants) {
    return <div className="text-center p-12 text-on-surface-variant animate-pulse">Computing projection matrices...</div>
  }

  // Calculate future weekdays (Next 30 days)
  const futureWeekdays = countWeekdays(new Date(), 30)
  const projectedTotalAdSpend = futureWeekdays * dailySpend

  // Calculate Projections based on Constants
  const projectedClicks = projectedTotalAdSpend / constants.cost_per_ppc_click
  const projectedCalls = projectedTotalAdSpend / constants.cost_per_call
  const projectedAdSalesCount = projectedTotalAdSpend / constants.cost_per_sale
  const projectedAdRevenue = projectedAdSalesCount * constants.average_sale_value
  
  // Total Gross uses the Paid Ad percentage
  const projectedGross = projectedAdRevenue / (constants.paid_ad_sales_pct / 100)
  const projectedCost = projectedGross * (constants.cost_of_goods_pct / 100)
  
  const totalDeduction = 30 * 833 * eligibleRepsCount
  const projectedCommission = Math.max(0, projectedGross - totalDeduction) * (constants.commission_pct / 100)
  
  const projectedNet = projectedGross - projectedCost
  
  const futureFridays = countFridays(new Date(), 30)
  const projectedSalaryCost = totalWeeklySalary * futureFridays
  const projectedTrueNet = projectedNet - projectedCommission - projectedSalaryCost

  // Organic visits scaled by a percentage of PPC Clicks
  const projectedOrganic = projectedClicks * (constants.organic_visits_pct / 100)

  // Calculate % change against the *actual* historical last 30 days
  const getPctChange = (projected: number, historical: number) => {
    if (historical === 0) return 0
    return ((projected - historical) / historical) * 100
  }

  const pctChangeGross = getPctChange(projectedGross, historicalData.historicalGross)
  const pctChangeAdSpend = getPctChange(projectedTotalAdSpend, historicalData.historicalAdSpend)
  const pctChangeNet = getPctChange(projectedNet, historicalData.historicalNet)
  const pctChangeCommission = getPctChange(projectedCommission, historicalData.historicalCommission)
  
  // Historical data doesn't track salary dynamically here yet, so we'll compare True Net with basic Net for now
  const pctChangeTrueNet = getPctChange(projectedTrueNet, historicalData.historicalNet)
  
  const pctChangeClicks = getPctChange(projectedClicks, historicalData.historicalClicks)
  const pctChangeCalls = getPctChange(projectedCalls, historicalData.historicalCalls)
  const pctChangeOrganic = getPctChange(projectedOrganic, historicalData.historicalOrganic)

  // Pre-generate pseudo-random deterministic distribution weights for weekdays
  const varianceWeights = []
  let weightSum = 0
  for (let i = 0; i < futureWeekdays; i++) {
    // Math.sin provides a wave-like variation. Combining multiple creates a pseudo-random look
    const val = 1.0 + Math.sin(i * 13.9) * 0.15 + Math.cos(i * 7.1) * 0.1
    varianceWeights.push(val)
    weightSum += val
  }
  // Normalize so the sum is exactly futureWeekdays
  const normalizedWeights = varianceWeights.map(v => (v / weightSum) * futureWeekdays)

  // Generate 30 Day Chart Data (Future)
  const chartDataArray = []
  let chartDate = new Date()
  let weekdayIdx = 0

  for (let i = 1; i <= 30; i++) {
    chartDate.setDate(chartDate.getDate() + 1)
    const dayStr = chartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    const isWeekday = chartDate.getDay() !== 0 && chartDate.getDay() !== 6
    
    let dayAdSpend = 0
    let dayGross = 0
    let dayClicks = 0
    let dayOrganic = 0
    let dayCalls = 0

    if (isWeekday) {
      const weight = normalizedWeights[weekdayIdx]
      // Multiply the average daily expectation by the normalized pseudo-random weight
      dayAdSpend = dailySpend
      dayGross = (projectedGross / futureWeekdays) * weight
      dayClicks = (projectedClicks / futureWeekdays) * weight
      dayOrganic = (projectedOrganic / futureWeekdays) * weight
      dayCalls = (projectedCalls / futureWeekdays) * weight
      
      weekdayIdx++
    }
    
    chartDataArray.push({
      name: dayStr,
      grossSales: dayGross,
      adSpend: dayAdSpend,
      ppcClicks: dayClicks,
      organicVisits: dayOrganic,
      incomingCalls: dayCalls
    })
  }

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val)

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
         <div>
           <h1 className="text-4xl font-display font-medium text-on-surface mb-2">30-Day Projections</h1>
           <p className="text-on-surface-variant flex items-center gap-2">
              Forecasting baseline models mapped to dynamically adjusted daily spend.
           </p>
         </div>
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart data={chartDataArray} />
          
          <div className="h-full">
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
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
             trendType={pctChangeGross > 0 ? 'negative' : pctChangeGross < 0 ? 'positive' : 'neutral'}
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
           <StatCard 
             title="Proj. Salary Cost" 
             value={formatCurrency(projectedSalaryCost)} 
             trendAmount="-- " 
             icon={<DollarSign size={20} />} 
           />
           <StatCard 
             title="Proj. True Net Profit" 
             value={formatCurrency(projectedTrueNet)} 
             trendAmount={pctChangeTrueNet.toFixed(1)} 
             trendType={pctChangeTrueNet > 0 ? 'positive' : pctChangeTrueNet < 0 ? 'negative' : 'neutral'}
             icon={<TrendingUp size={20} />} 
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
