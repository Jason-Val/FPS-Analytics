'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Shield, Mail, Calendar, UserCheck } from 'lucide-react'

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

  useEffect(() => {
    fetchUsers()
  }, [])

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
      </div>
    </div>
  )
}
