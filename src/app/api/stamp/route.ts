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

    // 3. Bekleyen İşlem Yarat (Yıldız hemen verilmez)
    // Fiziksel redeem_tag artık geçersiz, reddet.
    if (device.tag_type === 'redeem_tag') {
      return NextResponse.json({ error: 'Ödül almak için cüzdanınızdan dijital kod üretin.' }, { status: 400 })
    }

    const { data: transactionId, error: txError } = await supabase.rpc('create_pending_transaction', {
      p_business_id: device.business_id,
      p_visitor_uuid: visitor_uuid,
      p_tag_type: device.tag_type,
      p_fingerprint: fingerprint || null,
      p_visitor_name: 'Müşteri', // İdealde loyalty_stars'dan okunabilir, şimdilik böyle
    })

    if (txError) {
      console.error('Create pending tx error:', txError)
      return NextResponse.json({ error: 'İşlem başlatılamadı' }, { status: 500 })
    }

    if (!transactionId) {
      // Çift okutma (spam) koruması
      return NextResponse.json({
        is_duplicate: true,
        target_url: device.target_url || '/',
      })
    }

    // Müşterinin o anki yıldız sayısını bulalım ki arayüzde doğru gösterelim
    const { data: starsData } = await supabase
      .from('loyalty_stars')
      .select('current_stars')
      .eq('business_id', device.business_id)
      .eq('visitor_uuid', visitor_uuid)
      .single()

    const currentStars = starsData?.current_stars || 0

    const response = NextResponse.json({
      success: true,
      status: 'pending',
      transaction_id: transactionId,
      current_stars: currentStars,
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
