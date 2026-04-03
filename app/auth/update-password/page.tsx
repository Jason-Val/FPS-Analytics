'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSessionActive, setIsSessionActive] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if there is an active session (set by the callback route)
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsSessionActive(false)
        router.push('/') // Redirect if no session found
      } else {
        setIsSessionActive(true)
      }
    }
    checkSession()
  }, [supabase, router])

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setError(error.message)
    } else {
      // Successfully updated, redirect to dashboard
      router.push('/dashboard')
    }
    setIsLoading(false)
  }

  if (isSessionActive === null) return <div className="min-h-screen flex items-center justify-center p-4">Loading session...</div>

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-gradient"></div>
        <h1 className="text-3xl mb-2 text-primary font-display font-medium">New Password</h1>
        <p className="text-on-surface-variant mb-8 text-sm">Enter a secure new passcode for your identity.</p>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">New Passcode</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transistion-all ghost-border"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="text-error text-sm p-3 bg-error/10 rounded-md border border-error/20">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full primary-btn mt-4 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Passcode"}
          </button>
        </form>
      </div>
    </div>
  )
}
