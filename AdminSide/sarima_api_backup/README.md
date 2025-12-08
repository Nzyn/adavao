# SARIMA Crime Forecast API

This API provides crime forecasting using SARIMA (Seasonal AutoRegressive Integrated Moving Average) model.

## Auto-Start (Development)

**The API automatically starts when you visit the Statistics page in development mode!**

No manual setup needed - just visit `/statistics` in AdminSide.

## Manual Start (Optional)

### From Project Root

```bash
python start_sarima.py
```

### From This Directory

```bash
# Install dependencies
pip install -r requirements.txt

# Start API
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### Windows Batch File

```cmd
start.bat
```

## Production Deployment

For production servers, use systemd or supervisor to run as a system service.

**See:** `../../SARIMA_DEPLOYMENT.md` for complete setup instructions.

### Quick Setup (Linux):

```bash
# Copy service file
sudo cp sarima-api.service /etc/systemd/system/

# Enable and start
sudo systemctl enable sarima-api
sudo systemctl start sarima-api
```

## Endpoints

- `GET /` - Health check
- `GET /forecast?horizon=12` - Get crime forecast for next N months (default: 12)

## Data

The model uses historical crime data from `data/CrimeDAta.csv` and trains a SARIMA(1,1,1)(1,1,1)[12] model to forecast future crime trends.

## API URL

- **Local:** `http://localhost:8001/`
- **Production:** Configure reverse proxy or use direct port

## Files

- `main.py` - FastAPI application with SARIMA model
- `data/CrimeDAta.csv` - Historical crime data for training
- `requirements.txt` - Python dependencies
- `start.bat` - Windows startup script
- `sarima-api.service` - Systemd service file (production)
- `supervisor.conf` - Supervisor config (production)
