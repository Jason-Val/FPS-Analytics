import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  const email = 'jasoncvalenzuela@gmail.com'
  const newPassword = 'your-new-password-here' // The user can change this later

  console.log(`Searching for user with email: ${email}...`)
  
  const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()
  
  if (fetchError) {
    console.error('Error fetching users:', fetchError.message)
    return
  }

  const user = users.find(u => u.email === email)

  if (!user) {
    console.error('User not found in auth.users')
    return
  }

  console.log(`Found user ID: ${user.id}. Updating password and confirming email...`)

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { 
      password: newPassword,
      email_confirm: true 
    }
  )

  if (error) {
    console.error('Error updating user:', error.message)
  } else {
    console.log('Successfully updated password and confirmed email for jasoncvalenzuela@gmail.com!')
  }
}

resetPassword()
