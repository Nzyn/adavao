from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import pandas as pd
import numpy as np
import uvicorn
import warnings
from pathlib import Path
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tools.sm_exceptions import ConvergenceWarning

warnings.filterwarnings("ignore", category=ConvergenceWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# =========================================================
# INITIALIZE APP
# =========================================================
app = FastAPI(
    title="SARIMA Crime Forecast API",
    description="Provides crime forecasting using SARIMA (Seasonal AutoRegressive Integrated Moving Average) model",
    version="2.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# LOAD DATA FROM CrimeDAta.csv
# =========================================================

# Load the simple CrimeDAta.csv (Year, Month, Count, Date)
DATA_PATH = Path(__file__).parent / "data" / "CrimeDAta.csv"

if not DATA_PATH.exists():
    raise FileNotFoundError(f"CrimeDAta.csv not found at: {DATA_PATH}")

print(f"✅ Loading data from: {DATA_PATH}")
df_raw = pd.read_csv(DATA_PATH)

# Clean column names
df = df_raw.copy()
df.columns = df.columns.str.strip()

# Ensure we have the expected columns: Year, Month, Count, Date
required_cols = ['Year', 'Month', 'Count', 'Date']
if not all(col in df.columns for col in required_cols):
    raise ValueError(f"Missing required columns. Expected: {required_cols}, Got: {df.columns.tolist()}")

# Convert to proper types
df['Year'] = pd.to_numeric(df['Year'], errors='coerce').astype(int)
df['Month'] = pd.to_numeric(df['Month'], errors='coerce').astype(int)
df['Count'] = pd.to_numeric(df['Count'], errors='coerce').astype(int)
df['Date'] = pd.to_datetime(df['Date'])

# Remove any rows with NaN values
df = df.dropna()

# Sort by date
df = df.sort_values('Date').reset_index(drop=True)

print(f"📊 Loaded {len(df)} monthly crime records")
print(f"📅 Date range: {df['Date'].min()} to {df['Date'].max()}")
print(f"🔢 Total crimes in dataset: {df['Count'].sum()}")
print(f"📈 Average crimes per month: {df['Count'].mean():.1f}")

# Create time series for SARIMA
crime_series = df.set_index('Date')['Count']
crime_series = crime_series.asfreq('MS')  # Monthly start frequency

# =========================================================
# RESPONSE MODELS
# =========================================================

class ForecastItem(BaseModel):
    date: str
    forecast: float
    lower_ci: float
    upper_ci: float

class ForecastResponse(BaseModel):
    status: str
    horizon: int
    model: str
    results: List[ForecastItem]

class SummaryResponse(BaseModel):
    status: str
    data: Dict

# =========================================================
# SARIMA FORECASTING FUNCTION
# =========================================================

def run_sarima_forecast(series: pd.Series, horizon: int = 12) -> List[Dict]:
    """
    Run SARIMA(1,1,1)(1,1,1)[12] forecast
    
    Args:
        series: Time series data (monthly frequency)
        horizon: Number of months to forecast
    
    Returns:
        List of forecast dictionaries with date, forecast, lower_ci, upper_ci
    """
    # Ensure monthly frequency
    s = series.asfreq('MS').fillna(0)
    
    # Check if we have enough data
    if len(s) < 24:  # Need at least 2 years of data
        print(f"⚠️ Warning: Only {len(s)} data points. SARIMA needs at least 24 months.")
        return []
    
    try:
        # SARIMA(1,1,1)(1,1,1)[12] model
        # (p,d,q) = (1,1,1) - non-seasonal parameters
        # (P,D,Q,s) = (1,1,1,12) - seasonal parameters with 12-month cycle
        model = SARIMAX(
            s,
            order=(1, 1, 1),           # (p, d, q)
            seasonal_order=(1, 1, 1, 12),  # (P, D, Q, s)
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        
        print(f"🔧 Fitting SARIMA(1,1,1)(1,1,1)[12] model...")
        result = model.fit(disp=False)
        print(f"✅ Model fitted successfully!")
        
        # Generate forecast
        forecast = result.get_forecast(steps=horizon)
        mean = forecast.predicted_mean.clip(lower=0)  # No negative crimes
        ci = forecast.conf_int(alpha=0.05).clip(lower=0)  # 95% confidence interval
        
        # Format output
        output = []
        for i in range(len(mean)):
            output.append({
                'date': mean.index[i].strftime('%Y-%m-%d'),
                'forecast': float(mean.iloc[i]),
                'lower_ci': float(ci.iloc[i, 0]),
                'upper_ci': float(ci.iloc[i, 1]),
            })
        
        print(f"📈 Generated {len(output)} forecast points")
        return output
        
    except Exception as e:
        print(f"❌ SARIMA model failed: {str(e)}")
        return []

# =========================================================
# API ROUTES
# =========================================================

@app.get("/")
def root():
    """API health check and information"""
    return {
        'status': 'running',
        'message': 'SARIMA Crime Forecast API is active',
        'version': '2.0',
        'model': 'SARIMA(1,1,1)(1,1,1)[12]',
        'data_source': 'data/CrimeDAta.csv',
        'endpoints': {
            '/': 'API information',
            '/forecast': 'Get crime forecast (specify ?horizon=12)',
            '/summary': 'Get dataset summary statistics'
        }
    }

@app.get("/forecast", response_model=ForecastResponse)
def get_forecast(horizon: int = 12):
    """
    Get SARIMA crime forecast
    
    Args:
        horizon: Number of months to forecast (default: 12)
    
    Returns:
        ForecastResponse with predicted values and confidence intervals
    """
    if horizon < 1 or horizon > 36:
        raise HTTPException(400, detail="Horizon must be between 1 and 36 months")
    
    print(f"\n🔮 Generating {horizon}-month forecast...")
    
    # Run SARIMA forecast
    forecast_data = run_sarima_forecast(crime_series, horizon)
    
    if not forecast_data:
        raise HTTPException(500, detail="SARIMA forecast failed. Check if you have enough historical data (minimum 24 months).")
    
    results = [
        ForecastItem(
            date=item['date'],
            forecast=item['forecast'],
            lower_ci=item['lower_ci'],
            upper_ci=item['upper_ci']
        )
        for item in forecast_data
    ]
    
    return ForecastResponse(
        status='success',
        horizon=horizon,
        model='SARIMA(1,1,1)(1,1,1)[12]',
        results=results
    )

@app.get("/health")
def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy", "service": "SARIMA API"}

@app.get("/summary", response_model=SummaryResponse)
def get_summary():
    """Get summary statistics of the dataset"""
    return SummaryResponse(
        status='success',
        data={
            'total_records': len(df),
            'date_range': {
                'start': df['Date'].min().strftime('%Y-%m-%d'),
                'end': df['Date'].max().strftime('%Y-%m-%d')
            },
            'total_crimes': int(df['Count'].sum()),
            'average_crimes_per_month': float(df['Count'].mean()),
            'min_crimes_in_month': int(df['Count'].min()),
            'max_crimes_in_month': int(df['Count'].max()),
            'data_source': 'CrimeDAta.csv',
            'model': 'SARIMA(1,1,1)(1,1,1)[12]'
        }
    )

# =========================================================
# RUN SERVER (for local dev)
# =========================================================
if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8001, reload=True)
