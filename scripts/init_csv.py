import os

csv_header = "Month,folder_id,Folder,Articles,Article thường,Article thương mại,A- Build Top,A- Non- Build Top,Pageviews,Pageviews (-$),Pageviews ($),P- Ex-Direct,P- Ex-Google,P- Ex-Social,P- In-Home,P- In-Folder,P- In-Detail,P- In-Other,P- Listing,P- Detail,P- DO,P- OV,P- Unknown,P- Mobile,P- PC,P- App,P- Tablet\n"

with open("src/data/dataset.csv", "w", encoding="utf-8") as f:
    f.write(csv_header)

print("Initialized dataset.csv with header")
