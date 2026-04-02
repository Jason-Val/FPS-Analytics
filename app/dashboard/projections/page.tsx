import { createClient } from '@/utils/supabase/server'
import ProjectionsView from '@/components/views/ProjectionsView'

export default async function ProjectionsPage() {
  const supabase = await createClient()

  // Calculate the past 30 days
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)

  // Use YYYY-MM-DD for Supabase querying
  const todayStr = today.toISOString().split('T')[0]
  const fromStr = thirtyDaysAgo.toISOString().split('T')[0]

  // 1. Fetch historical data for the last 30 days
  async function fetchAll(table: string) {
    let allData: any[] = []
    let page = 0
    const pageSize = 1000
    while (true) {
      let query = supabase
        .from(table)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .gte('date', fromStr)
        .lte('date', todayStr)
      
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

  // 2. Aggregate Historical Data
  const historicalGross = sales.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
  const historicalCost = sales.reduce((sum, row) => sum + (Number(row.cost_of_goods) || 0), 0)
  const historicalNet = sales.reduce((sum, row) => sum + (Number(row.net_sales) || 0), 0)
  const historicalCommission = sales.reduce((sum, row) => sum + (Number(row.commission_paid) || 0), 0)
  
  const historicalAdSpend = metrics.reduce((sum, row) => sum + (Number(row.ad_spend) || 0), 0)
  const historicalClicks = metrics.reduce((sum, row) => sum + (Number(row.google_ppc_clicks) || 0), 0)
  const historicalOrganic = metrics.reduce((sum, row) => sum + (Number(row.organic_visits) || 0), 0)
  const historicalCalls = metrics.reduce((sum, row) => sum + (Number(row.incoming_calls) || 0), 0)

  // 3. Assemble Payload 
  const historicalData = {
    historicalGross,
    historicalCost,
    historicalNet,
    historicalCommission,
    historicalAdSpend,
    historicalClicks,
    historicalOrganic,
    historicalCalls
  }

  return <ProjectionsView historicalData={historicalData} />
}
