import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import * as jose from "https://deno.land/x/jose@v4.14.4/index.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Initialize Supabase with service role to bypass RLS for token lookup
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Lookup judge row
    const { data: judge, error: lookupError } = await supabase
      .from('judges')
      .select('id, event_id, name, token_expires_at, round_ids, status, events(status)')
      .eq('invite_token', token)
      .single()

    if (lookupError || !judge) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Check expiration if set
    if (judge.token_expires_at && new Date(judge.token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This token has expired' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }
    
    // Check event status (Draft events cannot be scored)
    if (judge.events.status === 'draft') {
      return new Response(JSON.stringify({ error: 'This event is not yet live' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      })
    }

    // Mint custom JWT for the judge session
    // We use role: 'authenticated' so PostgREST processes it normally.
    // Our RLS policies use jwt_judge_id() which checks auth.jwt()->>'judge_id'
    const secret = new TextEncoder().encode(Deno.env.get('SUPABASE_JWT_SECRET'))
    
    const jwtString = await new jose.SignJWT({
      role: 'authenticated', 
      judge_id: judge.id,
      event_id: judge.event_id,
      round_ids: judge.round_ids,
      name: judge.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('supabase')
      .setExpirationTime('18h')
      .sign(secret)

    return new Response(
      JSON.stringify({ 
        jwt: jwtString, 
        judge_id: judge.id,
        event_id: judge.event_id,
        name: judge.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
