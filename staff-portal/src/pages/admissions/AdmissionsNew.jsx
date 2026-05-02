import { useState } from 'react'
import { UserPlus, Save } from 'lucide-react'
import { PageHeader, SectionCard, ActionButton } from '../../components/PageShell'

const PROGRAMS = ['BS(SE)', 'BS(CS)', 'BS(AI)', 'BS(DS)', 'BS(EE)', 'MS(SE)']
const BATCHES = ['Fall 2026', 'Spring 2027']

export default function AdmissionsNew() {
  const [form, setForm] = useState({
    rollNo: '', name: '', cnic: '', email: '', mobile: '',
    program: 'BS(SE)', batch: 'Fall 2026', section: 'BSE-251A', campus: 'Lahore',
    dob: '', gender: 'Male', bloodGroup: 'O+', nationality: 'Pakistani',
  })
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5 max-w-[1500px]">
      <PageHeader kicker="Admissions" KickerIcon={UserPlus} title="NEW ADMISSION" subtitle="Create a new student profile at admission time. Credentials are emailed automatically." />

      {saved && (
        <div className="chunky-card p-3 bg-moss text-cream font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
          ✓ Profile created · welcome email queued to {form.email}
        </div>
      )}

      <SectionCard title="Student Particulars">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Roll No"      value={form.rollNo}      onChange={v => set('rollNo', v)}       placeholder="26L-3001" />
          <Field label="Full Name"    value={form.name}        onChange={v => set('name', v)}         placeholder="Full Name" />
          <Field label="CNIC"         value={form.cnic}        onChange={v => set('cnic', v)}         placeholder="35202-XXXXXXX-X" />
          <Field label="Email"        value={form.email}       onChange={v => set('email', v)}        placeholder="name@nu.edu.pk" />
          <Field label="Mobile"       value={form.mobile}      onChange={v => set('mobile', v)}       placeholder="0300-1234567" />
          <Field label="Date of Birth" value={form.dob}        onChange={v => set('dob', v)}          type="date" />
          <Select label="Program"     value={form.program}     onChange={v => set('program', v)}      options={PROGRAMS} />
          <Select label="Batch"       value={form.batch}       onChange={v => set('batch', v)}        options={BATCHES} />
          <Field label="Section"      value={form.section}     onChange={v => set('section', v)} />
          <Field label="Campus"       value={form.campus}      onChange={v => set('campus', v)} />
          <Field label="Blood Group"  value={form.bloodGroup}  onChange={v => set('bloodGroup', v)} />
          <Field label="Nationality"  value={form.nationality} onChange={v => set('nationality', v)} />
        </div>
        <div className="px-5 pb-5 flex justify-end">
          <ActionButton tone="cocoa" Icon={Save} onClick={save} disabled={!form.rollNo || !form.name || !form.email}>Create Profile</ActionButton>
        </div>
      </SectionCard>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; {label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none" />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <div className="text-[10px] font-extrabold text-coffee uppercase tracking-widest mb-1.5">&gt; {label}</div>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-bone border-2 border-ink rounded-md px-3 py-2 font-mono text-sm text-ink focus:outline-none">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}
