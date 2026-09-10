import csv
import math

def load_data():
    with open("src/data/dataset.csv", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    return header, rows

def parse_num(v):
    if not v:
        return 0.0
    v = v.replace(",", "").strip()
    try:
        return float(v)
    except:
        return 0.0

def run_sample_analysis():
    header, rows = load_data()
    # Let's compare 12/2025 vs 12/2024 for VnExpress total (code 1000000)
    t1_rows = [r for r in rows if r[0] == "12/2024" and r[1] == "1000000"]
    t_rows = [r for r in rows if r[0] == "12/2025" and r[1] == "1000000"]
    
    if not t1_rows or not t_rows:
        print("Rows not found")
        return
    r0 = t1_rows[0]
    r1 = t_rows[0]
    
    pv0 = parse_num(r0[8])
    pv1 = parse_num(r1[8])
    art0 = parse_num(r0[3])
    art1 = parse_num(r1[3])
    
    print(f"PV0: {pv0:,.0f}, PV1: {pv1:,.0f}, dPV: {pv1-pv0:,.0f} ({(pv1-pv0)/pv0*100:.2f}%)")
    
    # LMDI test:
    # If art == 0, we can use total across sections for articles!
    # Note: VnExpress row (code 1000000) has Articles = 0 because it's site-wide listing/PV total.
    # Total articles of the site is sum of all folder articles!
    all_art0 = sum(parse_num(r[3]) for r in rows if r[0] == "12/2024" and r[1] != "1000000")
    all_art1 = sum(parse_num(r[3]) for r in rows if r[0] == "12/2025" and r[1] != "1000000")
    print(f"Total articles (sum across sections): 2024={all_art0:,.0f}, 2025={all_art1:,.0f}")
    
    # Check yield
    y0 = pv0 / all_art0 if all_art0 > 0 else 0
    y1 = pv1 / all_art1 if all_art1 > 0 else 0
    print(f"Yield: 2024={y0:,.1f}, 2025={y1:,.1f}")
    
    # LMDI
    L = (pv1 - pv0) / (math.log(pv1) - math.log(pv0))
    vol_eff = L * math.log(all_art1 / all_art0)
    yield_eff = L * math.log(y1 / y0)
    print(f"LMDI: Vol={vol_eff:,.0f} ({vol_eff/(pv1-pv0)*100:.1f}%), Yield={yield_eff:,.0f} ({yield_eff/(pv1-pv0)*100:.1f}%)")
    print(f"Sum LMDI: {vol_eff + yield_eff:,.0f} vs dPV: {pv1 - pv0:,.0f}")

if __name__ == "__main__":
    run_sample_analysis()
