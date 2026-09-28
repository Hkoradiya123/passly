const BASE = 'http://localhost:3001/api'

function getToken() { return localStorage.getItem('rp_token') }

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || 'Request failed')
  return data
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  orgLogin:       (email, password) => req('POST', '/auth/organizer/login', { email, password }),
  orgRegister:    (name, email, password) => req('POST', '/auth/organizer/register', { name, email, password }),
  sendOtp:        (email) => req('POST', '/auth/customer/send-otp', { email }),
  verifyOtp:      (email, code) => req('POST', '/auth/customer/verify-otp', { email, code }),
  adminLogin:     (email, password) => req('POST', '/admin/login', { email, password }),

  // ── Organizer ─────────────────────────────────────────
  dashboard:      () => req('GET', '/organizer/dashboard'),
  getEvents:      () => req('GET', '/organizer/events'),
  createEvent:    (d) => req('POST', '/organizer/events', d),
  getEvent:       (id) => req('GET', `/organizer/events/${id}`),
  updateEvent:    (id, d) => req('PUT', `/organizer/events/${id}`, d),
  deleteEvent:    (id) => req('DELETE', `/organizer/events/${id}`),
  getPassTypes:   (eid) => req('GET', `/organizer/events/${eid}/pass-types`),
  createPassType: (eid, d) => req('POST', `/organizer/events/${eid}/pass-types`, d),
  updatePassType: (id, d) => req('PUT', `/organizer/pass-types/${id}`, d),
  deletePassType: (id) => req('DELETE', `/organizer/pass-types/${id}`),
  getPasses:      (eid, qs='') => req('GET', `/organizer/events/${eid}/passes${qs}`),
  createPass:     (eid, d) => req('POST', `/organizer/events/${eid}/passes`, d),
  revokePass:     (id) => req('POST', `/organizer/passes/${id}/revoke`),
  orgSendPass:    (id, email, eventId) => req('POST', `/organizer/passes/${id}/send`, { email, event_id: eventId }),
  createBatch:    (eid, d) => req('POST', `/organizer/events/${eid}/batches`, d),
  getBatches:     (eid) => req('GET', `/organizer/events/${eid}/batches`),
  shareBatchEmail:(token, email) => req('POST', '/organizer/batches/share-email', { token, email }),
  getClaimBatch:  (token) => req('GET', `/customer/claim/${token}`),
  claimPass:      (token) => req('POST', `/customer/claim/${token}`),
  resetEntries:   (id) => req('POST', `/organizer/passes/${id}/reset-entries`),
  scanQr:         (qr_data) => req('POST', '/organizer/passes/scan', { qr_data }),
  enterPass:      (id, count, gate) => req('POST', `/organizer/passes/${id}/enter`, { count, gate }),
  getEntries:     (eid) => req('GET', `/organizer/events/${eid}/entries`),

  // ── Customer ──────────────────────────────────────────
  getMe:          () => req('GET', '/customer/me'),
  updateMe:       (d) => req('PUT', '/customer/me', d),
  myPasses:       () => req('GET', '/customer/passes'),
  myPass:         (id) => req('GET', `/customer/passes/${id}`),
  sendPass:       (id, d) => req('POST', `/customer/passes/${id}/send`, d),
  myTransfers:    () => req('GET', '/customer/transfers'),
  recallTransfer: (id) => req('POST', `/customer/transfers/${id}/recall`),
  acceptTransfer: (id, d) => req('POST', `/customer/transfers/${id}/accept`, d),
  passHistory:    (id) => req('GET', `/customer/passes/${id}/history`),

  // ── Admin ─────────────────────────────────────────────
  adminDashboard: () => req('GET', '/admin/dashboard'),
  adminOrgs:      (s) => req('GET', `/admin/organizers${s ? `?search=${encodeURIComponent(s)}` : ''}`),
  adminOrg:       (id) => req('GET', `/admin/organizers/${id}`),
  deleteOrg:      (id) => req('DELETE', `/admin/organizers/${id}`),
  adminEvents:    (qs='') => req('GET', `/admin/events${qs}`),
  adminPasses:    (qs='') => req('GET', `/admin/passes${qs}`),
  adminStats:     () => req('GET', '/admin/stats'),
}
