import { PageHeader } from './PageShell'

/** Lightweight placeholder for routes that are scaffolded but not built out yet. */
export default function StubPage({ kicker, title, subtitle, KickerIcon, bullets = [] }) {
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker={kicker} KickerIcon={KickerIcon} title={title} subtitle={subtitle} />
      <div className="chunky-card p-8">
        <div className="font-display text-[11px] uppercase tracking-widest text-coffee mb-3">&gt; What this page will do</div>
        <ul className="space-y-2 text-sm text-ink">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-burn rounded-sm mt-2 shrink-0" />
              <span className="font-medium">{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 pt-4 border-t-2 border-dashed border-cocoa/30 text-xs font-bold text-cocoa uppercase tracking-wider">
          Coming up · scaffolded route, ready for full implementation in the next pass.
        </div>
      </div>
    </div>
  )
}
