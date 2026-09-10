import csv

def check():
    with open("src/data/dataset.csv", "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)
    print(f"Total rows: {len(rows)}")
    dates = sorted(list(set(r[0] for r in rows if r)))
    print(f"Available dates: {dates}")

if __name__ == "__main__":
    check()
