import React, { useState, useRef, useEffect } from 'react'
import { api } from '../../api'

const OTP_LEN = import.meta.env.DEV ? 4 : 6

export default function LoginScreen({ onAuth }) {
  const [role, setRole] = useState('customer') // customer | organizer | admin
  const [step, setStep] = useState('main') // main | otp | register
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  function switchRole(r) {
    setRole(r); setStep('main'); setError(''); setOtp('')
    setForm({ name: '', email: '', password: '', confirm: '' })
  }

  // ── Customer OTP send ──────────────────────────────────────────────────────
  async function sendOtp() {
    if (!form.email) return setError('Enter your email')
    setLoading(true); setError('')
    try {
      await api.sendOtp(form.email)
      setStep('otp'); setResendTimer(30)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  // ── Customer OTP verify (any 6 digits) ────────────────────────────────────
  async function verifyOtp(code) {
    if (code.length !== OTP_LEN) return
    setLoading(true); setError('')
    try {
      const d = await api.verifyOtp(form.email, code)
      onAuth(d.token, { ...d.customer, role: 'customer' })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  // ── Organizer login ────────────────────────────────────────────────────────
  async function orgLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const d = await api.orgLogin(form.email, form.password)
      onAuth(d.token, { ...d.organizer, role: 'organizer' })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  // ── Organizer register ────────────────────────────────────────────────────
  async function orgRegister(e) {
    e.preventDefault()
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setLoading(true); setError('')
    try {
      const d = await api.orgRegister(form.name, form.email, form.password)
      onAuth(d.token, { ...d.organizer, role: 'organizer' })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  // ── Admin login ────────────────────────────────────────────────────────────
  async function adminLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const d = await api.adminLogin(form.email, form.password)
      onAuth(d.token, { ...d.admin, role: 'super_admin' })
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  // ── Shared error + loading display ────────────────────────────────────────
  const Err = () => error ? <div style={{ fontSize: 13, color: '#DC2626', marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', borderRadius: 8 }}>{error}</div> : null

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFE6DC', padding: 16 }}>
      <div style={{ width: 400, background: '#FFF8F0', borderRadius: 20, padding: 32, boxShadow: '0 8px 40px rgba(35,26,31,.15)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo.svg" alt="Passly" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 20, fontFamily: 'Archivo, sans-serif' }}>Passly</span>
        </div>


        {/* ── CUSTOMER ── */}
        {role === 'customer' && step === 'main' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Archivo, sans-serif', marginBottom: 4 }}>Your Garba passes</h2>
              <p style={{ fontSize: 14, color: '#6B5A62' }}>Enter your email to access your passes</p>
            </div>
            <Err />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email address</label>
              <input
                type="email" autoFocus
                value={form.email} onChange={e => set('email', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="you@example.com"
                style={{ width: '100%', border: '2px solid #E6D7C9', borderRadius: 10, padding: '12px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#7A1F3D'}
                onBlur={e => e.target.style.borderColor = '#E6D7C9'}
              />
            </div>
            <button onClick={sendOtp} disabled={loading || !form.email} style={{ width: '100%', padding: '13px', background: form.email ? '#7A1F3D' : '#E6D7C9', color: form.email ? '#FFF8F0' : '#6B5A62', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </>
        )}

        {role === 'customer' && step === 'otp' && (
          <>
            <button onClick={() => { setStep('main'); setOtp('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A1F3D', fontSize: 14, fontWeight: 600, marginBottom: 16, padding: 0, fontFamily: 'inherit' }}>← Back</button>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Archivo, sans-serif', marginBottom: 4 }}>Enter the code</h2>
              <p style={{ fontSize: 14, color: '#6B5A62' }}>Sent to {form.email}</p>
            </div>
            <Err />
            {/* OTP boxes */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${OTP_LEN},1fr)`, gap: 8, pointerEvents: 'none' }}>
                {otp.padEnd(OTP_LEN, ' ').split('').map((d, i) => {
                  const filled = i < otp.length; const active = i === otp.length
                  return (
                    <div key={i} style={{ height: 52, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, background: '#fff', border: `${active ? 3 : 2}px solid ${active ? '#F29A1F' : filled ? '#231A1F' : '#E6D7C9'}` }}>
                      {filled ? d : ''}
                    </div>
                  )
                })}
              </div>
              <input
                ref={inputRef} type="tel" inputMode="numeric" autoFocus
                value={otp}
                onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,OTP_LEN); setOtp(v); if (v.length === OTP_LEN) verifyOtp(v) }}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'text' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B5A62', marginBottom: 16 }}>
              <span>Didn't get it?</span>
              {resendTimer > 0
                ? <span style={{ fontWeight: 600 }}>Resend in 0:{String(resendTimer).padStart(2,'0')}</span>
                : <button onClick={() => { setOtp(''); sendOtp() }} style={{ background: 'none', border: 'none', color: '#7A1F3D', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Resend</button>
              }
            </div>
            <button onClick={() => verifyOtp(otp)} disabled={loading || otp.length < OTP_LEN} style={{ width: '100%', padding: '13px', background: otp.length === OTP_LEN ? '#7A1F3D' : '#E6D7C9', color: otp.length === OTP_LEN ? '#FFF8F0' : '#6B5A62', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </>
        )}

        {/* ── ORGANIZER ── */}
        {role === 'organizer' && step === 'main' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Archivo, sans-serif', marginBottom: 4 }}>Organizer Portal</h2>
              <p style={{ fontSize: 14, color: '#6B5A62' }}>Manage your events and passes</p>
            </div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E6D7C9', marginBottom: 20 }}>
              {['Login', 'Register'].map((t, i) => (
                <button key={t} onClick={() => { setError(''); setForm(f => ({ ...f, name: '', confirm: '' })); setStep(i === 0 ? 'main' : 'register') }}
                  style={{ flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: (step === 'main' && i === 0) || (step === 'register' && i === 1) ? '#7A1F3D' : '#6B5A62', borderBottom: (step === 'main' && i === 0) || (step === 'register' && i === 1) ? '2px solid #7A1F3D' : '2px solid transparent', marginBottom: -2 }}>
                  {t}
                </button>
              ))}
            </div>
            <Err />
            <form onSubmit={orgLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="org@example.com" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#7A1F3D', color: '#FFF8F0', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}

        {role === 'organizer' && step === 'register' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Archivo, sans-serif', marginBottom: 4 }}>Create account</h2>
            </div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E6D7C9', marginBottom: 20 }}>
              {['Login', 'Register'].map((t, i) => (
                <button key={t} onClick={() => { setError(''); setStep(i === 0 ? 'main' : 'register') }}
                  style={{ flex: 1, padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', color: (step === 'main' && i === 0) || (step === 'register' && i === 1) ? '#7A1F3D' : '#6B5A62', borderBottom: (step === 'main' && i === 0) || (step === 'register' && i === 1) ? '2px solid #7A1F3D' : '2px solid transparent', marginBottom: -2 }}>
                  {t}
                </button>
              ))}
            </div>
            <Err />
            <form onSubmit={orgRegister}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Organization name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Sheri Garba Utsav" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="org@example.com" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Confirm password</label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="••••••••" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#7A1F3D', color: '#FFF8F0', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Creating…' : 'Create account'}
              </button>
            </form>
          </>
        )}

        {/* ── ADMIN ── */}
        {role === 'admin' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: 'rgba(122,31,61,.1)', color: '#7A1F3D', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Super Admin
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Archivo, sans-serif', marginBottom: 4 }}>Admin Access</h2>
              <p style={{ fontSize: 14, color: '#6B5A62' }}>Platform management</p>
            </div>
            <Err />
            <form onSubmit={adminLogin}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@raaspass.com" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Password</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" required style={{ width: '100%', border: '1.5px solid #E6D7C9', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#7A1F3D', color: '#FFF8F0', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        )}
        {/* Role switcher — subtle, bottom */}
        {role === 'customer' && (
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#9B8A93' }}>
            Organizer or Admin?{' '}
            <button onClick={() => switchRole('organizer')} style={{ background: 'none', border: 'none', color: '#7A1F3D', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Sign in here</button>
          </div>
        )}
        {(role === 'organizer' || role === 'admin') && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: '#9B8A93' }}>
            {role === 'organizer'
              ? <><button onClick={() => switchRole('admin')} style={{ background: 'none', border: 'none', color: '#7A1F3D', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Admin login</button> · <button onClick={() => switchRole('customer')} style={{ background: 'none', border: 'none', color: '#9B8A93', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Customer</button></>
              : <button onClick={() => switchRole('customer')} style={{ background: 'none', border: 'none', color: '#9B8A93', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>← Back to customer login</button>
            }
          </div>
        )}
      </div>
    </div>
  )
}
