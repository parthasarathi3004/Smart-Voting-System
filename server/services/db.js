const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ELECTORAL_DB_FILE = path.join(DATA_DIR, 'tamilnadu_electoral_db.json');
const STATE_FILE = path.join(DATA_DIR, 'election_state.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let inMemoryState = {
  districts: [],
  constituenciesByDistrict: {},
  parties: [],
  candidates: [],
  voters: [],
  votesAudit: [],
  supportTickets: [],
  electionConfig: {
    electionDate: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '18:00',
    isLiveOverride: true, // Default to true so election is active out-of-the-box
    sessionId: `SESSION-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-001`,
    sessionCreatedAt: new Date().toISOString(),
    title: 'Tamil Nadu Legislative Assembly General Election 2026'
  }
};


// Initialize or load state
function initDatabase() {
  let electoralData = { districts: [], constituenciesByDistrict: {}, parties: [], candidates: [] };
  if (fs.existsSync(ELECTORAL_DB_FILE)) {
    try {
      electoralData = JSON.parse(fs.readFileSync(ELECTORAL_DB_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading electoral dataset:', e);
    }
  }

  if (fs.existsSync(STATE_FILE)) {
    try {
      const savedState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      inMemoryState = {
        ...inMemoryState,
        ...savedState,
        districts: electoralData.districts || savedState.districts,
        constituenciesByDistrict: electoralData.constituenciesByDistrict || savedState.constituenciesByDistrict,
        parties: electoralData.parties || savedState.parties,
        // Keep candidate vote counts from savedState if available, otherwise fallback to electoralData
        candidates: (savedState.candidates && savedState.candidates.length > 0) 
          ? savedState.candidates 
          : electoralData.candidates
      };
    } catch (e) {
      console.error('Error reading state file, initializing from electoral dataset:', e);
      inMemoryState.districts = electoralData.districts;
      inMemoryState.constituenciesByDistrict = electoralData.constituenciesByDistrict;
      inMemoryState.parties = electoralData.parties;
      inMemoryState.candidates = electoralData.candidates;
    }
  } else {
    inMemoryState.districts = electoralData.districts;
    inMemoryState.constituenciesByDistrict = electoralData.constituenciesByDistrict;
    inMemoryState.parties = electoralData.parties;
    inMemoryState.candidates = electoralData.candidates;

    // Start with 100% clean, empty voters list (only admin-registered voters will exist)
    inMemoryState.voters = [];
    saveState();
  }
  console.log(`Database initialized: ${inMemoryState.candidates.length} candidates, ${inMemoryState.voters.length} voters loaded.`);
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(inMemoryState, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

function getState() {
  return inMemoryState;
}

function updateState(updaterFn) {
  updaterFn(inMemoryState);
  saveState();
  return inMemoryState;
}

module.exports = {
  initDatabase,
  getState,
  updateState,
  saveState
};
