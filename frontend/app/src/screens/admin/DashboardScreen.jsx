import React, { useState, useEffect } from 'react'
import { api } from '../../api'

export default function DashboardScreen() {
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([api.dashboard(), api.getStats()])
      .then(([d, s]) => { setData(d); setStats(s) })
      .catch(() => {})
  }, [])

  if (!data) return <div className="loading"><div className="spinner" /></div>

  const { stats: s, recent_organizers } = data

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <div className="page-subtitle">All tenants · Real-time</div>
        </div>
        <div style={{ fontSize: 12, color: '#5A4A52' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Organizers</div>
          <div className="stat-value">{s.organizers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Events</div>
          <div className="stat-value" style={{ color: '#4ADE80' }}>{s.active_events}</div>
          <div className="stat-sub">{s.events} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Passes Issued</div>
          <div className="stat-value">{s.passes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entries Today</div>
          <div className="stat-value" style={{ color: '#FCD34D' }}>{s.entries_today}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">{s.entries_total}</div>
        </div>
        {stats && (
          <div className="stat-card">
            <div className="stat-label">Pass Breakdown</div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {stats.passes_by_status.map(p => (
                <div key={p.status} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span>
                  <span style={{ fontWeight: 700, color: '#F0ECE8' }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top events */}
      {stats?.top_events?.length > 0 && (
        <div className="card">
          <div className="card-title">Top Events by Entries</div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Event</th><th>Organizer</th><th>Passes</th><th>Entries</th></tr></thead>
              <tbody>
                {stats.top_events.map((ev, i) => (
                  <tr key={i}>
                    <td className="strong">{ev.name}</td>
                    <td className="text-muted">{ev.organizer}</td>
                    <td>{ev.passes}</td>
                    <td style={{ color: '#4ADE80', fontWeight: 700 }}>{ev.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent organizers */}
      <div className="card">
        <div className="card-title">Recent Organizers</div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Events</th><th>Passes</th><th>Joined</th></tr></thead>
            <tbody>
              {recent_organizers.map(o => (
                <tr key={o.id}>
                  <td className="strong">{o.name}</td>
                  <td className="text-muted">{o.email}</td>
                  <td>{o.events_count}</td>
                  <td>{o.passes_count}</td>
                  <td className="text-muted text-sm">{new Date(o.created_at * 1000).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
