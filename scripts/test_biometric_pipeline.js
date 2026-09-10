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

function generateStandardizedFaceVector(seed) {
  const vec = [];
  for (let c = 0; c < 8; c++) {
    const vals = [];
    for (let z = 0; z < 16; z++) {
      const val = Math.sin(seed * 100 + c * 25 + z * 13) * 50 + 100;
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

async function runTests() {
  console.log('===============================================================');
  console.log('RUNNING CONTROLLED BIOMETRIC PIPELINE TEST SUITE');
  console.log('===============================================================');

  const faceVectorA = generateStandardizedFaceVector(1.0);
  const faceVectorB = generateStandardizedFaceVector(7.5);
  const faceVectorA_retest = faceVectorA.map(v => v + (Math.random() - 0.5) * 0.03);
  const normRetest = Math.sqrt(faceVectorA_retest.reduce((s, x) => s + x * x, 0));
  const faceVectorA_normalizedRetest = faceVectorA_retest.map(x => Number((x / normRetest).toFixed(4)));

  let personA_id = null;
  let personB_id = null;

  try {
    console.log('\n[TEST 1] Registering Person A (First registration)...');
    const aadhaarA = '4589' + Math.floor(10000000 + Math.random() * 90000000);
    const regA = await request('/api/voters/register', 'POST', {
      fullName: 'Anbarasan Raman',
      aadhaar: aadhaarA,
      dob: '1995-04-12',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mock_face_a',
      faceDescriptor: faceVectorA
    });

    console.log(`Status: ${regA.status}, Success: ${regA.body.success}`);
    if (regA.status !== 201 || !regA.body.success) {
      throw new Error(`Test 1 Failed: Person A registration rejected: ${JSON.stringify(regA.body)}`);
    }
    personA_id = regA.body.voter.id;
    console.log(`[PASS] Person A successfully registered with ID: ${personA_id}`);

    console.log('\n[TEST 2] Registering Different Person B (Should NOT trigger duplicate)...');
    const aadhaarB = '8912' + Math.floor(10000000 + Math.random() * 90000000);
    const regB = await request('/api/voters/register', 'POST', {
      fullName: 'Bala Chandran',
      aadhaar: aadhaarB,
      dob: '1998-09-20',
      district: 'Madurai',
      constituency: 'Madurai Central',
      facePhoto: 'data:image/jpeg;base64,mock_face_b',
      faceDescriptor: faceVectorB
    });

    console.log(`Status: ${regB.status}, Success: ${regB.body.success}`);
    if (regB.status !== 201 || !regB.body.success) {
      throw new Error(`Test 2 Failed: Person B incorrectly blocked as duplicate: ${JSON.stringify(regB.body)}`);
    }
    personB_id = regB.body.voter.id;
    console.log(`[PASS] Different Person B successfully registered with ID: ${personB_id}`);

    console.log('\n[TEST 3] Attempting to re-register Person A under different name & Aadhaar...');
    const aadhaarA2 = '7744' + Math.floor(10000000 + Math.random() * 90000000);
    const regA_dup = await request('/api/voters/register', 'POST', {
      fullName: 'Anbarasan Imposter',
      aadhaar: aadhaarA2,
      dob: '1995-04-12',
      district: 'Chennai',
      constituency: 'Kolathur',
      facePhoto: 'data:image/jpeg;base64,mock_face_a_retest',
      faceDescriptor: faceVectorA_normalizedRetest
    });

    console.log(`Status: ${regA_dup.status}, Message: ${regA_dup.body.message}`);
    if (regA_dup.status !== 400 || !regA_dup.body.message.includes('DUPLICATE BIOMETRIC DETECTED')) {
      throw new Error(`Test 3 Failed: Person A re-registration was NOT blocked as duplicate! Status: ${regA_dup.status}`);
    }
    console.log(`[PASS] Same Person A re-registration successfully BLOCKED with: "${regA_dup.body.message}"`);

    console.log('\n[TEST 4] Testing Voting Booth Authentication...');
    
    const boothA = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'booth_scan_a',
      faceDescriptor: faceVectorA_normalizedRetest
    });
    console.log(`Person A in Booth -> Status: ${boothA.status}, Voter: ${boothA.body.voter?.fullName} (${boothA.body.voter?.id})`);
    if (boothA.status !== 200 || boothA.body.voter?.id !== personA_id) {
      throw new Error(`Booth Test A Failed: Person A did not unlock their own booth!`);
    }
    console.log(`[PASS] Person A correctly unlocked booth for: ${boothA.body.voter.fullName}`);

    const boothB = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'booth_scan_b',
      faceDescriptor: faceVectorB
    });
    console.log(`Person B in Booth -> Status: ${boothB.status}, Voter: ${boothB.body.voter?.fullName} (${boothB.body.voter?.id})`);
    if (boothB.status !== 200 || boothB.body.voter?.id !== personB_id) {
      throw new Error(`Booth Test B Failed: Person B did not unlock their own booth!`);
    }
    console.log(`[PASS] Person B correctly unlocked booth for: ${boothB.body.voter.fullName}`);

    const strangerVector = Array.from({ length: 128 }, () => Math.random() - 0.5);
    const normS = Math.sqrt(strangerVector.reduce((s, x) => s + x * x, 0));
    const unitStranger = strangerVector.map(x => Number((x / normS).toFixed(4)));

    const boothStranger = await request('/api/voters/verify-face', 'POST', {
      faceSignature: 'booth_scan_stranger',
      faceDescriptor: unitStranger
    });
    console.log(`Stranger in Booth -> Status: ${boothStranger.status}, Unauthorized: ${boothStranger.body.unauthorized}`);
    if (boothStranger.status !== 403 || !boothStranger.body.unauthorized) {
      throw new Error(`Booth Test Stranger Failed: Stranger was not blocked!`);
    }
    console.log(`[PASS] Stranger correctly blocked as UNAUTHORIZED USER!`);

    console.log('\n===============================================================');
    console.log('ALL BIOMETRIC PIPELINE TESTS PASSED WITH 100% ACCURACY!');
    console.log('===============================================================');

  } finally {
    if (personA_id) await request(`/api/voters/${personA_id}`, 'DELETE').catch(() => {});
    if (personB_id) await request(`/api/voters/${personB_id}`, 'DELETE').catch(() => {});
    console.log('Test cleanup complete.');
  }
}

runTests().catch(err => {
 console.error('\nTEST RUN FAILED:', err.message);
 process.exit(1);
});
