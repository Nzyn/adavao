import pandas as pd
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

df = pd.read_csv(csv_path)
df["crime_type"] = df["crime_type"].astype(str).str.strip().str.upper()

# Check the last 4 from dropdown
dropdown_crimes = [
    "ILLEGAL POSSESSION OF FIREARM",
    "ILLEGAL GAMBLING", 
    "DRUNK DRIVING",
    "DISTURBANCE"
]

print("Checking dropdown crime types against data:\n")
for crime in dropdown_crimes:
    matches = df[df["crime_type"] == crime]
    print(f"{crime}: {len(matches)} records")
    
print("\n--- All unique crime types in data ---")
for crime in sorted(df["crime_type"].unique()):
    count = len(df[df["crime_type"] == crime])
    print(f"{crime}: {count} records")
