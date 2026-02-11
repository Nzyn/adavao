@extends('layouts.app')

@section('title', 'Crime Hotspot Map')

@section('styles')
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />

<style>
    .hotspot-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 2rem;
    }
    
    .hotspot-header {
        padding: 2rem;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .hotspot-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .hotspot-subtitle {
        font-size: 0.95rem;
        opacity: 0.95;
        margin: 0.5rem 0 0 0;
        font-weight: 400;
    }
    
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 2rem;
    }
    
    .map-controls {
        display: flex;
        gap: 0.75rem;
    }
    
    .control-btn {
        padding: 0.6rem 1.25rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.15);
        color: white;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    }
    
    .control-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.5);
    }
    
    .control-btn.active {
        background: rgba(255, 255, 255, 0.3);
        border-color: white;
    }
    
    #map {
        height: 650px;
        width: 100%;
        z-index: 1;
        position: relative;
    }
    
    /* Weather-Forecast Style Hotspot Circles with Pulsing Animation */
    .hotspot-circle {
        transition: all 0.3s ease;
        position: relative;
    }
    
    /* High Risk - Pulsing Red with Urgency */
    .hotspot-circle-high {
        background: radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.9), rgba(220, 38, 38, 0.3));
        box-shadow: 
            0 0 30px rgba(220, 38, 38, 0.6),
            0 0 60px rgba(220, 38, 38, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.2);
        animation: pulseDanger 2s ease-in-out infinite;
        border: 2px solid rgba(220, 38, 38, 0.8);
    }
    
    .hotspot-circle-high::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(220, 38, 38, 0.3), transparent);
        animation: ripple 3s ease-out infinite;
        pointer-events: none;
    }
    
    /* Medium Risk - Pulsing Orange/Amber */
    .hotspot-circle-medium {
        background: radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.85), rgba(245, 158, 11, 0.25));
        box-shadow: 
            0 0 25px rgba(245, 158, 11, 0.5),
            0 0 50px rgba(245, 158, 11, 0.3),
            inset 0 0 15px rgba(255, 255, 255, 0.15);
        animation: pulseWarning 2.5s ease-in-out infinite;
        border: 2px solid rgba(245, 158, 11, 0.7);
    }
    
    .hotspot-circle-medium::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.25), transparent);
        animation: ripple 3.5s ease-out infinite;
        pointer-events: none;
    }
    
    /* Low Risk - Subtle Green Glow */
    .hotspot-circle-low {
        background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.75), rgba(16, 185, 129, 0.2));
        box-shadow: 
            0 0 20px rgba(16, 185, 129, 0.4),
            0 0 40px rgba(16, 185, 129, 0.2),
            inset 0 0 10px rgba(255, 255, 255, 0.1);
        animation: pulseSafe 3s ease-in-out infinite;
        border: 2px solid rgba(16, 185, 129, 0.6);
    }
    
    .hotspot-circle-low::before {
        content: '';
        position: absolute;
        top: -6px;
        left: -6px;
        right: -6px;
        bottom: -6px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.2), transparent);
        animation: ripple 4s ease-out infinite;
        pointer-events: none;
    }
    
    /* Pulsing Animations */
    @keyframes pulseDanger {
        0%, 100% {
            transform: scale(1);
            opacity: 0.9;
        }
        50% {
            transform: scale(1.08);
            opacity: 1;
        }
    }
    
    @keyframes pulseWarning {
        0%, 100% {
            transform: scale(1);
            opacity: 0.85;
        }
        50% {
            transform: scale(1.05);
            opacity: 1;
        }
    }
    
    @keyframes pulseSafe {
        0%, 100% {
            transform: scale(1);
            opacity: 0.75;
        }
        50% {
            transform: scale(1.03);
            opacity: 0.9;
        }
    }
    
    /* Ripple Effect for Urgency */
    @keyframes ripple {
        0% {
            transform: scale(0.8);
            opacity: 0.8;
        }
        100% {
            transform: scale(1.5);
            opacity: 0;
        }
    }
    
    /* Map Legend Overlay */
    .leaflet-control-legend {
        background: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        min-width: 200px;
    }
    
    .legend-control-title {
        font-size: 14px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 10px;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
    }
    
    .legend-control-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 8px 0;
        font-size: 13px;
        color: #374151;
    }
    
    .legend-control-color {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
    }
    
    .legend-control-color.high {
        background-color: #dc2626;
    }
    
    .legend-control-color.medium {
        background-color: #f59e0b;
    }
    
    .legend-control-color.low {
        background-color: #10b981;
    }
    
    .legend-control-label {
        flex: 1;
    }
    
    .legend-control-label strong {
        font-weight: 600;
        display: block;
        margin-bottom: 2px;
    }
    
    .legend-control-label small {
        font-size: 11px;
        color: #6b7280;
    }
    
    .hotspot-legend {
        padding: 2rem;
        background: white;
        border-top: 2px solid #e5e7eb;
    }
    
    .legend-section {
        margin-bottom: 2rem;
    }
    
    .legend-section:last-child {
        margin-bottom: 0;
    }
    
    .legend-title {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .legend-title svg {
        width: 20px;
        height: 20px;
    }
    
    .legend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.875rem;
        color: #374151;
    }
    
    .legend-marker {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        flex-shrink: 0;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
    }
    
    .legend-marker.high {
        background-color: #dc2626;
    }
    
    .legend-marker.medium {
        background-color: #f59e0b;
    }
    
    .legend-marker.low {
        background-color: #10b981;
    }
    
    .stats-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #e5e7eb;
    }
    
    .stat-card.high {
        border-left-color: #dc2626;
    }
    
    .stat-card.medium {
        border-left-color: #f59e0b;
    }
    
    .stat-card.low {
        border-left-color: #10b981;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
    }
    
    .stat-value {
        font-size: 2.25rem;
        font-weight: 700;
        color: #1f2937;
    }
    
    .stat-subtext {
        font-size: 0.8rem;
        color: #9ca3af;
        margin-top: 0.5rem;
    }
    
    /* Popup Styling */
    .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 0;
    }
    
    .popup-content {
        padding: 1rem;
        font-size: 0.875rem;
    }
    
    .popup-header {
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.75rem;
        font-size: 1rem;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 0.75rem;
    }
    
    .popup-stat {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        color: #374151;
    }
    
    .popup-stat-label {
        font-weight: 500;
        color: #6b7280;
    }
    
    .popup-stat-value {
        font-weight: 600;
        color: #1f2937;
    }
    
    .crime-rate {
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .crime-rate.high {
        color: #dc2626;
    }
    
    .crime-rate.medium {
        color: #f59e0b;
    }
    
    .crime-rate.low {
        color: #10b981;
    }
    
    .layer-control {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .layer-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
    }
    
    .layer-btn:hover {
        background: #f3f4f6;
        border-color: #667eea;
    }
    
    .layer-btn.active {
        background: #667eea;
        border-color: #667eea;
        color: white;
    }
    
    .comparison-container {
        margin-top: 2rem;
    }
    
    .top-hotspots {
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 2rem;
    }
    
    .hotspots-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1.5rem;
    }
    
    .hotspot-list {
        display: grid;
        gap: 1rem;
    }
    
    .hotspot-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #e5e7eb;
        transition: all 0.2s;
    }
    
    .hotspot-item:hover {
        background: #f3f4f6;
        transform: translateX(4px);
    }
    
    .hotspot-item.high {
        border-left-color: #dc2626;
    }
    
    .hotspot-item.medium {
        border-left-color: #f59e0b;
    }
    
    .hotspot-item.low {
        border-left-color: #10b981;
    }
    
    .hotspot-item-name {
        font-weight: 600;
        color: #1f2937;
    }
    
    .hotspot-item-details {
        display: flex;
        gap: 2rem;
        align-items: center;
    }
    
    .detail-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .detail-label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
        font-weight: 600;
    }
    
    .detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }
    
    .crime-rate-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.875rem;
        color: white;
    }
    
    .crime-rate-badge.high {
        background-color: #dc2626;
    }
    
    .crime-rate-badge.medium {
        background-color: #f59e0b;
    }
    
    .crime-rate-badge.low {
        background-color: #10b981;
    }
    
    .loading-spinner {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
    }
    
    .loading-spinner svg {
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
        #map {
            height: 400px;
        }
        
        .hotspot-header {
            padding: 1.5rem;
        }
        
        .header-content {
            flex-direction: column;
            gap: 1rem;
        }
        
        .hotspot-item-details {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
        }
        
        .map-controls {
            width: 100%;
        }
        
        .control-btn {
            flex: 1;
            justify-content: center;
        }
    }
</style>
@endsection

@section('content')
<div class="hotspot-container">
    <div class="hotspot-header">
        <div class="header-content">
            <div>
                <h1 class="hotspot-title">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                    </svg>
                    Crime Hotspot Analysis
                </h1>
                <p class="hotspot-subtitle">Crime rate visualization based on incident density and population</p>
            </div>
            <div class="map-controls">
                <button class="control-btn active" id="map-view-btn" onclick="switchToMapView()">
                    <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Map
                </button>
                <button class="control-btn" id="satellite-view-btn" onclick="switchToSatelliteView()">
                    <svg style="width: 14px; height: 14px; fill: currentColor;" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Satellite
                </button>
            </div>
        </div>
    </div>
    
    <!-- Stats Cards -->
    <div style="padding: 2rem; background: #f8fafc; border-bottom: 1px solid #e5e7eb;">
        <div class="stats-container">
            <div class="stat-card high">
                <div class="stat-label">High Crime Rate Barangays</div>
                <div class="stat-value" id="stat-high">0</div>
                <div class="stat-subtext">&gt; 8 per 1,000 people</div>
            </div>
            <div class="stat-card medium">
                <div class="stat-label">Medium Crime Rate Barangays</div>
                <div class="stat-value" id="stat-medium">0</div>
                <div class="stat-subtext">4-7 per 1,000 people</div>
            </div>
            <div class="stat-card low">
                <div class="stat-label">Low Crime Rate Barangays</div>
                <div class="stat-value" id="stat-low">0</div>
                <div class="stat-subtext">&lt; 4 per 1,000 people</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Crime Rate</div>
                <div class="stat-value" id="stat-average">0</div>
                <div class="stat-subtext">per 1,000 people</div>
            </div>
        </div>
    </div>
    
    <!-- Map -->
    <div id="map"></div>
    
    <!-- Legend -->
    <div class="hotspot-legend">
        <div class="legend-section">
            <div class="legend-title">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                </svg>
                Crime Rate Classification
            </div>
            <div class="legend-grid">
                <div class="legend-item">
                    <div class="legend-marker high"></div>
                    <span><strong>High Risk:</strong> &gt; 8 crimes per 1,000 people</span>
                </div>
                <div class="legend-item">
                    <div class="legend-marker medium"></div>
                    <span><strong>Medium Risk:</strong> 4-7 crimes per 1,000 people</span>
                </div>
                <div class="legend-item">
                    <div class="legend-marker low"></div>
                    <span><strong>Low Risk:</strong> &lt; 4 crimes per 1,000 people</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Top Hotspots Table -->
<div class="comparison-container">
    <div class="top-hotspots">
        <h3 class="hotspots-title">
            <svg style="width: 20px; height: 20px; fill: currentColor; display: inline-block; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.58 4.58L10 10.58 3.29 17.29 4.7 18.7l6.71-6.71 3.71 3.71 6.59-6.59L22 12v-6z"/>
            </svg>
            Crime Hotspots Ranking
        </h3>
        <div class="hotspot-list" id="hotspot-list">
            <div class="loading-spinner">
                <svg fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                Loading hotspot data...
            </div>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<!-- Leaflet JavaScript -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>

<script>
    // Global variables
    let map;
    let markers = [];
    let allHotspots = [];
    let streetLayer, satelliteLayer;
    
    // Davao City bounds
    const davaoCityBounds = [
        [6.9, 125.2],
        [7.5, 125.7]
    ];
    
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            // Initialize map
            map = L.map('map', {
                maxBounds: davaoCityBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 11,
                maxZoom: 18
            }).setView([7.1907, 125.4553], 13);
            
            // Add Street Map layer
            streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(map);
            
            // Add Satellite layer
            satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 18,
            });
            
            // Add Crime Intensity Legend
            const legend = L.control({ position: 'topright' });
            
            legend.onAdd = function(map) {
                const div = L.DomUtil.create('div', 'leaflet-control-legend');
                div.innerHTML = `
                    <div class="legend-control-title">Crime Intensity</div>
                    <div class="legend-control-item">
                        <div class="legend-control-color high"></div>
                        <div class="legend-control-label">
                            <strong>High</strong>
                            <small>&gt; 8 per 1K</small>
                        </div>
                    </div>
                    <div class="legend-control-item">
                        <div class="legend-control-color medium"></div>
                        <div class="legend-control-label">
                            <strong>Medium</strong>
                            <small>4 - 7 per 1K</small>
                        </div>
                    </div>
                    <div class="legend-control-item">
                        <div class="legend-control-color low"></div>
                        <div class="legend-control-label">
                            <strong>Low</strong>
                            <small>&lt; 4 per 1K</small>
                        </div>
                    </div>
                `;
                return div;
            };
            
            legend.addTo(map);
            
            // Load hotspot data
            loadHotspotData();
        }, 100);
    });
    
    function loadHotspotData() {
        const url = '{{ route("api.hotspot-data") }}';
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log('Hotspot data loaded:', data);
                allHotspots = data.barangays || [];
                updateMapMarkers(allHotspots);
                updateStats(allHotspots);
                updateHotspotsList(allHotspots);
            })
            .catch(error => {
                console.error('Error loading hotspot data:', error);
                document.getElementById('hotspot-list').innerHTML = '<div style="color: #dc2626; padding: 1rem;">Error loading data</div>';
            });
    }
    
    function getCrimeRateLevel(rate) {
        if (rate > 8) return 'high';
        if (rate >= 4) return 'medium';
        return 'low';
    }
    
    function updateMapMarkers(hotspots) {
        // Clear existing markers
        markers.forEach(marker => {
            map.removeLayer(marker);
        });
        markers = [];
        
        hotspots.forEach(barangay => {
            const level = getCrimeRateLevel(barangay.crime_rate);
            
            // Determine marker color based on crime rate level
            const colors = {
                high: { main: '#dc2626', light: '#fca5a5', pulse: '#fee2e2' },
                medium: { main: '#f59e0b', light: '#fed7aa', pulse: '#fef3c7' },
                low: { main: '#10b981', light: '#a7f3d0', pulse: '#dcfce7' }
            };
            
            // Urgency indicators with animations
            const urgencyIcons = {
                high: '⚠️',
                medium: '⚡',
                low: '✓'
            };
            
            // Weather-forecast style icon with gradient and pulsing effect
            const icon = L.divIcon({
                className: 'custom-hotspot-marker',
                html: `<div style="
                    background: radial-gradient(circle at 30% 30%, ${colors[level].light}, ${colors[level].main});
                    width: 46px; 
                    height: 46px; 
                    border-radius: 50%; 
                    border: 3px solid white; 
                    box-shadow: 
                        0 4px 12px rgba(0,0,0,0.3), 
                        0 0 25px ${colors[level].main}99,
                        0 0 40px ${colors[level].main}66;
                    display: flex; 
                    flex-direction: column;
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    color: white; 
                    font-size: 11px;
                    transition: all 0.3s ease;
                    animation: ${level === 'high' ? 'pulseDanger 2s ease-in-out infinite' : level === 'medium' ? 'pulseWarning 2.5s ease-in-out infinite' : 'pulseSafe 3s ease-in-out infinite'};
                    position: relative;
                    overflow: visible;
                ">
                    <div style="font-size: 16px; line-height: 1; margin-bottom: 2px;">${urgencyIcons[level]}</div>
                    <div style="font-size: 12px; font-weight: 800; line-height: 1;">${barangay.crime_rate.toFixed(1)}</div>
                </div>`,
                iconSize: [46, 46],
                iconAnchor: [23, 23],
                popupAnchor: [0, -23],
                className: `hotspot-marker-${level}`
            });
            
            // Risk level badge with enhanced urgency styling
            const riskBadgeColors = {
                high: { 
                    bg: '#fee2e2', 
                    text: '#991b1b', 
                    label: '🔴 CRITICAL RISK',
                    urgency: 'IMMEDIATE ATTENTION REQUIRED'
                },
                medium: { 
                    bg: '#fef3c7', 
                    text: '#92400e', 
                    label: '🟠 HIGH ALERT',
                    urgency: 'ELEVATED MONITORING NEEDED'
                },
                low: { 
                    bg: '#dcfce7', 
                    text: '#166534', 
                    label: '🟢 MODERATE',
                    urgency: 'ROUTINE SURVEILLANCE'
                }
            };
            
            const badge = riskBadgeColors[level];
            
            const popupContent = `
                <div class="popup-content" style="min-width: 280px;">
                    <div class="popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-weight: 700; font-size: 1.1rem;">${barangay.name}</span>
                        <span style="
                            background: linear-gradient(135deg, ${badge.bg}, ${colors[level].light}); 
                            color: ${badge.text}; 
                            padding: 4px 10px; 
                            border-radius: 12px; 
                            font-size: 0.7rem; 
                            font-weight: 800; 
                            white-space: nowrap; 
                            margin-left: 8px;
                            border: 2px solid ${colors[level].main};
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        ">${badge.label}</span>
                    </div>
                    <div style="
                        background: ${level === 'high' ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : level === 'medium' ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #dcfce7, #bbf7d0)'};
                        padding: 0.5rem 0.75rem;
                        border-radius: 8px;
                        font-size: 0.7rem;
                        font-weight: 600;
                        color: ${badge.text};
                        text-align: center;
                        margin-bottom: 0.75rem;
                        border: 2px solid ${colors[level].main}40;
                        letter-spacing: 0.5px;
                    ">
                        ${badge.urgency}
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 0.75rem;">
                        <div class="popup-stat" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">
                            <span class="popup-stat-label" style="color: #6b7280; font-size: 0.85rem;">📊 Total Incidents:</span>
                            <span class="popup-stat-value" style="font-weight: 700; color: ${colors[level].main}; font-size: 0.9rem;">${barangay.incidents}</span>
                        </div>
                        <div class="popup-stat" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6;">
                            <span class="popup-stat-label" style="color: #6b7280; font-size: 0.85rem;">👥 Population:</span>
                            <span class="popup-stat-value" style="font-weight: 700; color: #1f2937; font-size: 0.9rem;">${barangay.population.toLocaleString()}</span>
                        </div>
                        <div style="background: linear-gradient(135deg, ${badge.bg}, ${colors[level].pulse}); border-left: 4px solid ${colors[level].main}; padding: 0.75rem; border-radius: 6px; margin-top: 0.75rem; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
                            <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem; font-weight: 500;">Crime Rate per 1,000 residents</div>
                            <div style="font-size: 1.75rem; font-weight: 800; color: ${colors[level].main}; line-height: 1; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${barangay.crime_rate.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
            
            const marker = L.marker([barangay.latitude, barangay.longitude], { icon: icon })
                .addTo(map)
                .bindPopup(popupContent, { maxWidth: 300 });
            
            // Enhanced tooltip with emoji and status
            const tooltipText = `
                <div style="text-align: center; font-weight: 600;">
                    ${barangay.name}
                    <br>
                    <span style="color: ${colors[level].main}; font-size: 1.2em;">●</span>
                    ${barangay.crime_rate.toFixed(2)} per 1K
                </div>
            `;
            marker.bindTooltip(tooltipText, {
                permanent: false,
                direction: 'top',
                offset: [0, -28],
                className: `leaflet-tooltip-${level}`
            });
            
            markers.push(marker);
        });
        
        // Fit bounds
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1), {
                maxZoom: 13
            });
        }
    }
    
    function updateStats(hotspots) {
        let high = 0, medium = 0, low = 0;
        let totalRate = 0;
        
        hotspots.forEach(b => {
            const level = getCrimeRateLevel(b.crime_rate);
            if (level === 'high') high++;
            else if (level === 'medium') medium++;
            else low++;
            
            totalRate += b.crime_rate;
        });
        
        const avgRate = hotspots.length > 0 ? (totalRate / hotspots.length).toFixed(2) : 0;
        
        document.getElementById('stat-high').textContent = high;
        document.getElementById('stat-medium').textContent = medium;
        document.getElementById('stat-low').textContent = low;
        document.getElementById('stat-average').textContent = avgRate;
    }
    
    function updateHotspotsList(hotspots) {
        const listContainer = document.getElementById('hotspot-list');
        
        if (!hotspots || hotspots.length === 0) {
            listContainer.innerHTML = '<div style="color: #6b7280; padding: 1rem;">No data available</div>';
            return;
        }
        
        // Sort by crime rate descending (top hotspots first)
        const sorted = [...hotspots].sort((a, b) => b.crime_rate - a.crime_rate);
        
        const html = sorted.map((barangay, index) => {
            const level = getCrimeRateLevel(barangay.crime_rate);
            const levelLabel = level === 'high' ? 'HIGH RISK' : level === 'medium' ? 'MEDIUM RISK' : 'LOW RISK';
            
            return `
                <div class="hotspot-item ${level}">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="font-size: 1.25rem; font-weight: 700; color: #9ca3af; min-width: 30px;">#${index + 1}</div>
                        <div class="hotspot-item-name">${barangay.name}</div>
                    </div>
                    <div class="hotspot-item-details">
                        <div class="detail-group">
                            <span class="detail-label">Incidents</span>
                            <span class="detail-value">${barangay.incidents}</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Population</span>
                            <span class="detail-value">${(barangay.population / 1000).toFixed(1)}K</span>
                        </div>
                        <div class="detail-group">
                            <span class="detail-label">Rate</span>
                            <span class="detail-value">${barangay.crime_rate.toFixed(2)}/1K</span>
                        </div>
                        <span class="crime-rate-badge ${level}">${levelLabel}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        listContainer.innerHTML = html;
    }
    
    function switchToMapView() {
        if (map.hasLayer(satelliteLayer)) {
            map.removeLayer(satelliteLayer);
        }
        if (!map.hasLayer(streetLayer)) {
            map.addLayer(streetLayer);
        }
        document.getElementById('map-view-btn').classList.add('active');
        document.getElementById('satellite-view-btn').classList.remove('active');
    }
    
    function switchToSatelliteView() {
        if (map.hasLayer(streetLayer)) {
            map.removeLayer(streetLayer);
        }
        if (!map.hasLayer(satelliteLayer)) {
            map.addLayer(satelliteLayer);
        }
        document.getElementById('satellite-view-btn').classList.add('active');
        document.getElementById('map-view-btn').classList.remove('active');
    }
</script>
@endsection
