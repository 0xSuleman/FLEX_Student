import { useEffect, useMemo, useState, useRef } from 'react'
import { Award, Eye, Pencil, CheckCircle2, Plus, Trash2, AlertTriangle, Save, RotateCcw, Download, Upload, X, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { PageHeader, SectionCard, StatCard } from '../../components/PageShell'

const CATEGORIES = [
  { key: 'QUIZ',        label: 'Quizzes' },
  { key: 'ASSIGNMENT',  label: 'Assignments' },
  { key: 'SESSIONAL_1', label: 'Sessional 1' },
  { key: 'SESSIONAL_2', label: 'Sessional 2' },
  { key: 'FINAL',       label: 'Final Exam' },
]

// Used only as a one-click starter — has no effect until faculty hits Save.
const STARTER_TEMPLATE = [
  { category: 'QUIZ',        name: 'Quiz 1',       components: [{ name: 'Q1', maxMarks: 5,  weightage: 5  }] },
  { category: 'QUIZ',        name: 'Quiz 2',       components: [{ name: 'Q1', maxMarks: 5,  weightage: 5  }] },
  { category: 'ASSIGNMENT',  name: 'Assignment 1', components: [{ name: 'Q1', maxMarks: 10, weightage: 5  }] },
  { category: 'SESSIONAL_1', name: 'Sessional 1',  components: [{ name: 'Q1', maxMarks: 25, weightage: 15 }] },
  { category: 'SESSIONAL_2', name: 'Sessional 2',  components: [{ name: 'Q1', maxMarks: 25, weightage: 15 }] },
  { category: 'FINAL',       name: 'Final Exam',   components: [{ name: 'Q1', maxMarks: 50, weightage: 50 }] },
]

const VIEW = 'view'
const EDIT = 'edit'

let _tmpId = 1
const tempId = () => `tmp_${_tmpId++}`     // negative-style local ID for unsaved rows

export default function FacultyMarks() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [roster, setRoster] = useState([])
  const [instruments, setInstruments] = useState([])
  // marks: { [componentId]: { [enrollmentId]: number } }
  const [marks, setMarks] = useState({})
  const [activeInstrumentId, setActiveInstrumentId] = useState(null)
  const [mode, setMode] = useState(VIEW)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [gradeState, setGradeState] = useState(null)
  const dirtyScoresRef = useRef(new Set())  // componentId|enrollmentId keys with unsaved score edits
  const fileInputRef = useRef(null)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [instrumentsOpen, setInstrumentsOpen] = useState(true)
  const [tableOpen, setTableOpen] = useState(true)          // Whole active-instrument marking-table card

  useEffect(() => {
    api.get('/faculty/courses?semester=Spring%202026')
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : []
        setCourses(arr)
        if (arr.length > 0 && !courseId) setCourseId(arr[0].id)
      })
      .catch(() => setToast({ kind: 'err', text: 'Failed to load courses.' }))
  }, [])

  const loadSection = async (sid) => {
    if (!sid) return
    try {
      const res = await api.get(`/faculty/sections/${sid}/marks`)
      const data = res.data || {}
      setInstruments(data.instruments || [])
      setRoster(data.roster || [])
      setMarks(data.scores || {})
      setGradeState(data.gradeSubmissionState || null)
      setDirty(false)
      dirtyScoresRef.current.clear()
    } catch {
      setInstruments([])
      setRoster([])
      setMarks({})
      setGradeState(null)
      setToast({ kind: 'err', text: 'Failed to load section data.' })
    }
  }

  useEffect(() => { if (courseId) loadSection(courseId) }, [courseId])

  // Keep activeInstrumentId valid
  useEffect(() => {
    if (instruments.length === 0) { setActiveInstrumentId(null); return }
    if (!activeInstrumentId || !instruments.find(i => i.id === activeInstrumentId)) {
      setActiveInstrumentId(instruments[0].id)
    }
  }, [instruments, activeInstrumentId])

  const totalWeight = instruments.reduce((s, ins) =>
    s + (ins.components || []).reduce((cs, c) => cs + (Number(c.weightage) || 0), 0), 0)
  // 4.4.3: weight must not exceed 100. (Was previously "must equal 100" — relaxed.)
  const weightOk = totalWeight <= 100.0001

  const completionByInstrument = useMemo(() => {
    const out = {}
    for (const ins of instruments) {
      let totalCells = roster.length * (ins.components || []).length
      let filled = 0
      for (const c of (ins.components || [])) {
        for (const r of roster) {
          const v = marks[c.id]?.[r.enrollmentId]
          if (v != null) filled += 1
        }
      }
      out[ins.id] = { filled, totalCells, full: totalCells > 0 && filled === totalCells }
    }
    return out
  }, [instruments, marks, roster])

  // ── Instrument CRUD (local) ──
  const addInstrument = (catKey) => {
    const sameCat = instruments.filter(i => i.category === catKey)
    const cat = CATEGORIES.find(c => c.key === catKey)
    const seq = sameCat.length + 1
    const baseMax = catKey === 'FINAL' ? 50 : (catKey === 'SESSIONAL_1' || catKey === 'SESSIONAL_2') ? 25 : catKey === 'ASSIGNMENT' ? 10 : 5
    const newIns = {
      id: tempId(),
      category: catKey,
      name: `${cat.label.replace(/s$/, '')} ${seq}`,
      displayOrder: instruments.length,
      publishState: 'DRAFT',
      components: [{ id: tempId(), name: 'Q1', maxMarks: baseMax, weightage: 5, displayOrder: 0 }],
    }
    setInstruments([...instruments, newIns])
    setDirty(true)
  }

  const removeInstrument = (id) => {
    setInstruments(prev => prev.filter(i => i.id !== id))
    setMarks(prev => {
      const next = { ...prev }
      const ins = instruments.find(i => i.id === id)
      ins?.components?.forEach(c => { delete next[c.id] })
      return next
    })
    setDirty(true)
  }

  const renameInstrument = (id, name) => {
    setInstruments(prev => prev.map(i => i.id === id ? { ...i, name } : i))
    setDirty(true)
  }

  const addComponent = (instrumentId) => {
    setInstruments(prev => prev.map(i => {
      if (i.id !== instrumentId) return i
      const seq = (i.components || []).length + 1
      return {
        ...i,
        components: [...(i.components || []), { id: tempId(), name: `Q${seq}`, maxMarks: 5, weightage: 5, displayOrder: seq - 1 }],
      }
    }))
    setDirty(true)
  }

  const removeComponent = (instrumentId, componentId) => {
    setInstruments(prev => prev.map(i =>
      i.id !== instrumentId ? i : { ...i, components: (i.components || []).filter(c => c.id !== componentId) }
    ))
    setMarks(prev => { const next = { ...prev }; delete next[componentId]; return next })
    setDirty(true)
  }

  const updateComponent = (instrumentId, componentId, patch) => {
    setInstruments(prev => prev.map(i =>
      i.id !== instrumentId ? i : {
        ...i,
        components: (i.components || []).map(c => c.id !== componentId ? c : { ...c, ...patch }),
      }
    ))
    setDirty(true)
  }

  const setMark = (componentId, enrollmentId, value) => {
    setMarks(prev => {
      const sec = { ...(prev[componentId] || {}) }
      if (value == null) delete sec[enrollmentId]; else sec[enrollmentId] = value
      return { ...prev, [componentId]: sec }
    })
    dirtyScoresRef.current.add(`${componentId}|${enrollmentId}`)
    setDirty(true)
  }

  const loadStarter = () => {
    if (instruments.length > 0 && !confirm('This will replace your current instruments. Continue?')) return
    const list = STARTER_TEMPLATE.map((t, i) => ({
      id: tempId(),
      category: t.category,
      name: t.name,
      displayOrder: i,
      publishState: 'DRAFT',
      components: t.components.map((c, j) => ({ id: tempId(), name: c.name, maxMarks: c.maxMarks, weightage: c.weightage, displayOrder: j })),
    }))
    setInstruments(list)
    setMarks({})
    setDirty(true)
  }

  // ── Save: instruments first (definitions), then any dirty scores ──
  const saveAll = async () => {
    if (!courseId) return
    if (!weightOk) {
      setToast({ kind: 'err', text: `Total weight ${totalWeight}% exceeds 100% (req 4.4.3).` })
      clearToastSoon()
      return
    }
    setSaving(true)
    try {
      // Strip temp IDs so the server treats them as inserts.
      const payload = {
        instruments: instruments.map((ins, idx) => ({
          id: typeof ins.id === 'number' ? ins.id : null,
          category: ins.category,
          name: ins.name,
          displayOrder: idx,
          components: (ins.components || []).map((c, j) => ({
            id: typeof c.id === 'number' ? c.id : null,
            name: c.name,
            maxMarks: Number(c.maxMarks) || 0,
            weightage: Number(c.weightage) || 0,
            displayOrder: j,
          })),
        })),
      }
      const res = await api.put(`/faculty/sections/${courseId}/marks/instruments`, payload)
      const data = res.data || {}

      // Server returns canonical IDs. Map our temp components back to server IDs
      // by (instrumentName, componentName, displayOrder) so any dirty scores can
      // be flushed without losing them.
      const serverInstruments = data.instruments || []
      const idRemap = {}    // tempCompId → serverCompId
      instruments.forEach((localIns, i) => {
        const serverIns = serverInstruments[i]
        if (!serverIns) return
        ;(localIns.components || []).forEach((localComp, j) => {
          const serverComp = (serverIns.components || [])[j]
          if (serverComp && typeof localComp.id !== 'number') {
            idRemap[localComp.id] = serverComp.id
          }
        })
      })

      // Flush dirty scores using server IDs.
      const scorePayload = []
      for (const key of dirtyScoresRef.current) {
        const [compIdRaw, enrollIdRaw] = key.split('|')
        const remapped = idRemap[compIdRaw] ?? Number(compIdRaw)
        const enrollmentId = Number(enrollIdRaw)
        const v = (marks[compIdRaw] ?? marks[remapped] ?? {})[enrollmentId]
        scorePayload.push({
          componentId: remapped,
          enrollmentId,
          obtained: v == null ? null : Number(v),
        })
      }
      if (scorePayload.length > 0) {
        await api.put(`/faculty/sections/${courseId}/marks/scores`, { scores: scorePayload })
      }

      // Reload to get authoritative state (publish state, server IDs).
      await loadSection(courseId)
      setToast({ kind: 'ok', text: `Saved · ${serverInstruments.length} instruments` })
    } catch (err) {
      setToast({ kind: 'err', text: 'Save failed: ' + (err.response?.data?.message || err.message) })
    } finally {
      setSaving(false)
      clearToastSoon()
    }
  }

  const discardChanges = async () => {
    if (!confirm('Discard all unsaved changes?')) return
    await loadSection(courseId)
    setToast({ kind: 'info', text: 'Reverted to last saved state.' })
    clearToastSoon()
  }

  const clearToastSoon = () => setTimeout(() => setToast(null), 3500)

  // ── Excel round-trip (req 4.5.3 / 4.5.4) ──
  const downloadTemplate = async () => {
    if (!courseId) return
    if (instruments.length === 0) {
      setToast({ kind: 'err', text: 'Define at least one instrument before downloading the template.' })
      clearToastSoon()
      return
    }
    if (dirty) {
      if (!confirm('You have unsaved changes. Save first, then download?')) return
      await saveAll()
    }
    try {
      const res = await api.get(`/faculty/sections/${courseId}/marks/template`, { responseType: 'blob' })
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `marks-template-section-${courseId}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setToast({ kind: 'ok', text: 'Template downloaded.' })
      clearToastSoon()
    } catch (err) {
      setToast({ kind: 'err', text: 'Download failed: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    }
  }

  const uploadFilledTemplate = async (file) => {
    if (!file || !courseId) return
    setUploading(true)
    setUploadResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post(`/faculty/sections/${courseId}/marks/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const result = res.data || {}
      setUploadResult(result)
      if (result.ok) {
        await loadSection(courseId)
        setToast({ kind: 'ok', text: `Imported · ${result.rowsApplied} scores applied.` })
      } else {
        setToast({ kind: 'err', text: 'Upload rejected — see error panel below.' })
      }
      clearToastSoon()
    } catch (err) {
      setToast({ kind: 'err', text: 'Upload failed: ' + (err.response?.data?.message || err.message) })
      clearToastSoon()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const course = courses.find(c => String(c.id) === String(courseId))
  const activeIns = instruments.find(i => i.id === activeInstrumentId)
  const activeComponents = activeIns?.components || []
  const insTotalMax = activeComponents.reduce((s, c) => s + (Number(c.maxMarks) || 0), 0)
  const insTotalWeight = activeComponents.reduce((s, c) => s + (Number(c.weightage) || 0), 0)

  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    instruments: instruments.filter(i => i.category === cat.key),
    weight: instruments.filter(i => i.category === cat.key)
                       .reduce((s, ins) => s + (ins.components || []).reduce((cs, c) => cs + (Number(c.weightage) || 0), 0), 0),
  }))

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader
        kicker="Evaluation"
        KickerIcon={Award}
        title="MARKS"
        subtitle="Define evaluation instruments, enter per-component scores, then save. Mid-semester marks publish to students immediately; final marks publish only after HOD approval."
      />

      <div className="chunky-card overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-ink bg-tan flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-ink uppercase tracking-widest">&gt; Section</span>
            <select value={courseId || ''} onChange={e => setCourseId(e.target.value)}
              className="bg-bone border-2 border-ink rounded-md px-3 py-1.5 font-mono text-sm text-ink focus:outline-none">
              {courses.length === 0 && <option>No assigned sections</option>}
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} · {c.section}</option>)}
            </select>
          </div>
          <GradeStateBadge state={gradeState} />
          <div className="ml-auto flex items-center gap-2">
            <button onClick={downloadTemplate} disabled={!courseId || instruments.length === 0}
              title="Download Flex-formatted xlsx (req 4.5.3)"
              className="bg-coffee text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Download size={11} strokeWidth={3} /> Template
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
              onChange={(e) => uploadFilledTemplate(e.target.files?.[0])} />
            <button onClick={() => fileInputRef.current?.click()} disabled={!courseId || uploading}
              title="Upload filled marks sheet (req 4.5.3 / 4.5.4)"
              className="bg-mustard text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
              <Upload size={11} strokeWidth={3} /> {uploading ? 'Uploading…' : 'Upload'}
            </button>
            {mode === EDIT && dirty && (
              <>
                <button onClick={discardChanges} disabled={saving}
                  className="bg-bone text-ink border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                  <RotateCcw size={11} strokeWidth={3} /> Discard
                </button>
                <button onClick={saveAll} disabled={saving || !weightOk}
                  className="bg-burn text-bone border-2 border-ink rounded px-3 py-1.5 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1 disabled:opacity-50">
                  <Save size={11} strokeWidth={3} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            <ModeToggle mode={mode} setMode={setMode} />
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setInstrumentsOpen(o => !o)}
              className="flex items-center gap-2 font-display text-[11px] uppercase tracking-widest text-coffee hover:text-ink transition-colors"
              title={instrumentsOpen ? 'Collapse instruments' : 'Expand instruments'}>
              {instrumentsOpen ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
              Instruments
            </button>
            <div className="flex items-center gap-2">
              {instruments.length === 0 && mode === EDIT && (
                <button onClick={loadStarter}
                  className="bg-coffee text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
                  Load Starter Template
                </button>
              )}
              <span className={`tag ${weightOk ? 'bg-moss text-cream' : 'bg-bad text-bone'}`}>
                {weightOk ? `total ${totalWeight}%` : `! total ${totalWeight}% (max 100)`}
              </span>
            </div>
          </div>
          {instrumentsOpen && grouped.map(cat => (
            <div key={cat.key} className="bg-bone border-2 border-ink rounded-md">
              <div className="px-3 py-1.5 bg-coffee text-bone border-b-2 border-ink flex items-center justify-between">
                <span className="font-display text-[10px] uppercase tracking-widest">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="tag bg-bone text-ink">{cat.weight}%</span>
                  {mode === EDIT && (
                    <button onClick={() => addInstrument(cat.key)}
                      className="bg-burn text-bone border-2 border-ink rounded px-2 py-0.5 font-display text-[9px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                      <Plus size={10} strokeWidth={3} /> Add
                    </button>
                  )}
                </div>
              </div>
              <div className="p-2 flex flex-wrap gap-2">
                {cat.instruments.length === 0 && (
                  <div className="text-[11px] font-bold text-cocoa uppercase tracking-wider px-2 py-1.5">
                    {mode === EDIT ? 'No items yet — click Add.' : 'No items defined.'}
                  </div>
                )}
                {cat.instruments.map(ins => {
                  const cmp = completionByInstrument[ins.id] || { filled: 0, totalCells: 0, full: false }
                  const isActive = activeInstrumentId === ins.id
                  const insWeight = (ins.components || []).reduce((s, c) => s + (Number(c.weightage) || 0), 0)
                  return (
                    <div key={ins.id} className={`flex items-center gap-1 border-2 rounded-md ${isActive ? 'border-burn bg-cream' : 'border-ink bg-cream'}`}>
                      <button onClick={() => setActiveInstrumentId(ins.id)}
                        className="px-3 py-1.5 text-[11px] font-extrabold text-ink uppercase tracking-wider inline-flex items-center gap-2">
                        {mode === EDIT ? (
                          <input value={ins.name} onChange={(e) => renameInstrument(ins.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-bone border-2 border-ink rounded px-1.5 py-0.5 font-extrabold text-[11px] uppercase tracking-wider text-ink focus:outline-none w-32" />
                        ) : (
                          <span>{ins.name}</span>
                        )}
                        <span className="tag bg-coffee text-bone">{insWeight}%</span>
                        <span className="tag bg-bone text-ink">{(ins.components || []).length} part{(ins.components || []).length !== 1 ? 's' : ''}</span>
                        <PublishBadge state={ins.publishState} category={ins.category} />
                        {cmp.full && <CheckCircle2 size={12} strokeWidth={3} className="text-moss" />}
                      </button>
                      {mode === EDIT && (
                        <button onClick={() => removeInstrument(ins.id)} title="Remove instrument"
                          className="bg-bad text-bone border-l-2 border-ink rounded-r-md p-1 hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                          <Trash2 size={11} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div className={`chunky-card p-3 flex items-center gap-2 ${toast.kind === 'ok' ? 'bg-moss text-cream' : toast.kind === 'err' ? 'bg-bad text-bone' : 'bg-cocoa text-bone'}`}>
          {toast.kind === 'ok' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
          <span className="text-xs font-extrabold uppercase tracking-wider">{toast.text}</span>
        </div>
      )}

      {uploadResult && !uploadResult.ok && (
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3 border-b-2 border-ink bg-bad text-bone flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={3} />
              <span className="font-display text-sm uppercase tracking-wider">Upload Rejected</span>
            </div>
            <button onClick={() => setUploadResult(null)} className="hover:opacity-70" title="Dismiss">
              <X size={16} strokeWidth={3} />
            </button>
          </div>
          <div className="p-4 space-y-2 text-xs text-ink">
            {(uploadResult.structureErrors || []).length > 0 && (
              <div>
                <div className="font-extrabold text-bad uppercase tracking-wider mb-1.5">Structure errors (req 4.5.4)</div>
                <ul className="list-disc list-inside space-y-1 text-cocoa">
                  {uploadResult.structureErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            {(uploadResult.errors || []).length > 0 && (
              <div>
                <div className="font-extrabold text-bad uppercase tracking-wider mt-2 mb-1.5">Row errors</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-bone border-b-2 border-ink text-coffee">
                      <th className="px-3 py-1.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Row</th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Roll</th>
                      <th className="px-3 py-1.5 text-left text-[10px] font-extrabold uppercase tracking-widest">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.errors.map((e, i) => (
                      <tr key={i} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                        <td className="px-3 py-1.5 font-mono text-cocoa">{e.rowNumber}</td>
                        <td className="px-3 py-1.5 font-mono text-ink">{e.rollNo}</td>
                        <td className="px-3 py-1.5 text-ink">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Students" value={roster.length} tone="bg-cocoa text-bone" />
        <StatCard label="Instruments" value={instruments.length} tone="bg-coffee text-bone" />
        <StatCard label="Active" value={activeIns?.name || '—'} tone="bg-mustard text-ink" />
        <StatCard label="Active Total" value={activeIns ? `${insTotalWeight}% · /${insTotalMax}` : '—'} tone="bg-bone text-ink" />
      </div>

      {activeIns && (
        <div className="chunky-card overflow-hidden">
          <div className="px-5 py-3.5 border-b-2 border-ink bg-tan flex items-center justify-between gap-3">
            <button onClick={() => setTableOpen(o => !o)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              title={tableOpen ? 'Collapse this instrument' : 'Expand this instrument'}>
              {tableOpen ? <ChevronDown size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
              <h3 className="heading-retro text-sm">{activeIns.name} — {course?.courseCode || ''} · {course?.section || ''}</h3>
            </button>
            {mode === EDIT && tableOpen && (
              <button onClick={() => addComponent(activeIns.id)}
                className="bg-burn text-bone border-2 border-ink rounded px-2.5 py-1 font-display text-[10px] uppercase tracking-wider shadow-pixel-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all inline-flex items-center gap-1">
                <Plus size={11} strokeWidth={3} /> Add Component
              </button>
            )}
          </div>
          {tableOpen && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bone border-b-2 border-ink text-coffee">
                  <Th>#</Th><Th>Roll</Th><Th>Name</Th>
                  {activeComponents.map(c => (
                    <th key={c.id} className="px-3 py-2.5 text-center text-[10px] font-extrabold uppercase tracking-widest border-l border-dashed border-cocoa/30">
                      <div className="flex items-center justify-center gap-1">
                        {mode === EDIT ? (
                          <input value={c.name} onChange={(e) => updateComponent(activeIns.id, c.id, { name: e.target.value })}
                            className="w-14 bg-cream border border-ink rounded px-1 py-0.5 font-extrabold text-[10px] uppercase tracking-wider text-ink text-center focus:outline-none" />
                        ) : c.name}
                        {mode === EDIT && activeComponents.length > 1 && (
                          <button onClick={() => removeComponent(activeIns.id, c.id)} title="Remove component"
                            className="bg-bad text-bone border border-ink rounded p-0.5 hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
                            <Trash2 size={9} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <Th center>Total</Th>
                </tr>
                <tr className="bg-tan border-b border-dashed border-cocoa/40">
                  <td colSpan="3" className="px-5 py-2 text-right text-[10px] font-extrabold text-ink uppercase tracking-widest">Max Marks →</td>
                  {activeComponents.map(c => (
                    <td key={c.id} className="px-3 py-2 text-center border-l border-dashed border-cocoa/30">
                      <input
                        type="number" min="0" step="0.5" value={c.maxMarks === 0 ? '' : c.maxMarks}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') { updateComponent(activeIns.id, c.id, { maxMarks: 0 }); return }
                          const n = Math.max(0, parseFloat(raw))
                          if (!isNaN(n)) updateComponent(activeIns.id, c.id, { maxMarks: n })
                        }}
                        placeholder="0"
                        className="w-16 bg-bone border-2 border-ink rounded px-1.5 py-1 font-mono text-sm text-ink text-center focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center"><span className="tag bg-cocoa text-bone">{insTotalMax}</span></td>
                </tr>
                <tr className="bg-tan border-b-2 border-ink">
                  <td colSpan="3" className="px-5 py-2 text-right text-[10px] font-extrabold text-ink uppercase tracking-widest">Weightage % →</td>
                  {activeComponents.map(c => (
                    <td key={c.id} className="px-3 py-2 text-center border-l border-dashed border-cocoa/30">
                      <input
                        type="number" min="0" step="0.5" value={c.weightage === 0 ? '' : c.weightage}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (raw === '') { updateComponent(activeIns.id, c.id, { weightage: 0 }); return }
                          const n = Math.max(0, parseFloat(raw))
                          if (!isNaN(n)) updateComponent(activeIns.id, c.id, { weightage: n })
                        }}
                        placeholder="0"
                        className="w-16 bg-bone border-2 border-ink rounded px-1.5 py-1 font-mono text-sm text-ink text-center focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center"><span className="tag bg-coffee text-bone">{insTotalWeight}%</span></td>
                </tr>
              </thead>
              <tbody>
                {roster.map((r, i) => {
                  let rowTotal = 0
                  return (
                    <tr key={r.enrollmentId} className={`border-b border-dashed border-cocoa/30 ${i % 2 === 0 ? 'bg-cream' : 'bg-bone/50'}`}>
                      <td className="px-5 py-2.5 text-cocoa font-bold text-xs">{i + 1}</td>
                      <td className="px-5 py-2.5 font-extrabold text-ink">{r.rollNo}</td>
                      <td className="px-5 py-2.5 text-ink">{r.name}</td>
                      {activeComponents.map(c => {
                        const v = marks[c.id]?.[r.enrollmentId]
                        if (v != null) rowTotal += Number(v) || 0
                        return (
                          <td key={c.id} className="px-3 py-2 text-center border-l border-dashed border-cocoa/20">
                            {mode === EDIT ? (
                              <input
                                type="number" min="0" max={c.maxMarks} step="0.5" value={v ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value
                                  if (raw === '') { setMark(c.id, r.enrollmentId, null); return }
                                  const n = Math.max(0, Math.min(c.maxMarks || 0, parseFloat(raw)))
                                  if (!isNaN(n)) setMark(c.id, r.enrollmentId, n)
                                }}
                                placeholder="—"
                                className="w-16 bg-bone border-2 border-ink rounded px-1.5 py-1 font-mono text-sm text-ink text-center focus:outline-none"
                              />
                            ) : (
                              <span className={`tag ${v == null ? 'bg-bone text-cocoa' : 'bg-coffee text-bone'}`}>{v == null ? '—' : v}</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-center"><span className="tag bg-cocoa text-bone">{rowTotal} / {insTotalMax}</span></td>
                    </tr>
                  )
                })}
                {roster.length === 0 && (
                  <tr><td colSpan={4 + activeComponents.length} className="px-5 py-8 text-center text-cocoa font-bold text-xs uppercase tracking-wider">No students.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="inline-flex border-2 border-ink rounded-md overflow-hidden shadow-pixel-sm">
      <button onClick={() => setMode(VIEW)}
        className={`px-3 py-1.5 font-display text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 ${mode === VIEW ? 'bg-cocoa text-bone' : 'bg-bone text-ink hover:bg-tan/40'}`}>
        <Eye size={11} strokeWidth={3} /> View
      </button>
      <button onClick={() => setMode(EDIT)}
        className={`px-3 py-1.5 font-display text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 border-l-2 border-ink ${mode === EDIT ? 'bg-cocoa text-bone' : 'bg-bone text-ink hover:bg-tan/40'}`}>
        <Pencil size={11} strokeWidth={3} /> Edit
      </button>
    </div>
  )
}

function PublishBadge({ state, category }) {
  if (category === 'FINAL') {
    return state === 'PUBLISHED'
      ? <span className="tag bg-moss text-cream">PUBLISHED</span>
      : <span className="tag bg-mustard text-ink">FINAL · HELD</span>
  }
  return state === 'PUBLISHED'
    ? <span className="tag bg-moss text-cream">PUBLISHED</span>
    : <span className="tag bg-bone text-cocoa">DRAFT</span>
}

function GradeStateBadge({ state }) {
  if (!state) return null
  const tone = {
    DRAFT:     'bg-bone text-cocoa',
    SUBMITTED: 'bg-mustard text-ink',
    APPROVED:  'bg-moss text-cream',
    REJECTED:  'bg-bad text-bone',
  }[state] || 'bg-bone text-cocoa'
  return (
    <span className={`tag ${tone}`} title="Grade-list submission state">GRADES · {state}</span>
  )
}

function Th({ children, center }) {
  return <th className={`px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest ${center ? 'text-center' : 'text-left'}`}>{children}</th>
}
