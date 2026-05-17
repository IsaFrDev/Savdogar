import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, store_id } = await req.json()

    // Log the request (optional)
    console.log(`AI Request for store ${store_id}: ${message}`)

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in Edge Functions')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are Bozorchi AI, a professional web designer and business consultant. Help the merchant build their online store. Provide creative and technical suggestions.' 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    
    // Check if OpenAI returned an error
    if (data.error) {
      throw new Error(`OpenAI Error: ${data.error.message}`)
    }

    return new Response(JSON.stringify({
      ai_reply: data.choices[0].message.content,
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message, success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
