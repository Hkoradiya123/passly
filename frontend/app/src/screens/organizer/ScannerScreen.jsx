import React, { useState, useEffect, useRef } from 'react'
import { api } from '../../api'

const GATES = ['Main Entrance', 'Gate 1', 'Gate 2', 'Gate 3', 'VIP Gate']

function AdmitsStepper({ value, max, onChange }) {
  return (
    <div className="stepper">
      <button className="stepper-btn" disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <div className="stepper-val">{value}</div>
      <button className="stepper-btn" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function PassCard({ pass, admitsRemaining }) {
  const admits_used = pass.admits_total - admitsRemaining
  const pct = (admits_used / pass.admits_total) * 100

  return (
    <div className="scan-pass-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div className="scan-pass-id">{pass.id}</div>
          <div className="scan-pass-name">{pass.holder_name || 'Unknown holder'}</div>
          <div className="scan-pass-meta">{pass.holder_email}</div>
        </div>
        <span className={`badge badge-${pass.status}`}>{pass.status.replace('_', ' ')}</span>
      </div>

      {(pass.night_label || pass.event_name) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '8px 0', borderTop: '1px solid #2A1F1C' }}>
          {pass.color_hex && <div className="color-dot" style={{ background: pass.color_hex, width: 10, height: 10 }} />}
          <span style={{ fontSize: 13, fontWeight: 600 }}>{pass.night_label || pass.event_name}</span>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
          <span className="text-muted">Admits used</span>
          <span style={{ fontWeight: 700 }}>{admits_used} / {pass.admits_total}</span>
        </div>
        <div style={{ background: '#2A1F1C', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ background: admitsRemaining === 0 ? '#FCA5A5' : '#4ADE80', height: '100%', width: `${pct}%`, borderRadius: 999, transition: 'width .3s' }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: admitsRemaining === 0 ? '#FCA5A5' : '#4ADE80' }}>
          {admitsRemaining === 0 ? 'No admits remaining' : `${admitsRemaining} admit${admitsRemaining !== 1 ? 's' : ''} remaining`}
        </div>
      </div>
    </div>
  )
}

export default function ScannerScreen({ eventId: initialEventId, onNav }) {
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '')
  const [scanState, setScanState] = useState('idle') // idle | found | entering | success | error
  const [scanResult, setScanResult] = useState(null)
  const [admitCount, setAdmitCount] = useState(1)
  const [gate, setGate] = useState(GATES[0])
  const [entering, setEntering] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState(null)
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)
  const scanningRef = useRef(false)

  useEffect(() => {
    api.getEvents().then(d => {
      setEvents(d.events)
      if (!selectedEventId && d.events.length > 0) setSelectedEventId(d.events[0].id)
    }).catch(() => {})
  }, [])

  // Start/stop camera scanner
  useEffect(() => {
    let scanner = null

    async function startScanner() {
      if (!scannerRef.current || scanningRef.current) return
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        html5QrRef.current = scanner
        scanningRef.current = true

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (scanState !== 'idle') return
            await handleScan(decodedText)
          },
          () => {}
        )
      } catch (err) {
        console.error('Camera error:', err)
      }
    }

    if (scanState === 'idle') {
      startScanner()
    } else {
      // Stop scanner when not idle
      if (html5QrRef.current && scanningRef.current) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          scanningRef.current = false
          html5QrRef.current = null
        })
      }
    }

    return () => {
      if (html5QrRef.current && scanningRef.current) {
        html5QrRef.current.stop().catch(() => {}).finally(() => {
          scanningRef.current = false
          html5QrRef.current = null
        })
      }
    }
  }, [scanState])

  async function handleScan(qrData) {
    setScanState('loading')
    try {
      const result = await api.scanQr(qrData)
      setScanResult(result)
      setAdmitCount(Math.min(1, result.admits_remaining))
      setScanState(result.admits_remaining > 0 && result.pass.status === 'active' ? 'found' : 'blocked')
    } catch (err) {
      setErrorMsg(err.message)
      setScanState('error')
    }
  }

  async function handleEnter() {
    if (!scanResult || admitCount < 1) return
    setEntering(true)
    try {
      const data = await api.enterPass(scanResult.pass.id, admitCount, gate)
      setSuccessData({ admitted: admitCount, remaining: data.admits_remaining, passId: scanResult.pass.id, holderName: scanResult.pass.holder_name })
      setScanState('success')
    } catch (err) {
      setErrorMsg(err.message)
      setScanState('error')
    } finally {
      setEntering(false)
    }
  }

  function reset() {
    setScanState('idle')
    setScanResult(null)
    setAdmitCount(1)
    setErrorMsg('')
    setSuccessData(null)
  }

  // Auto-reset after success
  useEffect(() => {
    if (scanState !== 'success') return
    const t = setTimeout(reset, 4000)
    return () => clearTimeout(t)
  }, [scanState])

  const selectedEvent = events.find(e => e.id === selectedEventId)

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onNav('events')}>← Back</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Gate Scanner</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4A3A42' }}>Event:</label>
          <select className="form-input" style={{ width: 220 }} value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#4A3A42' }}>Gate:</label>
          <select className="form-input" style={{ width: 160 }} value={gate} onChange={e => setGate(e.target.value)}>
            {GATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="scanner-layout">
        {/* Camera */}
        <div className="scanner-camera" style={{ position: 'relative' }}>
          <div id="qr-reader" ref={scannerRef} style={{ width: '100%', height: '100%' }} />

          {scanState !== 'idle' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {scanState === 'loading' && <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} />}
              {scanState === 'success' && (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Admitted!</div>
                </div>
              )}
              {scanState === 'error' && (
                <div style={{ color: '#fff', textAlign: 'center' }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
              )}
            </div>
          )}

          {scanState === 'idle' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 200, height: 200, border: '2px solid rgba(255,255,255,.6)', borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,.3)' }} />
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="scanner-panel">
          {/* Idle */}
          {scanState === 'idle' && (
            <div className="scanner-idle">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/></svg>
              <div style={{ fontWeight: 600, color: '#1A1210' }}>Ready to scan</div>
              <div style={{ fontSize: 13 }}>Point the camera at a Raaspass QR code</div>
              {selectedEvent && (
                <div style={{ marginTop: 8, padding: '8px 14px', background: '#F5F3F0', borderRadius: 8, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{selectedEvent.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {scanState === 'loading' && (
            <div className="scanner-idle">
              <div className="spinner" />
              <div style={{ fontWeight: 600, color: '#1A1210' }}>Looking up pass…</div>
            </div>
          )}

          {/* Pass found — entry form */}
          {(scanState === 'found' || scanState === 'blocked') && scanResult && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <PassCard pass={scanResult.pass} admitsRemaining={scanResult.admits_remaining} />

              {scanState === 'blocked' && (
                <div className="scan-error" style={{ marginBottom: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <div style={{ fontWeight: 700, color: '#DC2626' }}>
                    {scanResult.pass.status === 'revoked' ? 'Pass is revoked' : 'No admits remaining'}
                  </div>
                  <div style={{ fontSize: 13, color: '#7F1D1D', marginTop: 4 }}>
                    {scanResult.pass.status === 'revoked' ? 'This pass has been cancelled by the organizer.' : 'All admits on this pass have been used.'}
                  </div>
                </div>
              )}

              {scanState === 'found' && (
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#4A3A42', marginBottom: 8 }}>How many people entering now?</div>
                    <AdmitsStepper value={admitCount} max={scanResult.admits_remaining} onChange={setAdmitCount} />
                    <div style={{ fontSize: 12, color: '#6B5A62', marginTop: 6 }}>{scanResult.admits_remaining} available · selecting {admitCount}</div>
                  </div>

                  <button
                    className="btn btn-success"
                    style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 10, justifyContent: 'center', marginBottom: 8 }}
                    onClick={handleEnter}
                    disabled={entering || admitCount < 1}
                  >
                    {entering ? 'Processing…' : `Admit ${admitCount} ${admitCount === 1 ? 'person' : 'people'}`}
                  </button>
                </div>
              )}

              <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={reset}>Cancel / scan again</button>
            </div>
          )}

          {/* Success */}
          {scanState === 'success' && successData && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="scan-success">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#15803D' }}>
                  {successData.admitted} {successData.admitted === 1 ? 'person' : 'people'} admitted
                </div>
                {successData.holderName && <div style={{ fontSize: 14, color: '#166534', marginTop: 4 }}>{successData.holderName}</div>}
                <div style={{ fontSize: 13, color: '#166534', marginTop: 8 }}>
                  {successData.remaining > 0 ? `${successData.remaining} admit${successData.remaining !== 1 ? 's' : ''} still remaining on this pass` : 'All admits used on this pass'}
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#6B5A62', textAlign: 'center' }}>Scanning again in a moment…</div>
              <button className="btn btn-secondary" onClick={reset}>Scan next</button>
            </div>
          )}

          {/* Error */}
          {scanState === 'error' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="scan-error">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <div style={{ fontWeight: 700, color: '#DC2626', fontSize: 16 }}>Error</div>
                <div style={{ fontSize: 14, color: '#7F1D1D', marginTop: 6 }}>{errorMsg || 'Something went wrong. Try scanning again.'}</div>
              </div>
              <button className="btn btn-primary" onClick={reset}>Try again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
