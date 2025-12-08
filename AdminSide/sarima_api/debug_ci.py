
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os
import sys

# Load Data
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

if not os.path.exists(csv_path):
    print("CSV not found!")
    sys.exit(1)

df = pd.read_csv(csv_path)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"]).sort_values("date")
df["crime_count"] = pd.to_numeric(df["crime_count"], errors="coerce")
df = df[df["crime_count"] > 0]
df["barangay"] = df["barangay"].astype(str).str.strip()
df["crime_type"] = df["crime_type"].astype(str).str.strip()

unique_crimes = df["crime_type"].unique()
print(f"Found {len(unique_crimes)} crime types.")

horizon = 6

for crime in unique_crimes:
    print(f"\n--- Testing: {crime} ---")
    
    # Filter
    subset = df[df["crime_type"].str.upper() == crime.upper()]
    if subset.empty:
        print("  No data found.")
        continue
        
    # Create Series
    monthly = (
        subset.set_index("date")
        .groupby(pd.Grouper(freq="MS"))["crime_count"]
        .sum()
        .asfreq("MS", fill_value=0)
    )
    target_ts = monthly.astype(float)
    
    max_hist = float(target_ts.max())
    print(f"  Max Historical: {max_hist}")
    
    if len(target_ts) < 6:
        print("  Not enough history (<6 months).")
        continue

    try:
        model = SARIMAX(
            target_ts,
            order=(0, 1, 1),
            seasonal_order=(0, 1, 1, 12),
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        res = model.fit(disp=False)
        
        forecast = res.get_forecast(steps=horizon)
        ci = forecast.conf_int()
        mean = forecast.predicted_mean
        
        # Check raw values
        raw_upper = ci.iloc[:, 1].tolist()
        print(f"  Raw Upper CI (first 3): {raw_upper[:3]}")
        
        # Check Clamping Logic
        clamp_limit = max(max_hist * 5, 50.0)
        print(f"  Clamp Limit: {clamp_limit}")
        
        clamped_upper = [min(u, clamp_limit) for u in raw_upper]
        print(f"  Clamped Upper CI (first 3): {clamped_upper[:3]}")
        
    except Exception as e:
        print(f"  Error training: {e}")
