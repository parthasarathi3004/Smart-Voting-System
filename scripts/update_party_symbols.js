const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'server', 'data', 'election_state.json');
const ELECTORAL_DB_FILE = path.join(__dirname, '..', 'server', 'data', 'tamilnadu_electoral_db.json');

// Authentic Tamil Nadu Election Symbols SVG Definitions
const SVGS = {
  // TVK: Whistle / விசில்
  TVK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="tvkWhistleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="45%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="tvkRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E5E7EB"/>
      <stop offset="100%" stop-color="#9CA3AF"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#78350F" stroke="#F59E0B" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#1E293B"/>
  <circle cx="20" cy="56" r="7.5" fill="none" stroke="url(#tvkRing)" stroke-width="3.5"/>
  <circle cx="44" cy="56" r="21" fill="url(#tvkWhistleGrad)" stroke="#78350F" stroke-width="2"/>
  <ellipse cx="44" cy="46" rx="7.5" ry="3.5" fill="#0F172A"/>
  <path d="M 44 38 L 84 38 L 86 48 L 44 54 Z" fill="url(#tvkWhistleGrad)" stroke="#78350F" stroke-width="2"/>
  <rect x="83" y="38" width="6" height="10" rx="1.5" fill="#FBBF24" stroke="#B45309" stroke-width="1.5"/>
  <path d="M 72 26 Q 80 20 88 26" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 64 20 Q 76 12 88 18" fill="none" stroke="#FBBF24" stroke-width="2" stroke-linecap="round"/>
  <text x="50" y="89" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="#FDE68A" text-anchor="middle">TVK • விசில்</text>
</svg>`,

  // AIADMK: Two Leaves / இரட்டை இலை
  AIADMK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="aiadmkLeaf1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="60%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="aiadmkLeaf2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6EE7B7"/>
      <stop offset="60%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#065F46"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#064E3B" stroke="#10B981" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <path d="M 50 80 Q 50 68 50 58" fill="none" stroke="#047857" stroke-width="4.5" stroke-linecap="round"/>
  <path d="M 50 60 C 33 56 19 40 22 22 C 36 22 48 36 50 58 Z" fill="url(#aiadmkLeaf1)" stroke="#ECFDF5" stroke-width="1.5"/>
  <path d="M 50 58 Q 36 40 25 26" fill="none" stroke="#ECFDF5" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 44 46 Q 32 44 28 40" fill="none" stroke="#A7F3D0" stroke-width="1"/>
  <path d="M 47 38 Q 38 34 34 30" fill="none" stroke="#A7F3D0" stroke-width="1"/>
  <path d="M 50 60 C 67 56 81 40 78 22 C 64 22 52 36 50 58 Z" fill="url(#aiadmkLeaf2)" stroke="#ECFDF5" stroke-width="1.5"/>
  <path d="M 50 58 Q 64 40 75 26" fill="none" stroke="#ECFDF5" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M 56 46 Q 68 44 72 40" fill="none" stroke="#A7F3D0" stroke-width="1"/>
  <path d="M 53 38 Q 62 34 66 30" fill="none" stroke="#A7F3D0" stroke-width="1"/>
  <text x="50" y="89" font-size="8.5" font-family="sans-serif" font-weight="bold" fill="#A7F3D0" text-anchor="middle">AIADMK • இரட்டை இலை</text>
</svg>`,

  // DMK: Rising Sun / உதயசூரியன்
  DMK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="dmkSun" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#7F1D1D" stroke="#EF4444" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#18181B"/>
  <g fill="#F59E0B" stroke="#FDE047" stroke-width="0.5">
    <polygon points="50,14 47,36 53,36"/>
    <polygon points="35,18 40,38 45,35"/>
    <polygon points="65,18 55,35 60,38"/>
    <polygon points="23,27 35,41 39,37"/>
    <polygon points="77,27 61,37 65,41"/>
    <polygon points="14,40 31,46 33,42"/>
    <polygon points="86,40 67,42 69,46"/>
  </g>
  <circle cx="50" cy="52" r="16" fill="url(#dmkSun)" stroke="#991B1B" stroke-width="1.5"/>
  <polygon points="12,73 34,44 52,68 12,73" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>
  <polygon points="48,68 66,44 88,73 48,73" fill="#1E293B" stroke="#94A3B8" stroke-width="1.5"/>
  <rect x="12" y="69" width="76" height="5" rx="1.5" fill="#EF4444"/>
  <text x="50" y="89" font-size="8.5" font-family="sans-serif" font-weight="bold" fill="#FEF08A" text-anchor="middle">DMK • உதயசூரியன்</text>
</svg>`,

  // BJP: Lotus / தாமரை
  BJP: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bjpLotusCenter" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FB7185"/>
      <stop offset="60%" stop-color="#F43F5E"/>
      <stop offset="100%" stop-color="#BE123C"/>
    </linearGradient>
    <linearGradient id="bjpLotusOuter" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FED7AA"/>
      <stop offset="50%" stop-color="#FB923C"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#7C2D12" stroke="#F97316" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <ellipse cx="32" cy="69" rx="13" ry="5" fill="#15803D" stroke="#86EFAC" stroke-width="1" transform="rotate(-15 32 69)"/>
  <ellipse cx="68" cy="69" rx="13" ry="5" fill="#15803D" stroke="#86EFAC" stroke-width="1" transform="rotate(15 68 69)"/>
  <ellipse cx="50" cy="71" rx="15" ry="4.5" fill="#166534" stroke="#86EFAC" stroke-width="1"/>
  <path d="M 50 65 C 24 63 16 46 22 36 C 28 44 38 55 50 65 Z" fill="url(#bjpLotusOuter)" stroke="#FFE4E6" stroke-width="1"/>
  <path d="M 50 65 C 76 63 84 46 78 36 C 72 44 62 55 50 65 Z" fill="url(#bjpLotusOuter)" stroke="#FFE4E6" stroke-width="1"/>
  <path d="M 50 65 C 30 57 28 36 36 26 C 40 38 46 53 50 65 Z" fill="url(#bjpLotusCenter)" stroke="#FFE4E6" stroke-width="1"/>
  <path d="M 50 65 C 70 57 72 36 64 26 C 60 38 54 53 50 65 Z" fill="url(#bjpLotusCenter)" stroke="#FFE4E6" stroke-width="1"/>
  <path d="M 50 65 C 42 50 42 30 50 20 C 58 30 58 50 50 65 Z" fill="#FDA4AF" stroke="#FFE4E6" stroke-width="1.5"/>
  <text x="50" y="89" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="#FED7AA" text-anchor="middle">BJP • தாமரை</text>
</svg>`,

  // NTK: Sugarcane Farmer / விவசாயி
  NTK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#7F1D1D" stroke="#DC2626" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#022C22"/>
  <path d="M 31 78 L 31 20" stroke="#22C55E" stroke-width="4" stroke-linecap="round"/>
  <line x1="28" y1="36" x2="34" y2="36" stroke="#FEF08A" stroke-width="2"/>
  <line x1="28" y1="52" x2="34" y2="52" stroke="#FEF08A" stroke-width="2"/>
  <path d="M 31 28 Q 17 22 15 15" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 31 44 Q 15 38 17 30" fill="none" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
  <path d="M 69 78 L 69 20" stroke="#22C55E" stroke-width="4" stroke-linecap="round"/>
  <line x1="66" y1="36" x2="72" y2="36" stroke="#FEF08A" stroke-width="2"/>
  <line x1="66" y1="52" x2="72" y2="52" stroke="#FEF08A" stroke-width="2"/>
  <path d="M 69 28 Q 83 22 85 15" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M 69 44 Q 85 38 83 30" fill="none" stroke="#4ADE80" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="50" cy="33" rx="6.5" ry="5.5" fill="#F59E0B"/>
  <circle cx="50" cy="36" r="4.5" fill="#FED7AA"/>
  <path d="M 43 44 L 57 44 L 60 74 L 40 74 Z" fill="#EF4444" stroke="#FEE2E2" stroke-width="1"/>
  <path d="M 43 44 Q 48 56 46 70" fill="none" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/>
  <path d="M 43 47 L 31 49" stroke="#FED7AA" stroke-width="3" stroke-linecap="round"/>
  <path d="M 57 47 L 69 49" stroke="#FED7AA" stroke-width="3" stroke-linecap="round"/>
  <text x="50" y="89" font-size="9" font-family="sans-serif" font-weight="bold" fill="#FEF08A" text-anchor="middle">NTK • விவசாயி</text>
</svg>`,

  // INC: Hand / கை
  INC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#1E3A8A" stroke="#3B82F6" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <rect x="42" y="66" width="16" height="12" rx="2.5" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1.5"/>
  <path d="M 34 50 C 34 65 42 67 50 67 C 58 67 66 65 66 50 Z" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <path d="M 34 52 C 26 48 24 38 30 36 C 34 35 36 42 38 48 Z" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <rect x="38" y="24" width="7" height="28" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <rect x="46" y="20" width="7.5" height="32" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <rect x="54" y="24" width="7" height="28" rx="3.5" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <rect x="62" y="32" width="6.5" height="20" rx="3" fill="#F8FAFC" stroke="#1E40AF" stroke-width="2"/>
  <text x="50" y="89" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="#93C5FD" text-anchor="middle">INC • கை</text>
</svg>`,

  // PMK: Mango / மாம்பழம்
  PMK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="pmkMango" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#EA580C"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#713F12" stroke="#EAB308" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <path d="M 52 26 C 68 18 78 24 74 36 C 64 38 56 32 52 26 Z" fill="#22C55E" stroke="#86EFAC" stroke-width="1.5"/>
  <path d="M 50 34 Q 48 24 54 20" fill="none" stroke="#78350F" stroke-width="4" stroke-linecap="round"/>
  <path d="M 48 30 C 64 30 78 44 76 60 C 74 74 60 78 48 76 C 34 74 24 64 26 50 C 28 36 38 30 48 30 Z" fill="url(#pmkMango)" stroke="#B45309" stroke-width="2"/>
  <text x="50" y="89" font-size="9" font-family="sans-serif" font-weight="bold" fill="#FEF08A" text-anchor="middle">PMK • மாம்பழம்</text>
</svg>`,

  // DMDK: Murasu / முரசு
  DMDK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#831843" stroke="#EC4899" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <line x1="22" y1="26" x2="78" y2="74" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="78" y1="26" x2="22" y2="74" stroke="#FDE047" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M 26 42 Q 50 48 74 42 L 68 68 Q 50 76 32 68 Z" fill="#DC2626" stroke="#F87171" stroke-width="2"/>
  <ellipse cx="50" cy="42" rx="24" ry="7.5" fill="#FEF3C7" stroke="#92400E" stroke-width="2.5"/>
  <path d="M 26 44 L 40 71 L 50 44 L 60 71 L 74 44" fill="none" stroke="#FBBF24" stroke-width="2"/>
  <text x="50" y="89" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="#FBCFE8" text-anchor="middle">DMDK • முரசு</text>
</svg>`,

  // MNM: Torchlight / டார்ச்
  MNM: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#312E81" stroke="#6366F1" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <polygon points="46,38 78,16 84,46" fill="#FDE047" opacity="0.35"/>
  <polygon points="44,34 56,44 48,54 36,44" fill="#E0E7FF" stroke="#6366F1" stroke-width="2"/>
  <rect x="22" y="48" width="28" height="12" rx="3" fill="#4F46E5" stroke="#A5B4FC" stroke-width="2" transform="rotate(-40 36 54)"/>
  <rect x="28" y="50" width="6" height="3" rx="1" fill="#EF4444" transform="rotate(-40 31 51)"/>
  <text x="50" y="89" font-size="9" font-family="sans-serif" font-weight="bold" fill="#C7D2FE" text-anchor="middle">MNM • டார்ச்</text>
</svg>`,

  // AMMK: Cooker / குக்கர்
  AMMK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#4C1D95" stroke="#8B5CF6" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <rect x="47" y="22" width="6" height="8" rx="2" fill="#1F2937" stroke="#9CA3AF" stroke-width="1"/>
  <path d="M 32 36 L 68 36 L 64 30 L 36 30 Z" fill="#E2E8F0" stroke="#64748B" stroke-width="2"/>
  <path d="M 30 38 L 70 38 L 68 67 C 68 73 32 73 32 67 Z" fill="#CBD5E1" stroke="#475569" stroke-width="2"/>
  <rect x="66" y="34" width="22" height="6" rx="3" fill="#0F172A" stroke="#E2E8F0" stroke-width="1.5"/>
  <path d="M 30 46 C 22 46 22 56 30 56" fill="none" stroke="#0F172A" stroke-width="3.5" stroke-linecap="round"/>
  <text x="50" y="89" font-size="9" font-family="sans-serif" font-weight="bold" fill="#DDD6FE" text-anchor="middle">AMMK • குக்கர்</text>
</svg>`,

  // VCK: Clay Pot / பானை
  VCK: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="vckPot" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FB923C"/>
      <stop offset="60%" stop-color="#C2410C"/>
      <stop offset="100%" stop-color="#7C2D12"/>
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="#164E63" stroke="#06B6D4" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <ellipse cx="50" cy="32" rx="16" ry="5" fill="#FDBA74" stroke="#9A3412" stroke-width="2"/>
  <ellipse cx="50" cy="32" rx="11" ry="2.5" fill="#431407"/>
  <path d="M 38 33 L 34 40 L 66 40 L 62 33 Z" fill="url(#vckPot)"/>
  <circle cx="50" cy="55" r="21" fill="url(#vckPot)" stroke="#7C2D12" stroke-width="2"/>
  <path d="M 32 50 Q 50 58 68 50" fill="none" stroke="#FED7AA" stroke-width="1.5"/>
  <path d="M 34 58 Q 50 66 66 58" fill="none" stroke="#FED7AA" stroke-width="1.5"/>
  <text x="50" y="89" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="#A5F3FC" text-anchor="middle">VCK • பானை</text>
</svg>`,

  // CPI: Ears of Corn & Sickle
  CPI: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#881337" stroke="#E11D48" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <polygon points="50,18 53,26 62,26 55,31 57,39 50,34 43,39 45,31 38,26 47,26" fill="#FACC15"/>
  <path d="M 32 64 C 24 50 28 34 44 26 C 36 34 36 46 44 54 C 48 58 54 60 62 60 C 50 66 38 68 32 64 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5"/>
  <rect x="58" y="58" width="15" height="6" rx="2" fill="#B45309" transform="rotate(35 65 61)"/>
  <rect x="36" y="38" width="28" height="6.5" rx="1.5" fill="#E2E8F0" transform="rotate(-45 50 41)"/>
  <rect x="58" y="24" width="9" height="13" rx="2" fill="#64748B" transform="rotate(-45 62 30)"/>
  <text x="50" y="89" font-size="9" font-family="sans-serif" font-weight="bold" fill="#FECDD3" text-anchor="middle">CPI • அரிவாள்</text>
</svg>`,

  // CPI(M): Hammer, Sickle and Star
  'CPI(M)': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="48" fill="#881337" stroke="#E11D48" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="43" fill="#0F172A"/>
  <polygon points="50,18 53,26 62,26 55,31 57,39 50,34 43,39 45,31 38,26 47,26" fill="#FACC15"/>
  <path d="M 32 64 C 24 50 28 34 44 26 C 36 34 36 46 44 54 C 48 58 54 60 62 60 C 50 66 38 68 32 64 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.5"/>
  <rect x="58" y="58" width="15" height="6" rx="2" fill="#B45309" transform="rotate(35 65 61)"/>
  <rect x="36" y="38" width="28" height="6.5" rx="1.5" fill="#E2E8F0" transform="rotate(-45 50 41)"/>
  <rect x="58" y="24" width="9" height="13" rx="2" fill="#64748B" transform="rotate(-45 62 30)"/>
  <text x="50" y="89" font-size="8.5" font-family="sans-serif" font-weight="bold" fill="#FECDD3" text-anchor="middle">CPI(M) • சுத்தியல்</text>
</svg>`
};

function toDataUri(svgString) {
  const clean = svgString.replace(/\s+/g, ' ').trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(clean)}`;
}

// Convert SVGs to Data URIs
const DATA_URIS = {};
for (const [party, svg] of Object.entries(SVGS)) {
  DATA_URIS[party] = toDataUri(svg);
}

// Function to update state file
function updateDataset(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log(`Updating ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Update parties array
  if (Array.isArray(data.parties)) {
    data.parties.forEach(p => {
      if (DATA_URIS[p.partyName]) {
        p.symbolUrl = DATA_URIS[p.partyName];
      }
    });
  }

  // Update candidates array
  let updatedCount = 0;
  if (Array.isArray(data.candidates)) {
    data.candidates.forEach(c => {
      const p = c.party?.trim();
      if (DATA_URIS[p]) {
        c.symbolUrl = DATA_URIS[p];
        updatedCount++;
      }
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Updated ${updatedCount} candidate symbols in ${filePath}`);
}

updateDataset(STATE_FILE);
updateDataset(ELECTORAL_DB_FILE);
console.log('Official Tamil Nadu party election symbols injected successfully!');
