import React, { useState } from 'react'
import { api } from '../../api'

const COLORS = ['#7A1F3D', '#2B4FB5', '#1A6B4A', '#8B3A00', '#4A2080', '#B5401F', '#1F6B6B', '#7A5A00']

function PassTypeForm({ onAdd }) {
  const [form, setForm] = useState({ night_label: '', color_hex: COLORS[0], event_date: '', gate_open_time: '', admits_per_pass: 1 })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function submit(e) {
    e.preventDefault()
    if (!form.night_label) return
    onAdd({ ...form, admits_per_pass: parseInt(form.admits_per_pass) || 1 })
    setForm({ night_label: '', color_hex: COLORS[0], event_date: '', gate_open_time: '', admits_per_pass: 1 })
  }

  return (
    <div className="card-sm" style={{ border: '1.5px dashed #3A2A32' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3A42', marginBottom: 12 }}>Add pass type</div>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Label (e.g. Night 1)</label>
            <input className="form-input" placeholder="Night 1" value={form.night_label} onChange={e => set('night_label', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Admits per pass</label>
            <input className="form-input" type="number" min="1" max="20" value={form.admits_per_pass} onChange={e => set('admits_per_pass', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Event date</label>
            <input className="form-input" type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Gate opens</label>
            <input className="form-input" type="time" value={form.gate_open_time} onChange={e => set('gate_open_time', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="color-swatches">
            {COLORS.map(c => (
              <div key={c} className={`color-swatch${form.color_hex === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => set('color_hex', c)} />
            ))}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" type="submit">+ Add pass type</button>
      </form>
    </div>
  )
}

export default function CreateEventScreen({ onNav }) {
  const [step, setStep] = useState(1)
  const [eventForm, setEventForm] = useState({ name: '', venue: '', location: '', description: '' })
  const [passTypes, setPassTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setEv = (k, v) => setEventForm(f => ({ ...f, [k]: v }))

  async function create() {
    if (!eventForm.name) return setError('Event name is required')
    setLoading(true)
    setError('')
    try {
      const { event } = await api.createEvent(eventForm)
      for (const pt of passTypes) {
        await api.createPassType(event.id, pt)
      }
      onNav('event-detail', { eventId: event.id })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => onNav('events')}>← Back</button>
          <h1 className="page-title">Create event</h1>
        </div>
      </div>

      {/* Step 1: Event details */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7A1F3D', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>Event details</div>
        <div className="form-group">
          <label className="form-label">Event name *</label>
          <input className="form-input" placeholder="Sheri Garba Utsav 2026" value={eventForm.name} onChange={e => setEv('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input className="form-input" placeholder="Riverfront Grounds" value={eventForm.venue} onChange={e => setEv('venue', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City / location</label>
            <input className="form-input" placeholder="Ahmedabad" value={eventForm.location} onChange={e => setEv('location', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" rows={3} placeholder="Tell guests about the event…" value={eventForm.description} onChange={e => setEv('description', e.target.value)} style={{ resize: 'vertical' }} />
        </div>
      </div>

      {/* Step 2: Pass types */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7A1F3D', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>Pass types <span style={{ color: '#6B5A62', fontWeight: 400 }}>(optional)</span></div>

        {passTypes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {passTypes.map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#231A1F', borderRadius: 8 }}>
                <div className="color-dot" style={{ background: pt.color_hex }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{pt.night_label}</div>
                  <div style={{ fontSize: 12, color: '#7A6A72' }}>{pt.admits_per_pass} admit{pt.admits_per_pass !== 1 ? 's' : ''}{pt.event_date ? ` · ${pt.event_date}` : ''}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPassTypes(pts => pts.filter((_, j) => j !== i))}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <PassTypeForm onAdd={pt => setPassTypes(pts => [...pts, pt])} />
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" onClick={() => onNav('events')}>Cancel</button>
        <button className="btn btn-primary btn-lg" onClick={create} disabled={loading || !eventForm.name}>
          {loading ? 'Creating…' : 'Create event'}
        </button>
      </div>
    </div>
  )
}
