import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Clock, Users, Wifi } from 'lucide-react'
import api from '../../services/api'

export default function FacultyAttendanceProjector() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [marks, setMarks] = useState([])
  const [now, setNow] = useState(Date.now())
  const [presentOrder, setPresentOrder] = useState([])
  const [celebration, setCelebration] = useState(null)
  const seenPresentRef = useRef(new Set())
  const initializedRef = useRef(false)
  const celebrationTimers = useRef([])

  const load = async () => {
    const [sessionRes, marksRes] = await Promise.all([
      api.get(`/faculty/attendance/sessions/${sessionId}`),
      api.get(`/faculty/attendance/sessions/${sessionId}/marks`),
    ])
    const nextMarks = Array.isArray(marksRes.data) ? marksRes.data : []
    const presentMarks = nextMarks.filter(m => m.presence === 'P')
    const presentIds = presentMarks.map(m => String(m.enrollmentId || m.rollNo))
    const newMarks = presentMarks.filter(m => !seenPresentRef.current.has(String(m.enrollmentId || m.rollNo)))

    if (!initializedRef.current) {
      initializedRef.current = true
      seenPresentRef.current = new Set(presentIds)
      setPresentOrder(presentIds)
    } else if (newMarks.length > 0) {
      const newIds = newMarks.map(m => String(m.enrollmentId || m.rollNo)).reverse()
      seenPresentRef.current = new Set(presentIds)
      setPresentOrder(prev => [...newIds, ...prev.filter(id => presentIds.includes(id) && !newIds.includes(id))])
      showCelebration(newMarks[newMarks.length - 1])
    } else {
      seenPresentRef.current = new Set(presentIds)
      setPresentOrder(prev => prev.filter(id => presentIds.includes(id)))
    }

    if (sessionRes.data.status === 'CLOSED') {
      window.close()
    }

    setSession(sessionRes.data)
    setMarks(nextMarks)
  }

  const showCelebration = (mark) => {
    celebrationTimers.current.forEach(clearTimeout)
    celebrationTimers.current = []
    setCelebration({ rollNo: mark.rollNo, name: mark.name, phase: 'hold' })
    celebrationTimers.current.push(setTimeout(() => {
      setCelebration(current => current ? { ...current, phase: 'fly' } : current)
    }, 2000))
    celebrationTimers.current.push(setTimeout(() => {
      setCelebration(null)
    }, 2700))
  }

  useEffect(() => {
    initializedRef.current = false
    seenPresentRef.current = new Set()
    setPresentOrder([])
    setCelebration(null)
    load().catch(() => {})
    const poll = setInterval(() => load().catch(() => {}), 2000)
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
      celebrationTimers.current.forEach(clearTimeout)
      celebrationTimers.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const present = useMemo(() => {
    const presentMarks = marks.filter(m => m.presence === 'P')
    const order = new Map(presentOrder.map((id, index) => [id, index]))
    return [...presentMarks].sort((a, b) => {
      const aId = String(a.enrollmentId || a.rollNo)
      const bId = String(b.enrollmentId || b.rollNo)
      return (order.get(aId) ?? 9999) - (order.get(bId) ?? 9999)
    })
  }, [marks, presentOrder])
  const total = marks.length
  const remainingMs = session?.endsAt ? Math.max(0, new Date(session.endsAt).getTime() - now) : 0
  const remainingMin = Math.floor(remainingMs / 60000)
  const remainingSec = Math.floor((remainingMs % 60000) / 1000)

  return (
    <div className="relative h-screen bg-ink text-bone p-6 md:p-8 flex flex-col gap-5 overflow-hidden">
      <style>{`
        @keyframes successHold {
          from { opacity: 0; transform: scale(.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes successFly {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(34vh) scale(.34); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .success-hold { animation: successHold .28s ease-out both; }
        .success-fly { animation: successFly .7s cubic-bezier(.2,.8,.2,1) both; }
        .success-scroll::-webkit-scrollbar { width: 12px; }
        .success-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, .12); border-left: 2px solid #020617; }
        .success-scroll::-webkit-scrollbar-thumb { background: #10b981; border: 2px solid #020617; border-radius: 999px; }
      `}</style>

      {celebration && (
        <div className="fixed inset-0 z-50 bg-ink/96 flex items-center justify-center pointer-events-none">
          <div className={`text-center bg-bone border-4 border-ink shadow-pixel-lg p-8 md:p-12 rounded-xl ${celebration.phase === 'fly' ? 'success-fly' : 'success-hold'}`}>
            <div className="font-display text-[clamp(2.5rem,9vw,6.5rem)] leading-none text-ink whitespace-nowrap px-4 md:px-8">
              {celebration.rollNo}
            </div>
            <div className="mt-4 md:mt-6 text-moss font-black uppercase tracking-[0.2em] text-sm md:text-2xl whitespace-nowrap">
              Marked Present
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.45fr)] gap-5 shrink-0">
        <div className="grid grid-rows-2 gap-5 min-w-0">
          <InstructionCard
            icon={<Wifi size={22} strokeWidth={3} />}
            label="WiFi Network"
            value="Mark-Attendence"
          />
          <InstructionCard
            label="Open in Browser"
            value="attendence.fast"
          />
        </div>
        <div className="grid grid-rows-2 gap-5 min-w-0">
        <Panel icon={<Users size={34} strokeWidth={3} />} label="Marked" value={`${present.length}/${total}`} />
          <Panel icon={<Clock size={34} strokeWidth={3} />} label="Time Left" value={`${remainingMin}:${remainingSec.toString().padStart(2, '0')}`} />
        </div>
      </section>

      <section className="flex-1 min-h-0 bg-cream text-ink border-4 border-bone rounded-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-moss text-cream border-b-4 border-ink flex items-center justify-between">
          <div className="font-display text-xl uppercase tracking-wider">Attendence Success</div>
          <div className="font-black text-2xl tabular-nums">{present.length}</div>
        </div>
        <div className="success-scroll flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-min gap-0">
          {present.map((m, i) => (
            <div key={m.enrollmentId} className="px-6 py-4 border-b-2 border-r-2 border-cocoa/30 flex items-center gap-3 animate-[fadeIn_.25s_ease-out]">
              <CheckCircle2 size={24} className="text-moss shrink-0" strokeWidth={3} />
              <div className="min-w-0">
                <div className="font-display text-lg truncate">{m.rollNo}</div>
                <div className="font-bold text-cocoa truncate">{m.name}</div>
              </div>
              <div className="ml-auto text-cocoa/50 font-black tabular-nums">{String(i + 1).padStart(2, '0')}</div>
            </div>
          ))}
          {present.length === 0 && (
            <div className="px-6 py-16 text-center text-cocoa font-black uppercase tracking-widest col-span-full">
              Waiting for students...
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function InstructionCard({ icon, label, value }) {
  return (
    <div className="bg-bone text-ink border-4 border-cream rounded-md p-5 md:p-6 min-w-0 min-h-[142px] flex flex-col justify-center">
      <div className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-cocoa flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="font-display text-[clamp(1.75rem,3.25vw,3.5rem)] leading-none mt-4 whitespace-nowrap overflow-visible">
        {value}
      </div>
    </div>
  )
}

function Panel({ icon, label, value }) {
  return (
    <div className="bg-bone text-ink border-4 border-cream rounded-md p-5 min-h-[142px] flex items-center gap-4">
      <div className="w-16 h-16 bg-burn text-bone border-4 border-ink rounded-md flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cocoa">{label}</div>
        <div className="font-display text-[clamp(2.5rem,4.8vw,5.2rem)] mt-2 whitespace-nowrap leading-none">{value}</div>
      </div>
    </div>
  )
}
