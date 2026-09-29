import re, sys
sys.stdout.reconfigure(encoding='utf-8')
with open('src/data/dataset.ts', encoding='utf-8') as f:
    text = f.read()
m = re.findall(r'"month":\s*"([^"]+)"', text)
months = sorted(list(set(m)))
print('Months in dataset.ts:', months)

matches = re.findall(r'\{[^{}]*"month":\s*"8/2026"[^{}]*\}', text)
print('Count of 8/2026 records:', len(matches))
for rec_str in matches:
    fid = re.search(r'"folder_id":\s*"([^"]+)"', rec_str)
    fn = re.search(r'"folder":\s*"([^"]+)"', rec_str)
    site = re.search(r'"site_name":\s*"([^"]+)"', rec_str)
    arts = re.search(r'"articles":\s*([\d\.]+)', rec_str)
    pv = re.search(r'"pageviews":\s*([\d\.]+)', rec_str)
    print(fid.group(1) if fid else '?', fn.group(1) if fn else '?', '| site:', site.group(1) if site else '?', '| arts:', arts.group(1) if arts else '?', '| pv:', pv.group(1) if pv else '?')
