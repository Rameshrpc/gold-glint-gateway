import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Roles that tenant_admin can assign
const TENANT_ALLOWED_ROLES = ['branch_manager', 'loan_officer', 'appraiser', 'collection_agent', 'auditor'];

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

    // Check if requesting user is an admin and get their roles
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)

    const isPlatformAdmin = roles?.some(r => 
      ['super_admin', 'moderator'].includes(r.role)
    )
    const isTenantAdmin = roles?.some(r => r.role === 'tenant_admin')
    const isAdmin = isPlatformAdmin || isTenantAdmin

    if (!isAdmin) {
      throw new Error('Only admins can create users')
    }

    // Get requesting user's profile to get their client_id
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('client_id')
      .eq('user_id', requestingUser.id)
      .single()

    if (!adminProfile) {
      throw new Error('Admin profile not found')
    }

    // Parse request body
    const { email, password, userData, roles: userRoles } = await req.json()

    console.log('Creating user with email:', email)

    // Validate required fields
    if (!email || !password || !userData?.client_id || !userRoles?.length) {
      throw new Error('Missing required fields: email, password, client_id, or roles')
    }

    // === TENANT ADMIN RESTRICTIONS ===
    if (isTenantAdmin && !isPlatformAdmin) {
      // 1. Tenant admins can only create users for their own client
      if (userData.client_id !== adminProfile.client_id) {
        throw new Error('You can only create users for your own organization')
      }

      // 2. Tenant admins cannot assign admin or platform roles
      const invalidRoles = userRoles.filter((r: string) => !TENANT_ALLOWED_ROLES.includes(r))
      if (invalidRoles.length > 0) {
        throw new Error(`You cannot assign these roles: ${invalidRoles.join(', ')}. Only branch_manager, loan_officer, appraiser, collection_agent, and auditor roles are allowed.`)
      }
    }

    // 3. Validate branch belongs to the specified client (for all admins)
    if (userData.branch_id) {
      const { data: branch, error: branchError } = await supabaseAdmin
        .from('branches')
        .select('client_id')
        .eq('id', userData.branch_id)
        .single()

      if (branchError || !branch) {
        throw new Error('Invalid branch selected')
      }

      if (branch.client_id !== userData.client_id) {
        throw new Error('Selected branch does not belong to the specified client')
      }
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
