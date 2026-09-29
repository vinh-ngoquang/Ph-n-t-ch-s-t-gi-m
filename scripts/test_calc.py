import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Let's inspect all records for 8/2026 where folder_id != '-1'
with open('src/data/dataset.ts', encoding='utf-8') as f:
    text = f.read()

import json
# Extract all records
records_str = re.findall(r'\{[^{}]+\}', text)
print('Total record blocks:', len(records_str))

records = []
for r_str in records_str:
    m = re.search(r'"month":\s*"([^"]+)"', r_str)
    fid = re.search(r'"folder_id":\s*"([^"]+)"', r_str)
    fn = re.search(r'"folder":\s*"([^"]+)"', r_str)
    site = re.search(r'"site_name":\s*"([^"]+)"', r_str)
    arts = re.search(r'"articles":\s*([\d\.]+)', r_str)
    pv = re.search(r'"pageviews":\s*([\d\.]+)', r_str)
    if m:
        records.append({
            'month': m.group(1),
            'folder_id': fid.group(1) if fid else '',
            'folder': fn.group(1) if fn else '',
            'site_name': site.group(1) if site else '',
            'articles': float(arts.group(1)) if arts else 0.0,
            'pageviews': float(pv.group(1)) if pv else 0.0,
        })

print('Parsed records:', len(records))

# Test sumRecords for 8/2026 when scope='ALL', site='ALL'
matched_8_26 = [r for r in records if r['month'] == '8/2026']
print('Matched 8/2026 count:', len(matched_8_26))

folderRecs = [r for r in matched_8_26 if r['folder_id'] != '-1' or r['pageviews'] > 0]
tot_arts = sum(r['articles'] for r in folderRecs)
tot_pv = sum(r['pageviews'] for r in folderRecs)
print('8/2026 scope=ALL tot_arts:', tot_arts, 'tot_pv:', tot_pv)

# What if site_name is VnExpress?
matched_vne_8_26 = [r for r in matched_8_26 if r['site_name'].lower() == 'vnexpress']
tot_vne_arts = sum(r['articles'] for r in matched_vne_8_26)
tot_vne_pv = sum(r['pageviews'] for r in matched_vne_8_26)
print('8/2026 site=VnExpress tot_arts:', tot_vne_arts, 'tot_pv:', tot_vne_pv)

# Check all months
for yr in ['2025', '2026']:
    for mo in range(1, 13):
        m_str = f'{mo}/{yr}'
        m_recs = [r for r in records if r['month'] == m_str]
        if m_recs:
            print(f'{m_str}: count={len(m_recs)}, total_arts={sum(r["articles"] for r in m_recs)}, total_pv={sum(r["pageviews"] for r in m_recs)}')
