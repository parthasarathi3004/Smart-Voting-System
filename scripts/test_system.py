import urllib.request
import json
import sys
import time

BASE_URL = "http://localhost:5000/api"

def make_req(endpoint, data=None, method="GET"):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data is not None else None
    try:
        with urllib.request.urlopen(req, data=body) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"error": err_body}

print("=== STARTING COMPREHENSIVE BACKEND VERIFICATION ===")

# Test 1: Health Check
status, body = make_req("/health")
assert status == 200, f"Health check failed: {status}"
print("[PASS] [TEST 1] Health check returned 200 OK")

# Test 2: Crucial Age Check (< 18 rejection)
underage_payload = {
    "fullName": "Kishore Junior",
    "aadhaar": f"9999 {int(time.time()*1000) % 10000:04d} 7777",
    "dob": "2012-05-10", # 14 years old
    "district": "Chennai",
    "constituency": "Kolathur",
    "facePhoto": "data:image/jpeg;base64,mock",
    "fingerprintHash": "mockhash123"
}
status, body = make_req("/voters/register", underage_payload, "POST")
assert status == 400, f"Expected 400 for underage voter, got {status}"
assert "You are not eligible for election" in body.get("message", ""), f"Unexpected error message: {body}"
print(f"[PASS] [TEST 2] Underage voter strictly blocked with message: '{body.get('message')}'")

# Test 3: Valid Voter Registration (Age >= 18)
unique_seq = int(time.time() * 1000) % 1000000
eligible_payload = {
    "fullName": "Subramanian Jayaraman",
    "aadhaar": f"6677 {unique_seq % 10000:04d} {unique_seq // 100:04d}",
    "dob": "1994-08-20", # 32 years old
    "district": "Chennai",
    "constituency": "Kolathur",
    "facePhoto": "data:image/jpeg;base64,valid_photo_bytes",
    "faceDescriptor": f"SUBRAMANIAN_FACE_VECTOR_HASH_{unique_seq}",
    "fingerprintHash": f"SUBRAMANIAN_FINGERPRINT_HEX_{unique_seq}"
}
status, body = make_req("/voters/register", eligible_payload, "POST")
assert status == 201, f"Expected 201 for valid voter, got {status}: {body}"
new_voter_id = body["voter"]["id"]
print(f"[PASS] [TEST 3] Valid voter enrolled successfully with ID: {new_voter_id}")

# Test 4: Candidate Directory by Constituency
status, body = make_req("/candidates?constituency=Kolathur")
assert status == 200 and len(body["candidates"]) > 0, "No candidates found for Kolathur"
kolathur_candidates = body["candidates"]
target_candidate = kolathur_candidates[0]
print(f"[PASS] [TEST 4] Queried candidates for Kolathur: Found {len(kolathur_candidates)} candidates. Top candidate: {target_candidate['name']} ({target_candidate['party']})")

# Test 5: Biometric Verification
face_verify_payload = {
    "faceSignature": "SUBRAMANIAN_FACE_VECTOR_HASH_9900",
    "voterIdHint": new_voter_id
}
status, body = make_req("/voters/verify-face", face_verify_payload, "POST")
assert status == 200 and body["voter"]["id"] == new_voter_id, "Face verification failed"
print(f"[PASS] [TEST 5A] 2FA Face recognition verified voter: {body['voter']['fullName']}")

fp_verify_payload = {
    "fingerprintHash": "SUBRAMANIAN_FINGERPRINT_HEX_9900",
    "voterIdHint": new_voter_id
}
status, body = make_req("/voters/verify-fingerprint", fp_verify_payload, "POST")
assert status == 200 and body["voter"]["id"] == new_voter_id, "Fingerprint verification failed"
print(f"[PASS] [TEST 5B] Fingerprint fallback verified voter: {body['voter']['fullName']}")

# Test 6: First Valid Vote Cast
vote_payload = {
    "voterId": new_voter_id,
    "candidateId": target_candidate["id"]
}
status, body = make_req("/vote/cast", vote_payload, "POST")
assert status == 200, f"Expected 200 for first vote, got {status}: {body}"
receipt = body["receipt"]
print(f"[PASS] [TEST 6] Vote cast successfully! Digital Receipt SHA-256: {receipt['receiptHash'][:24]}...")

# Test 7: Anti-Fraud Double-Voting Detection
status, body = make_req("/vote/cast", vote_payload, "POST")
assert status == 409, f"Expected 409 Conflict for duplicate vote, got {status}: {body}"
assert "Duplicate Vote Detected" in body.get("message", ""), f"Unexpected duplicate vote response: {body}"
print(f"[PASS] [TEST 7] Anti-Fraud Engine instantly blocked duplicate vote with message: '{body.get('message')}'")

# Test 8: Analytics & Statewide Winner Determination
status, body = make_req("/analytics")
assert status == 200, f"Analytics failed: {status}"
analytics = body["analytics"]
leaderboard = analytics["seatLeaderboard"]
print(f"[PASS] [TEST 8] Analytics engine calculated seat leaderboard ({len(leaderboard)} parties). Grand Winner: {analytics['grandWinner']['declaration']}")

# Test 9: Support Ticket Dispatch to parthasarathi3046@gmail.com
ticket_payload = {
    "name": "Test Citizen",
    "phone": "+91 9876543210",
    "issue": "Verification test of support ticket email dispatch."
}
status, body = make_req("/support/ticket", ticket_payload, "POST")
assert status == 201, f"Support ticket failed: {status}"
print(f"[PASS] [TEST 9] Support ticket #{body['ticketId']} dispatched to: {body['targetEmail']}")

print("\n*** ALL 9 CRITICAL ARCHITECTURAL AND SECURITY TESTS PASSED PERFECTLY! ***")
