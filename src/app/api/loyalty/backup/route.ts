import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { visitor_uuid, serial, phone_number, username, pin_code } = body

    if (!visitor_uuid || !serial || !phone_number || !pin_code) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    if (pin_code.length !== 6 || !/^\d+$/.test(pin_code)) {
      return NextResponse.json({ error: 'PIN kodu 6 haneli rakam olmalıdır' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Cihaz bilgisinden business_id'yi al
    const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_stamp_device', {
      p_serial: serial,
    })

    if (resolveError || !resolveData || resolveData.length === 0) {
      return NextResponse.json({ error: 'Cihaz bulunamadı' }, { status: 404 })
    }

    const device = resolveData[0]

    // Yedekleme
    const { data, error } = await supabase.rpc('backup_visitor', {
      p_visitor_uuid: visitor_uuid,
      p_business_id: device.business_id,
      p_phone: phone_number,
      p_username: username || null,
      p_pin_code: pin_code,
    })

    if (error) {
      console.error('Backup error:', error)
      return NextResponse.json({ error: 'Yedekleme başarısız' }, { status: 500 })
    }

    return NextResponse.json({ success: data })
  } catch (err) {
    console.error('Backup API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
