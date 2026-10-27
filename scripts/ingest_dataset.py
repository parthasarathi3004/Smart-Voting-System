import openpyxl
import json
import os
import re

excel_file = "TN_Election_Candidates_With_TVK_All_234_Seats.xlsx"
wb = openpyxl.load_workbook(excel_file, data_only=True)
sheet = wb.active
rows = list(sheet.iter_rows(values_only=True))

party_colors = {
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
}

candidates = []
districts_map = {}
parties_map = {}

for i, r in enumerate(rows[1:], start=1):
    if not any(r):
        continue
    cand_name = str(r[0]).strip() if r[0] else 'Candidate'
    party_name = str(r[1]).strip() if r[1] else 'Independent'
    symbol_url = str(r[2]).strip() if r[2] else ''
    district = str(r[3]).strip() if r[3] else 'Tamil Nadu'
    constituency = str(r[4]).strip() if r[4] else 'General'

    if district not in districts_map:
        districts_map[district] = []
    if constituency not in districts_map[district]:
        districts_map[district].append(constituency)

    if party_name not in parties_map:
        parties_map[party_name] = {
            'partyName': party_name,
            'symbolUrl': symbol_url,
            'themeColor': party_colors.get(party_name, '#06b6d4')
        }

    clean_seed = re.sub(r'[^a-zA-Z0-9]', '', cand_name)
    candidates.append({
        'id': f'CAND-{i:04d}',
        'name': cand_name,
        'party': party_name,
        'symbolUrl': symbol_url,
        'themeColor': party_colors.get(party_name, '#06b6d4'),
        'district': district,
        'constituency': constituency,
        'votes': 0,
        'photoUrl': f'https://api.dicebear.com/7.x/avataaars/svg?seed={clean_seed}'
    })

for d in districts_map:
    districts_map[d].sort()

os.makedirs('server/data', exist_ok=True)
db_payload = {
    'districts': sorted(list(districts_map.keys())),
    'constituenciesByDistrict': districts_map,
    'parties': list(parties_map.values()),
    'candidates': candidates
}

with open('server/data/tamilnadu_electoral_db.json', 'w', encoding='utf-8') as f:
    json.dump(db_payload, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(candidates)} candidates across {len(db_payload['districts'])} districts and {sum(len(v) for v in districts_map.values())} constituencies.")
