import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serial, visitor_uuid, fingerprint } = body

    if (!serial || !visitor_uuid) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Cihaz bilgisini çöz
    const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_stamp_device', {
      p_serial: serial,
    })

    if (resolveError || !resolveData || resolveData.length === 0) {
      return NextResponse.json({ error: 'Cihaz bulunamadı' }, { status: 404 })
    }

    const device = resolveData[0]

    if (!device.business_id) {
      return NextResponse.json({ error: 'Bu cihaz henüz bir işletmeye atanmamış' }, { status: 400 })
    }

    // 2. Fingerprint ile otomatik geri yükleme denemesi
    if (fingerprint) {
      await supabase.rpc('restore_by_fingerprint', {
        p_fingerprint: fingerprint,
        p_business_id: device.business_id,
        p_new_visitor_uuid: visitor_uuid,
      })
    }

    // 3. Damga işlemi
    const { data: stampData, error: stampError } = await supabase.rpc('process_stamp', {
      p_business_id: device.business_id,
      p_visitor_uuid: visitor_uuid,
      p_tag_type: device.tag_type,
      p_device_id: device.device_id,
      p_fingerprint: fingerprint || null,
      p_target_stars: device.target_stars_for_reward,
    })

    if (stampError) {
      console.error('Process stamp error:', stampError)
      return NextResponse.json({ error: 'Damga işlemi başarısız' }, { status: 500 })
    }

    const result = stampData[0]

    const response = NextResponse.json({
      success: result.success,
      stars: result.stars_after,
      stars_added: result.stars_added,
      is_reward: result.is_reward,
      is_duplicate: result.is_duplicate,
      total_rewards: result.total_rewards,
      is_backed_up: result.is_backed_up,
      visitor_name: result.visitor_name,
      tag_type: device.tag_type,
      business_name: device.business_name || 'İşletme',
      target_url: device.target_url || '/',
      target_stars: device.target_stars_for_reward,
    })

    // Müşterinin tarayıcısının bu isteği önbelleğe almasını ve sayfa yenilendiğinde
    // tekrar göndermesini (form resubmission) kesin olarak engeller.
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (err) {
    console.error('Stamp API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
