'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

export default function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentFrom = searchParams.get('from')
  const currentTo = searchParams.get('to')

  // Determine active preset
  let activePreset = 'all'
  if (currentFrom && currentTo) activePreset = 'custom'
  
  // Calculate specific fixed dates to match preset strings (if URL has them)
  const todayStr = new Date().toISOString().split('T')[0]
  
  const calculatePresetRanges = () => {
    const today = new Date()
    const last7 = new Date()
    last7.setDate(today.getDate() - 7)
    
    const last30 = new Date()
    last30.setDate(today.getDate() - 30)

    return {
      today: { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
      last7: { from: last7.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
      last30: { from: last30.toISOString().split('T')[0], to: today.toISOString().split('T')[0] }
    }
  }

  const { today, last7, last30 } = calculatePresetRanges()
  
  if (currentFrom === today.from && currentTo === today.to) activePreset = 'today'
  else if (currentFrom === last7.from && currentTo === last7.to) activePreset = '7days'
  else if (currentFrom === last30.from && currentTo === last30.to) activePreset = '30days'

  const [isCustomOpen, setIsCustomOpen] = useState(activePreset === 'custom')
  const [customFrom, setCustomFrom] = useState(currentFrom || today.from)
  const [customTo, setCustomTo] = useState(currentTo || today.to)

  const handlePreset = (preset: string) => {
    setIsCustomOpen(false)
    const ranges = calculatePresetRanges()
    
    if (preset === 'all') {
      router.push('/dashboard')
    } else if (preset === 'today') {
      router.push(`/dashboard?from=${ranges.today.from}&to=${ranges.today.to}`)
    } else if (preset === '7days') {
      router.push(`/dashboard?from=${ranges.last7.from}&to=${ranges.last7.to}`)
    } else if (preset === '30days') {
      router.push(`/dashboard?from=${ranges.last30.from}&to=${ranges.last30.to}`)
    }
  }

  const applyCustomFilter = () => {
    if (customFrom && customTo) {
      router.push(`/dashboard?from=${customFrom}&to=${customTo}`)
    }
  }

  const buttonBaseClass = "px-4 py-1.5 text-xs font-bold rounded-md transition-colors"
  const inactiveClass = `${buttonBaseClass} text-on-surface-variant hover:text-on-surface`
  const activeClass = `${buttonBaseClass} text-primary bg-surface-container shadow-sm`

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
       <div className="flex bg-surface-container-low rounded-lg p-1 ghost-border w-max overflow-x-auto">
          <button 
            onClick={() => handlePreset('all')} 
            className={activePreset === 'all' ? activeClass : inactiveClass}
          >
            All Time
          </button>
          <button 
            onClick={() => handlePreset('today')} 
            className={activePreset === 'today' ? activeClass : inactiveClass}
          >
            Today
          </button>
          <button 
            onClick={() => handlePreset('7days')} 
            className={activePreset === '7days' ? activeClass : inactiveClass}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => handlePreset('30days')} 
            className={activePreset === '30days' ? activeClass : inactiveClass}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setIsCustomOpen(!isCustomOpen)} 
            className={`${isCustomOpen || activePreset === 'custom' ? activeClass : inactiveClass} flex items-center gap-2`}
          >
            <Calendar size={14} />
            <span>Custom</span>
          </button>
       </div>

       {isCustomOpen && (
         <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-lg border border-outline-variant/20 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">Start Date</label>
              <input 
                type="date" 
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-background text-sm text-on-surface px-3 py-1.5 rounded ghost-border focus:outline-none focus:border-primary [color-scheme:dark]"
              />
            </div>
            
            <div className="text-on-surface-variant mt-4">&rarr;</div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-on-surface-variant px-1">End Date</label>
              <input 
                type="date" 
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-background text-sm text-on-surface px-3 py-1.5 rounded ghost-border focus:outline-none focus:border-primary [color-scheme:dark]" 
              />
            </div>
            
            <button 
              onClick={applyCustomFilter}
              className="mt-4 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-md text-sm font-bold transition-colors border border-primary/20"
            >
              Apply
            </button>
         </div>
       )}
    </div>
  )
}
