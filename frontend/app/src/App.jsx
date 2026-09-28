import React, { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import LoginScreen from './screens/auth/LoginScreen'

// Organizer screens
import OrgDashboard from './screens/organizer/DashboardScreen'
import OrgEvents from './screens/organizer/EventsScreen'
import OrgEventDetail from './screens/organizer/EventDetailScreen'
import OrgCreateEvent from './screens/organizer/CreateEventScreen'
import OrgScanner from './screens/organizer/ScannerScreen'
import OrgSidebar from './components/OrgSidebar'

// Customer screens
import CustNavbar from './components/CustNavbar'
import CustomerPasses from './screens/customer/PassesScreen'
import CustomerQR from './screens/customer/PassQRScreen'
import CustomerSend from './screens/customer/SendScreen'
import CustomerHistory from './screens/customer/HistoryScreen'
import CustomerProfile from './screens/customer/ProfileScreen'
import CustomerAccept from './screens/customer/AcceptScreen'
import CustomerSupport from './screens/customer/SupportScreen'
import CustomerHowPasses from './screens/customer/HowPassesWorkScreen'
import CustomerClaim from './screens/customer/ClaimScreen'

// Admin screens
import AdminDashboard from './screens/admin/DashboardScreen'
import AdminOrganizers from './screens/admin/OrganizersScreen'
import AdminEvents from './screens/admin/EventsScreen'
import AdminPasses from './screens/admin/PassesScreen'
import AdminSidebar from './components/AdminSidebar'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rp_user') || 'null') } catch { return null }
  })
  const claimToken = new URLSearchParams(window.location.search).get('claim')
  const [appScreen, setAppScreen] = useState(() => claimToken ? 'claim' : user ? 'app' : 'home')

  // Organizer nav state
  const [orgScreen, setOrgScreen] = useState({ name: 'dashboard' })

  // Customer nav stack
  const [stack, setStack] = useState([{ screen: 'passes' }])
  const [selectedPass, setSel] = useState(null)
  const [qrDark, setQrDark] = useState(false)

  // Admin nav state
  const [adminScreen, setAdminScreen] = useState('dashboard')

  function handleAuth(token, userData) {
    localStorage.setItem('rp_token', token)
    localStorage.setItem('rp_user', JSON.stringify(userData))
    setUser(userData)
    setAppScreen('app')
  }

  function handleLogout() {
    localStorage.removeItem('rp_token')
    localStorage.removeItem('rp_user')
    setUser(null)
    setAppScreen('home')
  }

  if (appScreen === 'claim') return (
    <CustomerClaim
      token={claimToken}
      user={user}
      onNav={(s) => { setStack([{ screen: s }]); setAppScreen('app') }}
      onLogin={() => setAppScreen('login')}
    />
  )

  if (appScreen === 'home') return (
    <HomeScreen
      user={user}
      onLogin={() => setAppScreen('login')}
      onDashboard={() => setAppScreen('app')}
    />
  )

  if (appScreen === 'login' || (!user && appScreen !== 'home'))
    return <LoginScreen onAuth={handleAuth} />

  // ── ORGANIZER ──────────────────────────────────────────────────────────────
  if (user.role === 'organizer') {
    const nav = (name, extra = {}) => setOrgScreen({ name, ...extra })

    const content = () => {
      switch (orgScreen.name) {
        case 'dashboard':    return <OrgDashboard onNav={nav} />
        case 'events':       return <OrgEvents onNav={nav} />
        case 'event-detail': return <OrgEventDetail eventId={orgScreen.eventId} onNav={nav} />
        case 'create-event': return <OrgCreateEvent onNav={nav} />
        case 'scanner':      return <OrgScanner eventId={orgScreen.eventId} onNav={nav} />
        default:             return <OrgDashboard onNav={nav} />
      }
    }

    return (
      <div className="org-layout">
        <OrgSidebar screen={orgScreen.name} user={user} onNav={nav} onLogout={handleLogout} />
        <div className="org-main">{content()}</div>
      </div>
    )
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (user.role === 'super_admin') {
    const content = () => {
      switch (adminScreen) {
        case 'dashboard':   return <AdminDashboard />
        case 'organizers':  return <AdminOrganizers />
        case 'events':      return <AdminEvents />
        case 'passes':      return <AdminPasses />
        default:            return <AdminDashboard />
      }
    }

    return (
      <div className="admin-layout">
        <AdminSidebar screen={adminScreen} user={user} onNav={setAdminScreen} onLogout={handleLogout} />
        <div className="admin-main">{content()}</div>
      </div>
    )
  }

  // ── CUSTOMER ───────────────────────────────────────────────────────────────
  const current = stack[stack.length - 1]
  const push = (screen, extra = {}) => setStack(s => [...s, { screen, ...extra }])
  const pop  = () => setStack(s => s.length > 1 ? s.slice(0, -1) : s)
  const reset = (screen, extra = {}) => setStack([{ screen, ...extra }])
  const handleNav = (screen) => setStack([{ screen }])

  const firstName = user.name
    ? user.name.split(' ')[0]
    : user.email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).split(' ')[0]

  const fullName = user.name || user.email.split('@')[0].replace(/[\._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const parts = fullName.split(' ')
  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '')

  const HIDE_NAV = ['qr', 'send', 'accept']
  const showNav = !HIDE_NAV.includes(current.screen)

  return (
    <div className={`cust-shell${qrDark ? ' qr-dark' : ''}`}>
      {showNav && <CustNavbar screen={current.screen} initials={initials} onNav={handleNav} />}

      <div className="cust-main">
        {current.screen === 'passes' && (
          <CustomerPasses
            firstName={firstName}
            onShowQr={pass => { setSel(pass); push('qr') }}
            onSend={pass => { setSel(pass); push('send') }}
            onNav={handleNav}
          />
        )}
        {current.screen === 'qr' && selectedPass && (
          <CustomerQR
            pass={selectedPass}
            onBack={() => { setQrDark(false); pop() }}
            onSplit={() => { setQrDark(false); push('send') }}
            onSend={() => { setQrDark(false); push('send') }}
            onDarkChange={setQrDark}
          />
        )}
        {current.screen === 'send' && selectedPass && (
          <CustomerSend pass={selectedPass} onBack={pop} onDone={() => reset('passes')} />
        )}
        {current.screen === 'accept' && (
          <CustomerAccept onDone={() => reset('passes')} />
        )}
        {current.screen === 'history' && (
          <CustomerHistory onNav={handleNav} />
        )}
        {current.screen === 'profile' && (
          <CustomerProfile
            email={user.email}
            userName={fullName}
            onNav={handleNav}
            onLogout={handleLogout}
          />
        )}
        {current.screen === 'support' && (
          <CustomerSupport onBack={pop} />
        )}
        {current.screen === 'how-passes-work' && (
          <CustomerHowPasses onBack={pop} />
        )}
      </div>
    </div>
  )
}
