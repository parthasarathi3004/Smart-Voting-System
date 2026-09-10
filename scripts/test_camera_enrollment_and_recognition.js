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

// Generate standardized 128-D vector
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

// Simulate multi-frame capture (10 frames) and averaging
function simulateMultiFrameAveraging(baseVector) {
  const D = 128;
  const frames = [];
  for (let f = 0; f < 10; f++) {
    const noisyFrame = baseVector.map(v => v + (Math.random() - 0.5) * 0.04);
    const norm = Math.sqrt(noisyFrame.reduce((s, x) => s + x * x, 0)) || 1;
    frames.push(noisyFrame.map(x => x / norm));
  }
  const sumVec = new Array(D).fill(0);
  for (const frame of frames) {
    for (let i = 0; i < D; i++) sumVec[i] += frame[i];
  }
  const norm = Math.sqrt(sumVec.reduce((s, x) => s + x * x, 0)) || 1;
  return sumVec.map(v => Number((v / norm).toFixed(4)));
}

async function runTests() {
  console.log('========================================================================');
  console.log('CAMERA-ONLY MULTI-FRAME ENROLLMENT & RECOGNITION VALIDATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Clean up any existing Partha or Vijay test voters from previous runs
    const existing = await request('/api/voters');
    if (existing.body.voters) {
      for (const v of existing.body.voters) {
        if (v.fullName === 'Partha' || v.fullName === 'Vijay') {
          await request(`/api/voters/${v.id}`, 'DELETE');
        }
      }
    }

    // 1. Multi-Frame Enrollment with Person ID
    console.log('>>> TEST 1: Register Person A (Partha) with 10-frame averaged embedding');
    const baseA = generateFaceVector(39.1);
    const multiFrameA = simulateMultiFrameAveraging(baseA);
    const aadhaarA = '88' + Math.floor(1000000000 + Math.random() * 9000000000);

    const regA = await request('/api/voters/register', 'POST', {
      fullName: 'Partha',
      aadhaar: aadhaarA,
      dob: '1995-05-15',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mockParthaFrame10',
      faceDescriptor: multiFrameA
    });

    assert(regA.status === 201, `Status 201 Created (got ${regA.status})`);
    assert(regA.body.personId !== undefined && regA.body.personId > 0, `Assigned Person ID: ${regA.body.personId}`);
    assert(regA.body.name === 'Partha', `Name returned: ${regA.body.name}`);
    assert(regA.body.message === 'Face biometric enrolled successfully.', `Message: ${regA.body.message}`);
    const personIdA = regA.body.personId;
    const voterIdA = regA.body.voter.id;

    // 2. Duplicate Prevention on Enrollment (sim >= 0.82)
    console.log('\n>>> TEST 2: Attempt duplicate registration of Person A (Partha)');
    const duplicateFrameA = multiFrameA.map(v => v + (Math.random() - 0.5) * 0.02);
    const dupNorm = Math.sqrt(duplicateFrameA.reduce((s, x) => s + x * x, 0)) || 1;
    const normalizedDup = duplicateFrameA.map(x => Number((x / dupNorm).toFixed(4)));

    const regDup = await request('/api/voters/register', 'POST', {
      fullName: 'Partha Duplicate Attempt',
      aadhaar: '99' + Math.floor(1000000000 + Math.random() * 9000000000),
      dob: '1995-05-15',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mockDup',
      faceDescriptor: normalizedDup
    });

    assert(regDup.status === 409, `Duplicate enrollment rejected with status 409 (got ${regDup.status})`);
    assert(regDup.body.duplicateBiometric === true, 'Response contains duplicateBiometric flag: true');
    assert(
      regDup.body.message === `Person already registered as Person ID ${personIdA} - Partha`,
      `Exact reject message: "${regDup.body.message}"`
    );

    // 3. Register Person B (Vijay) with distinct face
    console.log('\n>>> TEST 3: Register Person B (Vijay) with distinct face');
    const baseB = generateFaceVector(42.7);
    const multiFrameB = simulateMultiFrameAveraging(baseB);
    const aadhaarB = '77' + Math.floor(1000000000 + Math.random() * 9000000000);

    const regB = await request('/api/voters/register', 'POST', {
      fullName: 'Vijay',
      aadhaar: aadhaarB,
      dob: '1992-08-20',
      district: 'Madurai',
      constituency: 'Madurai Central',
      facePhoto: 'data:image/jpeg;base64,mockVijay',
      faceDescriptor: multiFrameB
    });

    assert(regB.status === 201, `Status 201 Created (got ${regB.status})`);
    assert(regB.body.personId !== personIdA, `Assigned distinct Person ID: ${regB.body.personId} (Person A was ${personIdA})`);
    const personIdB = regB.body.personId;
    const voterIdB = regB.body.voter.id;

    // 4. Voting Booth Verification: Exact MATCHED for Person A
    console.log('\n>>> TEST 4: Live face verification in Voting Booth for Person A (Partha)');
    const liveScanA = baseA.map(v => v + (Math.random() - 0.5) * 0.03);
    const normA = Math.sqrt(liveScanA.reduce((s, x) => s + x * x, 0)) || 1;
    const normLiveA = liveScanA.map(x => Number((x / normA).toFixed(4)));

    const verifyA = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'data:image/jpeg;base64,liveScanA',
      faceDescriptor: normLiveA
    });

    assert(verifyA.status === 200, `Verification status 200 (got ${verifyA.status})`);
    assert(verifyA.body.personId === personIdA, `Matched Person ID: ${verifyA.body.personId} === ${personIdA}`);
    assert(verifyA.body.fullName === 'Partha', `Matched Name: ${verifyA.body.fullName} === Partha`);
    assert(
      verifyA.body.message.includes(`MATCHED - Person ID: ${personIdA} - Name: Partha`),
      `Matched message: ${verifyA.body.message}`
    );

    // 5. Voting Booth Verification: Exact MATCHED for Person B
    console.log('\n>>> TEST 5: Live face verification in Voting Booth for Person B (Vijay)');
    const liveScanB = baseB.map(v => v + (Math.random() - 0.5) * 0.03);
    const normB = Math.sqrt(liveScanB.reduce((s, x) => s + x * x, 0)) || 1;
    const normLiveB = liveScanB.map(x => Number((x / normB).toFixed(4)));

    const verifyB = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'data:image/jpeg;base64,liveScanB',
      faceDescriptor: normLiveB
    });

    assert(verifyB.status === 200, `Verification status 200 (got ${verifyB.status})`);
    assert(verifyB.body.personId === personIdB, `Matched Person ID: ${verifyB.body.personId} === ${personIdB}`);
    assert(verifyB.body.fullName === 'Vijay', `Matched Name: ${verifyB.body.fullName} === Vijay`);

    // 6. Voting Booth Verification: Stranger Rejection -> UNKNOWN - Please scan again.
    console.log('\n>>> TEST 6: Stranger live face scan rejection');
    const strangerFace = Array.from({ length: 128 }, () => Number((Math.random() - 0.5).toFixed(4)));

    const verifyStranger = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'data:image/jpeg;base64,stranger',
      faceDescriptor: strangerFace
    });

    assert(verifyStranger.status === 403, `Stranger rejected with status 403 (got ${verifyStranger.status})`);
    assert(verifyStranger.body.unauthorized === true, 'Response unauthorized flag: true');
    assert(
      verifyStranger.body.message === 'UNKNOWN - Please scan again.',
      `Exact stranger reject message: "${verifyStranger.body.message}"`
    );

    // 7. Double-Voting Prevention
    const candRes = await request('/api/candidates?constituency=Kolathur');
    const candId = candRes.body.candidates?.[0]?.id || 1;
    // First vote
    const vote1 = await request('/api/vote/cast', 'POST', {
      voterId: voterIdA,
      candidateId: candId
    });
    assert(vote1.status === 200, `Vote 1 successfully cast (status ${vote1.status})`);

    // Second vote attempt (must be blocked)
    const vote2 = await request('/api/vote/cast', 'POST', {
      voterId: voterIdA,
      candidateId: candId
    });
    assert(vote2.status === 409, `Vote 2 blocked with duplicate vote error 409 (got ${vote2.status})`);
    assert(vote2.body.message.includes('Duplicate Vote'), `Block reason: ${vote2.body.message}`);

    const reVerifyA = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'data:image/jpeg;base64,liveScanA',
      faceDescriptor: normLiveA
    });
    assert(reVerifyA.status === 200, 'Re-verification succeeds to identify voter');
    assert(reVerifyA.body.voter.hasVoted === true, 'hasVoted is strictly TRUE -> locks ballot with duplicate vote alert');

    console.log('\n========================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================');
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
