import React, { useState, useEffect, useRef } from 'react'
import qrcode from 'qrcode-generator'

function makeQR(token) {
  try {
    const q = qrcode(0, 'M')
    q.addData(token)
    q.make()
    return q.createDataURL(8, 0)
  } catch { return '' }
}

export default function QRPanel({ passId = 'RP-4K9T', mode = 'active', size = 220, dark = false, offlineSince = '9:38 PM' }) {
  const [now, setNow] = useState(new Date())
  const cacheRef = useRef({ token: null, src: null })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const epoch = Math.floor(now.getTime() / 30000)
  const token = `raaspass://v1/${passId}/${epoch}`
  if (cacheRef.current.token !== token) {
    cacheRef.current = { token, src: makeQR(token) }
  }

  const secsLeft = 30 - (now.getSeconds() % 30)
  const dashOffset = (81.7 * (1 - secsLeft / 30)).toFixed(1)
  const pad = n => String(n).padStart(2, '0')
  const h = ((now.getHours() + 11) % 12) + 1
  const clock = `${pad(h)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  const live = mode === 'active'
  const cardBg = dark ? '#2A1E26' : '#FFFFFF'
  const divider = dark ? '#3A2E35' : '#F0E4D8'

  return (
    <div style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', boxShadow: dark ? 'none' : '0 1px 2px rgba(35,26,31,.08), 0 6px 18px rgba(78,18,38,.07)' }}>
      {/* Live strip */}
      <div style={{ height: 6, background: live ? '#F3E6D8' : '#E9DCCD', position: 'relative', overflow: 'hidden' }}>
        {live && <div style={{ position: 'absolute', top: 0, bottom: 0, width: '25%', background: 'linear-gradient(90deg,#F29A1F,#D4A537)', animation: 'rp-live 2.4s linear infinite' }} />}
      </div>

      {/* QR image */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: size, height: size, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: mode === 'offline' ? 0.88 : 1 }}>
          {cacheRef.current.src
            ? <img src={cacheRef.current.src} alt="Pass QR code" style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }} />
            : <div style={{ width: size, height: size, background: '#F5EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8A7A82' }}>Generating…</div>
          }
        </div>
      </div>

      {/* Live countdown */}
      {live && (
        <div style={{ borderTop: `2px solid ${divider}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ flex: 'none', transform: 'rotate(-90deg)' }}>
            <circle cx="16" cy="16" r="13" fill="none" stroke="#F0E4D8" strokeWidth="4" />
            <circle cx="16" cy="16" r="13" fill="none" stroke="#7A1F3D" strokeWidth="4" strokeLinecap="round" strokeDasharray="81.7" strokeDashoffset={dashOffset} />
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: dark ? '#FFF8F0' : '#231A1F' }}>New code in {secsLeft}s</div>
            <div style={{ fontSize: 12, color: '#6B5A62' }}>Live · {clock}</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6B5A62' }}>{passId}</span>
        </div>
      )}

      {/* Offline notice */}
      {mode === 'offline' && (
        <div style={{ borderTop: '2px solid #F2C98A', background: '#FDF0DC', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, color: '#6B4000' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
            <path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 13a10 10 0 0 1 5.24-2.76"/><path d="m2 2 20 20"/>
          </svg>
          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
            <strong>You're offline.</strong> Showing the last code from {offlineSince}. The gate can still verify it. Reconnect to refresh.
          </div>
        </div>
      )}
    </div>
  )
}
