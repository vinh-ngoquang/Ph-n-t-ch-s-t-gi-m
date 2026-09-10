import csv
import json

def convert():
    with open("src/data/dataset.csv", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    records = []
    for r in rows:
        if not r or not r[0]:
            continue
        def p(idx):
            if idx >= len(r):
                return 0.0
            v = r[idx].replace(",", "").strip() if r[idx] else ""
            try:
                return float(v) if v else 0.0
            except:
                return 0.0

        records.append({
            "month": r[0].strip(),
            "folder_id": r[1].strip(),
            "folder": r[2].strip(),
            "articles": p(3),
            "articleThuong": p(4),
            "articleThuongMai": p(5),
            "aBuildTop": p(6),
            "aNonBuildTop": p(7),
            "pageviews": p(8),
            "pageviewsNoAds": p(9),
            "pageviewsAds": p(10),
            "pExDirect": p(11),
            "pExGoogle": p(12),
            "pExSocial": p(13),
            "pInHome": p(14),
            "pInFolder": p(15),
            "pInDetail": p(16),
            "pInOther": p(17),
            "pListing": p(18),
            "pDetail": p(19),
            "pDO": p(20),
            "pOV": p(21),
            "pUnknown": p(22),
            "pMobile": p(23),
            "pPC": p(24),
            "pApp": p(25),
            "pTablet": p(26),
        })

    print(f"Parsed {len(records)} records")

    content = f"""import {{ NewsRecord }} from '../types';

export const RAW_DATASET: NewsRecord[] = {json.dumps(records, ensure_ascii=False, indent=2)};
"""
    with open("src/data/dataset.ts", "w", encoding="utf-8") as f:
        f.write(content)
    print("Wrote src/data/dataset.ts")

if __name__ == "__main__":
    convert()
