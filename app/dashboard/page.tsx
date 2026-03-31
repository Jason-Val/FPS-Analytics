import StatCard from '@/components/cards/StatCard'
import MetricsChart from '@/components/charts/MetricsChart'
import { DollarSign, MousePointerClick, Globe, PhoneCall } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Fetch live data
  const { data: salesData } = await supabase.from('sales').select('*')
  const { data: marketingData } = await supabase.from('marketing_metrics').select('*')

  const sales = salesData || []
  const metrics = marketingData || []

  // 2. Aggregate Data
  const grossSales = sales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const ppcClicks = metrics.reduce((sum, row) => sum + (Number(row.google_ppc_clicks) || 0), 0)
  const organicVisits = metrics.reduce((sum, row) => sum + (Number(row.organic_visits) || 0), 0)
  const incomingCalls = metrics.reduce((sum, row) => sum + (Number(row.incoming_calls) || 0), 0)

  // 3. Format Date Series for MetricsChart (Gross Sales Trend over Time)
  // Grouping sales amount by Date
  const chartDataMap: Record<string, number> = {}
  
  sales.forEach(row => {
    if (!row.date) return
    // Simple naive date formatting handling ISO YYYY-MM-DD
    const dateStr = new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    if (!chartDataMap[dateStr]) {
       chartDataMap[dateStr] = 0
    }
    chartDataMap[dateStr] += Number(row.amount) || 0
  })

  let chartDataArray = Object.keys(chartDataMap).map(dateKey => ({
     name: dateKey,
     value: chartDataMap[dateKey]
  }))

  // If we don't have enough data to fill a chart, provide a fallback flat-line empty chart so the UI doesn't look broken
  if (chartDataArray.length === 0) {
     chartDataArray = [
        { name: 'No Data', value: 0 },
        { name: 'Upload Data', value: 0 }
     ]
  }

  // Number formatters for the UI
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US').format(val)

  return (
    <div className="max-w-7xl mx-auto space-y-10">
       <div className="mb-8">
         <h1 className="text-4xl font-display font-medium text-on-surface mb-2">Performance Dashboard</h1>
         <p className="text-on-surface-variant">Synthesizing real-time advertising and sales metrics.</p>
       </div>
       
       {/* Charts and Hero metrics block */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart data={chartDataArray} />
          
          <div className="bg-surface-container rounded-xl p-8 cursor-default flex flex-col justify-between hover:bg-surface-container-high transition-colors">
            <div>
              <span className="bg-tertiary/20 text-tertiary text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">Live Intel</span>
              <h3 className="text-xl font-display font-medium text-on-surface mt-4 mb-3 leading-snug">
                {sales.length > 0 ? `Tracking ${formatNumber(sales.length)} distinct sales transactions.` : 'Awaiting data ingestion...'}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Your visualization is currently mirroring data directly from the unified Supabase metrics pipeline. Upload more `.csv` exports to expand historical trends.
              </p>
            </div>
            
            <button className="text-left text-primary text-xs font-bold tracking-widest uppercase mt-8 hover:text-primary-container transition-colors flex items-center space-x-2">
              <span>View Detailed Report</span>
              <span>&rarr;</span>
            </button>
          </div>
       </div>

       {/* Detailed Stat Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
           title="Gross Sales" 
           value={formatCurrency(grossSales)} 
           trendAmount="-- " 
           icon={<DollarSign size={20} />} 
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
  )
}
