const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getState, updateState } = require('../services/db');
const { matchVoterByFace, maskVoterProfile, hashBiometric, computeCosineSimilarity } = require('../services/biometrics');
const { generateOtp, verifyOtp } = require('../services/otpService');

// Helper to calculate exact age in years from DOB
function calculateAge(dobString) {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return -1;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// 1. Send OTP for Voter Registration (Enrollment)
router.post('/send-otp', async (req, res) => {
  const { phoneNumber, purpose = 'REGISTRATION' } = req.body;
  try {
    const cleanPhone = String(phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number! In India, valid SIM numbers must be 10 digits starting with 6, 7, 8, or 9.'
      });
    }

    const state = getState();
    // Check if phone number is already enrolled for another voter
    const existing = (state.voters || []).find(v => v.phoneNumber && v.phoneNumber.slice(-10) === cleanPhone);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Mobile number +91 ${cleanPhone} is already enrolled under voter ${existing.fullName} (${existing.id}).`
      });
    }

    const otpData = await generateOtp(cleanPhone, purpose);
    return res.json({
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}. Check your phone messages.`,
      smsStatus: otpData.smsStatus,
      devFallbackCode: otpData.smsStatus?.delivered ? undefined : otpData.code
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 2. Verify OTP for Voter Registration
router.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp, purpose = 'REGISTRATION' } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and 6-digit OTP code are required.' });
  }

  const result = verifyOtp(phoneNumber, otp, purpose);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  return res.json({
    success: true,
    verified: true,
    message: 'Mobile number verified successfully! Valid OTP.'
  });
});

// 3. Send Voting Authorization OTP to Voter's Registered Phone Number
router.post('/send-voting-otp', async (req, res) => {
  const { voterId } = req.body;
  if (!voterId) {
    return res.status(400).json({ success: false, message: 'Voter ID is required to send voting OTP.' });
  }

  const state = getState();
  const voter = (state.voters || []).find(v => v.id === voterId);
  if (!voter) {
    return res.status(404).json({ success: false, message: 'Voter profile not found in database.' });
  }

  if (voter.hasVoted) {
    return res.status(409).json({
      success: false,
      duplicateVote: true,
      message: 'Duplicate Vote Lock: You have already cast your ballot.'
    });
  }

  const phone = voter.phoneNumber || '9876543210';
  const otpData = await generateOtp(phone, 'VOTING', voter.fullName);

  return res.json({
    success: true,
    message: `Voting Authorization OTP dispatched to registered mobile +91 ******${phone.slice(-4)}. Check your phone.`,
    maskedPhone: `+91 ******${phone.slice(-4)}`,
    smsStatus: otpData.smsStatus
  });
});

// 4. Verify Voting Authorization OTP before ballot unlock
router.post('/verify-voting-otp', (req, res) => {
  const { voterId, otp } = req.body;
  if (!voterId || !otp) {
    return res.status(400).json({ success: false, message: 'Voter ID and OTP are required.' });
  }

  const state = getState();
  const voter = (state.voters || []).find(v => v.id === voterId);
  if (!voter) {
    return res.status(404).json({ success: false, message: 'Voter record not found.' });
  }

  const phone = voter.phoneNumber || '9876543210';
  const result = verifyOtp(phone, otp, 'VOTING');
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.message || 'Invalid OTP! Please enter the correct 6-digit code.'
    });
  }

  return res.json({
    success: true,
    verified: true,
    message: '2FA Voting Authorization Complete. Ballot unlocked!',
    voter: maskVoterProfile(voter)
  });
});

// Register new voter (Admin enrollment)
router.post('/register', (req, res) => {
  const { 
    fullName, 
    aadhaar, 
    phoneNumber, 
    isPhoneVerified, 
    dob, 
    district, 
    constituency, 
    facePhoto, 
    faceDescriptor 
  } = req.body;

  // Basic validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ success: false, message: 'Full Name is required.' });
  }

  const cleanAadhaar = (aadhaar || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 12 numeric digits.' });
  }

  // Optional phone number
  const cleanPhone = String(phoneNumber || '').replace(/\D/g, '').slice(-10);

  // Face capture requirement
  if (!facePhoto) {
    return res.status(400).json({
      success: false,
      message: 'Live facial biometric snapshot must be captured before registration.'
    });
  }

  // Strict Age Check rule
  if (!dob) {
    return res.status(400).json({ success: false, message: 'Date of birth is required.' });
  }

  const age = calculateAge(dob);
  if (age < 18) {
    return res.status(400).json({
      success: false,
      eligible: false,
      message: 'You are not eligible for election'
    });
  }

  if (!district || !constituency) {
    return res.status(400).json({ success: false, message: 'District and Electoral Constituency are required.' });
  }

  const state = getState();
  const existingAadhaar = state.voters.find(v => v.aadhaar.replace(/\s/g, '') === cleanAadhaar);
  if (existingAadhaar) {
    return res.status(400).json({ success: false, message: 'A voter with this Aadhaar number is already enrolled in the electoral roll.' });
  }

// Helper to assign sequential unique Person ID
function getNextPersonId(state) {
  const existingIds = (state.voters || [])
    .map(v => Number(v.personId))
    .filter(id => !isNaN(id) && id > 0);
  if (existingIds.length === 0) {
    let base = 38;
    state.voters.forEach((v, idx) => {
      if (!v.personId) v.personId = base - (state.voters.length - 1 - idx);
    });
    return 39;
  }
  return Math.max(...existingIds) + 1;
}

  // Anti-Fraud Duplicate Facial Biometric Check (Threshold: >= 0.82)
  if (faceDescriptor && Array.isArray(faceDescriptor) && faceDescriptor.length > 0) {
    for (const v of state.voters) {
      if (Array.isArray(v.faceDescriptor) && v.faceDescriptor.length > 0) {
        const sim = computeCosineSimilarity(faceDescriptor, v.faceDescriptor);
        if (sim >= 0.82) {
          const pId = v.personId || v.id;
          return res.status(409).json({
            success: false,
            duplicateBiometric: true,
            personId: pId,
            name: v.fullName,
            message: `Person already registered as Person ID ${pId} - ${v.fullName}`
          });
        }
      }
    }
  }

  const personId = getNextPersonId(state);
  const voterId = `VOTER-TN-${Date.now().toString().slice(-6)}`;
  const formattedAadhaar = `${cleanAadhaar.slice(0, 4)} ${cleanAadhaar.slice(4, 8)} ${cleanAadhaar.slice(8, 12)}`;

  const newVoter = {
    id: voterId,
    personId,
    fullName: fullName.trim(),
    aadhaar: formattedAadhaar,
    phoneNumber: cleanPhone,
    isPhoneVerified: true,
    dob,
    age,
    district,
    constituency,
    facePhoto,
    faceDescriptor: faceDescriptor || hashBiometric(facePhoto || fullName),
    hasVoted: false,
    registeredAt: new Date().toISOString()
  };

  updateState(s => {
    s.voters.push(newVoter);
  });

  return res.status(201).json({
    success: true,
    personId: newVoter.personId,
    name: newVoter.fullName,
    message: 'Face biometric enrolled successfully.',
    voter: maskVoterProfile(newVoter)
  });
});

// Get all voters (Admin view, masked)
router.get('/', (req, res) => {
  const state = getState();
  const maskedList = (state.voters || []).map(maskVoterProfile);
  res.json({ success: true, count: maskedList.length, voters: maskedList });
});

// Biometric verification: Face
router.post('/verify-face', (req, res) => {
  const { faceSignature, faceDescriptor, voterIdHint } = req.body;
  if (!faceSignature && !faceDescriptor) {
    return res.status(400).json({ success: false, message: 'Face signature / snapshot data is required.' });
  }

  const result = matchVoterByFace(faceSignature, faceDescriptor, voterIdHint);
  if (!result.matched) {
    return res.status(403).json({
      success: false,
      unauthorized: true,
      alertType: 'UNAUTHORIZED_USER',
      message: 'UNKNOWN - Please scan again.',
      tamilMessage: 'அடையாளம் காணப்படவில்லை - தயவுசெய்து மீண்டும் ஸ்கேன் செய்யவும்.'
    });
  }

  return res.json({
    success: true,
    confidence: result.confidence,
    personId: result.personId || result.voter.personId,
    fullName: result.fullName || result.voter.fullName,
    message: result.message || `MATCHED - Person ID: ${result.personId || result.voter.personId} - Name: ${result.fullName || result.voter.fullName}`,
    voter: result.voter
  });
});

// Delete individual voter
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const state = getState();
  const index = (state.voters || []).findIndex(v => v.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Voter record not found.' });
  }

  const removed = state.voters.splice(index, 1)[0];
  updateState(s => {
    s.voters = state.voters;
  });

  return res.json({
    success: true,
    message: `Voter ${removed.fullName} (${removed.id}) deleted successfully.`,
    deletedVoterId: id
  });
});

// Clear all voters (Admin hard reset)
router.post('/clear-all', (req, res) => {
  updateState(s => {
    s.voters = [];
    s.votesAudit = [];
  });
  return res.json({
    success: true,
    message: 'All voter biometrics and registration records wiped successfully. Database is clean.'
  });
});

module.exports = router;
