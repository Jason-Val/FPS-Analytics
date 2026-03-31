'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/utils/supabase/client'
import { X, Upload, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'

interface DataUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

type TableChoice = 'marketing_metrics' | 'sales'

const TABLE_SCHEMAS = {
  marketing_metrics: ['date', 'google_ppc_clicks', 'organic_visits', 'incoming_calls', 'ad_spend'],
  sales: ['date', 'amount', 'sales_rep', 'customer', 'channel']
}

export default function DataUploadModal({ isOpen, onClose }: DataUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  
  const [targetTable, setTargetTable] = useState<TableChoice>('marketing_metrics')
  const [mapping, setMapping] = useState<Record<string, string>>({}) // DB Column -> CSV Header
  
  const [status, setStatus] = useState<'idle' | 'parsing' | 'mapping' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setStatus('parsing')
    
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
           setCsvHeaders(results.meta.fields)
           setCsvData(results.data)
           
           // Auto-map where possible
           const newMapping: Record<string, string> = {}
           const currentSchema = TABLE_SCHEMAS[targetTable]
           
           currentSchema.forEach(dbCol => {
              const exactMatch = results.meta.fields!.find(h => h.toLowerCase() === dbCol.toLowerCase())
              if (exactMatch) newMapping[dbCol] = exactMatch
           })
           
           setMapping(newMapping)
           setStatus('mapping')
        }
      },
      error: (error) => {
        setStatus('error')
        setErrorMessage(error.message)
      }
    })
  }

  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTable = e.target.value as TableChoice
    setTargetTable(newTable)
    setMapping({})
  }

  const executeUpload = async () => {
     setStatus('uploading')
     
     // Transform data based on mapping
     const payload = csvData
       .filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined)) // Filter trailing completely empty rows
       .map(row => {
         const newRow: any = {}
         Object.entries(mapping).forEach(([dbCol, csvHeader]) => {
            let val = row[csvHeader]
            
            // Critical Fix: Nullify any empty strings to prevent postgres strict numeric typing rejection
            if (val === undefined || val === null || String(val).trim() === '') {
               newRow[dbCol] = null
               return
            }
            
            // Basic type casting for numerical values
            if (!isNaN(Number(val)) && dbCol !== 'date' && dbCol !== 'customer' && dbCol !== 'sales_rep' && dbCol !== 'channel') {
              val = Number(val)
            }
            newRow[dbCol] = val
         })
         return newRow
     })

     const { error } = await supabase.from(targetTable).upsert(payload)

     if (error) {
       setStatus('error')
       setErrorMessage(error.message)
     } else {
       setStatus('success')
     }
  }

  const reset = () => {
    setFile(null)
    setCsvHeaders([])
    setCsvData([])
    setMapping({})
    setStatus('idle')
    setErrorMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closeAndReset = () => {
    reset()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface-container rounded-xl w-full max-w-2xl shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-display font-bold text-on-surface flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Ingest Analytics Data
          </h2>
          <button onClick={closeAndReset} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
           {status === 'idle' && (
             <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-2">Target Table</label>
                  <select 
                    value={targetTable}
                    onChange={handleTableChange}
                    className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 border border-outline-variant/20 focus:outline-none focus:border-primary"
                  >
                    <option value="marketing_metrics">Marketing Metrics (Aggregated)</option>
                    <option value="sales">Granular Sales (Transactions)</option>
                  </select>
                </div>

                <div 
                   className="border-2 border-dashed border-outline-variant/40 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-surface-container-high transition-colors text-center"
                   onClick={() => fileInputRef.current?.click()}
                >
                   <FileSpreadsheet size={48} className="text-on-surface-variant mb-4" />
                   <h3 className="text-lg font-medium text-on-surface mb-1">Select CSV File</h3>
                   <p className="text-sm text-on-surface-variant">Upload raw export data to begin mapping.</p>
                   <input 
                     type="file" 
                     className="hidden" 
                     accept=".csv" 
                     ref={fileInputRef}
                     onChange={handleFileUpload}
                   />
                </div>
             </div>
           )}

           {status === 'mapping' && (
             <div className="space-y-6">
               <div className="bg-surface-container-low p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="text-tertiary" />
                    <div>
                      <p className="text-sm font-medium text-on-surface">{file?.name}</p>
                      <p className="text-xs text-on-surface-variant">{csvData.length} records found</p>
                    </div>
                  </div>
                  <button onClick={reset} className="text-xs font-bold uppercase text-on-surface-variant hover:text-on-surface">Change File</button>
               </div>

               <div>
                 <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">Map Columns to {targetTable}</h3>
                 <div className="space-y-3">
                   {TABLE_SCHEMAS[targetTable].map(dbCol => (
                     <div key={dbCol} className="flex items-center gap-4">
                        <div className="w-1/3 text-sm text-on-surface font-medium capitalize bg-surface-container-low px-3 py-2 rounded">
                          {dbCol.replace('_', ' ')}
                        </div>
                        <div className="text-on-surface-variant">&rarr;</div>
                        <select
                          className="w-2/3 bg-surface-container-low text-on-surface rounded px-3 py-2 border border-outline-variant/20 text-sm"
                          value={mapping[dbCol] || ''}
                          onChange={(e) => setMapping({...mapping, [dbCol]: e.target.value})}
                        >
                          <option value="">-- Ignore / Leave Null --</option>
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}

           {status === 'uploading' && (
             <div className="py-12 flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-on-surface font-medium">Injecting {csvData.length} records into database...</p>
             </div>
           )}

           {status === 'success' && (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <CheckCircle2 size={64} className="text-tertiary" />
                <h3 className="text-2xl font-display font-medium text-on-surface">Upload Complete</h3>
                <p className="text-on-surface-variant">Successfully synchronized {csvData.length} records.</p>
             </div>
           )}

           {status === 'error' && (
             <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle size={64} className="text-error" />
                <h3 className="text-2xl font-display font-medium text-on-surface">Ingestion Failed</h3>
                <p className="text-on-surface-variant text-sm max-w-sm">{errorMessage}</p>
                <button onClick={reset} className="mt-4 px-6 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors text-sm font-bold">Try Again</button>
             </div>
           )}
        </div>

        {/* Footer Actions */}
        {status === 'mapping' && (
          <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3">
            <button onClick={closeAndReset} className="px-6 py-2 rounded-full text-on-surface-variant hover:text-on-surface transition-colors text-sm font-bold">Cancel</button>
            <button onClick={executeUpload} className="primary-btn !py-2 !px-8 text-sm">Synchronize Now</button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low flex justify-center">
            <button onClick={closeAndReset} className="primary-btn !py-2 !px-12 text-sm">Return to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}
