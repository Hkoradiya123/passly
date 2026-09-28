import React, { useState } from 'react'
import QRPanel from '../../components/QRPanel'
import { ChevronLeft, Moon, Sun } from '../../icons'

const PASS_STATUS = {
  ACTIVE:           { label: 'Active',      bg: '#E2F2E9', fg: '#145C3B' },
  CHECKED_IN:       { label: 'Checked in',  bg: '#E1E9F6', fg: '#1F4278' },
  REVOKED:          { label: 'Revoked',     bg: '#F8DFDB', fg: '#8E2A20' },
  TRANSFER_PENDING: { label: 'Pending',     bg: '#FCEAD0', fg: '#7A4A00' },
}

export default function PassQRScreen({ pass, onBack, onSplit, onSend, onDarkChange }) {
  const { id, night, colorName, colorHex, date, gates, admits } = pass
  const [dark, setDark] = useState(false)

  function toggleDark() {
    const next = !dark
    setDark(next)
    onDarkChange?.(next)
  }
  const [passStatus, setPassStatus] = useState(pass.status || 'ACTIVE')

  const st = PASS_STATUS[passStatus] || PASS_STATUS.ACTIVE
  const admitsStr = `${admits} ${admits === 1 ? 'person' : 'people'}`
  const isCheckedIn = passStatus === 'CHECKED_IN'
  const isRevoked   = passStatus === 'REVOKED'
  const isPending   = passStatus === 'TRANSFER_PENDING'

  const textColor = dark ? '#FFF8F0' : '#231A1F'
  const mutedColor = dark ? '#CDBFC6' : '#6B5A62'
  const divider = dark ? '#3A2E35' : '#E6D7C9'
  const dividerStrong = dark ? '#FFF8F0' : '#231A1F'

  return (
    <>
      <div className="status-bar" style={{ color: textColor }}>
        <span>9:41</span><span>5G</span>
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 8px' }}>
        <button onClick={onBack} style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }}>
          <ChevronLeft />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, flex: 1, color: textColor }}>{night} · {colorName}</span>
        {/* Dark mode toggle */}
        <button onClick={toggleDark} style={{ width: 36, height: 36, borderRadius: 999, background: dark ? '#3A2A12' : '#F3E8DC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#F7C572' : '#7A1F3D' }}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {!isCheckedIn && !isRevoked && !isPending && (
          <span style={{ padding: '4px 10px', borderRadius: 999, background: dark ? '#3A2A12' : '#FCEAD0', color: dark ? '#F7C572' : '#7A4A00', fontSize: 12, fontWeight: 600 }}>
            Brightness up
          </span>
        )}
      </div>

      {/* Content */}
      <div className="scroll" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Admits + status */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: `2px solid ${dividerStrong}`, paddingBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: dark ? 48 : 40, lineHeight: 1, color: isRevoked ? (dark ? '#8A7A82' : '#8A7A82') : dark ? '#F29A1F' : '#7A1F3D' }}>
            {admitsStr}
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: dark && isCheckedIn ? '#16274A' : st.bg, color: dark && isCheckedIn ? '#9DB8F0' : st.fg, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>
            {st.label}
          </span>
        </div>

        {/* ── CHECKED IN ── */}
        {isCheckedIn && !dark && (
          <>
            <div style={{ background: '#FFFFFF', borderRadius: 16, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(35,26,31,.08)' }}>
              <div style={{ width: 200, height: 200, borderRadius: 999, border: '5px solid #1E8E5A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#145C3B', transform: 'rotate(-8deg)', boxShadow: 'inset 0 0 0 6px #FFFFFF, inset 0 0 0 8px #1E8E5A' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '.06em' }}>CHECKED IN</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>8:42 PM</span>
              </div>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.45 }}>All {admits} entered at Gate 2. Enjoy the night.</p>
            <p style={{ fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>Left and coming back? Re-entry isn't allowed on this pass. Ask gate staff if you need help.</p>
          </>
        )}

        {isCheckedIn && dark && (
          <>
            <div style={{ background: '#0B5E3A', borderRadius: 16, minHeight: 320, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, color: '#FFFFFF' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span style={{ fontWeight: 800, fontSize: 40, lineHeight: 1 }}>CHECKED IN</span>
              <span style={{ fontSize: 22, fontWeight: 700 }}>8:42 PM · Gate 2</span>
            </div>
            <p style={{ fontSize: 16, lineHeight: 1.45, color: '#D8CAD0' }}>All {admits} entered. Re-entry isn't allowed on this pass.</p>
          </>
        )}

        {/* ── REVOKED ── */}
        {isRevoked && (
          <>
            <div style={{ background: '#FBE6E3', borderRadius: 16, minHeight: 300, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, color: '#8E2A20' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
              <span style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>This pass no longer works</span>
              <span style={{ fontSize: 16, lineHeight: 1.45 }}>Cancelled by Sheri Garba Utsav on 12 Oct, 6:05 PM. Reason given: refund issued.</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>
              Think this is a mistake? Contact the organizer with pass ID <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{id}</span>.
            </p>
          </>
        )}

        {/* ── TRANSFER PENDING ── */}
        {isPending && (
          <>
            <div style={{ background: '#FFFFFF', borderRadius: 16, minHeight: 300, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, border: '2px dashed #E6D7C9' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7A4A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, lineHeight: 1.15, marginBottom: 6 }}>QR hidden while Priya decides</div>
                <div style={{ fontSize: 16, lineHeight: 1.45, color: '#4A3A42', marginBottom: 4 }}>Sent to Priya Nair · priya.nair@gmail.com at 9:41 PM.</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#7A4A00' }}>Comes back to you in 23 h 52 m if not accepted</div>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.45, color: '#4A3A42' }}>Only one person can hold a pass at a time, so neither of you can show this QR until it's accepted or recalled.</p>
          </>
        )}

        {/* ── ACTIVE QR ── */}
        {!isCheckedIn && !isRevoked && !isPending && (
          <>
            <QRPanel passId={id} mode="active" size={dark ? 232 : 200} dark={dark} />
            <p style={{ fontSize: 14, lineHeight: 1.45, color: dark ? '#D8CAD0' : '#4A3A42' }}>Screenshots won't work. This code changes every 30 seconds.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `2px solid ${dividerStrong}` }}>
              <div style={{ padding: '8px 0', borderBottom: `2px solid ${divider}`, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>Holder</span>
                <span style={{ fontSize: dark ? 18 : 16, fontWeight: 600, color: textColor }}>Aarav Mehta</span>
              </div>
              <div style={{ padding: '8px 0 8px 12px', borderBottom: `2px solid ${divider}`, borderLeft: `2px solid ${divider}`, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>ID ending</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: dark ? 18 : 16, color: textColor }}>4821</span>
              </div>
              {!dark && <>
                <div style={{ padding: '8px 0', borderBottom: `2px solid ${divider}`, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>{date}</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Gates {gates}</span>
                </div>
                <div style={{ padding: '8px 0 8px 12px', borderBottom: `2px solid ${divider}`, borderLeft: `2px solid ${divider}`, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, color: mutedColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>Venue</span>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Riverfront Grounds</span>
                </div>
              </>}
            </div>
          </>
        )}
        <div style={{ height: 8 }} />
      </div>

      {/* Bottom actions */}
      {!isCheckedIn && !isRevoked && (
        <div style={{ padding: '12px 16px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: `2px solid ${divider}` }}>
          {isPending ? (
            <>
              <button onClick={onBack} style={{ minHeight: 52, borderRadius: 12, background: dark ? '#F29A1F' : '#7A1F3D', color: dark ? '#1B1218' : '#FFF8F0', fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Recall</button>
              <button style={{ minHeight: 52, border: `2px solid ${divider}`, borderRadius: 12, background: dark ? 'transparent' : '#FFFFFF', color: textColor, fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Share on WhatsApp</button>
            </>
          ) : (
            <>
              <button onClick={onSplit} style={{ minHeight: 52, borderRadius: 12, background: dark ? '#F29A1F' : '#7A1F3D', color: dark ? '#1B1218' : '#FFF8F0', fontSize: 16, fontWeight: dark ? 700 : 600, textAlign: 'left', padding: '0 16px' }}>Split</button>
              <button onClick={onSend} style={{ minHeight: 52, border: `2px solid ${dark ? '#4A3A42' : '#E6D7C9'}`, borderRadius: 12, background: dark ? 'transparent' : '#FFFFFF', color: textColor, fontSize: 16, fontWeight: 600, textAlign: 'left', padding: '0 16px' }}>Send to friend</button>
            </>
          )}
        </div>
      )}
      {isRevoked && (
        <div style={{ padding: '12px 16px 28px', borderTop: '2px solid #E6D7C9' }}>
          <button className="btn-secondary" style={{ minHeight: 52 }}>Contact organizer</button>
        </div>
      )}
    </>
  )
}
