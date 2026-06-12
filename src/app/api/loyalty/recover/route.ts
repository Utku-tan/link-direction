import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone_number, serial, new_visitor_uuid } = body

    if (!phone_number || !serial || !new_visitor_uuid) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_stamp_device', { p_serial: serial })
    if (resolveError || !resolveData || resolveData.length === 0) {
      return NextResponse.json({ error: 'Cihaz bulunamadı' }, { status: 404 })
    }

    const business_id = resolveData[0].business_id

    const { data: recoverData, error } = await supabase.rpc('recover_by_phone', {
      p_phone: phone_number,
      p_business_id: business_id,
      p_new_visitor_uuid: new_visitor_uuid
    })

    if (error) {
      console.error('Recover phone error:', error)
      return NextResponse.json({ error: 'Kurtarma başarısız' }, { status: 500 })
    }

    const result = recoverData[0]

    return NextResponse.json({
      success: result.success,
      recovered_stars: result.recovered_stars
    })

  } catch (err) {
    console.error('Loyalty recover API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
