import React, { useState, useEffect } from 'react'
import PassCard from '../../components/PassCard'
import { ArrowRight } from '../../icons'

export default function AcceptScreen({ onDone }) {
  const [step, setStep] = useState('login') // login | review | success | expired | taken
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [timer, setTimer] = useState(23 * 3600 + 41 * 60 + 8) // 23:41:08

  useEffect(() => {
    if (step !== 'review') return
    const t = setInterval(() => setTimer(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [step])

  const fmtTimer = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // ── EXPIRED ──
  if (step === 'expired') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div style={{ flex: 1, padding: '48px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: '#ECE7E3', color: '#5A5055', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
        <div style={{ borderTop: '2px solid #231A1F', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.05 }}>This link has expired</div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: '#4A3A42' }}>Riya's offer was open for 24 hours. The passes went back to her. Ask her to send them again.</div>
        </div>
      </div>
      <div style={{ padding: '16px 24px 32px' }}>
        <button className="btn-primary" style={{ justifyContent: 'space-between' }} onClick={onDone}>
          <span>Message Riya on WhatsApp</span><ArrowRight />
        </button>
      </div>
    </>
  )

  // ── TAKEN ──
  if (step === 'taken') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div style={{ flex: 1, padding: '48px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: '#F8DFDB', color: '#8E2A20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ borderTop: '2px solid #231A1F', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.05 }}>Already accepted</div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: '#4A3A42' }}>These passes were accepted by a different email, k•••@yahoo.com, at 8:15 PM. Each link works once.</div>
          <div style={{ fontSize: 16, lineHeight: 1.5, color: '#4A3A42' }}>If that wasn't meant to happen, let Riya know. She can see who accepted in her history.</div>
        </div>
      </div>
      <div style={{ padding: '16px 24px 32px' }}>
        <button className="btn-secondary" onClick={onDone}>Go to my passes</button>
      </div>
    </>
  )

  // ── SUCCESS ──
  if (step === 'success') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div className="scroll" style={{ flex: 1, padding: '32px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="dot-pattern" style={{ margin: '0 8px' }} />
        <div style={{ borderTop: '2px solid #231A1F', padding: '16px 8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#145C3B', fontWeight: 700, fontSize: 14 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Accepted
          </div>
          <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.05 }}>The passes are yours{name ? `, ${name.split(' ')[0]}` : ''}</div>
          <div style={{ fontSize: 16, lineHeight: 1.45, color: '#4A3A42' }}>Riya has been told. Your QR is ready for the gate.</div>
        </div>
        <PassCard night="Night 6" colorName="Green" colorHex="#2E9E4F" date="Fri, 16 Oct" admits={2} passId="RP-3H6V" onShowQr={onDone} onSplit={onDone} onSend={onDone} />
        <div style={{ height: 16 }} />
      </div>
    </>
  )

  // ── REVIEW ──
  if (step === 'review') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div className="scroll" style={{ flex: 1, padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: 14, color: '#4A3A42' }}>From Riya Patel · riya.patel@gmail.com</div>
          <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1, marginTop: 4 }}>2 passes for you</div>
        </div>
        <PassCard night="Night 6" colorName="Green" colorHex="#2E9E4F" date="Fri, 16 Oct" admits={2} passId="RP-3H6V" status="TRANSFER_PENDING" showActions={false} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FDF0DC', borderRadius: 12, padding: '10px 14px', color: '#6B4000' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Offer expires in</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16 }}>{fmtTimer(timer)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Name on your ID <span style={{ color: '#A12A1E' }}>*</span></label>
          <div style={{ border: '2px solid #231A1F', borderRadius: 12, background: '#FFFFFF', minHeight: 52, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <input
              autoFocus value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              style={{ flex: 1, border: 0, outline: 'none', padding: '0 16px', fontSize: 16, background: 'transparent' }}
            />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.4, color: '#4A3A42' }}>Gate staff check this against your ID.</p>
        </div>
        <div style={{ height: 8 }} />
      </div>
      <div style={{ padding: '12px 16px 28px', display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 8, borderTop: '2px solid #E6D7C9' }}>
        <button onClick={() => name.trim() && setStep('success')} style={{ minHeight: 52, borderRadius: 12, background: name.trim() ? '#7A1F3D' : '#E6D7C9', color: name.trim() ? '#FFF8F0' : '#6B5A62', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Accept 2 passes</button>
        <button onClick={onDone} className="btn-secondary" style={{ minHeight: 52 }}>Decline</button>
      </div>
    </>
  )

  // ── LOGIN ──
  return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div style={{ flex: 1, padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.svg" alt="Passly" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>Passly</span>
        </div>
        <div style={{ borderTop: '2px solid #231A1F', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.05 }}>Riya Patel sent you 2 passes</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#4A3A42' }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#2E9E4F', flex: 'none' }} />
            Night 6 · Green · Fri, 16 Oct
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Log in to accept</label>
          <div style={{ display: 'flex', border: '2px solid #231A1F', borderRadius: 12, background: '#FFFFFF', minHeight: 56, overflow: 'hidden' }}>
            <input
              type="email" autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && email.trim() && setStep('review')}
              placeholder="Your email address"
              style={{ flex: 1, border: 0, outline: 'none', padding: '0 16px', fontSize: 18, background: 'transparent' }}
            />
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>Use the email Riya sent it to: s•••@gmail.com.</p>
        </div>
      </div>
      <div style={{ padding: '16px 24px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => email.trim() && setStep('review')}
          className="btn-primary"
          style={{ background: email.trim() ? '#7A1F3D' : '#E6D7C9', color: email.trim() ? '#FFF8F0' : '#6B5A62', justifyContent: email.trim() ? 'space-between' : 'flex-start' }}
        >
          <span>Email me a code</span>
          {email.trim() && <ArrowRight />}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 4 }}>
          <button onClick={() => setStep('expired')} style={{ fontSize: 13, color: '#6B5A62', fontWeight: 600 }}>Expired link</button>
          <button onClick={() => setStep('taken')} style={{ fontSize: 13, color: '#6B5A62', fontWeight: 600 }}>Already taken</button>
        </div>
      </div>
    </>
  )
}
