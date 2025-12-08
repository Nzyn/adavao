from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os

app = FastAPI()

@app.get("/")
def root():
    return {"message": "hello world"}
# =========================================================
# FastAPI app
# =========================================================
app = FastAPI(
    title="SARIMA Crime Forecast API",
    description="Forecast monthly crimes + show top crimes and high-risk barangays using SARIMA(0,1,1)(0,1,1)[12].",
    version="1.2.0",
)

# =========================================================
# Pydantic models (for clean JSON responses)
# =========================================================
class ForecastItem(BaseModel):
    date: str
    forecast: float
    lower_ci: float
    upper_ci: float

class ForecastResponse(BaseModel):
    status: str
    horizon: int
    data: List[ForecastItem]


class TopCrimeItem(BaseModel):
    crime_type: str
    total: int

class TopCrimesResponse(BaseModel):
    status: str
    top_n: int
    data: List[TopCrimeItem]


class TopBarangayItem(BaseModel):
    barangay: str
    total: int

class TopBarangaysResponse(BaseModel):
    status: str
    top_n: int
    data: List[TopBarangayItem]


class PossibleCrimeItem(BaseModel):
    crime_type: str
    total_5years: int

class PossibleCrimesResponse(BaseModel):
    status: str
    month: int
    month_name: str
    data: List[PossibleCrimeItem]


# =========================================================
# Globals (shared data/model)
# =========================================================
ts = None                   # monthly total crimes (city-wide)
sarima_model = None         # SARIMA(0,1,1)(0,1,1,12) model
df_global = None            # cleaned full dataframe
top_crimes_overall = None   # Series: crime_type -> total
top_barangays_overall = None# Series: barangay -> total
top_crimes_by_month = None  # DataFrame: month, crime_type, total


# =========================================================
# Helper
# =========================================================
def month_name_from_int(m: int) -> str:
    names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    return names.get(m, "Unknown")


def load_and_train():
    """
    1. Load davao_crime_5years.csv
    2. Clean data
    3. Create monthly time series
    4. Train SARIMA(0,1,1)(0,1,1)[12]
    5. Pre-compute:
       - top crimes overall
       - top barangays overall
       - top 3 crimes per calendar month
    """
    global ts, sarima_model, df_global
    global top_crimes_overall, top_barangays_overall, top_crimes_by_month

    # 1) Path to CSV  --------------------------------------
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")
    csv_path = os.path.abspath(csv_path)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"davao_crime_5years.csv not found at: {csv_path}")

    df = pd.read_csv(csv_path)

    # Expect columns:
    # id, date, barangay, crime_type, crime_count, latitude, longitude

    # 2) CLEANING  -----------------------------------------
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date")

    # keep only positive crimes
    df["crime_count"] = pd.to_numeric(df["crime_count"], errors="coerce")
    df = df[df["crime_count"] > 0]

    # strip text fields
    df["barangay"] = df["barangay"].astype(str).str.strip()
    df["crime_type"] = df["crime_type"].astype(str).str.strip()

    df = df.drop_duplicates()

    df_global = df.copy()

    # 3) MONTHLY TOTAL CRIMES (CITY-WIDE)  -----------------
    # group by month start, sum crime_count
    monthly = (
        df.set_index("date")
          .groupby(pd.Grouper(freq="MS"))["crime_count"]
          .sum()
          .asfreq("MS", fill_value=0)
    )

    ts = monthly.astype(float)

    # 4) TRAIN SARIMA(0,1,1)(0,1,1)[12]  -------------------

    model = SARIMAX(
        ts,
        order=(0, 1, 1),
        seasonal_order=(0, 1, 1, 12),
        enforce_stationarity=True,
        enforce_invertibility=True,
    )
    sarima_model_local = model.fit(disp=False)

    # assign after training
    global sarima_model
    sarima_model = sarima_model_local

    # 5) PRE-COMPUTE INSIGHTS  -----------------------------

    # 5a) Overall top crimes
    top_crimes_overall = (
        df.groupby("crime_type")["crime_count"]
          .sum()
          .sort_values(ascending=False)
    )

    # 5b) Overall top barangays
    top_barangays_overall = (
        df.groupby("barangay")["crime_count"]
          .sum()
          .sort_values(ascending=False)
    )

    # 5c) Top 3 crimes per calendar month (1–12)
    df["month"] = df["date"].dt.month
    monthly_crime_type = (
        df.groupby(["month", "crime_type"])["crime_count"]
          .sum()
          .reset_index()
          .rename(columns={"crime_count": "total"})
    )

    top_crimes_by_month = (
        monthly_crime_type
        .sort_values(["month", "total"], ascending=[True, False])
        .groupby("month")
        .head(3)
        .reset_index(drop=True)
    )

    print("✅ Model trained on", len(ts), "months.")
    print("   Best model (fixed): SARIMA(0,1,1)(0,1,1)[12]")


# =========================================================
# Run training once when the API starts
# =========================================================
@app.on_event("startup")
def startup_event():
    try:
        load_and_train()
    except Exception as e:
        print("[ERROR] Error during startup training:", e)


# =========================================================
# ROUTES
# =========================================================
@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "message": "SARIMA API is running."}


# ---------- 1) FORECAST TOTAL CRIMES (MONTHLY) ----------
@app.get("/forecast", response_model=ForecastResponse, tags=["forecast"])
def get_forecast(horizon: int = 12, crime_type: str = None):
    """
    Get next N months crime forecast.
    If crime_type is provided, forecasts for that specific crime.
    Otherwise, forecasts city-wide total.
    Default horizon = 12 months.
    """
    global ts, sarima_model, df_global

    if df_global is None:
        raise HTTPException(status_code=500, detail="Data not loaded.")

    # Select Time Series
    target_ts = None
    model_to_use = None

    if not crime_type:
        # GLOBAL (City-wide)
        if ts is None or sarima_model is None:
             raise HTTPException(status_code=500, detail="Global model not trained.")
        target_ts = ts
        model_to_use = sarima_model
    else:
        # FILTERED (Specific Crime)
        # Filter logic similar to load_and_train 
        # (case-insensitive match might be safer, but frontend sends exact UPPERCASE)
        subset = df_global[df_global["crime_type"].str.upper() == crime_type.upper()]
        
        if subset.empty:
             # Return empty forecast or error? Error is better to indicate no data.
             # Alternatively, return 0s if we want to be nice.
             # Let's return 0s if no data found to avoid breaking UI.
             pass 
        
        # Create monthly series
        monthly = (
            subset.set_index("date")
            .groupby(pd.Grouper(freq="MS"))["crime_count"]
            .sum()
            .asfreq("MS", fill_value=0)
        )
        target_ts = monthly.astype(float)

        # Basic check: do we have enough data?
        if len(target_ts) < 6:
             # Not enough data to forecast properly. Return 0s
             # We create a dummy model result or just manual 0s?
             # Manual 0s is easier.
             model_to_use = None
        else:
            # TRAIN ON THE FLY
            try:
                # Use simple order for speed/stability on small data
                temp_model = SARIMAX(
                    target_ts,
                    order=(0, 1, 1),
                    seasonal_order=(0, 1, 1, 12),
                    enforce_stationarity=False,
                    enforce_invertibility=False
                )
                model_to_use = temp_model.fit(disp=False)
            except Exception as e:
                print(f"[ERROR] Training failed for {crime_type}: {e}")
                model_to_use = None

    if horizon <= 0 or horizon > 60:
        raise HTTPException(status_code=400, detail="horizon must be between 1 and 60 months.")

    # Generate Forecast
    items: List[ForecastItem] = []
    
    # Future dates
    last_date = target_ts.index[-1] if target_ts is not None and not target_ts.empty else pd.Timestamp.now()
    future_dates = pd.date_range(
        start=last_date + pd.DateOffset(months=1),
        periods=horizon,
        freq="MS",
    )

    if model_to_use:
        try:
            forecast_res = model_to_use.get_forecast(steps=horizon)
            mean = forecast_res.predicted_mean
            ci = forecast_res.conf_int()
            
            # Heuristic clamping: 
            # Limit Upper CI to be relative to the forecast value to prevent "box" look.
            # We allow it to go up to Forecast + MaxHistorical.
            max_hist = float(target_ts.max()) if target_ts is not None and not target_ts.empty else 10.0
            
            for i in range(horizon):
                val = float(mean.iloc[i]) if i < len(mean) else 0.0
                lower = float(ci.iloc[i, 0]) if i < len(ci) else 0.0
                upper = float(ci.iloc[i, 1]) if i < len(ci) else 0.0
                
                # Clip negative values
                val = max(0.0, val)
                lower = max(0.0, lower)
                upper = max(0.0, upper)
                
                # Dynamic Clamp: Forecast + MaxHistorical
                # This ensures the error bar is proportional to the scale of data
                dynamic_limit = val + max_hist
                if upper > dynamic_limit:
                     upper = dynamic_limit

                items.append(
                    ForecastItem(
                        date=str(future_dates[i].date()),
                        forecast=val,
                        lower_ci=lower,
                        upper_ci=upper,
                    )
                )
        except Exception as e:
            print(f"[ERROR] Forecast generation failed: {e}")
            # Fallback to 0s
            for i in range(horizon):
                items.append(ForecastItem(date=str(future_dates[i].date()), forecast=0.0, lower_ci=0.0, upper_ci=0.0))

    else:
        # Fallback for insufficient data or failed training
        # Use historical statistics instead of zeros
        if target_ts is not None and not target_ts.empty and len(target_ts) > 0:
            # Calculate historical mean and std
            hist_mean = float(target_ts.mean())
            hist_std = float(target_ts.std()) if len(target_ts) > 1 else hist_mean * 0.3
            
            # Use mean as forecast, with reasonable confidence intervals
            for i in range(horizon):
                # Slight decay over time (assume mean reverts)
                decay_factor = 0.95 ** i  # 5% decay per month
                forecast_val = hist_mean * decay_factor
                
                # CI based on historical variability
                lower_val = max(0.0, forecast_val - hist_std)
                upper_val = forecast_val + hist_std
                
                items.append(
                    ForecastItem(
                        date=str(future_dates[i].date()),
                        forecast=forecast_val,
                        lower_ci=lower_val,
                        upper_ci=upper_val,
                    )
                )
        else:
            # Truly no data - return zeros
            for i in range(horizon):
                items.append(
                    ForecastItem(
                        date=str(future_dates[i].date()),
                        forecast=0.0,
                        lower_ci=0.0,
                        upper_ci=0.0,
                    )
                )

    return ForecastResponse(status="success", horizon=horizon, data=items)


# ---------- 2) TOP CRIMES OVERALL -----------------------
@app.get("/top-crimes", response_model=TopCrimesResponse, tags=["insights"])
def get_top_crimes(top_n: int = 10):
    """
    Return top N crime types based on 5-year historical data.
    Example: /top-crimes?top_n=5
    """
    global top_crimes_overall

    if top_crimes_overall is None:
        raise HTTPException(status_code=500, detail="Top crimes not available (model not initialized).")

    if top_n <= 0:
        raise HTTPException(status_code=400, detail="top_n must be positive.")

    series = top_crimes_overall.head(top_n)

    data = [
        TopCrimeItem(crime_type=str(idx), total=int(val))
        for idx, val in series.items()
    ]

    return TopCrimesResponse(status="success", top_n=len(data), data=data)


# ---------- 3) TOP BARANGAYS (PINAKAMADAMING KRIMEN) ---
@app.get("/top-barangays", response_model=TopBarangaysResponse, tags=["insights"])
def get_top_barangays(top_n: int = 10):
    """
    Return top N barangays with highest crime totals.
    Example: /top-barangays?top_n=10
    """
    global top_barangays_overall

    if top_barangays_overall is None:
        raise HTTPException(status_code=500, detail="Top barangays not available (model not initialized).")

    if top_n <= 0:
        raise HTTPException(status_code=400, detail="top_n must be positive.")

    series = top_barangays_overall.head(top_n)

    data = [
        TopBarangayItem(barangay=str(idx), total=int(val))
        for idx, val in series.items()
    ]

    return TopBarangaysResponse(status="success", top_n=len(data), data=data)


# ---------- 4) POSSIBLE CRIMES PER MONTH ---------------
@app.get("/possible-crimes", response_model=PossibleCrimesResponse, tags=["insights"])
def get_possible_crimes_for_month(date: str):
    """
    Given a date, return the top 3 historical crimes for that calendar month.
    Example: /possible-crimes?date=2025-03-01
    """
    global top_crimes_by_month

    if top_crimes_by_month is None:
        raise HTTPException(status_code=500, detail="Top crimes by month not available (model not initialized).")

    # parse date
    try:
        d = pd.to_datetime(date)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    m = d.month
    sub = top_crimes_by_month[top_crimes_by_month["month"] == m]

    if sub.empty:
        raise HTTPException(status_code=404, detail="No crime history for that month.")

    data = [
        PossibleCrimeItem(
            crime_type=row["crime_type"],
            total_5years=int(row["total"])
        )
        for _, row in sub.iterrows()
    ]

    return PossibleCrimesResponse(
        status="success",
        month=m,
        month_name=month_name_from_int(m),
        data=data
    )
# RUN SERVER (for local dev)
# =========================================================
if __name__ == '__main__':
    import uvicorn
    # Clean up any existing params if needed
    uvicorn.run('main:app', host='0.0.0.0', port=8001, reload=True)

