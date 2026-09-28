import React, { useState, useEffect } from 'react'
import { api } from '../../api'

export default function EventsScreen() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const qs = params.toString() ? `?${params}` : ''
    try { const d = await api.getEvents(qs); setEvents(d.events) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Events</h1>
          <div className="page-subtitle">{events.length} events across all organizers</div>
        </div>
      </div>

      <form className="search-bar" onSubmit={e => { e.preventDefault(); load() }}>
        <input className="search-input" placeholder="Search events, venues, organizers…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ background: '#0F0D0E', border: '1px solid #2A1F1C', color: '#F0ECE8', padding: '7px 10px', borderRadius: 7, fontSize: 13, fontFamily: 'inherit' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="ended">Ended</option>
        </select>
        <button className="btn btn-ghost btn-sm" type="submit">Filter</button>
      </form>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Event</th><th>Organizer</th><th>Venue</th><th>Status</th><th>Passes</th><th>Admits Used</th><th>Created</th></tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={7}><div className="empty"><div className="empty-title">No events found</div></div></td></tr>
              ) : events.map(ev => (
                <tr key={ev.id}>
                  <td>
                    <div className="strong">{ev.name}</div>
                    <div className="text-muted text-sm font-mono">{ev.id}</div>
                  </td>
                  <td>
                    <div className="strong">{ev.organizer_name}</div>
                    <div className="text-muted text-sm">{ev.organizer_email}</div>
                  </td>
                  <td className="text-muted">{ev.venue || '—'}</td>
                  <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                  <td>{ev.passes_count}</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{ev.admits_used}</span>
                    <span className="text-muted">/{ev.admits_total}</span>
                    {ev.admits_total > 0 && <span style={{ fontSize: 11, color: '#5A4A52', marginLeft: 4 }}>({Math.round(ev.admits_used/ev.admits_total*100)}%)</span>}
                  </td>
                  <td className="text-muted text-sm">{new Date(ev.created_at * 1000).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
