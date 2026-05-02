import { useEffect, useState } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard } from '../../components/PageShell'

export default function HodLateRegistration() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/hod/late-registration')
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch { setRows([]) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Late Registration" KickerIcon={Clock} title="LATE REGISTRATION"
        subtitle="Late-registration items escalated to HOD by the AO. Read-only view." />

      <div className="flex items-center justify-end">
        <button onClick={load} className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
          <RefreshCw size={11} strokeWidth={3} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-10 h-10 border-4 border-ink border-t-burn rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <SectionCard title="No pending items">
          <div className="px-5 py-10 text-center text-xs font-bold text-cocoa uppercase tracking-wider">
            Late registration is processed primarily by the AO. Items reach this view only after AO escalation — none currently.
          </div>
        </SectionCard>
      ) : (
        <SectionCard title={`${rows.length} pending`}>
          <pre className="p-5 text-xs">{JSON.stringify(rows, null, 2)}</pre>
        </SectionCard>
      )}
    </div>
  )
}
