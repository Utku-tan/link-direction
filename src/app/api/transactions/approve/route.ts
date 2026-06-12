import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id } = body

    if (!transaction_id) {
      return NextResponse.json({ error: 'İşlem ID eksik' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('approve_transaction', {
      p_transaction_id: transaction_id,
    })

    if (error || !data) {
      return NextResponse.json({ error: 'İşlem onaylanamadı veya zaten işlendi' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    return response

  } catch (err) {
    console.error('Approve API error:', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
