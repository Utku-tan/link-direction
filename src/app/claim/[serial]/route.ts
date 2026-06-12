import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params
  const supabase = createAdminClient()

  // 1. NFC cihaz bilgisini çöz
  const { data, error } = await supabase.rpc('resolve_stamp_device', {
    p_serial: serial,
  })

  if (error || !data || data.length === 0) {
    return nfcErrorPage('Cihaz Bulunamadı', 'Bu seri numarasına sahip bir Refly cihazı bulunamadı.', 404)
  }

  const device = data[0]

  // 2. Cihaz henüz bir işletmeye atanmamış
  if (!device.business_id) {
    return nfcInfoPage(
      'Cihaz Henüz Atanmadı',
      'Bu Refly cihazı henüz bir işletmeye atanmamış. Lütfen sistem yöneticisiyle iletişime geçin.',
      serial
    )
  }

  // 3. Damga sayfasına yönlendir
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://refly.world'
  return Response.redirect(`${baseUrl}/stamp/${serial}`, 302)
}

// ---- Yardımcı HTML Sayfaları ----

function nfcErrorPage(title: string, message: string, status: number) {
  return new Response(
    `<!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Refly</title>
      <style>${baseStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔍</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="/" class="btn">Ana Sayfaya Dön</a>
      </div>
    </body>
    </html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function nfcInfoPage(title: string, message: string, serial: string) {
  return new Response(
    `<!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Refly</title>
      <style>${baseStyles()}</style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📱</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="serial-badge">Seri No: <strong>${serial}</strong></div>
      </div>
    </body>
    </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

function baseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #09090b, #18181b, #09090b);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #fafafa;
    }
    .container { text-align: center; padding: 2rem; max-width: 420px; }
    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
    h1 {
      font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem;
      background: linear-gradient(135deg, #00f2fe, #4facfe);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    p { font-size: 0.95rem; color: #a1a1aa; line-height: 1.6; margin-bottom: 1.5rem; }
    .serial-badge {
      display: inline-block; padding: 0.5rem 1.25rem; border-radius: 9999px;
      background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.2);
      color: #00f2fe; font-size: 0.875rem; margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block; padding: 0.75rem 2rem; border-radius: 0.75rem;
      background: linear-gradient(135deg, #00f2fe, #4facfe); color: white;
      text-decoration: none; font-weight: 500; transition: opacity 0.2s; margin: 0.25rem;
    }
    .btn:hover { opacity: 0.9; }
  `
}
