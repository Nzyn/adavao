import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os

# Load Data
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

df = pd.read_csv(csv_path)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"]).sort_values("date")
df["crime_count"] = pd.to_numeric(df["crime_count"], errors="coerce")
df = df[df["crime_count"] > 0]
df["crime_type"] = df["crime_type"].astype(str).str.strip().str.upper()

unique_crimes = df["crime_type"].unique()
print(f"Testing {len(unique_crimes)} crime types\n")

for crime in unique_crimes:
    subset = df[df["crime_type"] == crime]
    
    # Create monthly series
    monthly = (
        subset.set_index("date")
        .groupby(pd.Grouper(freq="MS"))["crime_count"]
        .sum()
        .asfreq("MS", fill_value=0)
    )
    target_ts = monthly.astype(float)
    
    print(f"--- {crime} ---")
    print(f"  Total records: {len(subset)}")
    print(f"  Monthly periods: {len(target_ts)}")
    print(f"  Non-zero months: {(target_ts > 0).sum()}")
    print(f"  Max monthly: {target_ts.max():.0f}")
    print(f"  Mean monthly: {target_ts.mean():.2f}")
    
    if len(target_ts) < 6:
        print(f"  ❌ INSUFFICIENT DATA (<6 months)")
        print()
        continue
    
    # Try training
    try:
        model = SARIMAX(
            target_ts,
            order=(0, 1, 1),
            seasonal_order=(0, 1, 1, 12),
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        res = model.fit(disp=False)
        
        forecast = res.get_forecast(steps=3)
        mean = forecast.predicted_mean
        
        print(f"  ✓ Model trained successfully")
        print(f"  Next 3 forecasts: {mean.values[:3]}")
        
    except Exception as e:
        print(f"  ❌ Training failed: {str(e)[:80]}")
    
    print()
