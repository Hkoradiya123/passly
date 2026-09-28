import React from 'react'

export default function HomeScreen({ user, onLogin, onDashboard }) {
  return (
    <div style={{
      fontFamily: "'Archivo', system-ui, sans-serif",
      background: 'var(--c-surface)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      width: '100%',
      maxWidth: 540,
      margin: '0 auto',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <img src="/logo.svg" alt="Passly" style={{ width: 96, height: 96, borderRadius: 26, objectFit: 'cover', margin: '0 auto 20px', display: 'block' }} />

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#231A1F', lineHeight: 1.1, marginBottom: 16 }}>
          Passly
        </h1>
        <p style={{ fontSize: 18, color: '#6B5A62', marginBottom: 12, fontWeight: 500 }}>
          Digital event passes — no paper, no hassle.
        </p>
        <p style={{ fontSize: 15, color: '#9B8A93', marginBottom: 40, lineHeight: 1.6 }}>
          Buy, store, and share your event passes from your phone.
          Organizers scan in seconds. Attendees carry nothing extra.
        </p>

        <button
          onClick={user ? onDashboard : onLogin}
          style={{
            background: '#7A1F3D', color: '#FFF8F0',
            fontSize: 17, fontWeight: 700,
            padding: '14px 40px', borderRadius: 14,
            border: 'none', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(122,31,61,.3)',
            transition: 'transform .1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
          onMouseUp={e => e.currentTarget.style.transform = ''}
        >
          {user ? 'Go to Dashboard →' : 'Login →'}
        </button>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 12, marginTop: 56, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['QR Check-in', 'Pass Sharing', 'Organizer Dashboard', 'Instant Verification'].map(f => (
          <span key={f} style={{
            background: '#FFF8F0', color: '#7A1F3D',
            padding: '7px 16px', borderRadius: 999,
            fontSize: 13, fontWeight: 600,
            border: '1.5px solid #E6D7C9',
          }}>{f}</span>
        ))}
      </div>
    </div>
  )
}
