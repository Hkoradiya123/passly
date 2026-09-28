import React, { useState, useEffect } from 'react'
import PassCard from '../../components/PassCard'
import { api } from '../../api'

function toCard(p) {
  return {
    passId: p.id,
    night: p.night_label || 'Pass',
    colorName: p.color_name || '',
    colorHex: p.color_hex || '#7A1F3D',
    date: p.event_date || '',
    gates: p.gate_open_time || '',
    venue: p.event_name ? `${p.event_name} · ${p.venue || ''}` : (p.venue || ''),
    admits: (p.admits_total || 1) - (p.admits_used || 0),
    status: (p.status || 'active').toUpperCase().replace('-', '_'),
  }
}

export default function PassesScreen({ firstName, onShowQr, onSend, onNav }) {
  const [tab, setTab] = useState('upcoming')
  const [passes, setPasses] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    Promise.all([api.myPasses(), api.myTransfers()])
      .then(([pr, tr]) => { setPasses(pr.passes || []); setTransfers(tr.transfers || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const upcoming = passes.filter(p => ['active', 'transfer_pending'].includes(p.status))
  const used = passes.filter(p => p.status === 'checked_in')

  const TRANSFER_COLORS = {
    pending:  { bg: '#FEF3C7', fg: '#D97706', label: 'Pending' },
    accepted: { bg: '#DCFCE7', fg: '#16A34A', label: 'Accepted' },
    recalled: { bg: '#F3F4F6', fg: '#6B7280', label: 'Recalled' },
    expired:  { bg: '#FEE2E2', fg: '#DC2626', label: 'Expired' },
  }

  return (
    <>
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>{greeting}</div>
        <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>{firstName}</div>
      </div>

      <div style={{ margin: '0 16px', padding: 4, background: '#F3E8DC', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {['upcoming', 'used', 'sent'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ minHeight: 44, borderRadius: tab === t ? 9 : 0, background: tab === t ? '#FFFFFF' : 'transparent', boxShadow: tab === t ? '0 1px 3px rgba(35,26,31,.15)' : 'none', fontSize: 14, fontWeight: 600, color: tab === t ? '#231A1F' : '#6B5A62', textTransform: 'capitalize', border: 0, padding: '0 12px', textAlign: 'left' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#6B5A62' }}>Loading…</div>}

        {!loading && tab === 'upcoming' && (
          upcoming.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: '#6B5A62' }}><div style={{ fontSize: 16, fontWeight: 600 }}>No passes yet</div></div>
            : upcoming.map(p => {
                const c = toCard(p)
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <span style={{ width: 12, height: 12, borderRadius: 999, background: c.colorHex }} />
                        {c.night}{c.colorName ? ` · ${c.colorName}` : ''}
                      </span>
                    </div>
                    <PassCard {...c} onShowQr={() => onShowQr(p)} onSend={() => onSend(p)} onSplit={() => onSend(p)} />
                  </div>
                )
              })
        )}

        {!loading && tab === 'used' && (
          used.length === 0
            ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80, color: '#6B5A62' }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>No used passes yet</div>
                <div style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.5, maxWidth: 260 }}>Passes appear here after checking in at the gate.</div>
              </div>
            : used.map(p => {
                const c = toCard(p)
                return <PassCard key={p.id} {...c} showActions={false} />
              })
        )}

        {!loading && tab === 'sent' && (
          transfers.length === 0
            ? <div style={{ textAlign: 'center', padding: 60, color: '#6B5A62' }}><div style={{ fontSize: 16, fontWeight: 600 }}>No sent passes</div></div>
            : <>
                <div style={{ borderTop: '2px solid #231A1F' }}>
                  {transfers.map(t => {
                    const st = TRANSFER_COLORS[t.status] || TRANSFER_COLORS.pending
                    return (
                      <div key={t.id} style={{ padding: '14px 0', borderBottom: '2px solid #E6D7C9', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 600 }}>To: {t.to_email}</div>
                          <div style={{ fontSize: 14, color: '#6B5A62', marginTop: 2 }}>{t.admits_count} {t.admits_count === 1 ? 'person' : 'people'} · {t.pass_id}</div>
                        </div>
                        <span style={{ alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 999, background: st.bg, color: st.fg, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
                      </div>
                    )
                  })}
                </div>
              </>
        )}

        <div style={{ height: 20 }} />
      </div>
    </>
  )
}
