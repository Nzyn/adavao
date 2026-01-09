@extends('layouts.app')

@section('title', 'Statistics & Crime Forecast')

@section('styles')
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
    .statistics-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .stats-header {
        margin-bottom: 2rem;
    }

    .stats-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1D3557;
        margin-bottom: 0.5rem;
    }

    .stats-subtitle {
        color: #6b7280;
        font-size: 1rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .stat-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .stat-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    }

    .stat-icon.blue { background: #dbeafe; color: #1e40af; }
    .stat-icon.green { background: #d1fae5; color: #065f46; }
    .stat-icon.orange { background: #fed7aa; color: #c2410c; }
    .stat-icon.purple { background: #e9d5ff; color: #6b21a8; }

    .stat-value {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }

    .stat-change {
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .stat-change.positive { color: #059669; }
    .stat-change.negative { color: #dc2626; }

    .chart-section {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        margin-bottom: 2rem;
    }

    .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .chart-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
    }

    .chart-controls {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    .chart-btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .chart-btn:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
    }

    .chart-btn.active {
        background: #1D3557;
        color: white;
        border-color: #1D3557;
    }

    .chart-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .forecast-select {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
    }

    .chart-canvas {
        width: 100%;
        height: 400px;
        position: relative;
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        z-index: 10;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top-color: #1D3557;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-message {
        background: #fef2f2;
        color: #991b1b;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #fecaca;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .info-message {
        background: #eff6ff;
        color: #1e40af;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #bfdbfe;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .forecast-legend {
        display: flex;
        gap: 1.5rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 3px;
    }

    .export-section {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }

    /* Loading Skeleton Styles */
    .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s ease-in-out infinite;
        border-radius: 8px;
    }

    @keyframes loading {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    .skeleton-text {
        height: 20px;
        margin-bottom: 10px;
        border-radius: 4px;
    }

    .skeleton-chart {
        height: 400px;
        border-radius: 12px;
    }

    .skeleton-card {
        height: 120px;
        border-radius: 12px;
    }

    @media (max-width: 768px) {
        .statistics-container {
            padding: 1rem;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .chart-header {
            flex-direction: column;
            align-items: flex-start;
        }
    }
</style>
@endsection

@section('content')
<div class="statistics-container">
    <div class="stats-header">
        <h1 class="stats-title">📊 Crime Statistics & SARIMA Forecast</h1>
        <p class="stats-subtitle">Advanced predictive analytics using Seasonal AutoRegressive Integrated Moving Average modeling</p>
    </div>

    <!-- Date Filter Section -->
    <div class="chart-section" style="margin-bottom: 2rem;">
        <div class="chart-header">
            <h2 class="chart-title">🔍 Filter Data</h2>
            <div class="chart-controls">
                <select class="forecast-select" id="yearFilter" style="margin-right: 0.5rem;">
                    <option value="">All Years</option>
                </select>
                <select class="forecast-select" id="monthFilter">
                    <option value="">All Months</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                </select>
                <button class="chart-btn active" id="applyFilter">📅 Apply Filter</button>
                <button class="chart-btn" id="clearFilter">🔄 Clear Filter</button>
            </div>
        </div>
        <p style="color: #6b7280; font-size: 0.875rem; margin-top: 0.5rem;" id="filterStatus">
            Showing: <strong>All historical data</strong>
        </p>
    </div>

    <!-- SARIMA API Status (removed) -->

    <!-- Overview Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-label">Total Reports</span>
                <div class="stat-icon blue">📊</div>
            </div>
            <div class="stat-value" id="totalReports">-</div>
            <div class="stat-change">All time</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-label">This Month</span>
                <div class="stat-icon green">📈</div>
            </div>
            <div class="stat-value" id="thisMonthReports">-</div>
            <div class="stat-change" id="monthChange">-</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-label">Last Month</span>
                <div class="stat-icon orange">📉</div>
            </div>
            <div class="stat-value" id="lastMonthReports">-</div>
            <div class="stat-change">Previous period</div>
        </div>

        <div class="stat-card">
            <div class="stat-card-header">
                <span class="stat-label">SARIMA API Status</span>
                <div class="stat-icon purple">🔮</div>
            </div>
            <div class="stat-value" style="font-size: 1.25rem;" id="forecastStatus">Checking...</div>
            <div class="stat-change">Port 8001</div>
        </div>
    </div>

    <!-- Crime Trend Chart -->
    <div class="chart-section">
        <div class="chart-header">
            <h2 class="chart-title">📊 Crime Trends & Forecast</h2>
            <div class="chart-controls">
                <select class="forecast-select" id="crimeTypeFilter" style="margin-right: 0.5rem;">
                    <option value="">All Crimes (Overall)</option>
                    <option value="ASSAULT">Assault</option>
                    <option value="CARNAPPING">Carnapping</option>
                    <option value="CYBER FRAUD">Cyber Fraud</option>
                    <option value="CYBERBULLYING">Cyberbullying</option>
                    <option value="HACKING">Hacking</option>
                    <option value="HOMICIDE">Homicide</option>
                    <option value="IDENTITY THEFT">Identity Theft</option>
                    <option value="ILLEGAL DRUGS">Illegal Drugs</option>
                    <option value="MURDER">Murder</option>
                    <option value="ONLINE SCAM">Online Scam</option>
                    <option value="PHISHING">Phishing</option>
                    <option value="PHYSICAL INJURY">Physical Injury</option>
                    <option value="ROBBERY">Robbery</option>
                    <option value="THEFT">Theft</option>
                    <option value="VANDALISM">Vandalism</option>
                </select>
                <select class="forecast-select" id="forecastHorizon">
                    <option value="6">6 Months Forecast</option>
                    <option value="12" selected>12 Months Forecast</option>
                    <option value="18">18 Months Forecast</option>
                    <option value="24">24 Months Forecast</option>
                </select>
                <button class="chart-btn" id="refreshForecast">🔄 Refresh Forecast</button>
            </div>
        </div>
        <div id="forecastInfoBox" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; color: #0c4a6e;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.25rem;">ℹ️</span>
                <strong>Forecast Information</strong>
            </div>
            <div id="forecastInfoText" style="font-size: 0.875rem; line-height: 1.5;"></div>
        </div>
        <div class="chart-canvas" id="trendChartContainer">
            <canvas id="trendChart"></canvas>
        </div>
        <div class="forecast-legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #1D3557;"></div>
                <span>Historical Data</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #e63946;"></div>
                <span>SARIMA Forecast</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: rgba(230, 57, 70, 0.2);"></div>
                <span>95% Confidence Interval</span>
            </div>
        </div>
    </div>

    <!-- Crime by Type & Location -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
        <div class="chart-section">
            <div class="chart-header">
                <h2 class="chart-title">Crime by Type</h2>
            </div>
            <div class="chart-canvas" style="height: 400px;">
                <canvas id="typeChart"></canvas>
            </div>
        </div>

        <div class="chart-section">
            <div class="chart-header">
                <h2 class="chart-title">Top Locations</h2>
            </div>
            <div class="chart-canvas" style="height: 400px;">
                <canvas id="locationChart"></canvas>
            </div>
        </div>
    </div>


    <!-- Data Export Section -->
    <div class="chart-section">
        <div class="chart-header">
            <h2 class="chart-title">Data Export</h2>
        </div>
        <p style="color: #6b7280; margin-bottom: 1rem;">Export crime data for external analysis or model training</p>
        <div class="export-section">
            <button class="chart-btn" onclick="exportCrimeData()">📥 Export Crime Data (CSV)</button>
            <button class="chart-btn" onclick="exportForecastData()">📥 Download Forecast Data (JSON)</button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
let trendChart, typeChart, locationChart;
let crimeStats = null;
let forecastData = null;
let currentFilter = { month: '', year: '' };

// Polyfill for requestIdleCallback (for older browsers)
window.requestIdleCallback = window.requestIdleCallback || function(cb) {
    const start = Date.now();
    return setTimeout(function() {
        cb({
            didTimeout: false,
            timeRemaining: function() {
                return Math.max(0, 50 - (Date.now() - start));
            }
        });
    }, 1);
};

// Initialize on page load - FAST FIRST PAINT
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded - Starting deferred initialization');
    
    // Immediate: Only populate filter dropdown (lightweight)
    populateYearFilter();
    
    // Immediate: Attach event listeners (lightweight)
    document.getElementById('forecastHorizon').addEventListener('change', loadForecast);
    document.getElementById('crimeTypeFilter').addEventListener('change', loadForecast);
    document.getElementById('refreshForecast').addEventListener('click', loadForecast);
    document.getElementById('applyFilter').addEventListener('click', applyFilter);
    document.getElementById('clearFilter').addEventListener('click', clearFilter);
    
    // DEFERRED: Heavy operations after first paint
    // Priority 1: Load crime stats (most important data)
    requestIdleCallback(() => {
        console.log('⏳ Loading crime statistics (deferred)');
        loadCrimeStats();
    }, { timeout: 100 });
    
    // Priority 2: Load forecast (secondary data)
    requestIdleCallback(() => {
        console.log('⏳ Loading forecast (deferred)');
        loadForecast();
    }, { timeout: 200 });
});

// Populate year filter dropdown with years from 2020 to current year
function populateYearFilter() {
    const select = document.getElementById('yearFilter');
    const startYear = 2020;
    const currentYear = new Date().getFullYear();
    
    // Generate year options from 2020 to current year
    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year.toString();
        select.appendChild(option);
    }
}

// Apply filter
function applyFilter() {
    const yearFilter = document.getElementById('yearFilter').value;
    const monthFilter = document.getElementById('monthFilter').value;
    const filterStatus = document.getElementById('filterStatus');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (yearFilter && monthFilter) {
        // Both year and month selected
        currentFilter.month = `${yearFilter}-${monthFilter}`;
        currentFilter.year = '';
        const monthName = monthNames[parseInt(monthFilter) - 1];
        filterStatus.innerHTML = `Showing: <strong>${monthName} ${yearFilter}</strong>`;
    } else if (yearFilter && !monthFilter) {
        // Only year selected
        currentFilter.month = '';
        currentFilter.year = yearFilter;
        filterStatus.innerHTML = `Showing: <strong>Year ${yearFilter}</strong>`;
    } else if (!yearFilter && monthFilter) {
        // Only month selected (all years for this month)
        currentFilter.month = '';
        currentFilter.year = '';
        const monthName = monthNames[parseInt(monthFilter) - 1];
        filterStatus.innerHTML = `Showing: <strong>${monthName} (All Years)</strong>`;
        alert('Please select a year to filter by month.');
        return;
    } else {
        // Neither selected
        currentFilter.month = '';
        currentFilter.year = '';
        filterStatus.innerHTML = 'Showing: <strong>All historical data</strong>';
    }
    
    // Reload data with filter
    loadCrimeStats();
}

// Clear filter
function clearFilter() {
    document.getElementById('yearFilter').value = '';
    document.getElementById('monthFilter').value = '';
    currentFilter.month = '';
    currentFilter.year = '';
    document.getElementById('filterStatus').innerHTML = 'Showing: <strong>All historical data</strong>';
    
    // Reload data without filter
    loadCrimeStats();
}

// Load crime statistics
async function loadCrimeStats() {
    console.log('Loading crime statistics...');
    showLoading('Loading crime statistics...');
    try {
        // Build URL with filter parameters
        let url = '/api/statistics/crime-stats';
        const params = new URLSearchParams();
        if (currentFilter.month) {
            params.append('month', currentFilter.month);
        } else if (currentFilter.year) {
            params.append('year', currentFilter.year);
        }
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        console.log('Crime stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Crime stats data:', data);
        
        if (data.status === 'success') {
            crimeStats = data.data;
            updateOverviewCards(data.data.overview);
            renderTypeChart(data.data.byType);
            renderLocationChart(data.data.byLocation);
            console.log('Crime statistics loaded successfully');
        } else {
            console.error('Crime stats API returned error:', data.message);
        }
    } catch (error) {
        console.error('Error loading crime stats:', error);
        alert('Failed to load crime statistics. Please ensure you are logged in and try again.');
    } finally {
        hideLoading();
    }
}

// Load forecast data
async function loadForecast() {
    const horizon = document.getElementById('forecastHorizon').value;
    const crimeType = document.getElementById('crimeTypeFilter').value;
    const forecastStatusEl = document.getElementById('forecastStatus');
    const forecastInfoBox = document.getElementById('forecastInfoBox');
    const forecastInfoText = document.getElementById('forecastInfoText');
    
    console.log(`🔮 Loading SARIMA forecast: ${crimeType || 'All Crimes'}, ${horizon} months...`);
    showLoading('Generating forecast...');
    
    // Show loading
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    const container = document.getElementById('trendChartContainer');
    container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div><canvas id="trendChart"></canvas>';
    
    try {
        // Update chart title based on selected crime type
        const chartTitle = document.querySelector('.chart-title');
        chartTitle.textContent = crimeType 
            ? `📊 ${crimeType.charAt(0) + crimeType.slice(1).toLowerCase()} - Trends & Forecast`
            : '📊 Crime Trends & Forecast';
        
        console.log('📡 Fetching from SARIMA API endpoint...');
        let url = `/api/statistics/forecast?horizon=${horizon}`;
        if (crimeType) {
            url += `&crime_type=${encodeURIComponent(crimeType)}`;
        }
        const response = await fetch(url);
        console.log('✅ Forecast response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Forecast data received:', data);
        
        if (data.status === 'success' && data.data && Array.isArray(data.data)) {
            forecastData = data.data;
            console.log(`✅ Successfully loaded ${forecastData.length} forecast points`);
            console.log(`📈 Rendering chart with ${crimeStats?.monthly?.length || 0} historical points and ${forecastData.length} forecast points`);
            
            // Remove loading overlay before rendering chart
            container.innerHTML = '<canvas id="trendChart"></canvas>';
            
            // Wait for DOM to update
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Use crime-specific historical data if available, otherwise use overall stats
            const historicalData = data.historical && data.historical.length > 0 
                ? data.historical 
                : (crimeStats?.monthly || []);
            
            console.log(`📈 Rendering chart with ${historicalData.length} historical points and ${forecastData.length} forecast points`);
            renderTrendChart(historicalData, data.data);
            
            // Update forecast status
            forecastStatusEl.textContent = '✓ Active';
            forecastStatusEl.style.color = '#059669';
            
            // Show forecast information
            forecastInfoBox.style.display = 'block';
            const firstDate = data.data[0]?.date?.substring(0, 7) || 'N/A';
            const lastDate = data.data[data.data.length - 1]?.date?.substring(0, 7) || 'N/A';
            const avgForecast = (data.data.reduce((sum, d) => sum + parseFloat(d.forecast || 0), 0) / data.data.length).toFixed(1);
            
            forecastInfoText.innerHTML = `
                <strong>Forecast Period:</strong> ${firstDate} to ${lastDate} (${horizon} months)<br>
                <strong>Scope:</strong> ${crimeType || 'City-wide (All Crimes)'}<br>
                <strong>Average Predicted:</strong> ${avgForecast} per month<br>
                <strong>Model:</strong> SARIMA(0,1,1)(0,1,1)[12] (Auto-optimized)<br>
                <strong>Last Updated:</strong> ${new Date().toLocaleString()}
            `;
            
            console.log('✅ SARIMA forecast loaded and displayed successfully');
        } else {
            throw new Error(data.message || 'Invalid forecast data structure');
        }
    } catch (error) {
        console.error('❌ Error loading SARIMA forecast:', error);
        forecastStatusEl.textContent = '✗ Offline';
        forecastStatusEl.style.color = '#dc2626';
        
        // Hide forecast info box
        forecastInfoBox.style.display = 'none';
        
        // Remove loading overlay
        container.innerHTML = '<canvas id="trendChart"></canvas>';
        
        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Render historical data only
        if (crimeStats && crimeStats.monthly && crimeStats.monthly.length > 0) {
            console.log('⚠️ Rendering historical data only (SARIMA API unavailable)');
            renderTrendChart(crimeStats.monthly, []);
        } else {
            // Show error message in chart area
            console.warn('❌ No historical data available to display');
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #9ca3af; text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <p style="font-size: 1.125rem; font-weight: 600; color: #4b5563; margin-bottom: 0.5rem;">No Data Available</p>
                    <p style="font-size: 0.875rem;">Please ensure crime reports exist in the database and the SARIMA API is running.</p>
                    <p style="font-size: 0.75rem; margin-top: 1rem; color: #6b7280;">SARIMA API should be running on <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px;">localhost:8001</code></p>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

// Update overview cards
function updateOverviewCards(overview) {
    document.getElementById('totalReports').textContent = overview.total.toLocaleString();
    document.getElementById('thisMonthReports').textContent = overview.thisMonth.toLocaleString();
    document.getElementById('lastMonthReports').textContent = overview.lastMonth.toLocaleString();
    
    const changeEl = document.getElementById('monthChange');
    const change = overview.percentChange;
    const arrow = change >= 0 ? '↑' : '↓';
    changeEl.textContent = `${arrow} ${Math.abs(change)}% from last month`;
    changeEl.className = `stat-change ${change >= 0 ? 'positive' : 'negative'}`;
}

// Render trend chart with forecast
function renderTrendChart(historical, forecast) {
    console.log(`📊 renderTrendChart: ${historical.length} historical + ${forecast.length} forecast points`);
    
    const ctx = document.getElementById('trendChart');
    
    if (!ctx) {
        console.error('❌ Chart canvas not found');
        return;
    }
    
    // Prepare historical data
    const historicalLabels = historical.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`);
    const historicalData = historical.map(d => parseInt(d.count) || 0);
    
    console.log('📊 Historical data sample:', historical.slice(0, 3));
    console.log('📊 Forecast data sample:', forecast.slice(0, 3));
    
    // Prepare forecast data
    const forecastLabels = forecast.map(d => d.date.substring(0, 7));
    const forecastValues = forecast.map(d => parseFloat(d.forecast) || 0);
    const lowerCI = forecast.map(d => parseFloat(d.lower_ci) || 0);
    const upperCI = forecast.map(d => parseFloat(d.upper_ci) || 0);
    
    console.log('📅 Historical period:', historicalLabels.length > 0 ? `${historicalLabels[0]} to ${historicalLabels[historicalLabels.length - 1]}` : 'None');
    console.log('🔮 Forecast period:', forecastLabels.length > 0 ? `${forecastLabels[0]} to ${forecastLabels[forecastLabels.length - 1]}` : 'None');
    console.log('📈 Historical values:', historicalData.slice(0, 5));
    console.log('🔮 Forecast values:', forecastValues.slice(0, 5));
    
    // Combine labels
    const allLabels = [...historicalLabels, ...forecastLabels];
    
    // Historical dataset (ends where forecast begins)
    const historicalDataset = [...historicalData, ...Array(forecastLabels.length).fill(null)];
    
    // Forecast dataset (starts where historical ends)
    const forecastDataset = [...Array(historicalLabels.length).fill(null), ...forecastValues];
    
    // Connect the gap between historical and forecast
    if (historicalData.length > 0 && forecastValues.length > 0) {
        // Connect last historical point to first forecast point
        forecastDataset[historicalLabels.length - 1] = historicalData[historicalData.length - 1];
    }
    
    console.log('🔗 Connection point:', historicalData.length > 0 ? historicalData[historicalData.length - 1] : 'No historical data');
    
    // Calculate max value for proper Y-axis scaling
    const allValues = [...historicalData.filter(v => v !== null && !isNaN(v)), ...forecastValues.filter(v => v !== null && !isNaN(v))];
    const maxValue = Math.max(...allValues, 0);
    const suggestedMax = Math.ceil(maxValue * 1.3); // Add 30% padding
    
    console.log('📊 Max value in data:', maxValue);
    console.log('📊 Suggested Y-axis max:', suggestedMax);
    console.log('📊 All values sample:', allValues.slice(0, 10));
    
    // Destroy existing chart
    if (trendChart) {
        trendChart.destroy();
    }
    
    console.log('🎨 Creating SARIMA forecast chart...');
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Historical Crime Data',
                    data: historicalDataset,
                    borderColor: '#1D3557',
                    backgroundColor: 'rgba(29, 53, 87, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y',
                    pointRadius: 3,
                    pointHoverRadius: 6
                },
                {
                    label: 'SARIMA Forecast',
                    data: forecastDataset,
                    borderColor: '#e63946',
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    borderWidth: 3,
                    borderDash: [8, 4],
                    tension: 0.4,
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointStyle: 'circle'
                },
                {
                    label: '95% Upper Confidence',
                    data: [...Array(historicalLabels.length).fill(null), ...upperCI],
                    borderColor: 'rgba(230, 57, 70, 0.3)',
                    backgroundColor: 'rgba(230, 57, 70, 0.15)',
                    borderWidth: 1,
                    fill: '+1',
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: '95% Lower Confidence',
                    data: [...Array(historicalLabels.length).fill(null), ...lowerCI],
                    borderColor: 'rgba(230, 57, 70, 0.3)',
                    backgroundColor: 'rgba(230, 57, 70, 0.15)',
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        filter: function(item) {
                            // Hide confidence interval labels from legend
                            return !item.text.includes('Confidence');
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(context) {
                            return 'Period: ' + context[0].label;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += Math.round(context.parsed.y) + ' crimes';
                            }
                            return label;
                        },
                        afterBody: function(context) {
                            // Only show breakdown for "All Crimes" forecast points
                            const crimeTypeFilter = document.getElementById('crimeTypeFilter').value;
                            if (crimeTypeFilter) return []; // Don't show if already filtered by type

                            const dataPoint = context[0]; // Active point
                            
                            // Check if hovering over forecast dataset (Dataset index 1 usually, but let's check label or index)
                            // Index 0: Historical, 1: Forecast, 2/3: CI
                            if (dataPoint.datasetIndex !== 1) return [];

                            const totalForecast = dataPoint.parsed.y;
                            if (!totalForecast || !crimeStats || !crimeStats.byType) return [];

                            // Calculate total historical crimes from the distribution to get ratios
                            // Note: We use the CURRENTLY LOADED historical distribution as a proxy for future distribution
                            const totalHistorical = crimeStats.byType.reduce((sum, item) => sum + parseInt(item.count), 0);
                            
                            if (totalHistorical === 0) return [];

                            // Calculate estimates
                            const estimates = crimeStats.byType.map(item => {
                                const ratio = parseInt(item.count) / totalHistorical;
                                const estimatedCount = Math.round(totalForecast * ratio);
                                return {
                                    type: item.type,
                                    count: estimatedCount
                                };
                            });

                            // Sort by count desc and take top 5
                            estimates.sort((a, b) => b.count - a.count);
                            const topEstimates = estimates.slice(0, 5);
                            
                            const lines = [' ', 'Estimated Breakdown:']; // Spacer + Header
                            topEstimates.forEach(est => {
                                if (est.count > 0) {
                                    lines.push(`• ${est.type}: ~${est.count}`);
                                }
                            });
                            
                            if (estimates.length > 5) {
                                lines.push(`• Others: ~${Math.round(totalForecast - topEstimates.reduce((s, i) => s + i.count, 0))}`);
                            }

                            return lines;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: suggestedMax,  // Force max instead of suggest
                    title: {
                        display: true,
                        text: '📊 Number of Crimes',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '📅 Time Period (Year-Month)',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    console.log('✅ SARIMA forecast chart rendered successfully!');
}

// Render crime by type chart
function renderTypeChart(data) {
    const ctx = document.getElementById('typeChart');
    
    if (!ctx) {
        console.error('Type chart canvas not found');
        return;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('No crime type data to display');
        return;
    }
    
    if (typeChart) typeChart.destroy();
    
    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.type || 'Unknown'),
            datasets: [{
                data: data.map(d => parseInt(d.count) || 0),
                backgroundColor: [
                    '#1D3557',
                    '#457B9D',
                    '#A8DADC',
                    '#F77F00',
                    '#E63946',
                    '#06D6A0',
                    '#8338EC'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Render top locations chart
function renderLocationChart(data) {
    const ctx = document.getElementById('locationChart');
    
    if (!ctx) {
        console.error('Location chart canvas not found');
        return;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('No location data to display');
        return;
    }
    
    if (locationChart) locationChart.destroy();
    
    locationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.location || 'Unknown'),
            datasets: [{
                label: 'Reports',
                data: data.map(d => parseInt(d.count) || 0),
                backgroundColor: '#1D3557'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Export crime data
function exportCrimeData() {
    showLoading('Exporting crime data...');
    try {
        const yearFilter = document.getElementById('yearFilter')?.value || '';
        const monthFilter = document.getElementById('monthFilter')?.value || '';
        const crimeType = document.getElementById('crimeTypeFilter')?.value || '';
        
        let url = '/api/statistics/export-crime-data';
        const params = [];
        
        if (yearFilter) params.push(`year=${yearFilter}`);
        if (monthFilter) params.push(`month=${monthFilter}`);
        if (crimeType) params.push(`crime_type=${encodeURIComponent(crimeType)}`);
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        console.log('📥 Exporting crime data:', { year: yearFilter, month: monthFilter, crimeType });
        window.location.href = url;
    } finally {
        hideLoading();
    }
}

// Export forecast data
function exportForecastData() {
    showLoading('Preparing forecast data for download...');
    try {
        if (!forecastData || forecastData.length === 0) {
            alert('⚠️ No forecast data available. Please load a forecast first by selecting a crime type and clicking "Refresh Forecast".');
            return;
        }
        
        const horizon = document.getElementById('forecastHorizon')?.value || '12';
        const crimeType = document.getElementById('crimeTypeFilter')?.value || '';
        
        const exportData = {
            metadata: {
                crime_type: crimeType || 'All Crimes',
                forecast_horizon: `${horizon} months`,
                model: 'SARIMA(1,1,1)(1,1,1)[12]',
                forecast_period: `${forecastData[0]?.date} to ${forecastData[forecastData.length - 1]?.date}`,
                exported_at: new Date().toISOString(),
                total_forecast_points: forecastData.length
            },
            forecast: forecastData
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const crimeTypeName = crimeType ? crimeType.toLowerCase().replace(/ /g, '_') : 'all_crimes';
        link.download = `forecast_${crimeTypeName}_${horizon}months_${new Date().toISOString().split('T')[0]}.json`;
        
        link.click();
        URL.revokeObjectURL(url);
        
        console.log('📥 Exported forecast data:', link.download);
    } finally {
        hideLoading();
    }
}

// Load barangay crime statistics
async function loadBarangayStats() {
    console.log('Loading barangay statistics...');
    showLoading('Loading barangay statistics...');
    try {
        // Build URL with filter parameters
        let url = '/api/statistics/barangay-stats';
        const params = new URLSearchParams();
        if (currentFilter.month) {
            params.append('month', currentFilter.month);
        } else if (currentFilter.year) {
            params.append('year', currentFilter.year);
        }
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        console.log('Barangay stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Barangay stats data:', result);
        
        if (result.status === 'success') {
            displayTopBarangays(result.data.slice(0, 15));
            console.log('Barangay statistics loaded successfully');
        } else {
            console.error('Barangay stats API returned error:', result.message);
        }
    } catch (error) {
        console.error('Error loading barangay statistics:', error);
    } finally {
        hideLoading();
    }
}

// Display top barangays with hover tooltip showing crime breakdown
function displayTopBarangays(topBarangays) {
    const container = document.getElementById('topBarangays');
    container.innerHTML = '';
    
    topBarangays.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 1rem; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); border-radius: 8px; border-left: 4px solid ' + getRankColor(index) + '; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; position: relative; cursor: pointer;';
        div.onmouseenter = function() { 
            this.style.transform = 'translateY(-2px)'; 
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            const tooltip = this.querySelector('.crime-tooltip');
            if (tooltip) tooltip.style.display = 'block';
        };
        div.onmouseleave = function() { 
            this.style.transform = 'translateY(0)'; 
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            const tooltip = this.querySelector('.crime-tooltip');
            if (tooltip) tooltip.style.display = 'none';
        };
        
        // Build crime breakdown tooltip content
        let tooltipContent = '';
        if (item.crime_breakdown && item.crime_breakdown.length > 0) {
            tooltipContent = item.crime_breakdown.map(crime => 
                `<div style="display: flex; justify-content: space-between; gap: 1rem; padding: 0.25rem 0;">
                    <span style="color: #374151;">${crime.type}</span>
                    <span style="font-weight: 600; color: ${getRankColor(index)};">${crime.count}</span>
                </div>`
            ).join('');
        } else {
            tooltipContent = '<span style="color: #6b7280; font-style: italic;">No breakdown available</span>';
        }
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 0.75rem; color: #6b7280; font-weight: 600; margin-bottom: 0.25rem;">#${index + 1}</div>
                    <div style="font-weight: 600; font-size: 0.875rem; color: #1f2937; line-height: 1.2;">${item.barangay}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: ${getRankColor(index)};">${item.total_crimes}</div>
                    <div style="font-size: 0.65rem; color: #6b7280; text-transform: uppercase;">crimes</div>
                </div>
            </div>
            <div class="crime-tooltip" style="display: none; position: absolute; bottom: 100%; left: 0; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; margin-bottom: 0.5rem;">
                <div style="font-weight: 600; font-size: 0.75rem; color: #1D3557; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Top Crime Types</div>
                ${tooltipContent}
            </div>
        `;
        container.appendChild(div);
    });
}

// Get color based on rank
function getRankColor(index) {
    if (index === 0) return '#dc2626'; // Red for #1
    if (index === 1) return '#ea580c'; // Orange-red for #2
    if (index === 2) return '#f59e0b'; // Orange for #3
    if (index < 5) return '#3b82f6'; // Blue for top 5
    return '#6b7280'; // Gray for others
}

// Export crime data (CSV) - respects current filters
function exportCrimeData() {
    const yearFilter = document.getElementById('yearFilter')?.value || '';
    const monthFilter = document.getElementById('monthFilter')?.value || '';
    const crimeType = document.getElementById('crimeTypeFilter')?.value || '';
    
    let url = '/api/statistics/export-crime-data';
    const params = [];
    
    if (yearFilter) params.push(`year=${yearFilter}`);
    if (monthFilter) params.push(`month=${monthFilter}`);
    if (crimeType) params.push(`crime_type=${encodeURIComponent(crimeType)}`);
    
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    console.log('📥 Exporting crime data:', { year: yearFilter, month: monthFilter, crimeType });
    window.location.href = url;
}

// Export forecast data (JSON) - includes current forecast
function exportForecastData() {
    if (!forecastData || forecastData.length === 0) {
        alert('⚠️ No forecast data available. Please load a forecast first by selecting a crime type and clicking "Refresh Forecast".');
        return;
    }
    
    const horizon = document.getElementById('forecastHorizon')?.value || '12';
    const crimeType = document.getElementById('crimeTypeFilter')?.value || '';
    
    const exportData = {
        metadata: {
            crime_type: crimeType || 'All Crimes',
            forecast_horizon: `${horizon} months`,
            model: 'SARIMA(1,1,1)(1,1,1)[12]',
            forecast_period: `${forecastData[0]?.date} to ${forecastData[forecastData.length - 1]?.date}`,
            exported_at: new Date().toISOString(),
            total_forecast_points: forecastData.length
        },
        forecast: forecastData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const crimeTypeName = crimeType ? crimeType.toLowerCase().replace(/ /g, '_') : 'all_crimes';
    link.download = `forecast_${crimeTypeName}_${horizon}months_${new Date().toISOString().split('T')[0]}.json`;
    
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 Exported forecast data:', link.download);
}

</script>
@endsection
