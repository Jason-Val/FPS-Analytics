'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Shield, Mail, Calendar, UserCheck, Settings2, DollarSign } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface UserProfile {
  id: string
  email: string
  role: string
  created_at: string
}

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  const [constants, setConstants] = useState({
    id: 1,
    cost_per_ppc_click: 1.37,
    cost_per_call: 17.42,
    cost_per_sale: 76.84,
    average_sale_value: 473.60,
    paid_ad_sales_pct: 12.5,
    cost_of_goods_pct: 30.0,
    commission_pct: 10.0,
    organic_visits_pct: 66.0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [constantsMessage, setConstantsMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchConstants()
  }, [])

  async function fetchConstants() {
    const supabase = createClient()
    const { data } = await supabase.from('projection_constants').select('*').eq('id', 1).single()
    if (data) setConstants(data)
  }

  async function handleSaveConstants(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setConstantsMessage(null)
    const supabase = createClient()
    const { error } = await supabase.from('projection_constants').upsert(constants)
    if (error) {
      setConstantsMessage({ text: error.message, type: 'error' })
    } else {
      setConstantsMessage({ text: 'Constants saved securely.', type: 'success' })
      setTimeout(() => setConstantsMessage(null), 3000)
    }
    setIsSaving(false)
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setIsFetching(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()

      if (res.ok) {
        setMessage({ text: data.message, type: 'success' })
        setEmail('')
        fetchUsers() // Refresh list
      } else {
        setMessage({ text: data.error, type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Internal Server Error', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-medium text-on-surface">Space Control</h1>
          <p className="text-on-surface-variant mt-1">Manage personnel and dispatch secure access invitations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1 bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-sm h-fit">
          <div className="flex items-center space-x-2 mb-6">
            <UserPlus size={20} className="text-primary" />
            <h2 className="text-lg font-medium text-on-surface">Invite New Analyst</h2>
          </div>
          
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all ghost-border text-sm"
                  placeholder="analyst@fps.com"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-xs font-medium border ${
                message.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-error/10 text-error border-error/20'
              }`}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full primary-btn py-3 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Dispatching...' : 'Dispatch Invitation'}</span>
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="lg:col-span-2 bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <div className="flex items-center space-x-2 mb-6">
            <Shield size={20} className="text-primary" />
            <h2 className="text-lg font-medium text-on-surface">Active Personnel</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="pb-4 pt-2 px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Identity</th>
                  <th className="pb-4 pt-2 px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Clearance</th>
                  <th className="pb-4 pt-2 px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider">Enlisted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {isFetching ? (
                  Array(3).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-2 h-14 bg-surface-container-low/20"></td>
                      <td className="py-4 px-2 h-14 bg-surface-container-low/20"></td>
                      <td className="py-4 px-2 h-14 bg-surface-container-low/20"></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-on-surface-variant text-sm">No personnel records found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
                            <UserCheck size={14} className="text-on-surface-variant" />
                          </div>
                          <span className="text-sm font-medium text-on-surface">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-on-surface-variant/10 text-on-surface-variant border-on-surface-variant/20'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-xs text-on-surface-variant">
                        <div className="flex items-center space-x-1">
                          <Calendar size={12} />
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Projection Constants Builder */}
        <div className="lg:col-span-3 bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden mb-8">
          <div className="flex items-center space-x-2 mb-6">
            <Settings2 size={20} className="text-primary" />
            <h2 className="text-lg font-medium text-on-surface">Projection Constraints Simulator</h2>
          </div>
          
          <form onSubmit={handleSaveConstants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Cost Per PPC Click</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input 
                  type="number" step="0.01"
                  value={constants.cost_per_ppc_click}
                  onChange={(e) => setConstants({ ...constants, cost_per_ppc_click: parseFloat(e.target.value) })}
                  className="w-full bg-surface-container-low text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Cost Per Call</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input 
                  type="number" step="0.01"
                  value={constants.cost_per_call}
                  onChange={(e) => setConstants({ ...constants, cost_per_call: parseFloat(e.target.value) })}
                  className="w-full bg-surface-container-low text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Cost Per Sale</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input 
                  type="number" step="0.01"
                  value={constants.cost_per_sale}
                  onChange={(e) => setConstants({ ...constants, cost_per_sale: parseFloat(e.target.value) })}
                  className="w-full bg-surface-container-low text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Average Sale Value</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                <input 
                  type="number" step="0.01"
                  value={constants.average_sale_value}
                  onChange={(e) => setConstants({ ...constants, average_sale_value: parseFloat(e.target.value) })}
                  className="w-full bg-surface-container-low text-on-surface rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Paid Ad Sales (%)</label>
              <input 
                type="number" step="0.1"
                value={constants.paid_ad_sales_pct}
                onChange={(e) => setConstants({ ...constants, paid_ad_sales_pct: parseFloat(e.target.value) })}
                className="w-full bg-surface-container-low text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Cost Of Goods (%)</label>
              <input 
                type="number" step="0.1"
                value={constants.cost_of_goods_pct}
                onChange={(e) => setConstants({ ...constants, cost_of_goods_pct: parseFloat(e.target.value) })}
                className="w-full bg-surface-container-low text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Commission (%)</label>
              <input 
                type="number" step="0.1"
                value={constants.commission_pct}
                onChange={(e) => setConstants({ ...constants, commission_pct: parseFloat(e.target.value) })}
                className="w-full bg-surface-container-low text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">Organic Visits (%)</label>
              <input 
                type="number" step="0.1"
                value={constants.organic_visits_pct}
                onChange={(e) => setConstants({ ...constants, organic_visits_pct: parseFloat(e.target.value) })}
                className="w-full bg-surface-container-low text-on-surface rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                required
              />
            </div>

            <div className="flex items-end md:col-span-2 lg:col-span-1">
              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full primary-btn py-3 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 h-[46px]"
              >
                <span>{isSaving ? 'Syncing...' : 'Update Constants'}</span>
              </button>
            </div>
            
            {constantsMessage && (
              <div className={`md:col-span-2 lg:col-span-4 p-3 rounded-lg text-xs font-medium border ${
                constantsMessage.type === 'success' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-error/10 text-error border-error/20'
              }`}>
                {constantsMessage.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
