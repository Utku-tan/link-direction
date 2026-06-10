import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitor_uuid, serial, phone_number } = body

    if (!visitor_uuid || !serial || !phone_number) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_nfc_redirect', { p_serial: serial })
    if (resolveError || !resolveData || resolveData.length === 0) {
      return NextResponse.json({ error: 'Cihaz bulunamadı' }, { status: 404 })
    }

    const business_id = resolveData[0].owner_id

    const { data: success, error } = await supabase.rpc('backup_phone', {
      p_visitor_uuid: visitor_uuid,
      p_business_id: business_id,
      p_phone: phone_number
    })

    if (error) {
      console.error('Backup phone error:', error)
      return NextResponse.json({ error: 'Yedekleme başarısız' }, { status: 500 })
    }

    return NextResponse.json({ success })

  } catch (err) {
    console.error('Loyalty backup API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
