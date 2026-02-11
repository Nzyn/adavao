import pandas as pd
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

df = pd.read_csv(csv_path)
df["crime_type"] = df["crime_type"].astype(str).str.strip().str.upper()

unique_crimes = sorted(df["crime_type"].unique())
print(f"Found {len(unique_crimes)} unique crime types:\n")
for i, crime in enumerate(unique_crimes, 1):
    count = len(df[df["crime_type"] == crime])
    print(f"{i}. {crime} ({count} records)")
