import React, { useState, useEffect } from 'react'
import { api } from '../../api'

const COLORS = ['#7A1F3D', '#2B4FB5', '#1A6B4A', '#8B3A00', '#4A2080', '#B5401F', '#1F6B6B', '#7A5A00']

function IssuePassModal({ event, passTypes, onClose, onIssued }) {
  const [form, setForm] = useState({ pass_type_id: passTypes[0]?.id || '', admits_total: passTypes[0]?.admits_per_pass || 1, quantity: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await api.createPass(event.id, { ...form, admits_total: parseInt(form.admits_total), quantity: parseInt(form.quantity) || 1 })
      onIssued(res)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  function onTypeChange(id) {
    const pt = passTypes.find(p => p.id === id)
    set('pass_type_id', id)
    if (pt) set('admits_total', pt.admits_per_pass)
  }

  const qty = parseInt(form.quantity) || 1

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Issue passes</div>
        <form onSubmit={submit}>
          {passTypes.length > 0 && (
            <div className="form-group">
              <label className="form-label">Pass type</label>
              <select className="form-input" value={form.pass_type_id} onChange={e => onTypeChange(e.target.value)}>
                <option value="">No type (custom)</option>
                {passTypes.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.night_label} – {pt.admits_per_pass} admit{pt.admits_per_pass !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input className="form-input" type="number" min="1" max="10000" value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Admits per pass *</label>
              <input className="form-input" type="number" min="1" max="50" value={form.admits_total} onChange={e => set('admits_total', e.target.value)} required />
            </div>
          </div>
          {qty > 1 && (
            <div style={{ fontSize: 13, color: '#9A8A92', marginBottom: 12, padding: '8px 12px', background: '#1A1210', borderRadius: 8 }}>
              {qty.toLocaleString()} unassigned passes will be created. Holders will be set when passes are claimed.
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Issuing…' : qty > 1 ? `Issue ${qty.toLocaleString()} passes` : 'Issue pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkSendModal({ eventId, onClose, onDone }) {
  const [text, setText] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const emails = [...new Set(
    text.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'))
  )]

  async function submit(e) {
    e.preventDefault()
    if (!emails.length) return
    setLoading(true)
    const res = await Promise.allSettled(
      emails.map(email => api.orgSendPass('__next__', email, eventId))
    )
    setResults(res.map((r, i) => ({ email: emails[i], ok: r.status === 'fulfilled', err: r.reason?.message })))
    setLoading(false)
    onDone()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-title">Send passes by email</div>

        {!results ? (
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Customer emails</label>
              <textarea
                className="form-input"
                autoFocus
                rows={6}
                placeholder={"one@example.com\ntwo@example.com\nthree@example.com"}
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              />
              <div style={{ fontSize: 12, color: '#9A8A92', marginTop: 6 }}>
                One email per line (or comma separated). {emails.length > 0 && <strong style={{ color: '#E8E0DC' }}>{emails.length} email{emails.length !== 1 ? 's' : ''} detected</strong>}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || !emails.length}>
                {loading ? 'Sending…' : `Send to ${emails.length || '?'} people`}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              <span style={{ color: '#4ADE80', fontWeight: 700 }}>{results.filter(r => r.ok).length} sent</span>
              {results.filter(r => !r.ok).length > 0 && <span style={{ color: '#FCA5A5', fontWeight: 700, marginLeft: 12 }}>{results.filter(r => !r.ok).length} failed</span>}
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(r => (
                <div key={r.email} style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: r.ok ? '#4ADE80' : '#FCA5A5' }}>{r.ok ? '✓' : '✗'}</span>
                  <span style={{ flex: 1, color: '#E8E0DC' }}>{r.email}</span>
                  {!r.ok && <span style={{ color: '#9A8A92', fontSize: 11 }}>{r.err}</span>}
                </div>
              ))}
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SendPassModal({ pass, onClose, onSent }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return setError('Enter an email')
    setLoading(true); setError('')
    try {
      await api.orgSendPass(pass.id, email.trim())
      onSent()
    } catch (err) {
      setError(err.message); setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Send pass {pass.id}</div>
        <p style={{ fontSize: 13, color: '#9A8A92', marginBottom: 16 }}>
          Enter the customer's email. They'll receive an email to access this pass after logging in.
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Customer email *</label>
            <input className="form-input" type="email" autoFocus placeholder="customer@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Send pass'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddPassTypeModal({ eventId, onClose, onAdded }) {
  const [form, setForm] = useState({ night_label: '', color_hex: COLORS[0], event_date: '', gate_open_time: '', admits_per_pass: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { pass_type } = await api.createPassType(eventId, { ...form, admits_per_pass: parseInt(form.admits_per_pass) || 1 })
      onAdded(pass_type)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Add pass type</div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Label *</label>
              <input className="form-input" placeholder="Night 1" value={form.night_label} onChange={e => set('night_label', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Admits per pass</label>
              <input className="form-input" type="number" min="1" value={form.admits_per_pass} onChange={e => set('admits_per_pass', e.target.value)} />
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
              {COLORS.map(c => <div key={c} className={`color-swatch${form.color_hex === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => set('color_hex', c)} />)}
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EventDetailScreen({ eventId, onNav }) {
  const [data, setData] = useState(null)
  const [passes, setPasses] = useState([])
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [showIssue, setShowIssue] = useState(false)
  const [showAddPT, setShowAddPT] = useState(false)
  const [sendPass, setSendPass] = useState(null)
  const [showBulkSend, setShowBulkSend] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      const [d, p, e] = await Promise.all([api.getEvent(eventId), api.getPasses(eventId), api.getEntries(eventId)])
      setData(d); setPasses(p.passes); setEntries(e.entries)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [eventId])

  async function deletePassType(id) {
    if (!confirm('Delete this pass type?')) return
    await api.deletePassType(id)
    load()
  }

  async function revokePass(id) {
    if (!confirm('Revoke this pass? This cannot be undone.')) return
    await api.revokePass(id)
    load()
  }

  async function resetEntries(id) {
    if (!confirm('Reset all entries for this pass?')) return
    await api.resetEntries(id)
    load()
  }

  async function updateStatus(status) {
    await api.updateEvent(eventId, { status })
    load()
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!data) return <div className="page"><div className="empty"><div className="empty-title">Event not found</div></div></div>

  const { event, pass_types, stats } = data

  const filteredPasses = passes.filter(p =>
    !search || p.holder_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.holder_email?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      {showIssue && <IssuePassModal event={event} passTypes={pass_types} onClose={() => setShowIssue(false)} onIssued={() => { setShowIssue(false); load() }} />}
      {showAddPT && <AddPassTypeModal eventId={eventId} onClose={() => setShowAddPT(false)} onAdded={() => { setShowAddPT(false); load() }} />}
      {sendPass && <SendPassModal pass={sendPass} onClose={() => setSendPass(null)} onSent={() => { setSendPass(null); load() }} />}
      {showBulkSend && <BulkSendModal eventId={eventId} onClose={() => setShowBulkSend(false)} onDone={load} />}
      {shareLink && (
        <div className="modal-backdrop" onClick={() => setShareLink(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Share link created</div>
            <p style={{ fontSize: 13, color: '#9A8A92', marginBottom: 12 }}>
              Share this link on WhatsApp or anywhere. Each customer who opens it and logs in gets one pass automatically.
              <strong style={{ color: '#4ADE80', display: 'block', marginTop: 6 }}>{shareLink.total} passes available</strong>
            </p>
            <div style={{ background: '#0F0D0E', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', color: '#E8E0DC', marginBottom: 16 }}>
              {shareLink.url}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { navigator.clipboard.writeText(shareLink.url); }}>Copy link</button>
              <button className="btn btn-ghost" onClick={() => setShareLink(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => onNav('events')}>← Events</button>
          <h1 className="page-title">{event.name}</h1>
          <div className="page-subtitle">{event.venue}{event.location ? ` · ${event.location}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => onNav('scanner', { eventId })}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
            Scanner
          </button>
          <button className="btn btn-primary" onClick={() => setShowIssue(true)}>Issue pass</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Passes issued', value: stats.passes_issued },
          { label: 'Total admits', value: stats.admits_total },
          { label: 'Admits used', value: stats.admits_used, color: '#93C5FD' },
          { label: 'Entries today', value: stats.entries_today, color: '#4ADE80' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24, ...(s.color ? { color: s.color } : {}) }}>{s.value ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['overview', 'pass-types', 'passes', 'entries'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'pass-types' ? 'Pass Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'passes' && ` (${passes.length})`}
            {t === 'entries' && ` (${entries.length})`}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="card">
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['draft', 'active', 'ended'].map(s => (
                <button key={s} className={`btn btn-sm ${event.status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => updateStatus(s)}>{s}</button>
              ))}
            </div>
          </div>
          {event.description && (
            <div className="form-group">
              <label className="form-label">Description</label>
              <div style={{ fontSize: 14, color: '#9A8A92', lineHeight: 1.5 }}>{event.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Pass types */}
      {tab === 'pass-types' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddPT(true)}>+ Add pass type</button>
          </div>
          {pass_types.length === 0 ? (
            <div className="empty"><div className="empty-title">No pass types yet</div><div className="empty-desc">Add pass types to organize your passes by night or category.</div></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Label</th><th>Color</th><th>Date</th><th>Gate opens</th><th>Admits/pass</th><th></th></tr></thead>
                <tbody>
                  {pass_types.map(pt => (
                    <tr key={pt.id}>
                      <td style={{ fontWeight: 600 }}>{pt.night_label}</td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="color-dot" style={{ background: pt.color_hex }} />{pt.color_name || pt.color_hex}</div></td>
                      <td className="text-muted">{pt.event_date || '—'}</td>
                      <td className="text-muted">{pt.gate_open_time || '—'}</td>
                      <td>{pt.admits_per_pass}</td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => deletePassType(pt.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Passes */}
      {tab === 'passes' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="form-input" placeholder="Search by name, email, or pass ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280, flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => setShowBulkSend(true)}>Send by email</button>
            <button className="btn btn-ghost btn-sm" onClick={async () => {
              const res = await api.createBatch(eventId, {})
              const url = `${window.location.origin}/?claim=${res.token}`
              setShareLink({ url, total: res.total })
            }}>Share link</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowIssue(true)}>Issue pass</button>
          </div>
          {filteredPasses.length === 0 ? (
            <div className="empty"><div className="empty-title">No passes yet</div></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Pass ID</th><th>Holder</th><th>Admits</th><th>Status</th><th>Issued</th><th></th></tr></thead>
                <tbody>
                  {filteredPasses.map(p => (
                    <tr key={p.id}>
                      <td><span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: '#FFB0C8' }}>{p.id}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.holder_name || <span className="text-muted">—</span>}</div>
                        <div style={{ fontSize: 12, color: '#6B5A62' }}>{p.holder_email || ''}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{p.admits_used}</span>
                        <span className="text-muted">/{p.admits_total}</span>
                        {p.admits_total - p.admits_used > 0 && <span style={{ fontSize: 11, color: '#16A34A', marginLeft: 4 }}>{p.admits_total - p.admits_used} left</span>}
                      </td>
                      <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                      <td className="text-muted text-sm">{new Date(p.issued_at * 1000).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.status !== 'revoked' && <button className="btn btn-primary btn-sm" onClick={() => setSendPass(p)}>Send</button>}
                          <button className="btn btn-ghost btn-sm" onClick={() => resetEntries(p.id)}>Reset</button>
                          {p.status !== 'revoked' && <button className="btn btn-danger btn-sm" onClick={() => revokePass(p.id)}>Revoke</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Entries */}
      {tab === 'entries' && (
        <div>
          {entries.length === 0 ? (
            <div className="empty"><div className="empty-title">No entries yet</div><div className="empty-desc">Entries will appear here after scanning passes at the gate.</div></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Pass ID</th><th>Holder</th><th>Admitted</th><th>Gate</th><th>Time</th></tr></thead>
                <tbody>
                  {entries.map(en => (
                    <tr key={en.id}>
                      <td><span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: '#FFB0C8' }}>{en.pass_id}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{en.holder_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#6B5A62' }}>{en.holder_email || ''}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#4ADE80' }}>+{en.count} {en.count === 1 ? 'person' : 'people'}</td>
                      <td className="text-muted">{en.gate || '—'}</td>
                      <td className="text-muted text-sm">{new Date(en.scanned_at * 1000).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
