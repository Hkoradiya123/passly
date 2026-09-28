import React, { useState, useEffect } from 'react'
import { api } from '../../api'

export default function ClaimScreen({ token, user, onNav, onLogin }) {
  const [batch, setBatch] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    api.getClaimBatch(token)
      .then(setBatch)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  async function claim() {
    setClaiming(true)
    try {
      await api.claimPass(token)
      setClaimed(true)
    } catch (e) {
      setError(e.message)
    }
    setClaiming(false)
  }

  if (loading) return (
    <div style={shell}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div className="spinner" />
      </div>
    </div>
  )

  if (error) return (
    <div style={shell}>
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚫</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Link unavailable</div>
        <div style={{ color: '#6B5A62', fontSize: 14 }}>{error}</div>
      </div>
    </div>
  )

  if (claimed) return (
    <div style={shell}>
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Pass claimed!</div>
        <div style={{ color: '#6B5A62', fontSize: 14, marginBottom: 32 }}>Your pass for <strong>{batch?.event_name}</strong> is now in your account.</div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onNav('passes')}>View my passes</button>
      </div>
    </div>
  )

  return (
    <div style={shell}>
      <div style={{ padding: 32 }}>
        <img src="/logo.svg" alt="Passly" style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 20 }} />
        <div style={{ fontSize: 13, color: '#6B5A62', marginBottom: 4 }}>You're invited to</div>
        <div style={{ fontWeight: 800, fontSize: 24, lineHeight: 1.2, marginBottom: 4 }}>{batch.event_name}</div>
        {batch.event_venue && <div style={{ fontSize: 14, color: '#6B5A62', marginBottom: 24 }}>{batch.event_venue}</div>}

        <div style={{ background: '#F5EDE6', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#6B5A62' }}>Passes remaining</div>
          <div style={{ fontWeight: 800, fontSize: 28, color: batch.available > 0 ? '#7A1F3D' : '#DC2626' }}>
            {batch.available > 0 ? batch.available : 'Sold out'}
          </div>
          <div style={{ fontSize: 12, color: '#9B8A93' }}>{batch.claimed} of {batch.total} claimed</div>
        </div>

        {batch.available === 0 ? (
          <div style={{ textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>All passes have been claimed.</div>
        ) : !user ? (
          <>
            <div style={{ fontSize: 14, color: '#6B5A62', marginBottom: 16 }}>Login to claim your pass</div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onLogin}>Login to claim →</button>
          </>
        ) : (
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={claim} disabled={claiming}>
            {claiming ? 'Claiming…' : 'Claim my pass →'}
          </button>
        )}
      </div>
    </div>
  )
}

const shell = {
  minHeight: '100vh', width: '100%', maxWidth: 420,
  margin: '0 auto', background: '#FFF8F0',
  display: 'flex', flexDirection: 'column',
  fontFamily: "'Archivo', system-ui, sans-serif",
}
