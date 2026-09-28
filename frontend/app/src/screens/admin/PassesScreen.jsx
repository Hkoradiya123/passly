import React, { useState, useEffect } from 'react'
import { api } from '../../api'

export default function PassesScreen() {
  const [passes, setPasses] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const qs = params.toString() ? `?${params}` : ''
    try { const d = await api.getPasses(qs); setPasses(d.passes) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Passes</h1>
          <div className="page-subtitle">{passes.length} passes platform-wide</div>
        </div>
      </div>

      <form className="search-bar" onSubmit={e => { e.preventDefault(); load() }}>
        <input className="search-input" placeholder="Search by pass ID, holder name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ background: '#0F0D0E', border: '1px solid #2A1F1C', color: '#F0ECE8', padding: '7px 10px', borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="checked_in">Checked in</option>
          <option value="revoked">Revoked</option>
          <option value="transfer_pending">Transfer pending</option>
        </select>
        <button className="btn btn-ghost btn-sm" type="submit">Search</button>
      </form>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Pass ID</th><th>Holder</th><th>Event</th><th>Organizer</th><th>Admits</th><th>Status</th><th>Issued</th></tr>
            </thead>
            <tbody>
              {passes.length === 0 ? (
                <tr><td colSpan={7}><div className="empty"><div className="empty-title">No passes found</div></div></td></tr>
              ) : passes.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="mono">{p.id}</div>
                    {p.night_label && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        {p.color_hex && <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color_hex, flexShrink: 0 }} />}
                        <span className="text-muted text-sm">{p.night_label}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="strong">{p.holder_name || <span className="text-muted">—</span>}</div>
                    <div className="text-muted text-sm">{p.holder_email || ''}</div>
                  </td>
                  <td className="text-muted">{p.event_name}</td>
                  <td className="text-muted">{p.organizer_name}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: p.admits_used > 0 ? '#4ADE80' : undefined }}>{p.admits_used}</span>
                    <span className="text-muted">/{p.admits_total}</span>
                  </td>
                  <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                  <td className="text-muted text-sm">{new Date(p.issued_at * 1000).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
