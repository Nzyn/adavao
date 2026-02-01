"""
Generate SARIMA forecasts for individual crime types
Reads DCPO_5years_monthly.csv and creates separate forecast files for each crime type
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
import os

warnings.filterwarnings('ignore')

def generate_crime_type_forecast(crime_type, data, horizon=12):
    """
    Generate SARIMA forecast for a specific crime type
    
    Args:
        crime_type: Name of the crime type (e.g., "PHYSICAL INJURY")
        data: Filtered monthly crime data for this type
        horizon: Number of months to forecast
    
    Returns:
        DataFrame with forecast, lower_ci, upper_ci
    """
    print(f"\n📊 Generating forecast for: {crime_type}")
    print(f"   Data points: {len(data)}")
    
    if len(data) < 24:  # Need at least 2 years of data
        print(f"   ⚠️  Insufficient data (need 24+ months, have {len(data)})")
        return None
    
    try:
        # Fit SARIMA model
        # Using (1,1,1)(1,1,1)[12] - same as overall model
        model = SARIMAX(
            data['count'],
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 12),
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        
        results = model.fit(disp=False, maxiter=200)
        
        # Generate forecast
        forecast_obj = results.get_forecast(steps=horizon)
        forecast_mean = forecast_obj.predicted_mean
        forecast_ci = forecast_obj.conf_int(alpha=0.05)  # 95% confidence interval
        
        # Create forecast dataframe
        last_date = pd.to_datetime(data['date'].iloc[-1])
        forecast_dates = pd.date_range(
            start=last_date + pd.DateOffset(months=1),
            periods=horizon,
            freq='MS'
        )
        
        forecast_df = pd.DataFrame({
            'Date': forecast_dates.strftime('%Y-%m-%d'),
            'Forecast_Crimes': forecast_mean.clip(lower=0).round(2),
            'Lower_CI': forecast_ci.iloc[:, 0].round(2),
            'Upper_CI': forecast_ci.iloc[:, 1].round(2)
        })
        
        # Fix confidence intervals for realistic bounds
        # Lower CI: Use max of (model CI, 50% of forecast) - prevents 0 or negative
        forecast_df['Lower_CI'] = forecast_df[['Lower_CI', 'Forecast_Crimes']].apply(
            lambda row: max(row['Lower_CI'], row['Forecast_Crimes'] * 0.5) if row['Lower_CI'] < 0 else row['Lower_CI'],
            axis=1
        ).round(2)
        
        # Upper CI: Cap at 3x forecast - prevents extreme values
        forecast_df['Upper_CI'] = forecast_df[['Upper_CI', 'Forecast_Crimes']].apply(
            lambda row: min(row['Upper_CI'], row['Forecast_Crimes'] * 3),
            axis=1
        ).round(2)
        
        print(f"   ✅ Forecast generated successfully")
        print(f"   📈 Average forecast: {forecast_df['Forecast_Crimes'].mean():.1f} crimes/month")
        print(f"   📊 CI range: {forecast_df['Lower_CI'].mean():.1f} to {forecast_df['Upper_CI'].mean():.1f}")
        
        return forecast_df
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def main():
    print("=" * 60)
    print("🔮 SARIMA Crime-Specific Forecast Generator")
    print("=" * 60)
    
    # Load DCPO data
    csv_path = 'alertdavao/AdminSide/admin/storage/app/DCPO_5years_monthly.csv'
    
    if not os.path.exists(csv_path):
        print(f"❌ Error: File not found: {csv_path}")
        return
    
    print(f"\n📂 Loading data from: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} records")
    
    # Get unique crime types
    crime_types = df['offense'].unique()
    print(f"\n📋 Found {len(crime_types)} unique crime types:")
    for ct in sorted(crime_types):
        count = len(df[df['offense'] == ct])
        print(f"   - {ct}: {count} records")
    
    # Generate forecasts for each crime type
    output_dir = 'alertdavao/AdminSide/admin/storage/app'
    successful = 0
    failed = 0
    
    for crime_type in sorted(crime_types):
        # Filter data for this crime type
        crime_data = df[df['offense'] == crime_type].copy()
        
        # Aggregate by month
        crime_data['date'] = pd.to_datetime(crime_data['Date'])
        crime_data['year_month'] = crime_data['date'].dt.to_period('M')
        
        monthly = crime_data.groupby('year_month').agg({
            'Count': 'sum'
        }).reset_index()
        
        monthly['date'] = monthly['year_month'].dt.to_timestamp()
        monthly = monthly.rename(columns={'Count': 'count'})
        monthly = monthly.sort_values('date')
        
        # Generate forecast
        forecast_df = generate_crime_type_forecast(crime_type, monthly, horizon=12)
        
        if forecast_df is not None:
            # Save to CSV
            filename = f"sarima_forecast_{crime_type.lower().replace(' ', '_')}.csv"
            output_path = os.path.join(output_dir, filename)
            forecast_df.to_csv(output_path, index=False)
            print(f"   💾 Saved to: {filename}")
            successful += 1
        else:
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Successfully generated: {successful} forecasts")
    print(f"❌ Failed: {failed} forecasts")
    print("=" * 60)
    
    print("\n📝 Next steps:")
    print("1. Check the storage/app/ directory for generated CSV files")
    print("2. Refresh your statistics page")
    print("3. Select different crime types to see specific forecasts")

if __name__ == '__main__':
    main()
