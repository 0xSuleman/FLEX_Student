import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Eye, EyeOff, Zap, ChevronRight, Mail, AlertTriangle, Check, Fingerprint,
  ArrowLeft, Send, X,
  Briefcase, GraduationCap, ClipboardCheck, BookOpen, NotebookPen, Library, Bookmark, BookMarked, Book,
} from 'lucide-react'

const ROLES = [
  { value: 'faculty',      label: 'Faculty',                  ready: true, homePath: '/faculty' },
  { value: 'hod',          label: 'Head of Department',       ready: true, homePath: '/hod' },
  { value: 'ao',           label: 'Academic Officer',         ready: true, homePath: '/ao' },
  { value: 'asst_ao',      label: 'Asst. Academic Officer',   ready: true, homePath: '/asst-ao' },
  { value: 'manager',      label: 'Manager (Academics)',      ready: true, homePath: '/manager' },
  { value: 'asst_manager', label: 'Asst. Manager (Academics)',ready: true, homePath: '/asst-manager' },
  { value: 'exam_office',  label: 'Exam Office',              ready: true, homePath: '/exam' },
  { value: 'finance',      label: 'Finance / Accounts',       ready: true, homePath: '/finance' },
  { value: 'it_admin',     label: 'IT Administrator',         ready: true, homePath: '/it' },
  { value: 'registrar',    label: 'Registrar',                ready: true, homePath: '/registrar' },
  { value: 'admissions',   label: 'Admissions Officer',       ready: true, homePath: '/admissions' },
  { value: 'cao',          label: 'Central Academic Office',  ready: true, homePath: '/cao' },
]

export default function StaffLogin() {
  const [view, setView] = useState('login')
  const [role, setRole] = useState('faculty')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [sending, setSending] = useState(false)
  const intervalRef = useRef(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const prevHtmlBg = document.documentElement.style.backgroundColor
    const prevBodyBg = document.body.style.backgroundColor
    document.documentElement.style.backgroundColor = '#0A1A33'
    document.body.style.backgroundColor = '#0A1A33'
    document.documentElement.classList.add('hide-scrollbar')
    document.body.classList.add('hide-scrollbar')
    return () => {
      document.documentElement.style.backgroundColor = prevHtmlBg
      document.body.style.backgroundColor = prevBodyBg
      document.documentElement.classList.remove('hide-scrollbar')
      document.body.classList.remove('hide-scrollbar')
    }
  }, [])

  const [particles] = useState(() =>
    [...Array(18)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 9 + Math.random() * 9,
      size: 2 + Math.random() * 3,
    }))
  )

  const startHold = () => {
    if (verified) return
    setError('')
    setVerifying(true)
    let p = 0
    intervalRef.current = setInterval(() => {
      p += 2
      setProgress(p)
      if (p >= 100) { clearInterval(intervalRef.current); setVerifying(false); setVerified(true) }
    }, 30)
  }

  const stopHold = () => {
    if (verified) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    setVerifying(false)
    setProgress(0)
  }

  const currentRole = ROLES.find(r => r.value === role) || ROLES[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentRole.ready) {
      setError(`${currentRole.label} login is not available yet — coming soon.`)
      return
    }
    if (!verified) { setError('Please verify you are a human.'); return }
    setError('')
    setLoginLoading(true)
    try {
      await login(username, password, role, remember)
      navigate(currentRole.homePath || '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const goForgot = () => { setForgotSent(false); setForgotEmail(''); setView('forgot') }
  const goBack = () => { setForgotSent(false); setSending(false); setView('login') }
  const handleForgotSubmit = (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setSending(true)
    setTimeout(() => { setSending(false); setForgotSent(true) }, 1100)
  }

  return (
    <div className="relative min-h-screen bg-cocoa" style={{ overscrollBehavior: 'none' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-coffee/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full bg-burn/15 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-coffee/20 blur-[160px]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="synth-grid" />

      <div className="absolute inset-0 pointer-events-none">
        <FloatItem Icon={Briefcase}     size={130} top="6%"   left="6%"    anim="drift-1" />
        <FloatItem Icon={GraduationCap} size={100} top="14%"  right="9%"   anim="drift-2" delay="0.6s" />
        <FloatItem Icon={NotebookPen}   size={110} top="40%"  left="3%"    anim="drift-3" delay="1.2s" />
        <FloatItem Icon={ClipboardCheck} size={80} bottom="14%" left="22%" anim="drift-1" delay="2s" />
        <FloatItem Icon={BookOpen}      size={120} bottom="6%" right="6%"  anim="drift-2" delay="0.4s" />
        <FloatItem Icon={BookMarked}    size={70}  top="48%"  right="4%"   anim="drift-3" delay="1.6s" />
        <FloatItem Icon={Library}       size={90}  bottom="32%" left="2%"  anim="drift-1" delay="3s" />
        <FloatItem Icon={Bookmark}      size={55}  top="28%"  right="24%"  anim="drift-2" delay="2.4s" />
        <FloatItem Icon={Book}          size={60}  top="64%"  right="18%"  anim="drift-3" delay="2.8s" />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <span key={i} className="particle" style={{ left: `${p.left}%`, width: `${p.size}px`, height: `${p.size}px`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-start justify-center px-4 pt-24 pb-10">
        <div className="w-full max-w-md scene-3d fade-up">
          <div className="text-center mb-5 select-none">
            <div className="inline-block animate-float-y">
              <h1 className="font-display text-4xl md:text-5xl title-3d leading-none mb-2">NUKED</h1>
            </div>
            <div className="font-display text-[10px] subtitle-shimmer mt-2 tracking-[0.3em]">
              [ ACADEMIC SUITE · STAFF TERMINAL ]
            </div>
          </div>

          <div className="flip-perspective">
            <div className="flip-card-3d w-full" style={{ transform: view === 'forgot' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div className="flip-face-3d bg-coffee border-2 border-ink rounded-lg overflow-hidden relative border-pulse">
                <div className="scan-line" />

                <form onSubmit={handleSubmit} className="px-5 pb-5 pt-5 space-y-3.5">
                  <div>
                    <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">&gt; Sign in as</label>
                    <select
                      value={role}
                      onChange={(e) => { setRole(e.target.value); setError('') }}
                      className="input-3d w-full bg-ink border-2 border-ink rounded-md px-3 py-2.5 font-mono text-sm text-bone focus:outline-none transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23FFFFFF\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: 36,
                      }}
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}{r.ready ? '' : ' — Coming soon'}</option>
                      ))}
                    </select>
                    {!currentRole.ready && (
                      <div className="text-[10px] text-mustard font-bold mt-1.5 uppercase tracking-wider">
                        This role is not online yet.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">&gt; Username</label>
                    <input
                      type="text"
                      placeholder={role === 'faculty' ? 'zeeshan.rana' : 'username'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-3d w-full bg-ink border-2 border-ink rounded-md px-3 py-2.5 font-mono text-sm text-bone placeholder:text-bone/30 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">&gt; Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-3d w-full bg-ink border-2 border-ink rounded-md px-3 py-2.5 font-mono text-sm text-bone placeholder:text-bone/30 focus:outline-none transition-all pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-bone/50 hover:text-bone transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">&gt; Verify You Are Human</label>
                    <div className="bg-ink border-2 border-ink rounded-md p-4 flex items-center gap-4">
                      <button
                        type="button"
                        onMouseDown={startHold} onMouseUp={stopHold} onMouseLeave={stopHold}
                        onTouchStart={startHold} onTouchEnd={stopHold}
                        className={`relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all shrink-0 select-none ${
                          verified ? 'bg-mossL/20 border-mossL'
                          : verifying ? 'bg-burn/15 border-burn cursor-grabbing'
                          : 'bg-cocoa border-burn/50 cursor-grab ring-breathe'
                        }`}
                      >
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(14,165,233,0.15)" strokeWidth="3" />
                          <circle
                            cx="32" cy="32" r="28" fill="none"
                            stroke={verified ? '#34D399' : '#0EA5E9'}
                            strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - (verified ? 100 : progress) / 100)}`}
                            style={{ transition: verifying ? 'none' : 'stroke-dashoffset 0.4s ease', filter: 'drop-shadow(0 0 8px currentColor)' }}
                          />
                        </svg>
                        {verified ? <Check size={26} className="text-mossL verified-pop" strokeWidth={3} /> : <Fingerprint size={24} className={`text-burn ${verifying ? 'hold-pulse' : ''}`} strokeWidth={2} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-display text-[10px] uppercase tracking-wider mb-1 ${verified ? 'text-mossL' : verifying ? 'text-burn' : 'text-bone'}`}>
                          {verified ? '✓ Verified' : verifying ? 'Hold...' : 'Press & Hold'}
                        </div>
                        <div className="font-mono text-[10px] text-bone/50 leading-snug">
                          {verified ? 'Identity confirmed. You may sign in.' : 'Hold the button until the ring fills to confirm you are not a bot.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-bad/25 border-2 border-bad rounded-md px-3 py-2 font-mono text-[11px] text-bone flex items-center gap-2">
                      <AlertTriangle size={12} strokeWidth={3} className="text-bad shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex items-center justify-between font-mono text-[11px] pt-1">
                    <label className="flex items-center gap-2 text-bone cursor-pointer hover:text-burn transition-colors">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.5 h-3.5 accent-mossL" />
                      Remember Me
                    </label>
                    <button type="button" onClick={goForgot} className="text-bone hover:text-burn transition-colors font-normal">
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading || !currentRole.ready}
                    className="login-btn w-full relative overflow-hidden bg-bone text-ink border-2 border-ink rounded-md px-5 py-3 font-display text-xs uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all inline-flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loginLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                        AUTHENTICATING...
                      </>
                    ) : (
                      <>
                        <Zap size={14} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                        EXECUTE LOGIN
                        <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="border-t-2 border-ink bg-ink px-5 py-2 flex items-center justify-between font-mono text-[10px] text-bone/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-sm bg-mossL" />
                    <span className="text-mossL">READY</span>
                  </span>
                  <span>NODE: FAST-LHR-STAFF</span>
                </div>
              </div>

              <div className="flip-face-3d bg-coffee border-2 border-ink rounded-lg overflow-hidden absolute inset-0" style={{ transform: 'rotateY(180deg)' }}>
                {view === 'forgot' && <ForgotPanel email={forgotEmail} setEmail={setForgotEmail} onSubmit={handleForgotSubmit} onBack={goBack} sending={sending} sent={forgotSent} />}
                {view !== 'forgot' && <div className="invisible">
                  <ForgotPanel email="" setEmail={() => {}} onSubmit={() => {}} onBack={() => {}} sending={false} sent={false} />
                </div>}
              </div>
            </div>
          </div>

          <div className="text-center font-mono text-[10px] text-bone/40 mt-4 uppercase tracking-wider">
            © 1990–2026 · NUKED SYSTEMS · ALL BITS RESERVED
          </div>
        </div>
      </div>
    </div>
  )
}

function ForgotPanel({ email, setEmail, onSubmit, onBack, sending, sent }) {
  return (
    <div className="p-6 h-full flex flex-col">
      <button type="button" onClick={onBack} className="self-start text-bone/60 hover:text-bone hover:-translate-x-1 transition-all flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider mb-4 content-up" style={{ animationDelay: '0.4s' }}>
        <ArrowLeft size={12} strokeWidth={3} /> Back
      </button>

      {sent ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center content-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-16 h-16 rounded-full bg-mossL/20 border-2 border-mossL flex items-center justify-center mb-4 verified-pop">
            <Check size={28} className="text-mossL" strokeWidth={3} />
          </div>
          <h2 className="font-display text-base text-bone uppercase mb-2">Email Sent</h2>
          <p className="font-mono text-xs text-bone/60 leading-relaxed max-w-[260px]">
            Check your inbox at <span className="text-burn">{email}</span> for the reset link.
          </p>
          <button type="button" onClick={onBack} className="mt-6 bg-bone text-ink border-2 border-ink rounded-md px-5 py-2 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <div className="text-center mb-4 content-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="font-display text-base md:text-lg text-bone leading-tight uppercase mb-2">Reset Password</h2>
            <div className="w-12 h-0.5 bg-burn mx-auto mb-3" />
          </div>
          <p className="font-mono text-xs text-bone/70 leading-relaxed text-center mb-5 content-up" style={{ animationDelay: '0.35s' }}>
            Enter your registered staff email. After verification a reset link will be sent.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="content-up" style={{ animationDelay: '0.5s' }}>
              <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">&gt; Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-bone/40" strokeWidth={2.5} />
                <input
                  type="email" required placeholder="you@nu.edu.pk"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-3d w-full bg-ink border-2 border-ink rounded-md pl-9 pr-3 py-2.5 font-mono text-sm text-bone placeholder:text-bone/30 focus:outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 content-up" style={{ animationDelay: '0.65s' }}>
              <button type="button" onClick={onBack} className="bg-cocoa text-bone border-2 border-ink rounded-md px-4 py-2.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-1.5">
                <X size={12} strokeWidth={3} /> Cancel
              </button>
              <button type="submit" disabled={sending} className={`bg-bone text-ink border-2 border-ink rounded-md px-4 py-2.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-1.5 ${sending ? 'send-pulse' : ''}`}>
                <Send size={12} strokeWidth={3} className={sending ? 'animate-pulse' : ''} />
                {sending ? 'Sending' : 'Request'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

function FloatItem({ Icon, size, top, left, right, bottom, anim = 'drift-1', delay = '0s' }) {
  return (
    <div className={`absolute pointer-events-none ${anim}`} style={{ top, left, right, bottom, animationDelay: delay }}>
      <Icon size={size} strokeWidth={1.4} className="text-burn/45" style={{ filter: 'drop-shadow(0 0 8px rgba(14, 165, 233, 0.18))' }} />
    </div>
  )
}
