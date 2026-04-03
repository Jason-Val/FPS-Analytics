import { createAdminClient, createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Ensure current user is an admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized Access: Admin status missing.' }, { status: 403 })
  }

  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Identity required (email).' }, { status: 400 })
  }

  const adminClient = await createAdminClient()
  
  // Use official Supabase invitation system. 
  // We explicitly add ?next=/auth/update-password to ensure the callback gets the correct destination
  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${new URL(request.url).origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: `Invite successfully dispatched to ${email}` })
}
