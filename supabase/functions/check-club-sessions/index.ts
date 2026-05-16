import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from check-club-sessions!")

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 1. Find expired sessions that are still marked as active
    // We compare end_time with current time
    const now = new Date().toISOString()
    
    const { data: expiredSessions, error: selectError } = await supabaseClient
      .from('club_sessions')
      .select('id, device_id')
      .eq('status', 'active')
      .not('end_time', 'is', null) // Only limited sessions have end_time
      .lt('end_time', now)

    if (selectError) {
      console.error('Error fetching expired sessions:', selectError)
      throw selectError
    }

    if (!expiredSessions || expiredSessions.length === 0) {
      return new Response(JSON.stringify({ message: "No expired sessions to process." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    const sessionIds = expiredSessions.map(s => s.id)
    const deviceIds = [...new Set(expiredSessions.map(s => s.device_id))] // Unique device IDs

    console.log(`Processing ${sessionIds.length} expired sessions for devices: ${deviceIds.join(', ')}`)

    // 2. Update sessions to 'completed'
    const { error: sessionUpdateError } = await supabaseClient
      .from('club_sessions')
      .update({ status: 'completed' })
      .in('id', sessionIds)

    if (sessionUpdateError) {
      console.error('Error updating sessions:', sessionUpdateError)
      throw sessionUpdateError
    }

    // 3. Update associated devices to 'available'
    const { error: deviceUpdateError } = await supabaseClient
      .from('club_devices')
      .update({ status: 'available' })
      .in('id', deviceIds)

    if (deviceUpdateError) {
      console.error('Error updating devices:', deviceUpdateError)
      throw deviceUpdateError
    }

    return new Response(JSON.stringify({ 
      message: "Expired sessions processed successfully.",
      sessions_count: sessionIds.length,
      devices_updated: deviceIds.length
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error('Operation failed:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
