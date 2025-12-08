import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

df = pd.read_csv(csv_path)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"]).sort_values("date")
df["crime_count"] = pd.to_numeric(df["crime_count"], errors="coerce")
df = df[df["crime_count"] > 0]
df["crime_type"] = df["crime_type"].astype(str).str.strip().str.upper()

# Test with a sparse crime type
test_crime = "MURDER"
subset = df[df["crime_type"] == test_crime]

monthly = (
    subset.set_index("date")
    .groupby(pd.Grouper(freq="MS"))["crime_count"]
    .sum()
    .asfreq("MS", fill_value=0)
)
target_ts = monthly.astype(float)

print(f"Testing {test_crime}")
print(f"Data points: {len(target_ts)}")
print(f"Mean: {target_ts.mean():.2f}")
print(f"Std: {target_ts.std():.2f}")
print(f"\nLast 6 months:")
print(target_ts.tail(6))

# Simulate fallback logic
hist_mean = float(target_ts.mean())
hist_std = float(target_ts.std()) if len(target_ts) > 1 else hist_mean * 0.3

print(f"\n--- Statistical Fallback Forecast (3 months) ---")
for i in range(3):
    decay_factor = 0.95 ** i
    forecast_val = hist_mean * decay_factor
    lower_val = max(0.0, forecast_val - hist_std)
    upper_val = forecast_val + hist_std
    
    print(f"Month {i+1}: Forecast={forecast_val:.2f}, CI=[{lower_val:.2f}, {upper_val:.2f}]")
