const API_BASE = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  getElectionConfig: () => request('/election/config'),
  updateElectionConfig: (config) => request('/election/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  }),
  startNewElectionSession: () => request('/election/new-session', {
    method: 'POST'
  }),


  // Meta
  getDistrictsAndConstituencies: () => request('/candidates/meta/districts-and-constituencies'),
  getParties: () => request('/candidates/meta/parties'),

  // Candidates
  getCandidates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/candidates?${query}`);
  },
  addCandidate: (candidateData) => request('/candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidateData)
  }),
  uploadDataset: (formData) => fetch(`${API_BASE}/candidates/upload-dataset`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),

  // Voters
  registerVoter: (voterData) => request('/voters/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(voterData)
  }),
  getVoters: () => request('/voters'),
  deleteVoter: (id) => request(`/voters/${id}`, {
    method: 'DELETE'
  }),
  clearAllVoters: () => request('/voters/clear-all', {
    method: 'POST'
  }),
  verifyFace: (faceSignature, faceDescriptorOrHint, voterIdHint) => {
    let faceDescriptor = null;
    let hint = voterIdHint;
    if (typeof faceDescriptorOrHint === 'string') {
      hint = faceDescriptorOrHint;
    } else if (Array.isArray(faceDescriptorOrHint)) {
      faceDescriptor = faceDescriptorOrHint;
    }
    return request('/voters/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faceSignature, faceDescriptor, voterIdHint: hint })
    });
  },
  // OTP 2-Factor Authentication
  sendVoterOtp: (phoneNumber, purpose = 'REGISTRATION') => request('/voters/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, purpose })
  }),
  verifyVoterOtp: (phoneNumber, otp, purpose = 'REGISTRATION') => request('/voters/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp, purpose })
  }),
  sendVotingOtp: (voterId) => request('/voters/send-voting-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId })
  }),
  verifyVotingOtp: (voterId, otp) => request('/voters/verify-voting-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, otp })
  }),

  // Voting & Audit
  castVote: (voterId, candidateId) => request('/vote/cast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voterId, candidateId })
  }),
  getAuditLedger: () => request('/vote/audit-ledger'),

  // Analytics
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics?${query}`);
  },

  // Support Help Desk
  submitSupportTicket: (formData) => fetch(`${API_BASE}/support/ticket`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),
  getSupportTickets: () => request('/support/tickets'),

  // Admin Auth
  adminLogin: (credentials) => request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }),

  // SMS Gateway Configuration & Testing
  getSmsConfig: () => request('/sms/config'),
  updateSmsConfig: (data) => request('/sms/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  testSmsDispatch: (phoneNumber) => request('/sms/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  })
};
