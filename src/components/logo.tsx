import { cn } from '@/lib/utils'

/**
 * LinkDirection Logo Component
 * Logo ikonu (SVG) + Marka ismi (metin) yan yana (flex layout)
 */
export function Logo({ 
  size = 'default',
  showText = true,
  className 
}: { 
  size?: 'sm' | 'default' | 'lg'
  showText?: boolean
  className?: string 
}) {
  const sizes = {
    sm: { icon: 'w-8 h-8', svg: 'w-4 h-4', text: 'text-base' },
    default: { icon: 'w-9 h-9', svg: 'w-[18px] h-[18px]', text: 'text-lg' },
    lg: { icon: 'w-11 h-11', svg: 'w-5 h-5', text: 'text-xl' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn(
        s.icon, 
        'rounded-xl accent-gradient flex items-center justify-center accent-glow-sm shrink-0'
      )}>
        <svg
          className={cn(s.svg, 'text-white')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      {showText && (
        <span className={cn(s.text, 'font-bold accent-text')}>
          Refly
        </span>
      )}
    </div>
  )
}
