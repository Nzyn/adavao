
import os
import sys

print(f"Python Executable: {sys.executable}")
print(f"Working Directory: {os.getcwd()}")

try:
    import pandas
    print("✓ pandas installed")
except ImportError:
    print("❌ pandas MISSING")

try:
    import fastapi
    print("✓ fastapi installed")
except ImportError:
    print("❌ fastapi MISSING")

try:
    import uvicorn
    print("✓ uvicorn installed")
except ImportError:
    print("❌ uvicorn MISSING")

try:
    import statsmodels
    print("✓ statsmodels installed")
except ImportError:
    print("❌ statsmodels MISSING")

base_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(base_dir, "..", "data", "davao_crime_5years.csv")
csv_path = os.path.abspath(csv_path)

print(f"Checking for CSV at: {csv_path}")
if os.path.exists(csv_path):
    print("✓ CSV Found")
else:
    print("❌ CSV NOT FOUND")

