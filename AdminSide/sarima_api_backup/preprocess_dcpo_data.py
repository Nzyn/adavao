"""
Preprocess DCPO 5 years monthly data for SARIMA model
Aggregates crime counts by year and month
"""

import pandas as pd
import os

# Read the raw DCPO data
input_file = os.path.join(os.path.dirname(__file__), 'data', 'CrimeDAta.csv')
output_file = os.path.join(os.path.dirname(__file__), 'data', 'CrimeDAta_Processed.csv')

print(f"📂 Reading data from: {input_file}")
df = pd.read_csv(input_file)

print(f"✅ Loaded {len(df)} rows")
print(f"📋 Columns: {df.columns.tolist()}")

# Convert Date to datetime
df['Date'] = pd.to_datetime(df['Date'])

# Extract Year and Month
df['Year'] = df['Date'].dt.year
df['Month'] = df['Date'].dt.month

# Aggregate by Year and Month - sum all crime counts
monthly_aggregated = df.groupby(['Year', 'Month'])['Count'].sum().reset_index()

# Sort by date
monthly_aggregated = monthly_aggregated.sort_values(['Year', 'Month'])

# Create a Date column for reference
monthly_aggregated['Date'] = pd.to_datetime(
    monthly_aggregated[['Year', 'Month']].assign(day=1)
)

print(f"\n📊 Aggregated Statistics:")
print(f"   Total Months: {len(monthly_aggregated)}")
print(f"   Date Range: {monthly_aggregated['Date'].min()} to {monthly_aggregated['Date'].max()}")
print(f"   Total Crimes: {monthly_aggregated['Count'].sum()}")
print(f"   Average per Month: {monthly_aggregated['Count'].mean():.2f}")

# Preview
print(f"\n📋 First 10 rows:")
print(monthly_aggregated.head(10))

print(f"\n📋 Last 10 rows:")
print(monthly_aggregated.tail(10))

# Save processed data
monthly_aggregated.to_csv(output_file, index=False)
print(f"\n✅ Saved processed data to: {output_file}")
print(f"   Format: Year, Month, Count, Date")
