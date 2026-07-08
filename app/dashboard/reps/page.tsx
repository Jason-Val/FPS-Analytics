import StatCard from '@/components/cards/StatCard'
import RepPerformanceChart from '@/components/charts/RepPerformanceChart'
import DateRangeFilter from '@/components/filters/DateRangeFilter'
import SalesRepFilter from '@/components/filters/SalesRepFilter'
import { Users, DollarSign, TrendingUp, CreditCard, ShoppingBag } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function SalesRepsPage(props: { searchParams?: Promise<{ from?: string, to?: string, rep?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const from = searchParams.from
  const to = searchParams.to
  const selectedRep = searchParams.rep

  const supabase = await createClient()

  // 1. Fetch all data (needed for both unique rep list and metrics)
  async function fetchAll(table: string) {
    let allData: any[] = []
    let page = 0
    const pageSize = 1000
    while (true) {
      let query = supabase.from(table).select('*').range(page * pageSize, (page + 1) * pageSize - 1)
      
      const { data } = await query
      if (!data || data.length === 0) break
      
      allData = allData.concat(data)
      if (data.length < pageSize) break
      page++
    }
    return allData
  }

  const allSales = await fetchAll('sales')
  const allMetrics = await fetchAll('marketing_metrics')

  // 1.5 Fetch Eligible Reps & Constants
  const { data: salesReps } = await supabase.from('sales_reps').select('*')
  const eligibleReps = salesReps ? salesReps.filter(r => r.is_eligible).map(r => r.name) : []
  const repsMap = new Map(salesReps?.map(r => [r.name, r]))
  
  const { data: constants } = await supabase.from('projection_constants').select('commission_pct').eq('id', 1).single()
  const commissionRate = constants ? (constants.commission_pct / 100) : 0.03

  // 2. Extract Unique Reps
  const uniqueReps = Array.from(new Set(allSales.map(s => s.sales_rep).filter(Boolean))) as string[]
  uniqueReps.sort()

  // 3. Filter Sales Data for Cards and Chart
  let filteredSales = allSales
  let filteredMetrics = allMetrics

  // Time filter
  if (from && to) {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    filteredSales = filteredSales.filter(s => {
       const d = new Date(s.date)
       return d >= fromDate && d <= toDate
    })
    filteredMetrics = filteredMetrics.filter(m => {
       const d = new Date(m.date)
       return d >= fromDate && d <= toDate
    })
  }

  // Rep filter (for Cards)
  const cardSales = selectedRep && selectedRep !== 'all' 
    ? filteredSales.filter(s => s.sales_rep === selectedRep)
    : filteredSales

  // 4. Aggregate Metrics for Cards
  const totalSalesCount = cardSales.length
  const grossSales = cardSales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const netSales = cardSales.reduce((sum, row) => sum + (Number(row.net_sales) || 0), 0)
  
  // Commission & Salary Paid Calculus
  let numberOfDays = 0
  let startDate = new Date()
  let endDate = new Date()

  if (from && to) {
     startDate = new Date(from)
     endDate = new Date(to)
     numberOfDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  } else if (allSales.length > 0) {
     startDate = new Date(Math.min(...allSales.map(s => new Date(s.date).getTime())))
     endDate = new Date(Math.max(...allSales.map(s => new Date(s.date).getTime())))
     numberOfDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  const countFridaysBetween = (s: Date, e: Date) => {
    let count = 0
    let curr = new Date(s)
    curr.setUTCHours(0, 0, 0, 0)
    const limit = new Date(e)
    limit.setUTCHours(23, 59, 59, 999)
    while (curr <= limit) {
      if (curr.getUTCDay() === 5) count++
      curr.setUTCDate(curr.getUTCDate() + 1)
    }
    return count
  }

  const repSalesMap: Record<string, number> = {}
  cardSales.forEach(row => {
    if (!row.sales_rep) return
    if (!repSalesMap[row.sales_rep]) repSalesMap[row.sales_rep] = 0
    repSalesMap[row.sales_rep] += (Number(row.amount) || 0)
  })

  let commissionPaid = 0
  let totalSalaryCost = 0
  
  const repsToAssess = selectedRep && selectedRep !== 'all' ? [selectedRep] : (salesReps ? salesReps.map(r => r.name) : uniqueReps)

  if (selectedRep && selectedRep !== 'all') {
    const repName = selectedRep
    const repData = repsMap.get(repName)
    let effStart = new Date(startDate)
    if (repData && repData.start_date) {
      const repStart = new Date(repData.start_date)
      if (repStart > effStart) effStart = repStart
    }
    
    if (eligibleReps.includes(repName)) {
       const repGross = repSalesMap[repName] || 0
       const activeDays = effStart <= endDate ? Math.max(1, Math.floor((endDate.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0
       const repDeduction = activeDays * 833
       commissionPaid = Math.max(0, repGross - repDeduction) * commissionRate
    }
    
    if (repData && repData.weekly_salary && effStart <= endDate) {
       const fridays = countFridaysBetween(effStart, endDate)
       totalSalaryCost = Number(repData.weekly_salary) * fridays
    }
  } else {
    const eligibleCardSales = cardSales.filter(s => eligibleReps.includes(s.sales_rep))
    const eligibleGrossSales = eligibleCardSales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
    let totalDeduction = 0
    const activeEligibleRepNames = Array.from(new Set(eligibleCardSales.map(s => s.sales_rep)))
    activeEligibleRepNames.forEach(repName => {
      const repData = repsMap.get(repName)
      let effStart = new Date(startDate)
      if (repData && repData.start_date) {
        const repStart = new Date(repData.start_date)
        if (repStart > effStart) effStart = repStart
      }
      if (effStart <= endDate) {
        const activeDays = Math.max(1, Math.floor((endDate.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        totalDeduction += activeDays * 833
      }
    })
    commissionPaid = Math.max(0, eligibleGrossSales - totalDeduction) * commissionRate

    salesReps?.forEach(rep => {
      if (!rep.weekly_salary) return
      let effStart = new Date(startDate)
      if (rep.start_date) {
        const repStart = new Date(rep.start_date)
        if (repStart > effStart) effStart = repStart
      }
      if (effStart <= endDate) {
        const fridays = countFridaysBetween(effStart, endDate)
        totalSalaryCost += Number(rep.weekly_salary) * fridays
      }
    })
  }
  
  const adSpendTotal = filteredMetrics.reduce((sum, row) => sum + (Number(row.ad_spend) || 0), 0)
  const totalFilteredGross = filteredSales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const allocatedAdSpend = (selectedRep && selectedRep !== 'all')
    ? (totalFilteredGross > 0 ? (grossSales / totalFilteredGross) * adSpendTotal : 0)
    : adSpendTotal
  const trueNetProfit = netSales - commissionPaid - totalSalaryCost - allocatedAdSpend

  // 5. Format Data for RepPerformanceChart
  // Even if a rep is selected, we show all reps in the chart comparison (unless the user specifically wants only one)
  // The user said: "rather than options for gross sales, ad spend, PPC clicks, etc we'll replace those with Rep names"
  const chartDataMap: Record<string, any> = {}
  
  filteredSales.forEach(row => {
    if (!row.date || !row.sales_rep) return
    const dateStr = new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    
    if (!chartDataMap[dateStr]) {
       chartDataMap[dateStr] = {
         name: dateStr,
       }
       // Initialize all reps to 0 for this date
       uniqueReps.forEach(r => chartDataMap[dateStr][r] = 0)
    }
    
    chartDataMap[dateStr][row.sales_rep] += Number(row.amount) || 0
  })

  // Sort chronological (Assuming year 2024 for sorting logic as in dashboard)
  const sortedDates = Object.keys(chartDataMap).sort((a, b) => new Date(`${a} 2024`).getTime() - new Date(`${b} 2024`).getTime())
  let chartDataArray = sortedDates.map(dateKey => chartDataMap[dateKey])

  if (chartDataArray.length === 0) {
      chartDataArray = [
         { name: 'No Data' }
      ]
      uniqueReps.forEach(r => chartDataArray[0][r] = 0)
  }

  // Number formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val)

  return (
    <div className="max-w-7xl mx-auto space-y-10">
       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
         <div>
           <h1 className="text-4xl font-display font-medium text-on-surface mb-2">Sales Representatives</h1>
           <p className="text-on-surface-variant flex items-center gap-2">
              Analyzing efficiency and volume by individual representative.
           </p>
         </div>
         <div className="flex flex-col gap-4">
           <DateRangeFilter />
           <SalesRepFilter reps={uniqueReps} />
         </div>
       </div>
       
       <div className="grid grid-cols-1 gap-6">
          <RepPerformanceChart 
            data={chartDataArray} 
            reps={selectedRep && selectedRep !== 'all' ? [selectedRep] : uniqueReps} 
          />
       </div>

        <div>
         <h3 className="text-xl font-display font-medium text-on-surface mb-4">
           {selectedRep && selectedRep !== 'all' ? `${selectedRep}'s Performance` : 'Aggregated Rep Metrics'}
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           <StatCard 
             title="Gross Sales" 
             value={formatCurrency(grossSales)} 
             trendAmount="-- " 
             icon={<DollarSign size={20} />} 
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
    </div>
  )
}
