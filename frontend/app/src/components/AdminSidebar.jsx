import React from 'react'

export default function AdminSidebar({ screen, user, onNav, onLogout }) {
  const NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: 'organizers', label: 'Organizers', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key: 'events', label: 'All Events', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { key: 'passes', label: 'All Passes', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  ]
  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <img src="/logo.svg" alt="Passly" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Passly</div>
          <div style={{ fontSize: 10, color: '#7A5A62', textTransform: 'uppercase', letterSpacing: '.08em' }}>Super Admin</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: '10px' }}>
        {NAV.map(({ key, label, icon }) => (
          <button key={key} className={`admin-nav-item${screen === key ? ' active' : ''}`} onClick={() => onNav(key)}>
            {icon} {label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 14px', borderTop: '1px solid #2A1F1C' }}>
        <div style={{ fontSize: 11, color: '#5A4A52', marginBottom: 8 }}>{user.email}</div>
        <button style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,.04)', border: '1px solid #2A1F1C', borderRadius: 6, color: '#7A6A72', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }} onClick={onLogout}>Sign out</button>
      </div>
    </div>
  )
}
