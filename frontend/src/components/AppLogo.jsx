const SIZES = {
  sm: { img: 28, text: 'text-sm',   sub: 'text-[9px]'  },
  md: { img: 36, text: 'text-base', sub: 'text-[10px]' },
  lg: { img: 48, text: 'text-xl',   sub: 'text-xs'     },
  xl: { img: 72, text: 'text-3xl',  sub: 'text-sm'     },
}

export default function AppLogo({ size = 'md', showText = true, animate = true, className = '' }) {
  const cfg = SIZES[size] || SIZES.md

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative shrink-0 ${animate ? 'app-logo' : ''}`}
        style={{ width: cfg.img, height: cfg.img }}>
        <img
          src="/logo.png"
          alt="TaskFlow"
          style={{
            width: cfg.img, height: cfg.img,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(99,102,241,0.6)) drop-shadow(0 0 22px rgba(34,211,238,0.2))',
          }}
        />
      </div>
      {showText && (
        <div>
          <p className={`font-display font-bold tracking-tight leading-none ${cfg.text}`}
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            TaskFlow
          </p>
          <p className={`font-mono ${cfg.sub} mt-0.5`} style={{ color: 'rgba(99,102,241,0.55)' }}>
            workspace
          </p>
        </div>
      )}
    </div>
  )
}
