import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  const { username, slug } = await params
  const supabase = createAdminClient()

  // Resolve redirect via RPC function (fast, single query)
  const { data, error } = await supabase.rpc('resolve_redirect', {
    p_username: username,
    p_slug: slug,
  })

  if (error || !data || data.length === 0) {
    // Return HTML 404 page
    return new Response(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Link Bulunamadı</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #09090b, #18181b, #09090b);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #fafafa;
          }
          .container {
            text-align: center;
            padding: 2rem;
          }
          .error-code {
            font-size: 8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #00f2fe, #4facfe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1;
          }
          .message {
            font-size: 1.25rem;
            color: #a1a1aa;
            margin-top: 1rem;
          }
          .description {
            font-size: 0.875rem;
            color: #71717a;
            margin-top: 0.5rem;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }
          .home-link {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 2rem;
            background: linear-gradient(135deg, #00f2fe, #4facfe);
            color: white;
            text-decoration: none;
            border-radius: 0.75rem;
            font-weight: 500;
            transition: opacity 0.2s;
          }
          .home-link:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-code">404</div>
          <p class="message">Link Bulunamadı</p>
          <p class="description">Aradığınız link mevcut değil veya artık aktif değil. Lütfen linki kontrol edin.</p>
          <a href="/" class="home-link">Ana Sayfaya Dön</a>
        </div>
      </body>
      </html>`,
      {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  const { link_id, target_url } = data[0]

  // Parse user agent for device and browser info
  const userAgent = request.headers.get('user-agent') || ''
  const referrer = request.headers.get('referer') || null

  // Determine device type
  let device = 'desktop'
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    device = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile'
  }

  // Determine browser
  let browser = 'Other'
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edg/')) browser = 'Edge'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera'

  // Get visitor IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  // Record analytics (non-blocking — don't await)
  supabase.from('analytics').insert({
    link_id,
    device,
    browser,
    referrer,
    ip_address: ip,
  }).then(() => {})

  // Increment click count (non-blocking)
  supabase.rpc('increment_click_count', { link_uuid: link_id }).then(() => {})

  // 302 Redirect
  return Response.redirect(target_url, 302)
}
