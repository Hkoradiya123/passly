import React from 'react'

const ICONS = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  events: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  scanner: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
}

export default function OrgSidebar({ screen, user, onNav, onLogout }) {
  const active = screen === 'event-detail' ? 'events' : screen
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.svg" alt="Passly" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }} />
        <div>
          <span>Passly</span>
          <small>Organizer</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {[{key:'dashboard',label:'Dashboard'},{key:'events',label:'Events'},{key:'scanner',label:'Scanner'}].map(({ key, label }) => (
          <button key={key} className={`nav-item${active === key ? ' active' : ''}`} onClick={() => onNav(key)}>
            {ICONS[key]} {label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="org-name">{user.name}</div>
        <div className="org-email">{user.email}</div>
        <button className="btn-logout" onClick={onLogout}>Sign out</button>
      </div>
    </div>
  )
}
