import React, { useState, useEffect } from 'react'
import { api } from '../../api'

const STATUS_DOT = {
  pending:  '#F59E0B',
  accepted: '#16A34A',
  recalled: '#6B7280',
  expired:  '#DC2626',
}

export default function HistoryScreen({ onNav }) {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.myTransfers()
      .then(d => setTransfers(d.transfers || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ fontWeight: 800, fontSize: 28 }}>History</div>
        <div style={{ fontSize: 14, color: '#6B5A62', marginTop: 2 }}>Sent passes</div>
      </div>
      <div className="scroll" style={{ flex: 1, padding: '8px 20px 0' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#6B5A62' }}>Loading…</div>}
        {!loading && transfers.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60, color: '#6B5A62' }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No history yet</div>
          </div>
        )}
        {!loading && transfers.length > 0 && (
          <div style={{ borderTop: '2px solid #231A1F' }}>
            {transfers.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '16px 1fr auto', gap: 12, padding: '12px 0', borderBottom: '2px solid #E6D7C9', alignItems: 'start' }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: STATUS_DOT[t.status] || '#6B7280', marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Sent to {t.to_email}</div>
                  <div style={{ fontSize: 14, color: '#4A3A42', lineHeight: 1.4, marginTop: 2 }}>
                    {t.admits_count} {t.admits_count === 1 ? 'person' : 'people'} · Pass {t.pass_id} · {t.status}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#6B5A62', whiteSpace: 'nowrap', textAlign: 'right' }}>
                  {t.created_at ? new Date(t.created_at * 1000).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 20 }} />
      </div>
    </>
  )
}
