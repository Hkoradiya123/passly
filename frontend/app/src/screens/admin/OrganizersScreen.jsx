import React, { useState, useEffect } from 'react'
import { api } from '../../api'

function OrgDetail({ orgId, onClose, onDelete }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.getOrganizer(orgId).then(setData).catch(() => {})
  }, [orgId])

  async function handleDelete() {
    if (!confirm('Delete this organizer and ALL their data? This is permanent.')) return
    try { await api.deleteOrganizer(orgId); onDelete() } catch (e) { alert(e.message) }
  }

  if (!data) return <div className="detail-panel"><div className="loading"><div className="spinner" /></div></div>

  const { organizer: org, events } = data

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div>
          <div className="detail-name">{org.name}</div>
          <div className="detail-email">{org.email}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete organizer</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#5A4A52', marginBottom: 12 }}>
        Joined {new Date(org.created_at * 1000).toLocaleDateString()} · {events.length} events
      </div>

      {events.length === 0 ? (
        <div className="empty"><div className="empty-title">No events yet</div></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Event</th><th>Venue</th><th>Status</th><th>Passes</th><th>Admits Used</th></tr></thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td className="strong">{ev.name}</td>
                  <td className="text-muted">{ev.venue || '—'}</td>
                  <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                  <td>{ev.passes_count}</td>
                  <td>{ev.admits_used}/{ev.admits_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function OrganizersScreen() {
  const [orgs, setOrgs] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load(q = '') {
    setLoading(true)
    try { const d = await api.getOrganizers(q); setOrgs(d.organizers) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleSearch(e) {
    e.preventDefault()
    load(search)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organizers</h1>
          <div className="page-subtitle">{orgs.length} registered</div>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input className="search-input" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-ghost btn-sm" type="submit">Search</button>
      </form>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <>
          <div className="table-wrap" style={{ marginBottom: selected ? 0 : 0 }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Events</th><th>Passes</th><th>Entries</th><th>Joined</th><th></th></tr>
              </thead>
              <tbody>
                {orgs.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty"><div className="empty-title">No organizers found</div></div></td></tr>
                ) : orgs.map(o => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === o.id ? null : o.id)}>
                    <td className="strong">{o.name}</td>
                    <td className="text-muted">{o.email}</td>
                    <td>{o.events_count}</td>
                    <td>{o.passes_count}</td>
                    <td style={{ color: '#4ADE80', fontWeight: o.total_entries > 0 ? 700 : undefined }}>{o.total_entries}</td>
                    <td className="text-muted text-sm">{new Date(o.created_at * 1000).toLocaleDateString()}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(selected === o.id ? null : o.id) }}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <OrgDetail
              orgId={selected}
              onClose={() => setSelected(null)}
              onDelete={() => { setSelected(null); load(search) }}
            />
          )}
        </>
      )}
    </div>
  )
}
