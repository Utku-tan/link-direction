// Device Fingerprint üreteci
// Screen + Timezone + UserAgent + Canvas hash

export function generateFingerprint(): string {
  // Önbellek kontrolü
  const cached = localStorage.getItem('refly_device_fingerprint')
  if (cached) return cached

  const components: string[] = []

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // User Agent
  components.push(navigator.userAgent)

  // Language
  components.push(navigator.language)

  // Platform
  components.push(navigator.platform || 'unknown')

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Refly.world', 2, 15)
      components.push(canvas.toDataURL().slice(-50))
    }
  } catch {
    components.push('no-canvas')
  }

  // Hash
  const raw = components.join('|')
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  const fingerprint = 'fp_' + Math.abs(hash).toString(36)

  localStorage.setItem('refly_device_fingerprint', fingerprint)
  return fingerprint
}
