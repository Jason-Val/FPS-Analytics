'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function SetupAuth() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processAuth = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type') || new URLSearchParams(window.location.search).get('type')
        const next = hashParams.get('next') || new URLSearchParams(window.location.search).get('next')
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        const destination = (type === 'recovery' || type === 'invite' || next === '/auth/update-password') 
          ? '/auth/update-password' 
          : (next ?? '/dashboard')

        // If the URL has explicit tokens, try to establish the session with them directly.
        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          if (setSessionError) {
            console.error('Error explicitly setting session:', setSessionError)
          }
        }

        // Wait a short moment to ensure the browser client logic and cookies have synced
        // This gives the @supabase/ssr client time to set the actual document.cookie
        await new Promise(resolve => setTimeout(resolve, 500))

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (session) {
          // Successfully established session
          router.push(destination)
        } else {
          // No session could be established
          setError('Authentication link is invalid or has expired. Please request a new invite or password reset.')
        }
      } catch (err: any) {
        console.error('Setup Auth Error:', err)
        setError(err.message || 'An error occurred during authentication.')
      }
    }

    processAuth()
  }, [router, supabase.auth])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 transform transition-all">
        {error ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Authentication Failed</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-white rounded-full">
               <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Setting up your session</h2>
              <p className="text-sm text-gray-500">Please wait while we verify your credentials...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
