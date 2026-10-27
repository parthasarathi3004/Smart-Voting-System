const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const { getState, updateState } = require('../services/db');

// Setup upload directory for CSV/Excel & symbols
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Get candidates (optionally filtered by district / constituency)
router.get('/', (req, res) => {
  const { district, constituency } = req.query;
  const state = getState();
  let list = state.candidates || [];

  if (district && district !== 'ALL') {
    list = list.filter(c => c.district.toLowerCase() === district.toLowerCase());
  }
  if (constituency && constituency !== 'ALL') {
    list = list.filter(c => c.constituency.toLowerCase() === constituency.toLowerCase());
  }

  res.json({
    success: true,
    totalCount: list.length,
    candidates: list
  });
});

// Get Tamil Nadu districts and cascading constituencies
router.get('/meta/districts-and-constituencies', (req, res) => {
  const state = getState();
  res.json({
    success: true,
    districts: state.districts || [],
    constituenciesByDistrict: state.constituenciesByDistrict || []
  });
});

// Get parties metadata
router.get('/meta/parties', (req, res) => {
  const state = getState();
  res.json({
    success: true,
    parties: state.parties || []
  });
});

// Add single candidate
router.post('/', (req, res) => {
  const { name, party, district, constituency, symbolUrl, photoUrl } = req.body;

  if (!name || !party || !district || !constituency) {
    return res.status(400).json({ success: false, message: 'Candidate name, party, district, and constituency are required.' });
  }

  const state = getState();
  const partyMeta = (state.parties || []).find(p => p.partyName === party) || {};

  const newCandidate = {
    id: `CAND-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    party: party.trim(),
    symbolUrl: symbolUrl || partyMeta.symbolUrl || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + party,
    themeColor: partyMeta.themeColor || '#06b6d4',
    district: district.trim(),
    constituency: constituency.trim(),
    votes: 0,
    photoUrl: photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`
  };

  updateState(s => {
    s.candidates.push(newCandidate);
  });

  return res.status(201).json({
    success: true,
    message: 'Candidate added successfully.',
    candidate: newCandidate
  });
});

// Upload CSV / Excel candidates file
router.post('/upload-dataset', upload.single('datasetFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No spreadsheet file provided.' });
  }

  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let addedCount = 0;
    const state = getState();
    const currentCandidates = [...state.candidates];
    const partyColors = {
      'DMK': '#ef4444',
      'AIADMK': '#10b981',
      'TVK': '#f59e0b',
      'INC': '#3b82f6',
      'BJP': '#f97316',
      'NTK': '#dc2626',
      'PMK': '#eab308',
      'MNM': '#6366f1',
      'DMDK': '#ec4899',
      'AMMK': '#8b5cf6',
      'VCK': '#06b6d4',
      'CPI': '#b91c1c',
      'CPI(M)': '#991b1b',
      'Independent': '#64748b'
    };

    rows.forEach(r => {
      const name = r.CandidateName || r.name || r['Candidate Name'];
      const party = r.PartyName || r.party || r['Party Name'];
      const symbol = r.PartySymbolUrl || r.symbolUrl || r['Symbol Url'] || '';
      const district = r.District || r.district;
      const constituency = r.Constituency || r.constituency;

      if (name && party && district && constituency) {
        const cleanParty = String(party).trim();
        const partyMeta = (state.parties || []).find(p => p.partyName === cleanParty) || {};
        const validSymbol = (symbol && !symbol.includes('wikimedia.org')) ? symbol : (partyMeta.symbolUrl || '');

        currentCandidates.push({
          id: `CAND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: String(name).trim(),
          party: cleanParty,
          symbolUrl: validSymbol,
          themeColor: partyColors[cleanParty] || partyMeta.themeColor || '#06b6d4',
          district: String(district).trim(),
          constituency: String(constituency).trim(),
          votes: 0,
          photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '')}`
        });
        addedCount++;
      }
    });


    updateState(s => {
      s.candidates = currentCandidates;
    });

    // Remove uploaded temporary file
    fs.unlink(filePath, () => {});

    return res.json({
      success: true,
      message: `Successfully imported ${addedCount} candidates from spreadsheet.`,
      addedCount
    });
  } catch (err) {
    console.error('Spreadsheet parse error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process spreadsheet file: ' + err.message
    });
  }
});

module.exports = router;
