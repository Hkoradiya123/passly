import React, { useState } from 'react'
import { ChevronRight } from '../../icons'
import { api } from '../../api'

export default function ProfileScreen({ email, userName, onNav, onLogout }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(userName || '')
  const [saved, setSaved] = useState(userName || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!name.trim()) return setErr('Name cannot be empty')
    setSaving(true); setErr('')
    try {
      await api.updateMe({ name: name.trim() })
      setSaved(name.trim())
      setEditing(false)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  function cancel() { setName(saved); setErr(''); setEditing(false) }

  return (
    <div style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>Profile</h1>

      {/* Personal info */}
      <div style={{ borderTop: '2px solid var(--c-text)' }}>
        {editing ? (
          <div style={{ padding: '14px 0', borderBottom: '2px solid var(--c-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Name</div>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErr('') }}
              autoFocus
              style={{ width: '100%', border: '1.5px solid var(--c-border)', borderRadius: 8, padding: '10px 12px', fontSize: 15, fontFamily: 'inherit', background: 'var(--c-surface)', color: 'var(--c-text)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
            />
            {err && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--c-primary)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={cancel} style={{ flex: 1, padding: '10px', borderRadius: 8, background: 'var(--c-bg)', color: 'var(--c-text)', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <Row label="Name" value={saved || 'Not set'} action="Edit" onAction={() => setEditing(true)} />
        )}
        <Row label="Email" value={email || ''} note="Can't be changed" />
      </div>

      {/* Links */}
      <div style={{ borderTop: '2px solid var(--c-text)' }}>
        <LinkRow label="Help and support" onClick={() => onNav('support')} />
        <LinkRow label="How passes work" onClick={() => onNav('how-passes-work')} />
        <button
          onClick={onLogout}
          style={{ minHeight: 52, borderBottom: '2px solid var(--c-border)', display: 'flex', alignItems: 'center', width: '100%', fontSize: 16, fontWeight: 600, color: '#A12A1E', padding: 0, background: 'none', border: 'none', borderBottom: '2px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit' }}
        >Log out</button>
      </div>
    </div>
  )
}

function Row({ label, value, action, note, onAction }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '2px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 52, gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
      </div>
      {action && <button onClick={onAction} style={{ color: 'var(--c-primary)', fontWeight: 600, fontSize: 14, cursor: 'pointer', flexShrink: 0, background: 'none', border: 'none', fontFamily: 'inherit' }}>{action}</button>}
      {note && <span style={{ fontSize: 12, color: 'var(--c-text-muted)', flexShrink: 0 }}>{note}</span>}
    </div>
  )
}

function LinkRow({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ minHeight: 52, borderBottom: '2px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 16, fontWeight: 600, color: 'var(--c-text)', padding: '0', background: 'none', border: 'none', borderBottom: '2px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit' }}>
      {label}<ChevronRight />
    </button>
  )
}
