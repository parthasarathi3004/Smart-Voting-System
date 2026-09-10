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

function generateFace(seed) {
  const vec = [];
  for (let c = 0; c < 8; c++) {
    const vals = [];
    for (let z = 0; z < 16; z++) {
      const val = Math.sin(seed * 77 + c * 31 + z * 19) * 50 + 100;
      vals.push(val);
    }
    const m = vals.reduce((s, x) => s + x, 0) / 16;
    const vSum = vals.reduce((s, x) => s + (x - m) ** 2, 0);
    const s = Math.sqrt(vSum / 16) || 1;
    for (let z = 0; z < 16; z++) {
      vec.push((vals[z] - m) / s);
    }
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map(x => Number((x / norm).toFixed(4)));
}

function addJitter(vec) {
  const noisy = vec.map(v => v + (Math.random() - 0.5) * 0.02);
  const norm = Math.sqrt(noisy.reduce((s, x) => s + x * x, 0)) || 1;
  return noisy.map(x => Number((x / norm).toFixed(4)));
}

async function runTestSuite() {
  console.log('======================================================================');
  console.log('MULTI-VOTER AUTHENTICATION & BOOTH ACCESS VERIFICATION TEST');
  console.log('======================================================================');

  const faceA = generateFace(1.5);
  const faceB = generateFace(6.2);
  const faceC = generateFace(11.8);

  let idA = null;
  let idB = null;
  let idC = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Register Voter A -> Authenticate Voter A -> SUCCESS
    // -------------------------------------------------------------
    console.log('\n--- [TEST 1] Register Voter A & Verify Authentication ---');
    const aadhaarA = '61' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regA = await request('/api/voters/register', 'POST', {
      fullName: 'Voter A (Anand)',
      aadhaar: aadhaarA,
      dob: '1992-05-10',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mockA',
      faceDescriptor: faceA
    });

    if (regA.status !== 201 || !regA.body.success) {
      throw new Error(`Test 1 Failed: Registration of Voter A rejected: ${JSON.stringify(regA.body)}`);
    }
    idA = regA.body.voter.id;
    console.log(`[PASS] Registered Voter A: ${regA.body.voter.fullName} (${idA})`);

    const authA1 = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_A1',
      faceDescriptor: addJitter(faceA)
    });
    if (authA1.status !== 200 || authA1.body.voter?.id !== idA) {
      throw new Error(`Test 1 Failed: Voter A could not authenticate: ${JSON.stringify(authA1.body)}`);
    }
    console.log(`[PASS] Authenticated Voter A -> SUCCESS (Status 200, Unlocked for: ${authA1.body.voter.fullName})`);

    // -----------------------------------------------------------------------
    // TEST 2: Register Voter B -> Authenticate Voter B -> SUCCESS
    //         Then Authenticate Voter A again -> SUCCESS
    // -----------------------------------------------------------------------
    console.log('\n--- [TEST 2] Register Voter B & Verify Voter B and Voter A Authentication ---');
    const aadhaarB = '72' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regB = await request('/api/voters/register', 'POST', {
      fullName: 'Voter B (Bhavani)',
      aadhaar: aadhaarB,
      dob: '1995-08-20',
      district: 'Madurai',
      constituency: 'Madurai Central',
      facePhoto: 'data:image/jpeg;base64,mockB',
      faceDescriptor: faceB
    });

    if (regB.status !== 201 || !regB.body.success) {
      throw new Error(`Test 2 Failed: Registration of Voter B rejected: ${JSON.stringify(regB.body)}`);
    }
    idB = regB.body.voter.id;
    console.log(`[PASS] Registered Voter B: ${regB.body.voter.fullName} (${idB})`);

    const authB = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_B',
      faceDescriptor: addJitter(faceB)
    });
    if (authB.status !== 200 || authB.body.voter?.id !== idB) {
      throw new Error(`Test 2 Failed: Voter B could not authenticate: ${JSON.stringify(authB.body)}`);
    }
    console.log(`[PASS] Authenticated Voter B -> SUCCESS (Status 200, Unlocked for: ${authB.body.voter.fullName})`);

    const authA2 = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_A2',
      faceDescriptor: addJitter(faceA)
    });
    if (authA2.status !== 200 || authA2.body.voter?.id !== idA) {
      throw new Error(`Test 2 Failed: Voter A could not authenticate after Voter B registration: ${JSON.stringify(authA2.body)}`);
    }
    console.log(`[PASS] Re-authenticated Voter A -> SUCCESS (Status 200, Unlocked for: ${authA2.body.voter.fullName})`);

    // -----------------------------------------------------------------------
    // TEST 3: Register Voter C -> Authenticate Voter C -> SUCCESS
    //         Then Authenticate Voter A again -> SUCCESS
    //         Then Authenticate Voter B again -> SUCCESS
    // -----------------------------------------------------------------------
    console.log('\n--- [TEST 3] Register Voter C & Verify Voter C, Voter A, and Voter B Authentication ---');
    const aadhaarC = '83' + Math.floor(1000000000 + Math.random() * 9000000000);
    const regC = await request('/api/voters/register', 'POST', {
      fullName: 'Voter C (Chandran)',
      aadhaar: aadhaarC,
      dob: '1991-12-15',
      district: 'Salem',
      constituency: 'Salem North',
      facePhoto: 'data:image/jpeg;base64,mockC',
      faceDescriptor: faceC
    });

    if (regC.status !== 201 || !regC.body.success) {
      throw new Error(`Test 3 Failed: Registration of Voter C rejected: ${JSON.stringify(regC.body)}`);
    }
    idC = regC.body.voter.id;
    console.log(`[PASS] Registered Voter C: ${regC.body.voter.fullName} (${idC})`);

    const authC = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_C',
      faceDescriptor: addJitter(faceC)
    });
    if (authC.status !== 200 || authC.body.voter?.id !== idC) {
      throw new Error(`Test 3 Failed: Voter C could not authenticate: ${JSON.stringify(authC.body)}`);
    }
    console.log(`[PASS] Authenticated Voter C -> SUCCESS (Status 200, Unlocked for: ${authC.body.voter.fullName})`);

    const authA3 = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_A3',
      faceDescriptor: addJitter(faceA)
    });
    if (authA3.status !== 200 || authA3.body.voter?.id !== idA) {
      throw new Error(`Test 3 Failed: Voter A could not authenticate after Voter C registration: ${JSON.stringify(authA3.body)}`);
    }
    console.log(`[PASS] Re-authenticated Voter A -> SUCCESS (Status 200, Unlocked for: ${authA3.body.voter.fullName})`);

    const authB2 = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_B2',
      faceDescriptor: addJitter(faceB)
    });
    if (authB2.status !== 200 || authB2.body.voter?.id !== idB) {
      throw new Error(`Test 3 Failed: Voter B could not authenticate after Voter C registration: ${JSON.stringify(authB2.body)}`);
    }
    console.log(`[PASS] Re-authenticated Voter B -> SUCCESS (Status 200, Unlocked for: ${authB2.body.voter.fullName})`);

    // -------------------------------------------------------------
    // TEST 4: Unregistered Stranger Face -> REJECTED as UNAUTHORIZED
    // -------------------------------------------------------------
    console.log('\n--- [TEST 4] Unregistered Stranger Face Rejection ---');
    const strangerVec = Array.from({ length: 128 }, () => Math.random() - 0.5);
    const normS = Math.sqrt(strangerVec.reduce((s, x) => s + x * x, 0)) || 1;
    const unitStranger = strangerVec.map(x => Number((x / normS).toFixed(4)));

    const authStranger = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'scan_stranger',
      faceDescriptor: unitStranger
    });

    if (authStranger.status !== 403 || !authStranger.body.unauthorized) {
      throw new Error(`Test 4 Failed: Stranger was not rejected! Status: ${authStranger.status}`);
    }
    console.log(`[PASS] Unregistered stranger correctly rejected with Status 403 (Unauthorized: "${authStranger.body.message}")`);

    console.log('\n======================================================================');
    console.log('ALL TESTS PASSED: EVERY REGISTERED VOTER AUTHENTICATES INDEPENDENTLY!');
    console.log('======================================================================');

  } finally {
    // Cleanup temporary test records
    if (idA) await request(`/api/voters/${idA}`, 'DELETE').catch(() => {});
    if (idB) await request(`/api/voters/${idB}`, 'DELETE').catch(() => {});
    if (idC) await request(`/api/voters/${idC}`, 'DELETE').catch(() => {});
    console.log('Test records cleanup complete. Database restored.');
  }
}

runTestSuite().catch(err => {
  console.error('\nTEST RUN FAILED:', err.message);
  process.exit(1);
});
