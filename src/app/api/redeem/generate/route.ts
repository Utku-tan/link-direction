import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, visitor_uuid } = body

    if (!business_id || !visitor_uuid) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('generate_redeem_code', {
      p_business_id: business_id,
      p_visitor_uuid: visitor_uuid,
    })

    if (error) {
      console.error('Generate redeem error:', error)
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }

    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      code: result.code,
      expires_at: result.expires_at,
      message: result.message,
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response

  } catch (err) {
    console.error('Generate redeem API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
