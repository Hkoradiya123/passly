import React, { useState, useEffect } from 'react'
import { api } from '../../api'

export default function EventsScreen({ onNav }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getEvents().then(d => { setEvents(d.events); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) })
  }, [])

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Events</h1>
          <div className="page-subtitle">{events.length} event{events.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('create-event')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New event
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {events.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">No events yet</div>
          <div className="empty-desc" style={{ marginBottom: 16 }}>Create your first Garba event to start issuing passes.</div>
          <button className="btn btn-primary" onClick={() => onNav('create-event')}>Create event</button>
        </div>
      ) : (
        <div className="event-grid">
          {events.map(ev => (
            <div key={ev.id} className="event-card" onClick={() => onNav('event-detail', { eventId: ev.id })}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div className="event-card-title">{ev.name}</div>
                <span className={`badge badge-${ev.status}`}>{ev.status}</span>
              </div>
              <div className="event-card-meta">{ev.venue || 'No venue set'}</div>
              <div style={{ display: 'flex', gap: 20, marginTop: 14, fontSize: 13 }}>
                <div><span style={{ fontWeight: 700, color: '#E8E0DC' }}>{ev.passes_count}</span> <span className="text-muted">passes</span></div>
                <div><span style={{ fontWeight: 700, color: '#4ADE80' }}>{ev.entries_today}</span> <span className="text-muted">today</span></div>
                <div><span style={{ fontWeight: 700 }}>{ev.admits_used}</span><span className="text-muted">/{ev.admits_total} admits</span></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onNav('event-detail', { eventId: ev.id }) }}>Manage</button>
                <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onNav('scanner', { eventId: ev.id }) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
                  Scanner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
