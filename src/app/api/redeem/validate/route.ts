import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business_id, code } = body

    if (!business_id || !code) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('validate_redeem_code', {
      p_business_id: business_id,
      p_code: code,
    })

    if (error) {
      console.error('Validate redeem error:', error)
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }

    const result = data[0]

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    const response = NextResponse.json({
      success: true,
      visitor_name: result.visitor_name,
      message: result.message,
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response

  } catch (err) {
    console.error('Validate redeem API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
