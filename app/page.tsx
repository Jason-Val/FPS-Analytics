'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    // Attempt standard login first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      setError("Identity verification failed. Please check your passcode or contact admin.")
      setIsLoading(false)
      return
    } 
    
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-gradient"></div>
        
        <h1 className="text-3xl mb-2 text-primary font-display font-medium">Luminous Analyst</h1>
        <p className="text-on-surface-variant mb-8 text-sm">Enter your credentials to access the precision dashboard.</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Email Identity</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transistion-all ghost-border"
              placeholder="analyst@fps.com"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-on-surface-variant">Secure Passcode</label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs text-primary hover:underline transition-all"
              >
                Forgot Passcode?
              </Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transistion-all ghost-border"
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && <div className="text-error text-sm p-3 bg-error/10 rounded-md border border-error/20 font-medium">{error}</div>}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full primary-btn mt-4 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Authenticate Session"}
          </button>
        </form>
      </div>
    </div>
  )
}
