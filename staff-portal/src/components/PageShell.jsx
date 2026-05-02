// Tiny reusable pieces so the per-role pages stay short and on-theme.

export function PageHeader({ kicker, title, subtitle, KickerIcon, right }) {
  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div>
        {kicker && (
          <div className="text-sm font-bold text-coffee uppercase tracking-wider flex items-center gap-2">
            {KickerIcon && <KickerIcon size={14} strokeWidth={3} className="text-burn" />} {kicker}
          </div>
        )}
        <h1 className="font-display text-2xl md:text-4xl text-ink leading-tight mt-3">{title}</h1>
        {subtitle && <p className="text-sm text-cocoa mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function StatCard({ label, value, sub, tone = 'bg-cocoa text-bone', Icon }) {
  return (
    <div className={`border-2 border-ink rounded-md p-3 shadow-pixel-sm ${tone}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} strokeWidth={3} />}
        <span className="text-[10px] font-extrabold uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-black text-3xl mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-[10px] font-bold mt-0.5 uppercase tracking-wider opacity-80">{sub}</div>}
    </div>
  )
}

export function InfoBox({ label, value }) {
  return (
    <div className="bg-cream border-2 border-ink rounded-md p-3 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-pixel-sm transition-all">
      <div className="text-[9px] font-extrabold text-ink/60 uppercase tracking-widest mb-1">{label}</div>
      <div className="font-extrabold text-sm text-ink truncate">{value || '—'}</div>
    </div>
  )
}

export function SectionCard({ title, right, children }) {
  return (
    <div className="chunky-card overflow-hidden">
      <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-3">
        <h3 className="heading-retro text-sm">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

export function ActionButton({ children, tone = 'cocoa', onClick, disabled, Icon }) {
  const tones = {
    cocoa: 'bg-cocoa text-bone',
    bone: 'bg-bone text-ink',
    bad:  'bg-bad text-bone',
    moss: 'bg-moss text-cream',
    mustard: 'bg-mustard text-ink',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${tones[tone]} border-2 border-ink rounded-md px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {Icon && <Icon size={11} strokeWidth={3} />} {children}
    </button>
  )
}
