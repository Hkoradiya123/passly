import React from 'react'
import { ChevronLeft } from '../../icons'

export default function SupportScreen({ onBack }) {
  return (
    <div style={{ padding: '0 20px 32px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--c-primary)', fontWeight: 600, fontSize: 14, padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <ChevronLeft size={18} />Back
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Help &amp; Support</h1>
      <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 28 }}>We're here to help.</p>

      <Section title="Common questions">
        <Faq q="How do I receive a pass?">
          When someone sends you a pass, you'll get an email with an accept link. Open it on your phone to add it to your account.
        </Faq>
        <Faq q="My QR code isn't scanning — what do I do?">
          Make sure your screen brightness is high. If it still fails, ask the gate staff to manually enter your pass ID.
        </Faq>
        <Faq q="Can I send part of my pass to someone else?">
          Yes — go to the pass, tap Send, enter the recipient's email, and choose how many admits to transfer.
        </Faq>
        <Faq q="I sent a pass by mistake — can I cancel it?">
          Open History → find the transfer → tap Recall. This works only if the recipient hasn't accepted yet.
        </Faq>
      </Section>

      <Section title="Contact us">
        <div style={{ background: 'var(--c-bg)', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
            Email us at{' '}
            <a href="mailto:support@raaspass.com" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>support@raaspass.com</a>
            {' '}and we'll get back to you within 24 hours.
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  )
}

function Faq({ q, children }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div style={{ borderTop: '1.5px solid var(--c-border)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', fontSize: 15, fontWeight: 600, color: 'var(--c-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 12 }}>
        {q}
        <span style={{ color: 'var(--c-primary)', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6, paddingBottom: 14 }}>{children}</p>}
    </div>
  )
}
