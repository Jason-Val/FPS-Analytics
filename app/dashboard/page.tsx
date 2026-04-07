import StatCard from '@/components/cards/StatCard'
import MetricsChart from '@/components/charts/MetricsChart'
import LiveIntelChat from '@/components/cards/LiveIntelChat'
import DateRangeFilter from '@/components/filters/DateRangeFilter'
import { DollarSign, MousePointerClick, Globe, PhoneCall, TrendingUp, Activity, CreditCard, Megaphone } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage(props: { searchParams?: Promise<{ from?: string, to?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const from = searchParams.from
  const to = searchParams.to

  const supabase = await createClient()

  // 1. Fetch live data (with pagination to bypass Supabase's default 1,000 row limit)
  async function fetchAll(table: string) {
    let allData: any[] = []
    let page = 0
    const pageSize = 1000
    while (true) {
      let query = supabase.from(table).select('*').range(page * pageSize, (page + 1) * pageSize - 1)
      if (from && to) query = query.gte('date', from).lte('date', to)
      
      const { data } = await query
      if (!data || data.length === 0) break
      
      allData = allData.concat(data)
      if (data.length < pageSize) break
      page++
    }
    return allData
  }

  const sales = await fetchAll('sales')
  const metrics = await fetchAll('marketing_metrics')

  // 2. Fetch Eligible Reps & Constants
  const { data: salesReps } = await supabase.from('sales_reps').select('*')
  const eligibleReps = salesReps ? salesReps.filter(r => r.is_eligible).map(r => r.name) : []
  const totalWeeklySalary = salesReps ? salesReps.reduce((sum, r) => sum + (Number(r.weekly_salary) || 0), 0) : 0
  
  const { data: constants } = await supabase.from('projection_constants').select('commission_pct').eq('id', 1).single()
  const commissionRate = constants ? (constants.commission_pct / 100) : 0.03

  // 3. Aggregate Data
  const grossSales = sales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const costOfGoods = sales.reduce((sum, row) => sum + (Number(row.cost_of_goods) || 0), 0)
  const netSales = sales.reduce((sum, row) => sum + (Number(row.net_sales) || 0), 0)

  // Commission Paid Calculus
  // Calculate numberOfDays and Fridays
  let numberOfDays = 0
  let startDate = new Date()
  let endDate = new Date()

  if (from && to) {
     startDate = new Date(from)
     endDate = new Date(to)
     numberOfDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  } else if (sales.length > 0) {
     startDate = new Date(Math.min(...sales.map(s => new Date(s.date).getTime())))
     endDate = new Date(Math.max(...sales.map(s => new Date(s.date).getTime())))
     numberOfDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }
  
  let numberOfFridays = 0
  let currentDate = new Date(startDate)
  currentDate.setUTCHours(0,0,0,0)
  const endLimit = new Date(endDate)
  endLimit.setUTCHours(23,59,59,999)
  
  while (currentDate <= endLimit) {
    if (currentDate.getUTCDay() === 5) {
      numberOfFridays++
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  const eligibleSales = sales.filter(s => eligibleReps.includes(s.sales_rep))
  const eligibleGrossSales = eligibleSales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const activeEligibleRepsCount = new Set(eligibleSales.map(s => s.sales_rep)).size
  
  const totalDeduction = numberOfDays * 833 * activeEligibleRepsCount
  const commissionPaid = Math.max(0, eligibleGrossSales - totalDeduction) * commissionRate
  
  const totalSalaryCost = totalWeeklySalary * numberOfFridays
  const trueNetProfit = netSales - commissionPaid - totalSalaryCost
  
  const ppcClicks = metrics.reduce((sum, row) => sum + (Number(row.google_ppc_clicks) || 0), 0)
  const organicVisits = metrics.reduce((sum, row) => sum + (Number(row.organic_visits) || 0), 0)
  const incomingCalls = metrics.reduce((sum, row) => sum + (Number(row.incoming_calls) || 0), 0)
  const adSpendTotal = metrics.reduce((sum, row) => sum + (Number(row.ad_spend) || 0), 0)

  // 4. Format Date Series for MetricsChart (All Metrics mapped onto single timescale)
  const chartDataMap: Record<string, any> = {}
  
  const initDate = (dateStr: string) => {
    if (!chartDataMap[dateStr]) {
       chartDataMap[dateStr] = {
         name: dateStr,
         grossSales: 0,
         adSpend: 0,
         ppcClicks: 0,
         organicVisits: 0,
         incomingCalls: 0
       }
    }
  }

  sales.forEach(row => {
    if (!row.date) return
    const dateStr = new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    initDate(dateStr)
    chartDataMap[dateStr].grossSales += Number(row.amount) || 0
  })

  metrics.forEach(row => {
    if (!row.date) return
    const dateStr = new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    initDate(dateStr)
    chartDataMap[dateStr].adSpend += Number(row.ad_spend) || 0
    chartDataMap[dateStr].ppcClicks += Number(row.google_ppc_clicks) || 0
    chartDataMap[dateStr].organicVisits += Number(row.organic_visits) || 0
    chartDataMap[dateStr].incomingCalls += Number(row.incoming_calls) || 0
  })

  // Sort chronological
  const sortedDates = Object.keys(chartDataMap).sort((a, b) => new Date(`${a} 2024`).getTime() - new Date(`${b} 2024`).getTime())
  
  let chartDataArray = sortedDates.map(dateKey => chartDataMap[dateKey])

  if (chartDataArray.length === 0) {
     chartDataArray = [
        { name: 'No Data', grossSales: 0, adSpend: 0, ppcClicks: 0, organicVisits: 0, incomingCalls: 0 },
        { name: 'Upload Data', grossSales: 0, adSpend: 0, ppcClicks: 0, organicVisits: 0, incomingCalls: 0 }
     ]
  }

  // Number formatters for the UI
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val)

  return (
    <div className="max-w-7xl mx-auto space-y-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
         <div>
           <h1 className="text-4xl font-display font-medium text-on-surface mb-2">Performance Dashboard</h1>
           <p className="text-on-surface-variant flex items-center gap-2">
              Synthesizing real-time advertising and sales metrics.
           </p>
         </div>
         <DateRangeFilter />
       </div>
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart data={chartDataArray} />
          
          <div className="bg-surface-container rounded-xl p-8 cursor-default flex flex-col justify-between hover:bg-surface-container-high transition-colors">
            <div>
              <div className="flex justify-between items-start">
                 <span className="bg-tertiary/20 text-tertiary text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">Live Intel</span>
                 {from && to && (
                     <span className="text-xs text-on-surface-variant font-medium bg-surface-container-low px-2 py-1 rounded border border-outline-variant/30">
                        Filtered: {new Date(from).toLocaleDateString()} - {new Date(to).toLocaleDateString()}
                     </span>
                 )}
              </div>
              <h3 className="text-xl font-display font-medium text-on-surface mt-4 mb-3 leading-snug">
                {sales.length > 0 ? `Tracking ${formatNumber(sales.length)} distinct sales transactions.` : 'No transactions exist in this period.'}
              </h3>
            </div>
            
            <div className="mt-4 flex-1">
               <LiveIntelChat />
            </div>
          </div>
       </div>

        <div>
         <h3 className="text-xl font-display font-medium text-on-surface mb-4">Financial Overview</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <StatCard 
             title="Gross Sales" 
             value={formatCurrency(grossSales)} 
             trendAmount="-- " 
             icon={<DollarSign size={20} />} 
           />
           <StatCard 
             title="Cost Of Goods" 
             value={formatCurrency(costOfGoods)} 
             trendAmount="-- " 
             icon={<Activity size={20} />} 
           />
           <StatCard 
             title="Net Sales" 
             value={formatCurrency(netSales)} 
             trendAmount="-- " 
             icon={<TrendingUp size={20} />} 
           />
           <StatCard 
             title="Commission Paid" 
             value={formatCurrency(commissionPaid)} 
             trendAmount="-- " 
             icon={<CreditCard size={20} />} 
           />
           <StatCard 
             title="Salary Cost" 
             value={formatCurrency(totalSalaryCost)} 
             trendAmount="-- " 
             icon={<DollarSign size={20} />} 
           />
           <StatCard 
             title="True Net Profit" 
             value={formatCurrency(trueNetProfit)} 
             trendAmount="-- " 
             icon={<TrendingUp size={20} />} 
           />
         </div>
       </div>

       <div>
         <h3 className="text-xl font-display font-medium text-on-surface mb-4 mt-8">Marketing Performance</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
             title="Ad Spend" 
             value={formatCurrency(adSpendTotal)} 
             trendAmount="-- " 
             icon={<Megaphone size={20} />} 
           />
           <StatCard 
             title="PPC Clicks" 
             value={formatNumber(ppcClicks)} 
             trendAmount="-- " 
             icon={<MousePointerClick size={20} />} 
           />
           <StatCard 
             title="Organic Visits" 
             value={formatNumber(organicVisits)} 
             trendAmount="-- " 
             icon={<Globe size={20} />} 
           />
           <StatCard 
             title="Direct Calls" 
             value={formatNumber(incomingCalls)} 
             trendAmount="-- " 
             icon={<PhoneCall size={20} />} 
           />
         </div>
       </div>
    </div>
  )
}
