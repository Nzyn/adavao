
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os
import sys

# Load Data
base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")

print(f"Loading data from: {csv_path}")
df = pd.read_csv(csv_path)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"]).sort_values("date")
df["crime_count"] = pd.to_numeric(df["crime_count"], errors="coerce")
df = df[df["crime_count"] > 0]
df["crime_type"] = df["crime_type"].astype(str).str.strip().str.upper()

crime_type = "ROBBERY"
print(f"\nAnalyzing: {crime_type}")

subset = df[df["crime_type"] == crime_type]
print(f"Found {len(subset)} records for {crime_type}")

# Monthly Aggregation
monthly = (
    subset.set_index("date")
    .groupby(pd.Grouper(freq="MS"))["crime_count"]
    .sum()
    .asfreq("MS", fill_value=0)
)
target_ts = monthly.astype(float)

print("\nRecent Historical Data (Last 6 Months):")
print(target_ts.tail(6))

print("\nTraining SARIMA(0,1,1)(0,1,1,12)...")
model = SARIMAX(
    target_ts,
    order=(0, 1, 1),
    seasonal_order=(0, 1, 1, 12),
    enforce_stationarity=False,
    enforce_invertibility=False
)
res = model.fit(disp=False)

print("\nGenerating Forecast (Next 3 Months):")
forecast = res.get_forecast(steps=3)
mean = forecast.predicted_mean
ci = forecast.conf_int()

for i in range(3):
    date = mean.index[i].date()
    val = mean.iloc[i]
    lower = ci.iloc[i, 0]
    upper = ci.iloc[i, 1]
    print(f"  Date: {date} | Forecast: {val:.2f} | Raw CI: [{lower:.2f}, {upper:.2f}]")
