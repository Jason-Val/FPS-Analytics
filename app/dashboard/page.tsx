import StatCard from '@/components/cards/StatCard'
import MetricsChart from '@/components/charts/MetricsChart'
import { DollarSign, MousePointerClick, Globe, PhoneCall } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-10">
       <div className="mb-8">
         <h1 className="text-4xl font-display font-medium text-on-surface mb-2">Performance Dashboard</h1>
         <p className="text-on-surface-variant">Synthesizing real-time advertising and sales metrics.</p>
       </div>
       
       {/* Charts and Hero metrics block */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricsChart />
          
          <div className="bg-surface-container rounded-xl p-8 cursor-default flex flex-col justify-between hover:bg-surface-container-high transition-colors">
            <div>
              <span className="bg-tertiary/20 text-tertiary text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded">Pro Insight</span>
              <h3 className="text-xl font-display font-medium text-on-surface mt-4 mb-3 leading-snug">Weekend surge in organic traffic suggests content viral loop.</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Consider increasing PPC bidding on Saturday morning to capture high-intent users while competition is lower.</p>
            </div>
            
            <button className="text-left text-primary text-xs font-bold tracking-widest uppercase mt-8 hover:text-primary-container transition-colors flex items-center space-x-2">
              <span>View Detailed Report</span>
              <span>→</span>
            </button>
          </div>
       </div>

       {/* Detailed Stat Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
           title="Net Sales" 
           value="$128,430" 
           trendAmount="8.2" 
           trendType="positive" 
           icon={<DollarSign size={20} />} 
         />
         <StatCard 
           title="PPC Clicks" 
           value="42,902" 
           trendAmount="2.1" 
           trendType="negative" 
           icon={<MousePointerClick size={20} />} 
         />
         <StatCard 
           title="Organic Visits" 
           value="18,230" 
           trendAmount="15.7" 
           trendType="positive" 
           icon={<Globe size={20} />} 
         />
         <StatCard 
           title="Direct Calls" 
           value="842" 
           trendAmount="4.3" 
           trendType="positive" 
           icon={<PhoneCall size={20} />} 
         />
       </div>
    </div>
  )
}
