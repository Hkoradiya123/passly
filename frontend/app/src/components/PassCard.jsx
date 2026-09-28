import React from 'react'
import { ArrowRight } from '../icons'

const STATUS = {
  ACTIVE:           { label: 'Active',      bg: '#E2F2E9', fg: '#145C3B' },
  TRANSFER_PENDING: { label: 'Pending',     bg: '#FCEAD0', fg: '#7A4A00' },
  SPLIT:            { label: 'Split',       bg: '#EFE6DD', fg: '#4A3A42' },
  CHECKED_IN:       { label: 'Checked in',  bg: '#E1E9F6', fg: '#1F4278' },
  REVOKED:          { label: 'Revoked',     bg: '#F8DFDB', fg: '#8E2A20' },
  EXPIRED:          { label: 'Expired',     bg: '#ECE7E3', fg: '#5A5055' },
  ACCEPTED:         { label: 'Accepted',    bg: '#E2F2E9', fg: '#145C3B' },
  RECALLED:         { label: 'Recalled',    bg: '#EFE6DD', fg: '#4A3A42' },
  DECLINED:         { label: 'Declined',    bg: '#F8DFDB', fg: '#8E2A20' },
}

const NOTE_TONE = {
  neutral: ['#FBF4EC', '#4A3A42'],
  warning: ['#FDF0DC', '#7A4A00'],
  danger:  ['#FBE6E3', '#8E2A20'],
  success: ['#E7F4EC', '#145C3B'],
}

export default function PassCard({
  night = 'Night 4', colorName = 'Royal Blue', colorHex = '#2B4FB5',
  date = 'Wed, 14 Oct', venue = 'Sheri Garba Utsav · Riverfront Grounds',
  gates = '7:30 PM', admits = 4, passId = 'RP-4K9T',
  status = 'ACTIVE', note = '', noteTone = 'neutral',
  showActions = true, dim = false, notchBg = '#FFF8F0',
  onShowQr, onSplit, onSend,
}) {
  const st = STATUS[status] || STATUS.ACTIVE
  const [noteBg, noteFg] = NOTE_TONE[noteTone] || NOTE_TONE.neutral
  const admitsStr = `${admits} ${admits === 1 ? 'person' : 'people'}`

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 16, boxShadow: '0 1px 2px rgba(35,26,31,.08), 0 6px 18px rgba(78,18,38,.07)', opacity: dim ? 0.6 : 1 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 999, background: colorHex, boxShadow: 'inset 0 0 0 1.5px rgba(35,26,31,.25)', flex: 'none' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{night} · {colorName}</span>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 10px', minHeight: 24, borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', background: st.bg, color: st.fg }}>
            {st.label}
          </span>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 24, lineHeight: 1.15, letterSpacing: '-.01em' }}>{date}</div>
          <div style={{ fontSize: 14, color: '#5E4B54', lineHeight: 1.4, marginTop: 2 }}>{venue}</div>
        </div>
      </div>

      {/* Ticket tear */}
      <div style={{ position: 'relative', height: 0, borderTop: '2px dashed #E6D7C9', margin: '0 14px' }}>
        <span style={{ position: 'absolute', left: -26, top: -11, width: 20, height: 20, borderRadius: 999, background: notchBg }} />
        <span style={{ position: 'absolute', right: -26, top: -11, width: 20, height: 20, borderRadius: 999, background: notchBg }} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.9fr) minmax(0,1fr) minmax(0,1.3fr)' }}>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: '#6B5A62', textTransform: 'uppercase', letterSpacing: '.06em' }}>Admits</span>
          <span style={{ fontWeight: 800, fontSize: 24, lineHeight: 1.1, color: '#7A1F3D' }}>{admitsStr}</span>
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '2px solid #F0E4D8' }}>
          <span style={{ fontSize: 12, color: '#6B5A62', textTransform: 'uppercase', letterSpacing: '.06em' }}>Gates</span>
          <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.4 }}>{gates}</span>
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 2, borderLeft: '2px solid #F0E4D8', minWidth: 0 }}>
          <span style={{ fontSize: 12, color: '#6B5A62', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pass ID</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{passId}</span>
        </div>
      </div>

      {/* Note */}
      {note && (
        <div style={{ borderTop: '2px solid #F0E4D8', padding: '12px 16px', fontSize: 14, lineHeight: 1.45, color: noteFg, background: noteBg }}>
          {note}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div style={{ borderTop: '2px solid #F0E4D8', padding: 12, display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
          <button onClick={onShowQr} style={{ minHeight: 48, borderRadius: 12, background: '#7A1F3D', color: '#FFF8F0', fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', gap: 6 }}>
            <span>Show QR</span><ArrowRight />
          </button>
          <button onClick={onSplit} style={{ minHeight: 48, border: '2px solid #E6D7C9', borderRadius: 12, background: '#FFFFFF', color: '#231A1F', fontWeight: 600, fontSize: 16, textAlign: 'left', padding: '0 12px' }}>Split</button>
          <button onClick={onSend} style={{ minHeight: 48, border: '2px solid #E6D7C9', borderRadius: 12, background: '#FFFFFF', color: '#231A1F', fontWeight: 600, fontSize: 16, textAlign: 'left', padding: '0 12px' }}>Send</button>
        </div>
      )}
    </div>
  )
}
