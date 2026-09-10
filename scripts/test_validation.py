import csv

def load_data():
    with open("src/data/dataset.csv", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    return header, rows

def parse_val(v):
    if not v:
        return 0
    v = v.replace(",", "").strip()
    return float(v) if v else 0

def test_validation():
    header, rows = load_data()
    print(f"Header: {header}")
    # Columns:
    # 0: Date
    # 1: Code
    # 2: Section
    # 3: Articles
    # 4: Art_Thuong
    # 5: Art_ThuongMai
    # 6: A_BuildTop
    # 7: A_NonBuildTop
    # 8: Pageviews
    # 9: Ads_S
    # 10: Ads_NoS
    # 11: P_Ex_Direct
    # 12: P_Ex_Google
    # 13: P_Ex_Social
    # 14: P_In_Home
    # 15: P_In_Folder
    # 16: P_In_Detail
    # 17: P_In_Other
    # 18: P_Listing
    # 19: P_Detail
    # 20: P_DO
    # 21: P_OV
    # 22: P_Unknown
    # 23: P_Mobile
    # 24: P_PC
    # 25: P_App
    # 26: P_Tablet

    mismatches = []
    for r in rows:
        date, code, sec = r[0], r[1], r[2]
        art = parse_val(r[3])
        art_src = parse_val(r[4]) + parse_val(r[5])
        art_pos = parse_val(r[6]) + parse_val(r[7])
        
        pv = parse_val(r[8])
        pv_ads = parse_val(r[9]) + parse_val(r[10])
        pv_src = sum(parse_val(r[i]) for i in range(11, 18))
        pv_layer = parse_val(r[18]) + parse_val(r[19])
        pv_market = parse_val(r[20]) + parse_val(r[21]) + parse_val(r[22])
        pv_platform = sum(parse_val(r[i]) for i in range(23, 27))
        
        # Check tolerance 1%
        if art > 0:
            if abs(art - art_src) / art > 0.01:
                mismatches.append((date, sec, "Articles vs Art_Source", art, art_src))
            if abs(art - art_pos) / art > 0.01:
                mismatches.append((date, sec, "Articles vs Art_Pos", art, art_pos))
        if pv > 0:
            if abs(pv - pv_ads) / pv > 0.01:
                mismatches.append((date, sec, "PV vs Ads", pv, pv_ads, abs(pv-pv_ads)/pv))
            if abs(pv - pv_src) / pv > 0.01:
                mismatches.append((date, sec, "PV vs Source", pv, pv_src, abs(pv-pv_src)/pv))
            if abs(pv - pv_layer) / pv > 0.01:
                mismatches.append((date, sec, "PV vs Layer", pv, pv_layer, abs(pv-pv_layer)/pv))
            if abs(pv - pv_market) / pv > 0.01:
                mismatches.append((date, sec, "PV vs Market", pv, pv_market, abs(pv-pv_market)/pv))
            if abs(pv - pv_platform) / pv > 0.01:
                mismatches.append((date, sec, "PV vs Platform", pv, pv_platform, abs(pv-pv_platform)/pv))

    print(f"Total rows checked: {len(rows)}")
    print(f"Total mismatches > 1%: {len(mismatches)}")
    if mismatches:
        for m in mismatches[:10]:
            print("  ", m)

if __name__ == "__main__":
    test_validation()
