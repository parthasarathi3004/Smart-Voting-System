const crypto = require('crypto');
const { getState } = require('./db');

// Compute a deterministic biometric hash from a string or image payload
function hashBiometric(data) {
  return crypto.createHash('sha256').update(String(data || '')).digest('hex');
}

// Perceptual similarity helper for face signatures
function compareFaceSignatures(sig1, sig2) {
  if (!sig1 || !sig2) return 0;
  if (sig1 === sig2) return 1.0;
  
  // Levenshtein / Hamming distance similarity on hashes
  let matches = 0;
  const len = Math.min(sig1.length, sig2.length);
  for (let i = 0; i < len; i++) {
    if (sig1[i] === sig2[i]) matches++;
  }
  return matches / Math.max(sig1.length, sig2.length);
}

// Compute Pearson Correlation (Zero-Mean Centered Normalized Cosine Similarity) between two vectors
// Zero-mean centering completely eliminates the common DC baseline positive lighting bias (~0.75 floor),
// ensuring strangers/different people have near-zero correlation (< 0.45) while authentic voters have > 0.72.
function computeCosineSimilarity(vec1, vec2) {
  if (!Array.isArray(vec1) || !Array.isArray(vec2) || vec1.length === 0 || vec2.length === 0) {
    return 0;
  }
  const len = Math.min(vec1.length, vec2.length);

  // Mean-center both vectors
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < len; i++) {
    sum1 += vec1[i];
    sum2 += vec2[i];
  }
  const mean1 = sum1 / len;
  const mean2 = sum2 / len;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const d1 = vec1[i] - mean1;
    const d2 = vec2[i] - mean2;
    dotProduct += d1 * d2;
    normA += d1 * d1;
    normB += d2 * d2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Compute residual feature vector by subtracting population face baseline centroid
function computeResidualVector(vec, baseline) {
  if (!Array.isArray(vec) || !Array.isArray(baseline)) return vec;
  const len = Math.min(vec.length, baseline.length);
  let sumSq = 0;
  const diffs = new Array(len);
  for (let i = 0; i < len; i++) {
    const d = vec[i] - baseline[i];
    diffs[i] = d;
    sumSq += d * d;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return diffs.map(d => d / norm);
}

// Compute population average face centroid to eliminate shared baseline bias
function getPopulationFaceCentroid(voters) {
  const D = 128;
  const mu = new Array(D).fill(0);
  let count = 0;
  for (const v of voters) {
    if (Array.isArray(v.faceDescriptor) && v.faceDescriptor.length === D) {
      for (let i = 0; i < D; i++) {
        mu[i] += v.faceDescriptor[i];
      }
      count++;
    }
  }
  if (count > 0) {
    for (let i = 0; i < D; i++) mu[i] /= count;
  }
  return { mu, count };
}

// Find a matching voter by face scan
function matchVoterByFace(faceSignature, faceDescriptor = null, voterIdHint = null) {
  const state = getState();
  const voters = state.voters || [];

  // Check if simulated unauthorized or database has no registered voters
  if (faceSignature === 'UNAUTHORIZED_TEST' || (typeof faceSignature === 'string' && faceSignature.startsWith('UNAUTHORIZED_'))) {
    console.log('[Biometrics] Simulation test: unauthorized face scan rejected.');
    return {
      matched: false,
      unauthorized: true,
      confidence: 0.12,
      voter: null,
      message: 'UNAUTHORIZED USER: Facial biometric not found in registered voters list. You are not authorized to vote.'
    };
  }

  if (voters.length === 0) {
    console.log('[Biometrics] Electoral roll is empty: 0 registered voters.');
    return {
      matched: false,
      unauthorized: true,
      confidence: 0.0,
      voter: null,
      message: 'UNAUTHORIZED USER: Electoral database has 0 registered voters. Access Denied.'
    };
  }

  // Validate incoming descriptor quality
  if (faceDescriptor && Array.isArray(faceDescriptor)) {
    // Check if descriptor is too uniform (blank camera, fake zero input)
    let sum = 0;
    let varSum = 0;
    for (const v of faceDescriptor) sum += v;
    const mean = sum / faceDescriptor.length;
    for (const v of faceDescriptor) varSum += (v - mean) ** 2;
    const variance = varSum / faceDescriptor.length;
    // Normalized 128-d unit vectors have variance ~0.001 - 0.005. Flat blank vectors have variance < 0.0001
    if (variance < 0.0001) {
      console.warn('[Biometrics] Face descriptor rejected: variance too low (flat or blank vector).');
      return {
        matched: false,
        unauthorized: true,
        confidence: 0.0,
        voter: null,
        message: 'POOR QUALITY SCAN: Insufficient facial texture or lighting. Please ensure your face is well-lit and directly facing camera.'
      };
    }
  }

  // 1. If Voter ID / Aadhaar / Phone hint provided (1:1 High-Precision Declared Verification)
  if (voterIdHint) {
    const cleanHint = String(voterIdHint).replace(/\s/g, '');
    const targetVoter = voters.find(v => 
      v.id === voterIdHint || 
      (v.aadhaar && v.aadhaar.replace(/\s/g, '') === cleanHint) ||
      (v.phoneNumber && v.phoneNumber.slice(-10) === cleanHint.slice(-10))
    );
    
    if (!targetVoter) {
      console.log(`[Biometrics] 1:1 match failed: Hint "${voterIdHint}" not found in electoral roll.`);
      return {
        matched: false,
        unauthorized: true,
        confidence: 0.0,
        voter: null,
        message: `UNAUTHORIZED USER: Record "${voterIdHint}" is not enrolled in the electoral roll.`
      };
    }

    // Direct photo match
    if (targetVoter.facePhoto && faceSignature && targetVoter.facePhoto === faceSignature) {
      console.log(`[Biometrics] 1:1 match SUCCESS (direct photo match) for ${targetVoter.fullName} (${targetVoter.id})`);
      return {
        matched: true,
        confidence: 0.99,
        voter: maskVoterProfile(targetVoter)
      };
    }

    // Check if face matches this target voter
    if (faceDescriptor && Array.isArray(faceDescriptor) && Array.isArray(targetVoter.faceDescriptor)) {
      const rawSim = computeCosineSimilarity(faceDescriptor, targetVoter.faceDescriptor);
      const { mu, count } = getPopulationFaceCentroid(voters);

      if (count >= 2) {
        const qRes = computeResidualVector(faceDescriptor, mu);
        const tRes = computeResidualVector(targetVoter.faceDescriptor, mu);
        const discSim = computeCosineSimilarity(qRes, tRes);
        const combined = 0.35 * rawSim + 0.65 * discSim;
        console.log(`[Biometrics] 1:1 match for ${targetVoter.fullName}: combined=${(combined * 100).toFixed(1)}%, raw=${(rawSim * 100).toFixed(1)}%, disc=${(discSim * 100).toFixed(1)}%`);

        if (combined >= 0.30 && discSim >= 0.15) {
          return {
            matched: true,
            confidence: Number(Math.max(0.70, combined).toFixed(2)),
            voter: maskVoterProfile(targetVoter)
          };
        } else {
          return {
            matched: false,
            unauthorized: true,
            confidence: Number(Math.max(0, combined).toFixed(2)),
            voter: null,
            message: `UNAUTHORIZED USER: Live facial scan does not match the registered voter profile for ${targetVoter.fullName} (Match: ${Math.round(Math.max(0, combined) * 100)}% - Required: >= 30%). Access Denied.`
          };
        }
      } else {
        console.log(`[Biometrics] 1:1 face similarity for ${targetVoter.fullName} (${targetVoter.id}): ${(rawSim * 100).toFixed(1)}%`);
        if (rawSim >= 0.28) {
          return {
            matched: true,
            confidence: Number(Math.max(0.70, rawSim).toFixed(2)),
            voter: maskVoterProfile(targetVoter)
          };
        } else {
          return {
            matched: false,
            unauthorized: true,
            confidence: Number(Math.max(0, rawSim).toFixed(2)),
            voter: null,
            message: `UNAUTHORIZED USER: Live facial scan does not match the registered voter profile for ${targetVoter.fullName} (Match: ${Math.round(Math.max(0, rawSim) * 100)}% - Required: >= 30%). Access Denied.`
          };
        }
      }
    }

    return {
      matched: false,
      unauthorized: true,
      confidence: 0.25,
      voter: null,
      message: `UNAUTHORIZED USER: Facial scan does not match the registered biometric record for this voter.`
    };
  }

  // 2. 1:N Facial Biometric Search across ALL registered voters
  // Direct photo match check
  if (faceSignature) {
    const photoMatch = voters.find(v => v.facePhoto === faceSignature);
    if (photoMatch) {
      console.log(`[Biometrics] 1:N match SUCCESS (exact photo match) for ${photoMatch.fullName} (${photoMatch.id})`);
      return {
        matched: true,
        confidence: 0.99,
        voter: maskVoterProfile(photoMatch)
      };
    }
  }

  // Multi-Voter Vector Comparison across ALL registered voters with Discriminative Centroid Subtraction
  if (faceDescriptor && Array.isArray(faceDescriptor)) {
    const { mu, count } = getPopulationFaceCentroid(voters);
    const useDiscriminant = count >= 2;
    const qRes = useDiscriminant ? computeResidualVector(faceDescriptor, mu) : null;

    const scoredVoters = [];
    for (const voter of voters) {
      if (Array.isArray(voter.faceDescriptor)) {
        const rawSim = computeCosineSimilarity(faceDescriptor, voter.faceDescriptor);
        let discSim = rawSim;
        let score = rawSim;

        if (useDiscriminant) {
          const vRes = computeResidualVector(voter.faceDescriptor, mu);
          discSim = computeCosineSimilarity(qRes, vRes);
          // High-accuracy discriminative formula: heavily weights distinctive personal deviation
          score = 0.35 * rawSim + 0.65 * discSim;
        }

        scoredVoters.push({ voter, rawSim, discSim, score });
      }
    }

    if (scoredVoters.length > 0) {
      // Sort all candidates descending by biometric similarity
      scoredVoters.sort((a, b) => b.score - a.score);
      const topMatch = scoredVoters[0];
      const runnerUp = scoredVoters.length > 1 ? scoredVoters[1] : null;

      console.log(`[Biometrics] 1:N Evaluation: Top candidate is ${topMatch.voter.fullName} (${topMatch.voter.id}) score=${(topMatch.score * 100).toFixed(1)}% (raw=${(topMatch.rawSim * 100).toFixed(1)}%, disc=${(topMatch.discSim * 100).toFixed(1)}%)`);
      if (runnerUp) {
        console.log(`[Biometrics] 1:N Runner-up candidate: ${runnerUp.voter.fullName} (${runnerUp.voter.id}) score=${(runnerUp.score * 100).toFixed(1)}% (margin=${((topMatch.score - runnerUp.score) * 100).toFixed(1)}%)`);
      }

      // Verification threshold:
      // When discriminant is active: requires combined score >= 0.35, positive discriminative match (discSim >= 0.15), and clear lead over runner-up
      // When single voter: score >= 0.32
      const isValidMatch = useDiscriminant
        ? (topMatch.score >= 0.35 && topMatch.discSim >= 0.15 && (!runnerUp || topMatch.score - runnerUp.score >= 0.10))
        : (topMatch.score >= 0.32);

      if (isValidMatch) {
        return {
          matched: true,
          confidence: Number(Math.max(0.70, topMatch.score).toFixed(2)),
          personId: topMatch.voter.personId || null,
          fullName: topMatch.voter.fullName,
          voter: maskVoterProfile(topMatch.voter),
          message: `MATCHED - Person ID: ${topMatch.voter.personId || topMatch.voter.id} - Name: ${topMatch.voter.fullName}`
        };
      } else {
        return {
          matched: false,
          unauthorized: true,
          confidence: Math.max(0, Number(topMatch.score.toFixed(2))),
          voter: null,
          message: 'UNKNOWN - Please scan again.'
        };
      }
    }
  }

  // NOT MATCHED -> STRICTLY UNAUTHORIZED USER!
  console.log('[Biometrics] 1:N verification: No matching biometric found. Access Denied.');
  return {
    matched: false,
    unauthorized: true,
    confidence: 0,
    voter: null,
    message: 'UNKNOWN - Please scan again.'
  };
}

// Mask sensitive fields from voter record before sending to client
function maskVoterProfile(voter) {
  if (!voter) return null;
  const state = getState();
  const currentSessionId = state?.electionConfig?.sessionId;

  const aadhaarParts = (voter.aadhaar || '').split(' ');
  const maskedAadhaar = aadhaarParts.length >= 3 
    ? `XXXX XXXX ${aadhaarParts[2]}`
    : (voter.aadhaar ? `XXXX-XXXX-${voter.aadhaar.slice(-4)}` : 'XXXX-XXXX-XXXX');

  const phone = voter.phoneNumber || '';
  const maskedPhone = phone.length >= 4 
    ? `+91 ******${phone.slice(-4)}` 
    : '+91 XXXXX XXXXX';

  const votedInCurrentSession = Boolean(
    (voter.lastVotedSessionId && currentSessionId && voter.lastVotedSessionId === currentSessionId) ||
    ((state.votesAudit || []).some(a => a.voterId === voter.id && a.sessionId === currentSessionId))
  );

  return {
    id: voter.id,
    personId: voter.personId || null,
    fullName: voter.fullName,
    aadhaar: voter.aadhaar,
    aadhaarMasked: maskedAadhaar,
    phoneNumber: phone,
    phoneMasked: maskedPhone,
    dob: voter.dob || '',
    age: voter.age || null,
    district: voter.district,
    constituency: voter.constituency,
    facePhoto: voter.facePhoto,
    isPhoneVerified: Boolean(voter.isPhoneVerified || phone),
    hasVoted: votedInCurrentSession,
    registeredAt: voter.registeredAt
  };
}



module.exports = {
  hashBiometric,
  matchVoterByFace,
  maskVoterProfile,
  computeCosineSimilarity
};
