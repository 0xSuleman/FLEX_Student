import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, ChevronRight } from 'lucide-react'

export default function Login() {
  const [rollNo, setRollNo] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  // Memoize particle positions so they don't re-randomize on re-render
  const [particles] = useState(() =>
    [...Array(22)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 9 + Math.random() * 9,
      size: 2 + Math.random() * 3,
    }))
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cocoa">
      {/* navy gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-coffee/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[700px] h-[700px] rounded-full bg-burn/15 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-coffee/20 blur-[160px]" />
      </div>

      {/* dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* synthwave perspective grid floor */}
      <div className="synth-grid" />

      {/* 3D scene */}
      <div className="scene-3d absolute inset-0 pointer-events-none">
        <Cube size={120} className="top-[8%] left-[6%] animate-spin3d animate-float-y" />
        <Cube size={70}  className="top-[18%] right-[10%] animate-spin3d-rev" />
        <Cube size={90}  className="bottom-[12%] left-[14%] animate-spin3d-rev animate-float-y" style={{ animationDelay: '1.5s' }} />
        <Cube size={55}  className="bottom-[22%] right-[16%] animate-spin3d" style={{ animationDelay: '2s' }} />
        <Cube size={40}  className="top-[40%] left-[3%] animate-spin3d-rev" />
        <Cube size={45}  className="top-[55%] right-[5%] animate-spin3d animate-float-y" />
      </div>

      {/* floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>


      {/* CONTENT */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md scene-3d fade-up">
          {/* Title */}
          <div className="text-center mb-8 select-none">
            <div className="inline-block animate-float-y">
              <h1 className="font-display text-5xl md:text-6xl title-3d leading-none mb-2">
                NUKED
              </h1>
            </div>
            <div className="font-display text-[10px] subtitle-shimmer mt-3 tracking-[0.3em]">
              [ STUDENT TERMINAL ]
            </div>
          </div>

          {/* CARD */}
          <div className="bg-coffee border-2 border-ink rounded-lg overflow-hidden relative border-pulse">
            <div className="scan-line" />

            {/* card title bar */}
            <div className="bg-ink border-b-2 border-ink px-4 py-2.5 flex items-center justify-between">
              <span className="font-display text-[9px] text-bone uppercase">// AUTH.exe</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-bad border border-ink" />
                <span className="w-2.5 h-2.5 rounded-sm bg-mustard border border-ink" />
                <span className="w-2.5 h-2.5 rounded-sm bg-mossL border border-ink" />
              </div>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="px-5 pb-6 pt-6 space-y-4">
              <div>
                <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">
                  &gt; Roll Number
                </label>
                <input
                  type="text"
                  placeholder="24L-3072"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  className="input-3d w-full bg-ink border-2 border-ink rounded-md px-3 py-2.5 font-mono text-sm text-bone placeholder:text-bone/30 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-display text-[9px] text-bone mb-2 uppercase tracking-wider">
                  &gt; Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-3d w-full bg-ink border-2 border-ink rounded-md px-3 py-2.5 font-mono text-sm text-bone placeholder:text-bone/30 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bone/50 hover:text-bone transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between font-mono text-[11px] pt-1">
                <label className="flex items-center gap-2 text-bone/70 cursor-pointer hover:text-bone transition-colors">
                  <input type="checkbox" className="w-3.5 h-3.5 accent-burn" />
                  REMEMBER_ME
                </label>
                <a href="#" className="text-burn hover:text-bone transition-colors uppercase tracking-wider font-bold">
                  [ FORGOT? ]
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-bone text-ink border-2 border-ink rounded-md px-5 py-3 font-display text-xs uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all inline-flex items-center justify-center gap-2 group"
              >
                <Zap size={14} strokeWidth={3} />
                EXECUTE LOGIN
                <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            {/* status footer */}
            <div className="border-t-2 border-ink bg-ink px-5 py-2 flex items-center justify-between font-mono text-[10px] text-bone/60">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm bg-mossL" />
                <span className="text-mossL">READY</span>
              </span>
              <span>NODE: FAST-LHR-01</span>
            </div>
          </div>

          <div className="text-center font-mono text-[10px] text-bone/40 mt-6 uppercase tracking-wider">
            © 1990–2026 · NUKED SYSTEMS · ALL BITS RESERVED
          </div>
        </div>
      </div>
    </div>
  )
}

function Cube({ size, className, style }) {
  const half = size / 2
  return (
    <div
      className={`cube ${className || ''}`}
      style={{
        width: size,
        height: size,
        '--half': `${half}px`,
        ...style,
      }}
    >
      <div className="face front" />
      <div className="face back" />
      <div className="face right" />
      <div className="face left" />
      <div className="face top" />
      <div className="face bottom" />
    </div>
  )
}
