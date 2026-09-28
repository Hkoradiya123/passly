import React from 'react'

const NAV = ['passes', 'history', 'profile']

export default function CustNavbar({ screen, initials, onNav }) {
  const active = NAV.includes(screen) ? screen : 'passes'

  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      padding: '0 20px', height: 56, flexShrink: 0,
      borderBottom: '1.5px solid var(--c-border)',
      background: 'var(--c-surface)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        <img src="/logo.svg" alt="Passly" style={{ width: 30, height: 30, borderRadius: 9, objectFit: 'cover' }} />
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--c-text)', fontFamily: 'Archivo, sans-serif' }}>Passly</span>
      </div>

      {/* Nav pills */}
      <div style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
        {NAV.map(s => (
          <button key={s} onClick={() => onNav(s)} style={{
            padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
            background: active === s ? 'var(--c-primary)' : 'transparent',
            color: active === s ? '#fff' : 'var(--c-text-muted)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background .15s, color .15s',
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--c-bg)', color: 'var(--c-text)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textTransform: 'uppercase', cursor: 'pointer' }}
        onClick={() => onNav('profile')}
      >
        {initials || 'U'}
      </div>
    </nav>
  )
}
