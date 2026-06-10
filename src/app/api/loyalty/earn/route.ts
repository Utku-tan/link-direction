import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serial, visitor_uuid } = body

    if (!serial || !visitor_uuid) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Cihaz bilgisini çöz
    const { data: resolveData, error: resolveError } = await supabase.rpc('resolve_nfc_redirect', {
      p_serial: serial,
    })

    if (resolveError || !resolveData || resolveData.length === 0) {
      return NextResponse.json({ error: 'Cihaz bulunamadı' }, { status: 404 })
    }

    const device = resolveData[0]

    if (device.account_type !== 'business') {
      return NextResponse.json({ error: 'Bu cihaz işletme hesabına ait değil' }, { status: 400 })
    }

    // 2. IP adresini al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'
      
    // 3. Yıldız kazanma işlemi (Cooldown kontrolü içerir)
    const cooldownHours = device.business_cooldown_hours || 12
    const { data: earnData, error: earnError } = await supabase.rpc('earn_star', {
      p_business_id: device.owner_id,
      p_visitor_uuid: visitor_uuid,
      p_ip: ip,
      p_cooldown_hours: cooldownHours,
      p_device_id: device.device_id
    })

    if (earnError) {
      console.error('Earn star error:', earnError)
      return NextResponse.json({ error: 'Yıldız eklenirken hata oluştu' }, { status: 500 })
    }

    const result = earnData[0]

    // 4. Analytics kaydı ve Click count
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || null

    let deviceType = 'desktop'
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
      deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile'
    }

    let browser = 'Other'
    if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Edg/')) browser = 'Edge'
    else if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera'

    await supabase.from('analytics').insert({
      link_id: device.link_id,
      nfc_device_id: device.device_id,
      device: deviceType,
      browser,
      referrer,
      ip_address: ip,
      is_cooldown_blocked: result.is_cooldown,
    })

    if (!result.is_cooldown) {
      await supabase.rpc('increment_click_count', { link_uuid: device.link_id })
    }

    return NextResponse.json({
      success: result.success,
      stars: result.stars,
      is_cooldown: result.is_cooldown,
      business_name: device.business_name || 'İşletme',
      target_url: device.target_url
    })

  } catch (err) {
    console.error('Loyalty earn API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
