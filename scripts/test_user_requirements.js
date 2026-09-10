const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Generate unique 128-dimensional standardized face vector
function generateFaceVector(seed) {
  const channels = [];
  for (let c = 0; c < 8; c++) {
    const vals = [];
    for (let z = 0; z < 16; z++) {
      const val = Math.sin(seed * 53 + c * 29 + z * 17) * 40 + 100;
      vals.push(val);
    }
    const m = vals.reduce((s, x) => s + x, 0) / 16;
    const vSum = vals.reduce((s, x) => s + (x - m) ** 2, 0);
    const s = Math.sqrt(vSum / 16) || 1;
    for (let z = 0; z < 16; z++) {
      channels.push((vals[z] - m) / s);
    }
  }
  const norm = Math.sqrt(channels.reduce((s, x) => s + x * x, 0)) || 1;
  return channels.map(x => Number((x / norm).toFixed(4)));
}

function addWebcamNoise(vec, noiseLevel = 0.03) {
  const noisy = vec.map(v => v + (Math.random() - 0.5) * noiseLevel);
  const norm = Math.sqrt(noisy.reduce((s, x) => s + x * x, 0)) || 1;
  return noisy.map(x => Number((x / norm).toFixed(4)));
}

async function runAllSixTests() {
  console.log('========================================================================');
  console.log('STARTING COMPREHENSIVE 6-TEST MULTI-VOTER AUTHENTICATION SUITE');
  console.log('========================================================================');

  const faceA = generateFaceVector(2.1);
  const faceB = generateFaceVector(7.4);
  const faceC = generateFaceVector(13.9);
  const faceD = generateFaceVector(19.2);
  const strangerFace = Array.from({ length: 128 }, () => Number((Math.random() - 0.5).toFixed(4)));

  let idA, idB, idC, idD;

  try {
    // Clean up any previous test voters from prior runs
    const existing = await request('/api/voters');
    if (existing.body.voters) {
      for (const v of existing.body.voters) {
        if (v.fullName.includes('Citizen') || v.fullName === 'Partha' || v.fullName === 'Vijay') {
          await request(`/api/voters/${v.id}`, 'DELETE');
        }
      }
    }

    // --- SETUP: Register Voters A, B, and C ---
    console.log('\n>>> Registering Voters A, B, and C in electoral database...');

    const aadhaarA = '61' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regA = await request('/api/voters/register', 'POST', {
      fullName: 'Citizen A (Ananya)',
      aadhaar: aadhaarA,
      dob: '1996-03-12',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mockA',
      faceDescriptor: faceA
    });
    if (regA.status !== 201) throw new Error(`Reg A failed: ${JSON.stringify(regA.body)}`);
    idA = regA.body.voter.id;
    console.log(`✓ Registered User A: ${regA.body.voter.fullName} (${idA})`);

    const aadhaarB = '72' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regB = await request('/api/voters/register', 'POST', {
      fullName: 'Citizen B (Bharath)',
      aadhaar: aadhaarB,
      dob: '1994-07-24',
      district: 'Madurai',
      constituency: 'Madurai Central',
      facePhoto: 'data:image/jpeg;base64,mockB',
      faceDescriptor: faceB
    });
    if (regB.status !== 201) throw new Error(`Reg B failed: ${JSON.stringify(regB.body)}`);
    idB = regB.body.voter.id;
    console.log(`✓ Registered User B: ${regB.body.voter.fullName} (${idB})`);

    const aadhaarC = '83' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regC = await request('/api/voters/register', 'POST', {
      fullName: 'Citizen C (Charan)',
      aadhaar: aadhaarC,
      dob: '1990-11-05',
      district: 'Salem',
      constituency: 'Salem North',
      facePhoto: 'data:image/jpeg;base64,mockC',
      faceDescriptor: faceC
    });
    if (regC.status !== 201) throw new Error(`Reg C failed: ${JSON.stringify(regC.body)}`);
    idC = regC.body.voter.id;
    console.log(`✓ Registered User C: ${regC.body.voter.fullName} (${idC})`);

    // =========================================================================
    // TEST 1: Register A, B, C -> Verify User A -> User A AUTHORIZED
    // =========================================================================
    console.log('\n--- [TEST 1]: Verify User A Authentication ---');
    const authA = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_A',
      faceDescriptor: addWebcamNoise(faceA)
    });
    if (authA.status === 200 && authA.body.voter?.id === idA) {
      console.log(`✓ PASS: User A successfully authorized! (Status: 200, Voter: ${authA.body.voter.fullName})`);
    } else {
      throw new Error(`TEST 1 FAILED: User A rejected: ${JSON.stringify(authA.body)}`);
    }

    // =========================================================================
    // TEST 2: Register A, B, C -> Verify User B -> User B AUTHORIZED
    // =========================================================================
    console.log('\n--- [TEST 2]: Verify User B Authentication ---');
    const authB = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_B',
      faceDescriptor: addWebcamNoise(faceB)
    });
    if (authB.status === 200 && authB.body.voter?.id === idB) {
      console.log(`✓ PASS: User B successfully authorized! (Status: 200, Voter: ${authB.body.voter.fullName})`);
    } else {
      throw new Error(`TEST 2 FAILED: User B rejected: ${JSON.stringify(authB.body)}`);
    }

    // =========================================================================
    // TEST 3: Register A, B, C -> Verify User C -> User C AUTHORIZED
    // =========================================================================
    console.log('\n--- [TEST 3]: Verify User C Authentication ---');
    const authC = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_C',
      faceDescriptor: addWebcamNoise(faceC)
    });
    if (authC.status === 200 && authC.body.voter?.id === idC) {
      console.log(`✓ PASS: User C successfully authorized! (Status: 200, Voter: ${authC.body.voter.fullName})`);
    } else {
      throw new Error(`TEST 3 FAILED: User C rejected: ${JSON.stringify(authC.body)}`);
    }

    // =========================================================================
    // TEST 4: Register A, B, C -> Verify Unregistered Stranger -> UNAUTHORIZED
    // =========================================================================
    console.log('\n--- [TEST 4]: Verify Unregistered Stranger Rejection ---');
    const authStranger = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_stranger',
      faceDescriptor: strangerFace
    });
    if (authStranger.status === 403 && authStranger.body.unauthorized) {
      console.log(`✓ PASS: Unregistered stranger firmly rejected! (Status: 403, Alert: ${authStranger.body.alertType || 'UNAUTHORIZED_USER'})`);
    } else {
      throw new Error(`TEST 4 FAILED: Stranger was incorrectly allowed! ${JSON.stringify(authStranger.body)}`);
    }

    // =========================================================================
    // TEST 5: User A votes -> A attempts second vote -> DUPLICATE VOTE REJECTED
    // =========================================================================
    console.log('\n--- [TEST 5]: Double-Voting Prevention (User A Votes Once, Second Vote Blocked) ---');
    // 5a. Get candidates for User A constituency (Kolathur)
    const candRes = await request('/api/candidates?constituency=Kolathur', 'GET');
    const candidateId = candRes.body.candidates?.[0]?.id || 'CAND-0922';

    // 5b. Cast first valid vote
    const vote1 = await request('/api/vote/cast', 'POST', {
      voterId: idA,
      candidateId: candidateId
    });
    if (vote1.status === 200 && vote1.body.success) {
      console.log(`✓ First Vote Cast Successfully by User A. Receipt: ${vote1.body.receipt?.receiptNumber}`);
    } else {
      throw new Error(`TEST 5 FAILED: First vote could not be cast: ${JSON.stringify(vote1.body)}`);
    }

    // 5c. Attempt second vote with User A
    const vote2 = await request('/api/vote/cast', 'POST', {
      voterId: idA,
      candidateId: candidateId
    });
    if (vote2.status === 409 && (vote2.body.errorType === 'DUPLICATE_VOTE_DETECTED' || vote2.body.message?.includes('Duplicate Vote'))) {
      console.log(`✓ PASS: Duplicate vote attempt blocked! (Status: 409, Error: ${vote2.body.message})`);
    } else {
      throw new Error(`TEST 5 FAILED: Duplicate vote was not blocked! ${JSON.stringify(vote2.body)}`);
    }

    // =========================================================================
    // TEST 6: Register User D -> Users A, B, and C must STILL remain authorized
    // =========================================================================
    console.log('\n--- [TEST 6]: Register User D -> Verify A, B, and C Remain Authorized ---');
    const aadhaarD = '94' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regD = await request('/api/voters/register', 'POST', {
      fullName: 'Citizen D (Divya)',
      aadhaar: aadhaarD,
      dob: '1998-09-18',
      district: 'Coimbatore',
      constituency: 'Coimbatore South',
      facePhoto: 'data:image/jpeg;base64,mockD',
      faceDescriptor: faceD
    });
    if (regD.status !== 201) throw new Error(`Reg D failed: ${JSON.stringify(regD.body)}`);
    idD = regD.body.voter.id;
    console.log(`✓ Registered User D: ${regD.body.voter.fullName} (${idD})`);

    // Verify User A still authorized (face biometric verified)
    const verifyA_after = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_A_after',
      faceDescriptor: addWebcamNoise(faceA)
    });
    if (verifyA_after.status === 200 && verifyA_after.body.voter?.id === idA) {
      console.log(`✓ PASS: User A remains authorized after User D registered! (hasVoted = ${verifyA_after.body.voter.hasVoted})`);
    } else {
      throw new Error(`TEST 6 FAILED: User A failed verification after D registered: ${JSON.stringify(verifyA_after.body)}`);
    }

    // Verify User B still authorized
    const verifyB_after = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_B_after',
      faceDescriptor: addWebcamNoise(faceB)
    });
    if (verifyB_after.status === 200 && verifyB_after.body.voter?.id === idB) {
      console.log(`✓ PASS: User B remains authorized after User D registered!`);
    } else {
      throw new Error(`TEST 6 FAILED: User B failed verification after D registered: ${JSON.stringify(verifyB_after.body)}`);
    }

    // Verify User C still authorized
    const verifyC_after = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_C_after',
      faceDescriptor: addWebcamNoise(faceC)
    });
    if (verifyC_after.status === 200 && verifyC_after.body.voter?.id === idC) {
      console.log(`✓ PASS: User C remains authorized after User D registered!`);
    } else {
      throw new Error(`TEST 6 FAILED: User C failed verification after D registered: ${JSON.stringify(verifyC_after.body)}`);
    }

    // Verify User D is also authorized
    const verifyD = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_D',
      faceDescriptor: addWebcamNoise(faceD)
    });
    if (verifyD.status === 200 && verifyD.body.voter?.id === idD) {
      console.log(`✓ PASS: User D is also authorized!`);
    } else {
      throw new Error(`TEST 6 FAILED: User D failed verification: ${JSON.stringify(verifyD.body)}`);
    }

    console.log('\n========================================================================');
    console.log('RESULT: ALL 6 TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================================');

  } finally {
    // Clean up test voters
    console.log('\nCleaning up test voter records from database...');
    for (const id of [idA, idB, idC, idD]) {
      if (id) {
        await request(`/api/voters/${id}`, 'DELETE').catch(() => {});
      }
    }
    console.log('Cleanup finished. Database state restored.');
  }
}

runAllSixTests().catch(err => {
  console.error('\n❌ Test execution encountered error:', err.message);
  process.exit(1);
});
