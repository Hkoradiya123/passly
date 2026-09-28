import React, { useState } from 'react'
import PassCard from '../../components/PassCard'
import { X, ArrowRight } from '../../icons'

export default function SendScreen({ pass, onBack, onDone }) {
  const { night, colorName, colorHex, date, admits, id } = pass
  const [step, setStep] = useState('form') // form | sent | recall-confirm
  const [friendEmail, setFriendEmail] = useState('')
  const [count, setCount] = useState(1)

  const friendName = friendEmail.toLowerCase().includes('priya') ? 'Priya Nair' : null
  const keep = admits - count
  const canSend = friendEmail.trim().length > 0

  // ── RECALL CONFIRM ──
  if (step === 'recall-confirm') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, opacity: .5, pointerEvents: 'none' }}>
        <PassCard night={night} colorName={colorName} colorHex={colorHex} date={date} admits={count} passId="RP-9F4D" status="TRANSFER_PENDING" showActions={false} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,18,24,.55)', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', background: '#FFF8F0', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '24px 20px 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>Recall {friendName || "friend"}'s pass?</div>
          <div style={{ borderTop: '2px solid #231A1F', paddingTop: 12, fontSize: 16, lineHeight: 1.45, color: '#4A3A42' }}>
            Their link stops working right away and {count} {count === 1 ? 'person goes' : 'people go'} back onto your passes.
          </div>
          <button onClick={() => { setStep('form'); setFriendEmail(''); setCount(1) }} style={{ minHeight: 52, borderRadius: 12, background: '#7A1F3D', color: '#FFF8F0', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Recall pass</button>
          <button onClick={() => setStep('sent')} style={{ minHeight: 52, border: '2px solid #E6D7C9', borderRadius: 12, background: '#FFFFFF', color: '#231A1F', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Keep waiting</button>
        </div>
      </div>
    </>
  )

  // ── SENT ──
  if (step === 'sent') return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div className="scroll" style={{ flex: 1, padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: '#E2F2E9', color: '#145C3B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div style={{ borderTop: '2px solid #231A1F', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.05 }}>Sent to {friendName || 'your friend'}</div>
          <div style={{ fontSize: 16, lineHeight: 1.45, color: '#4A3A42' }}>They got an email with the link. It's pending until they accept.</div>
        </div>
        <PassCard night={night} colorName={colorName} colorHex={colorHex} date={date} admits={count} passId="RP-9F4D" status="TRANSFER_PENDING" showActions={false} note="Expires in 24 h if not accepted, then comes back to you" noteTone="warning" />
        {keep > 0 && (
          <PassCard night={night} colorName={colorName} colorHex={colorHex} date={date} admits={keep} passId="RP-7C2A" showActions={false} note="Your new pass. The old QR no longer works." />
        )}
        <div style={{ height: 16 }} />
      </div>
      <div style={{ padding: '12px 16px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={() => setStep('recall-confirm')} style={{ minHeight: 52, border: '2px solid #7A1F3D', borderRadius: 12, background: 'transparent', color: '#7A1F3D', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Recall</button>
        <button onClick={onDone} style={{ minHeight: 52, borderRadius: 12, background: '#7A1F3D', color: '#FFF8F0', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Done</button>
      </div>
    </>
  )

  // ── FORM ──
  return (
    <>
      <div className="status-bar"><span>9:41</span><span>5G</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 8px' }}>
        <button onClick={onBack} style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#231A1F' }}><X /></button>
        <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Send pass</span>
      </div>

      <div className="scroll" style={{ flex: 1, padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Pass summary row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '2px solid #231A1F', borderBottom: '2px solid #E6D7C9', padding: '12px 0' }}>
          <span style={{ width: 12, height: 12, borderRadius: 999, background: colorHex }} />
          <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>{night} · {date}</span>
          <span style={{ fontWeight: 800, color: '#7A1F3D' }}>{admits} people</span>
        </div>

        {/* Friend's email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Friend's email</label>
          <div style={{ display: 'flex', border: '2px solid #231A1F', borderRadius: 12, background: '#FFFFFF', minHeight: 56, overflow: 'hidden' }}>
            <input
              type="email" autoFocus
              value={friendEmail}
              onChange={e => setFriendEmail(e.target.value)}
              placeholder="friend@example.com"
              style={{ flex: 1, border: 0, outline: 'none', padding: '0 16px', fontSize: 18, background: 'transparent' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', color: '#7A1F3D', fontWeight: 600, fontSize: 14 }}>Contacts</span>
          </div>
          {friendName && <span style={{ fontSize: 14, color: '#145C3B', fontWeight: 600 }}>{friendName}</span>}
        </div>

        {/* Count stepper */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>How many people?</label>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '2px solid #E6D7C9', borderRadius: 12, background: '#FFFFFF', padding: 4 }}>
            <button onClick={() => setCount(c => Math.max(1, c - 1))} style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: count > 1 ? '#231A1F' : '#C0B0B8' }}>−</button>
            <span style={{ fontWeight: 800, fontSize: 28 }}>
              {count} <span style={{ fontSize: 16, fontWeight: 600, color: '#6B5A62' }}>of {admits}</span>
            </span>
            <button onClick={() => setCount(c => Math.min(admits, c + 1))} style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>+</button>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>
            {keep > 0 ? `You keep ${keep}. Your pass will be split and you'll get a new QR.` : 'You\'re sending all your people on this pass.'}
          </p>
        </div>

        <div style={{ background: '#FBF4EC', borderRadius: 12, padding: '12px 14px', fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>
          {friendName || 'Your friend'} must log in with a code sent to their email to accept. Until then, the pass is on hold and you can recall it.
        </div>
      </div>

      <div style={{ padding: '12px 16px 28px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '2px solid #E6D7C9' }}>
        <button
          onClick={() => canSend && setStep('sent')}
          style={{ minHeight: 52, borderRadius: 12, background: canSend ? '#7A1F3D' : '#E6D7C9', color: canSend ? '#FFF8F0' : '#6B5A62', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: canSend ? 'space-between' : 'flex-start', padding: '0 16px' }}
        >
          <span>Send to {friendName || 'friend'}</span>
          {canSend && <ArrowRight />}
        </button>
        <button style={{ minHeight: 52, border: '2px solid #E6D7C9', borderRadius: 12, background: '#FFFFFF', color: '#231A1F', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>
          Send and share on WhatsApp
        </button>
      </div>
    </>
  )
}
