import { useState } from 'react'
import { Mail, Send, Download } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const LISTS = [
  { id: 1, name: 'BSE-243A — Spring 2026',   recipients: 42 },
  { id: 2, name: 'BSE-243B — Spring 2026',   recipients: 38 },
  { id: 3, name: 'BSE-243 (All Sections)',  recipients: 80 },
  { id: 4, name: 'CS3001 — All Sections',    recipients: 80 },
  { id: 5, name: 'CS3003 — Section B',       recipients: 36 },
  { id: 6, name: 'Faculty — Computing',       recipients: 24 },
]

export default function AsstAoMailingLists() {
  const [activeId, setActiveId] = useState(LISTS[0].id)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  const send = () => {
    if (!subject.trim() || !body.trim()) return
    setSent(true)
    setTimeout(() => setSent(false), 2500)
    setSubject(''); setBody('')
  }

  const active = LISTS.find(l => l.id === activeId)
  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Mail" KickerIcon={Mail} title="MAILING LISTS" subtitle="Pre-built lists scoped to your department. Excel export populates roll + email automatically." />

      {sent && (
        <div className="chunky-card p-3 bg-moss text-cream font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
          ✓ Email queued for {active?.recipients} recipients
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Lists">
          <div className="p-3 space-y-1.5">
            {LISTS.map(l => (
              <button
                key={l.id} onClick={() => setActiveId(l.id)}
                className={`w-full text-left px-3 py-2 border-2 rounded transition-all ${activeId === l.id ? 'bg-coffee text-bone border-burn' : 'bg-bone text-ink border-ink hover:bg-tan/30'}`}
              >
                <div className="font-extrabold text-xs uppercase tracking-wider">{l.name}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{l.recipients} recipients</div>
              </button>
            ))}
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard title={`Compose — ${active?.name}`} right={<ActionButton Icon={Download}>Export Excel (Roll + Email)</ActionButton>}>
            <div className="p-5 space-y-3">
              <div>
                <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; Subject</div>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" placeholder="Subject..." />
              </div>
              <div>
                <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; Body</div>
                <textarea value={body} onChange={e => setBody(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md p-3 text-sm text-ink focus:outline-none min-h-[160px] font-mono" placeholder="Write your message..." />
              </div>
              <div className="flex justify-end">
                <ActionButton tone="cocoa" Icon={Send} onClick={send} disabled={!subject.trim() || !body.trim()}>Send to {active?.recipients} recipients</ActionButton>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
