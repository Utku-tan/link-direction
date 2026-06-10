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
  const { data, error } = await supabase.rpc('resolve_nfc_redirect', {
    p_serial: serial,
  })

  if (error || !data || data.length === 0) {
    return nfcErrorPage('Cihaz Bulunamadı', 'Bu seri numarasına sahip bir Refly cihazı bulunamadı.', 404)
  }

  const device = data[0]

  // 2. Cihaz henüz claim edilmemiş
  if (!device.is_claimed) {
    return nfcInfoPage(
      'Cihaz Henüz Bağlanmadı',
      'Bu Refly cihazı henüz bir hesaba bağlanmamış. Cihazı bağlamak için Refly hesabınıza giriş yapın ve "Cihazlarım" sayfasından bu cihazı ekleyin.',
      serial
    )
  }

  // 3. Link atanmamış
  if (!device.link_id || !device.target_url) {
    return nfcInfoPage(
      'Link Atanmadı',
      'Bu cihaza henüz bir yönlendirme linki atanmamış. Cihaz sahibi panelden bir link atamalıdır.',
      serial
    )
  }

  // 4. Ziyaretçi bilgilerini topla
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
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

  // 5. İşletme hesabı ise doğrudan /star/[serial] sayfasına yönlendir
  // Cooldown kontrolü, analytics ve yıldız kazanma işlemleri /api/loyalty/earn içinde yapılacak
  if (device.account_type === 'business') {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://refly.world'
    return Response.redirect(`${baseUrl}/star/${serial}`, 302)
  }

  // 6. Bireysel hesap: Analytics kaydı yaz
  supabase.from('analytics').insert({
    link_id: device.link_id,
    nfc_device_id: device.device_id,
    device: deviceType,
    browser,
    referrer,
    ip_address: ip,
    is_cooldown_blocked: false,
  }).then(() => {})

  // Click count artır
  supabase.rpc('increment_click_count', { link_uuid: device.link_id }).then(() => {})

  // 7. Hedefe yönlendir
  return Response.redirect(device.target_url, 302)
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
        <a href="/login" class="btn">Giriş Yap</a>
        <a href="/register" class="btn btn-outline">Hesap Oluştur</a>
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
    .btn-outline {
      background: transparent; border: 1px solid #3f3f46; color: #d4d4d8;
    }
    .btn-outline:hover { border-color: #71717a; background: rgba(255,255,255,0.03); }
  `
}
