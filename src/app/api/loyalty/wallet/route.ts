import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const visitor_uuid = searchParams.get('visitor_uuid')

    if (!visitor_uuid) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('loyalty_stars')
      .select(`
        id,
        current_stars,
        business_id,
        profiles (
          business_name,
          target_stars_for_reward
        )
      `)
      .eq('visitor_uuid', visitor_uuid)

    if (error) {
      console.error('Wallet fetch error:', error)
      return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
    }

    const response = NextResponse.json({ success: true, cards: data })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response

  } catch (err) {
    console.error('Wallet API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
