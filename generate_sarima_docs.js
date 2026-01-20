const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

// Read existing document and append SARIMA section
const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "SARIMA IMPLEMENTATION IN CODE",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Overview",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "The SARIMA (Seasonal AutoRegressive Integrated Moving Average) model is implemented as a Python FastAPI service that provides crime forecasting capabilities. The model uses historical crime data to predict future crime trends.",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "File Location",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "File: AdminSide/sarima_api/main.py" }),
            new Paragraph({ text: "Framework: FastAPI (Python)" }),
            new Paragraph({ text: "Library: statsmodels.tsa.statespace.sarimax", spacing: { after: 200 } }),

            new Paragraph({
                text: "SARIMA Model Configuration",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Model: SARIMA(0,1,1)(0,1,1)[12]" }),
            new Paragraph({ text: "• Order (p,d,q): (0,1,1)" }),
            new Paragraph({ text: "  - p=0: No autoregressive terms" }),
            new Paragraph({ text: "  - d=1: First-order differencing" }),
            new Paragraph({ text: "  - q=1: One moving average term" }),
            new Paragraph({ text: "• Seasonal Order (P,D,Q,s): (0,1,1,12)" }),
            new Paragraph({ text: "  - P=0: No seasonal autoregressive terms" }),
            new Paragraph({ text: "  - D=1: First-order seasonal differencing" }),
            new Paragraph({ text: "  - Q=1: One seasonal moving average term" }),
            new Paragraph({ text: "  - s=12: 12-month seasonality (annual pattern)", spacing: { after: 200 } }),

            new Paragraph({
                text: "Implementation Steps (Code Flow)",
                heading: HeadingLevel.HEADING_2,
            }),

            new Paragraph({
                text: "Step 1: Data Loading (Lines 92-114)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Loads davao_crime_5years.csv from storage" }),
            new Paragraph({ text: "• CSV contains: date, barangay, crime_type, crime_count, latitude, longitude" }),
            new Paragraph({ text: "• File path: AdminSide/admin/storage/app/davao_crime_5years.csv", spacing: { after: 200 } }),

            new Paragraph({
                text: "Step 2: Data Cleaning (Lines 119-132)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Converts date column to datetime format" }),
            new Paragraph({ text: "• Removes rows with invalid dates" }),
            new Paragraph({ text: "• Filters out zero or negative crime counts" }),
            new Paragraph({ text: "• Strips whitespace from text fields" }),
            new Paragraph({ text: "• Removes duplicate records", spacing: { after: 200 } }),

            new Paragraph({
                text: "Step 3: Time Series Creation (Lines 135-144)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Groups data by month start (MS frequency)" }),
            new Paragraph({ text: "• Sums crime_count for each month" }),
            new Paragraph({ text: "• Creates monthly time series with zero-filling for missing months" }),
            new Paragraph({ text: "• Result: City-wide monthly crime totals", spacing: { after: 200 } }),

            new Paragraph({
                text: "Step 4: Model Training (Lines 146-159)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "Code:" }),
            new Paragraph({ text: "model = SARIMAX(" }),
            new Paragraph({ text: "    ts," }),
            new Paragraph({ text: "    order=(0, 1, 1)," }),
            new Paragraph({ text: "    seasonal_order=(0, 1, 1, 12)," }),
            new Paragraph({ text: "    enforce_stationarity=True," }),
            new Paragraph({ text: "    enforce_invertibility=True" }),
            new Paragraph({ text: ")" }),
            new Paragraph({ text: "sarima_model = model.fit(disp=False)" }),
            new Paragraph({ text: "• Trains on entire historical dataset" }),
            new Paragraph({ text: "• Model stored in global variable for reuse", spacing: { after: 200 } }),

            new Paragraph({
                text: "Step 5: Pre-computation of Insights (Lines 161-192)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Top crimes overall (grouped by crime_type)" }),
            new Paragraph({ text: "• Top barangays (grouped by barangay)" }),
            new Paragraph({ text: "• Top 3 crimes per calendar month (1-12)", spacing: { after: 200 } }),

            new Paragraph({
                text: "API Endpoints",
                heading: HeadingLevel.HEADING_2,
            }),

            new Paragraph({
                text: "1. /forecast (Lines 218-377)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Generates crime forecasts for next N months" }),
            new Paragraph({ text: "• Parameters: horizon (default 12), crime_type (optional)" }),
            new Paragraph({ text: "• Returns: date, forecast, lower_ci, upper_ci" }),
            new Paragraph({ text: "• Uses model.get_forecast(steps=horizon)" }),
            new Paragraph({ text: "• Applies dynamic clamping to prevent unrealistic confidence intervals", spacing: { after: 200 } }),

            new Paragraph({
                text: "2. /top-crimes (Lines 381-402)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Returns top N crime types by total count" }),
            new Paragraph({ text: "• Parameter: top_n (default 10)" }),
            new Paragraph({ text: "• Uses pre-computed top_crimes_overall", spacing: { after: 200 } }),

            new Paragraph({
                text: "3. /top-barangays (Lines 406-427)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Returns top N barangays with highest crime totals" }),
            new Paragraph({ text: "• Parameter: top_n (default 10)" }),
            new Paragraph({ text: "• Uses pre-computed top_barangays_overall", spacing: { after: 200 } }),

            new Paragraph({
                text: "4. /possible-crimes (Lines 431-467)",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "• Returns top 3 historical crimes for a given month" }),
            new Paragraph({ text: "• Parameter: date (YYYY-MM-DD format)" }),
            new Paragraph({ text: "• Extracts month from date and returns historical patterns", spacing: { after: 200 } }),

            new Paragraph({
                text: "Deployment",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "Platform: Render (Cloud Platform)" }),
            new Paragraph({ text: "Service Type: Web Service" }),
            new Paragraph({ text: "Runtime: Python 3.x with FastAPI" }),
            new Paragraph({ text: "Server: Uvicorn ASGI server" }),
            new Paragraph({ text: "Port: 8001 (configured in main.py line 473)" }),
            new Paragraph({ text: "Auto-reload: Enabled for development", spacing: { after: 200 } }),

            new Paragraph({
                text: "Integration with AdminSide",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• AdminSide Laravel app calls SARIMA API via HTTP requests" }),
            new Paragraph({ text: "• API URL stored in environment variables" }),
            new Paragraph({ text: "• Dashboard displays forecast charts using API data" }),
            new Paragraph({ text: "• JavaScript fetch() calls to /forecast endpoint" }),
            new Paragraph({ text: "• Data rendered using Chart.js or similar library", spacing: { after: 200 } }),

            new Paragraph({
                text: "Model Initialization",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Training occurs on API startup (Lines 201-206)" }),
            new Paragraph({ text: "• Uses FastAPI @app.on_event('startup') decorator" }),
            new Paragraph({ text: "• Calls load_and_train() function automatically" }),
            new Paragraph({ text: "• Model remains in memory for fast predictions" }),
            new Paragraph({ text: "• No need to retrain for each request", spacing: { after: 200 } }),

            new Paragraph({
                text: "Error Handling & Fallbacks",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• If specific crime type has insufficient data (< 6 months):" }),
            new Paragraph({ text: "  - Uses historical mean and standard deviation" }),
            new Paragraph({ text: "  - Applies 5% monthly decay factor" }),
            new Paragraph({ text: "  - Returns statistical fallback instead of zeros" }),
            new Paragraph({ text: "• If training fails:" }),
            new Paragraph({ text: "  - Catches exceptions and logs errors" }),
            new Paragraph({ text: "  - Returns fallback forecasts based on historical statistics" }),
            new Paragraph({ text: "• Confidence intervals clamped to prevent unrealistic values", spacing: { after: 400 } }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('AlertDavao_SARIMA_Implementation.docx', buffer);
    console.log('✅ SARIMA implementation documentation created: AlertDavao_SARIMA_Implementation.docx');
});
