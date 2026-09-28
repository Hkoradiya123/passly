import React, { useState, useEffect } from 'react'
import { api } from '../../api'

function fmt(n) { return typeof n === 'number' ? n.toLocaleString() : n ?? '—' }

export default function DashboardScreen({ onNav }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboard().then(setData).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="page"><div className="empty"><div className="empty-title">Failed to load</div><div className="empty-desc">{error}</div></div></div>
  if (!data) return <div className="loading"><div className="spinner" /></div>

  const user = JSON.parse(localStorage.getItem('rp_user') || '{}')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {user.name?.split(' ')[0] || 'there'}</h1>
          <div className="page-subtitle">Here's what's happening today</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('create-event')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New event
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{fmt(data.events)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passes Issued</div>
          <div className="stat-value">{fmt(data.passes)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entries Today</div>
          <div className="stat-value" style={{ color: '#4ADE80' }}>{fmt(data.entries_today)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Events</div>
          <div className="stat-value">{data.upcoming_events?.filter(e => e.status === 'active').length ?? 0}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Events</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('events')}>View all</button>
        </div>

        {data.upcoming_events?.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No events yet</div>
            <div className="empty-desc" style={{ marginBottom: 16 }}>Create your first event to start managing passes.</div>
            <button className="btn btn-primary" onClick={() => onNav('create-event')}>Create event</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Passes</th>
                  <th>Entries today</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming_events.map(ev => (
                  <tr key={ev.id} style={{ cursor: 'pointer' }} onClick={() => onNav('event-detail', { eventId: ev.id })}>
                    <td style={{ fontWeight: 600 }}>{ev.name}</td>
                    <td className="text-muted text-sm">{ev.venue || '—'}</td>
                    <td>{ev.passes_count}</td>
                    <td style={{ color: ev.entries_today > 0 ? '#4ADE80' : undefined, fontWeight: ev.entries_today > 0 ? 600 : undefined }}>{ev.entries_today}</td>
                    <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onNav('scanner', { eventId: ev.id }) }}>Scanner</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
