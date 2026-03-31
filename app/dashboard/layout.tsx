'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, TrendingUp, Plus, Settings, LogOut } from 'lucide-react'
import DataUploadModal from '@/components/modals/DataUploadModal'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex bg-background">
      <DataUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-outline-variant/10 flex-col justify-between hidden md:flex">
         <div className="p-6">
           <div className="mb-10">
             <h1 className="text-xl font-display font-bold text-on-surface">Luminous</h1>
             <p className="text-xs font-sans text-on-surface-variant uppercase tracking-wider mt-1">Precision Analyst</p>
           </div>
           
           <nav className="space-y-2">
              <button onClick={() => setIsModalOpen(true)} className="w-full primary-btn mb-6 flex items-center justify-center space-x-2 shadow-lg shadow-primary/10">
                <Plus size={18} />
                <span>Upload Data</span>
              </button>
              
              <Link href="/dashboard" className="flex items-center space-x-3 text-on-surface bg-surface-container/50 px-4 py-3 rounded-lg border-l-2 border-primary">
                 <LayoutDashboard size={18} className="text-primary" />
                 <span className="font-medium text-sm">Dashboard</span>
              </Link>
              
              <Link href="/dashboard/projections" className="flex items-center space-x-3 text-on-surface-variant hover:text-on-surface px-4 py-3 rounded-lg transition-colors">
                 <TrendingUp size={18} />
                 <span className="font-medium text-sm">Projections</span>
              </Link>
           </nav>
         </div>

         <div className="p-6 border-t border-outline-variant/10">
            <div className="flex items-center justify-between group p-2 rounded-lg hover:bg-surface-container-low transition-colors">
               <div className="flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                   AM
                 </div>
                 <div className="flex-1">
                   <p className="text-sm font-medium text-on-surface">Analyst</p>
                 </div>
               </div>
               <button onClick={handleLogout} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-md hover:bg-background" title="Sign Out">
                 <LogOut size={16} />
               </button>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto flex flex-col">
        {/* Top Header Placeholder */}
        <header className="h-20 flex items-center justify-between px-10 shrink-0">
           <div className="flex items-center space-x-2 text-on-surface-variant text-sm font-bold uppercase tracking-widest">
              <span>Luminous Analyst</span>
              <span className="mx-2 opacity-50">•</span>
              <span>Workspace / Overview</span>
           </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-10 pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}
