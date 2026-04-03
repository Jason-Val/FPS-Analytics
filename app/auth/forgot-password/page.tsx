'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset link sent to your email.')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container p-8 rounded-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-gradient"></div>
        <h1 className="text-3xl mb-2 text-primary font-display font-medium">Reset Password</h1>
        <p className="text-on-surface-variant mb-8 text-sm">Enter the email associated with your account.</p>

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface rounded-md px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transistion-all ghost-border"
              placeholder="analyst@fps.com"
              required
            />
          </div>

          {error && <div className="text-error text-sm p-3 bg-error/10 rounded-md border border-error/20">{error}</div>}
          {message && <div className="text-primary text-sm p-3 bg-primary/10 rounded-md border border-primary/20">{message}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full primary-btn mt-4 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
          <Link href="/" className="text-sm text-primary hover:underline transition-all">Back to Login</Link>
        </div>
      </div>
    </div>
  )
}
