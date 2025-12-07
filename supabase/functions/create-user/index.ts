import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a client with the user's token to verify they're an admin
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: requestingUser } } = await supabaseUser.auth.getUser()
    if (!requestingUser) {
      throw new Error('Unauthorized')
    }

    // Check if requesting user is an admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)

    const isAdmin = roles?.some(r => 
      ['super_admin', 'moderator', 'tenant_admin'].includes(r.role)
    )

    if (!isAdmin) {
      throw new Error('Only admins can create users')
    }

    // Parse request body
    const { email, password, userData, roles: userRoles } = await req.json()

    console.log('Creating user with email:', email)

    // Validate required fields
    if (!email || !password || !userData?.client_id || !userRoles?.length) {
      throw new Error('Missing required fields: email, password, client_id, or roles')
    }

    // Create user using admin API (doesn't log them in)
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
      },
    })

    if (userError) {
      console.error('Error creating auth user:', userError)
      throw userError
    }

    console.log('Auth user created:', newUser.user.id)

    // Create profile using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        client_id: userData.client_id,
        branch_id: userData.branch_id || null,
        full_name: userData.full_name,
        email: email,
        phone: userData.phone || null,
        is_active: userData.is_active ?? true,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw profileError
    }

    console.log('Profile created for user:', newUser.user.id)

    // Create roles using admin client (bypasses RLS)
    const roleInserts = userRoles.map((role: string) => ({
      user_id: newUser.user.id,
      role,
    }))

    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .insert(roleInserts)

    if (rolesError) {
      console.error('Error creating roles:', rolesError)
      // Cleanup: delete profile and auth user
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUser.user.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw rolesError
    }

    console.log('Roles assigned:', userRoles)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUser.user.id, 
          email: newUser.user.email 
        } 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
