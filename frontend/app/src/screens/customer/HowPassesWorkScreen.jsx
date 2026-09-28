import React from 'react'
import { ChevronLeft } from '../../icons'

const STEPS = [
  { n: '1', title: 'Buy a pass', body: 'Your organizer issues a digital pass to your email. No printing needed.' },
  { n: '2', title: 'Open in Raaspass', body: 'Accept the pass from the email link. It appears in your Passes tab.' },
  { n: '3', title: 'Share if needed', body: 'Split your pass and send admits to friends via email before the event.' },
  { n: '4', title: 'Show your QR at the gate', body: 'Open the pass and show the QR code. Gate staff scan it in seconds.' },
  { n: '5', title: 'Pass is marked used', body: 'Once scanned, the pass moves to your Used tab as a record.' },
]

export default function HowPassesWorkScreen({ onBack }) {
  return (
    <div style={{ padding: '0 20px 40px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-primary)', fontWeight: 600, fontSize: 14, padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <ChevronLeft size={18} />Back
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>How passes work</h1>
      <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 32 }}>Everything from buying to entry.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', gap: 16, paddingBottom: 28, position: 'relative' }}>
            {/* connector line */}
            {i < STEPS.length - 1 && (
              <div style={{ position: 'absolute', left: 18, top: 36, width: 2, height: 'calc(100% - 8px)', background: 'var(--c-border)' }} />
            )}
            <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--c-primary)', color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
              {s.n}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
