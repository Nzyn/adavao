
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import os

# =========================================================
# FastAPI app
# =========================================================
app = FastAPI(
    title="SARIMA Crime Forecast API",
    description="Serves monthly crime forecasts from SARIMA(1,1,1)(1,1,1)[12] using CrimeDAta.csv",
    version="1.0.0",
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


ts = None              
sarima_model = None   
def load_and_train():
    global ts, sarima_model

    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "..", "data", "CrimeDAta.csv")
    csv_path = os.path.abspath(csv_path)

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CrimeDAta.csv not found at: {csv_path}")

    df = pd.read_csv(csv_path)

    cols_lower = [c.lower() for c in df.columns]

    # Detect date column
    if "date" in cols_lower:
        date_col = df.columns[cols_lower.index("date")]
    elif "_date" in cols_lower:
        date_col = df.columns[cols_lower.index("_date")]
    else:
        # assume last column is date
        date_col = df.columns[-1]

    # Detect count column
    if "count" in cols_lower:
        count_col = df.columns[cols_lower.index("count")]
    else:
        # assume third column is count (Year,Month,Count,Date pattern)
        if df.shape[1] >= 3:
            count_col = df.columns[2]
        else:
            raise ValueError("Cannot find 'Count' column in CrimeDAta.csv")

    # Parse and clean
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
    df = df.dropna(subset=[date_col]).sort_values(date_col)
    df[count_col] = pd.to_numeric(df[count_col], errors="coerce").fillna(0)

    # Monthly time series
    series = df.set_index(date_col)[count_col].astype(float).sort_index()

    # (Optional) ensure monthly frequency
    series = series.asfreq("MS")  
    series = series.fillna(method="ffill")  # forward-fill if naay bangag

    # Save globally
    ts = series

    # Train SARIMA(1,1,1)(1,1,1)[12]
    model = SARIMAX(
        ts,
        order=(1, 1, 1),
        seasonal_order=(1, 1, 1, 12),
        enforce_stationarity=False,
        enforce_invertibility=False,
    )
    sarima_model = model.fit(disp=False)

    print("✅ SARIMA model trained. Observations:", len(ts))


# =========================================================
# Run training once when the API starts
# =========================================================
@app.on_event("startup")
def startup_event():
    try:
        load_and_train()
    except Exception as e:
        # Log error to console; API will return 500 if not trained
        print("❌ Error during startup training:", e)


# =========================================================
# Routes
# =========================================================
@app.get("/", tags=["health"])
def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok", "message": "SARIMA API is running."}


@app.get("/forecast", response_model=ForecastResponse, tags=["forecast"])
def get_forecast(horizon: int = 12):
    """
    Get next N months crime forecast.
    Default horizon = 12 months.
    """
    global ts, sarima_model

    if ts is None or sarima_model is None:
        raise HTTPException(status_code=500, detail="Model not trained.")

    if horizon <= 0 or horizon > 60:
        raise HTTPException(status_code=400, detail="horizon must be between 1 and 60 months.")

    # Forecast
    forecast_res = sarima_model.get_forecast(steps=horizon)
    mean = forecast_res.predicted_mean
    ci = forecast_res.conf_int()

    future_dates = pd.date_range(
        start=ts.index[-1] + pd.DateOffset(months=1),
        periods=horizon,
        freq="MS",
    )

    items: List[ForecastItem] = []
    for i in range(horizon):
        items.append(
            ForecastItem(
                date=str(future_dates[i].date()),
                forecast=float(mean.iloc[i]),
                lower_ci=float(ci.iloc[i, 0]),
                upper_ci=float(ci.iloc[i, 1]),
            )
        )

    return ForecastResponse(status="success", horizon=horizon, data=items)
