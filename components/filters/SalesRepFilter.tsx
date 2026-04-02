'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { User } from 'lucide-react'

interface SalesRepFilterProps {
  reps: string[]
}

export default function SalesRepFilter({ reps }: SalesRepFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const currentRep = searchParams.get('rep') || 'all'

  const handleRepChange = (rep: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (rep === 'all') {
      params.delete('rep')
    } else {
      params.set('rep', rep)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 bg-surface-container-low rounded-lg p-1 ghost-border w-max overflow-x-auto">
      <div className="px-3 py-1.5 text-on-surface-variant flex items-center gap-2 border-r border-outline-variant/20 mr-1">
        <User size={14} className="text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-wider">Representative</span>
      </div>
      
      <button 
        onClick={() => handleRepChange('all')} 
        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
          currentRep === 'all' 
            ? 'text-primary bg-surface-container shadow-sm' 
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        All Reps
      </button>

      {reps.map(rep => (
        <button 
          key={rep}
          onClick={() => handleRepChange(rep)} 
          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${
            currentRep === rep 
              ? 'text-primary bg-surface-container shadow-sm' 
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {rep}
        </button>
      ))}
    </div>
  )
}
