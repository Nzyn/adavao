@extends('layouts.app')

@section('title', 'View Map')

@section('styles')
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<!-- Leaflet MarkerCluster CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

<style>
    .map-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin-bottom: 2rem;
    }
    
    .map-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .map-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }
    
    .map-controls {
        display: flex;
        gap: 0.5rem;
    }
    
    .control-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: white;
        color: #6b7280;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .control-btn:hover {
        background: #f9fafb;
        border-color: #3b82f6;
        color: #3b82f6;
    }
    
    .control-btn.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
    }
    
    .date-filters {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .filter-label {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .filter-input {
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.875rem;
        background: white;
        min-width: 120px;
    }
    
    .filter-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .filter-button {
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
        align-self: flex-end;
    }
    
    .filter-button:hover {
        background: #2563eb;
    }
    
    .reset-button {
        padding: 0.5rem 1rem;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color 0.2s;
        align-self: flex-end;
    }
    
    .reset-button:hover {
        background: #4b5563;
    }
    
    .layer-control {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
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
        border-color: #3b82f6;
    }
    
    .layer-btn.active {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
    }
    
    #map {
        height: 600px;
        width: 100%;
        z-index: 1;
        position: relative;
    }
    
    .hotspot-toggle {
        position: absolute;
        top: 80px;
        right: 10px;
        z-index: 1000;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .hotspot-toggle label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        margin: 0;
        font-size: 0.875rem;
        color: #374151;
        font-weight: 500;
    }
    
    .hotspot-toggle input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    .hotspot-intensity-legend {
        position: absolute;
        bottom: 20px;
        right: 10px;
        z-index: 1000;
        background: white;
        padding: 1.25rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-size: 0.85rem;
        display: none;
        min-width: 220px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
    }
    
    .hotspot-intensity-legend.active {
        display: block;
        animation: fadeInSlide 0.4s ease-out;
        border-color: #3b82f6;
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    }
    
    @keyframes fadeInSlide {
        from {
            opacity: 0;
            transform: translateX(20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    .intensity-title {
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.75rem;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .intensity-title::before {
        content: '🎯';
        font-size: 1.1rem;
        animation: subtlePulse 2s ease-in-out infinite;
    }
    
    @keyframes subtlePulse {
        0%, 100% {
            opacity: 1;
            transform: scale(1);
        }
        50% {
            opacity: 0.7;
            transform: scale(1.1);
        }
    }
    
    .intensity-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }
    
    .intensity-item:last-child {
        margin-bottom: 0;
    }
    
    
    .intensity-color {
        width: 20px;
        height: 20px;
        border-radius: 3px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 0 6px currentColor;
    }
    
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    .intensity-label {
        color: #6b7280;
        font-size: 0.8rem;
    }
    
    .map-legend {
        padding: 2rem 1.5rem;
        background: white;
        border-top: 2px solid #e5e7eb;
        display: block;
        width: 100%;
        box-sizing: border-box;
    }
    
    .legend-title {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1.5rem;
        display: block;
        letter-spacing: 0.5px;
    }
    
    .legend-items {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 2rem 2.5rem;
        width: 100%;
        align-items: start;
    }
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.9rem;
        color: #374151;
        white-space: normal;
        word-break: break-word;
        flex-wrap: nowrap;
    }
    
    .legend-item img {
        flex-shrink: 0;
        min-width: 24px;
        width: 24px;
        height: 24px;
        object-fit: contain;
        display: block;
    }
    
    .legend-item span {
        flex: 0 1 auto;
        overflow-wrap: break-word;
    }
    
    .legend-marker {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
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
    
    .map-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .map-stat-card {
        background: white;
        padding: 1.25rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-left: 3px solid #e5e7eb;
    }
    
    .map-stat-card.high {
        border-left-color: #dc2626;
    }
    
    .map-stat-card.medium {
        border-left-color: #f59e0b;
    }
    
    .map-stat-card.low {
        border-left-color: #10b981;
    }
    
    .map-stat-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }
    
    .map-stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
    }
    
    /* Custom Leaflet Popup Styling */
    .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .leaflet-popup-content {
        margin: 1rem;
        font-size: 0.875rem;
    }
    
    .popup-title {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }
    
    .popup-details {
        color: #6b7280;
        line-height: 1.5;
    }
    
    /* Hotspots Ranking Section */
    .hotspots-ranking-section {
        padding: 0;
        background: white;
        border-top: 2px solid #e5e7eb;
    }
    
    .ranking-header {
        padding: 1.5rem;
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background-color 0.2s;
    }
    
    .ranking-header:hover {
        background: #f9fafb;
    }
    
    .ranking-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
        display: flex;
        align-items: center;
    }
    
    .ranking-chevron {
        width: 24px;
        height: 24px;
        fill: #6b7280;
        transition: transform 0.3s ease;
    }
    
    .ranking-chevron.open {
        transform: rotate(180deg);
    }
    
    .ranking-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        padding: 0 1.5rem;
    }
    
    .ranking-content.open {
        max-height: 3000px;
        padding: 0 1.5rem 1.5rem;
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
        transition: all 0.2s ease;
    }
    
    .hotspot-item:hover {
        background: #f3f4f6;
        transform: translateX(4px);
    }
    
    .hotspot-item.high {
        border-left-color: #dc2626;
        background: #fee2e2;
    }
    
    .hotspot-item.high:hover {
        background: #fecaca;
    }
    
    .hotspot-item.medium {
        border-left-color: #f59e0b;
        background: #fef3c7;
    }
    
    .hotspot-item.medium:hover {
        background: #fed7aa;
    }
    
    .hotspot-item.low {
        border-left-color: #10b981;
        background: #dcfce7;
    }
    
    .hotspot-item.low:hover {
        background: #bbf7d0;
    }
    
    .hotspot-item-name {
        font-weight: 600;
        color: #1f2937;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .hotspot-rank {
        font-size: 0.875rem;
        font-weight: 700;
        color: #9ca3af;
        min-width: 35px;
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
        text-align: right;
    }
    
    .detail-label {
        font-size: 0.75rem;
        color: #9ca3af;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.05em;
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
        white-space: nowrap;
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
    
    

    
    
    /* Static hotspot overlay circles (no animations) */
    .hotspot-circle-high path {
        stroke-opacity: 0.9;
        fill-opacity: 0.35;
        stroke-width: 3;
        filter: drop-shadow(0 0 10px rgba(220, 38, 38, 0.6));
    }
    
    .hotspot-circle-medium path {
        stroke-opacity: 0.8;
        fill-opacity: 0.3;
        stroke-width: 3;
        filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
    }
    
    .hotspot-circle-low path {
        stroke-opacity: 0.7;
        fill-opacity: 0.25;
        stroke-width: 3;
        filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.4));
    }
    
    
    @media (max-width: 768px) {
        #map {
            height: 400px;
        }
        
        .map-controls {
            width: 100%;
        }
        
        .control-btn {
            flex: 1;
            justify-content: center;
        }
        
        .hotspot-item-details {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
        }
    }
</style>
@endsection

@section('content')
<div class="content-header">
    <h1 class="content-title">View Map - All Crimes</h1>
</div>

<!-- Date Filters -->
<div class="date-filters">
    <div class="filter-group">
        <label class="filter-label">Year</label>
        <select id="filter-year" class="filter-input">
            <option value="">All Years</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
        </select>
    </div>
    
    <div class="filter-group">
        <label class="filter-label">Month</label>
        <select id="filter-month" class="filter-input">
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
        </select>
    </div>
    
    <div class="filter-group">
        <label class="filter-label">Date From</label>
        <input type="date" id="filter-date-from" class="filter-input">
    </div>
    
    <div class="filter-group">
        <label class="filter-label">Date To</label>
        <input type="date" id="filter-date-to" class="filter-input">
    </div>
    
    <div class="filter-group">
        <label class="filter-label">Status</label>
        <select id="filter-status" class="filter-input">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
        </select>
    </div>
    
    <button onclick="applyFilters()" class="filter-button">Apply Filters</button>
    <button onclick="resetFilters()" class="reset-button">Reset</button>
</div>

<!-- Map Container -->
<div class="map-container">
    <div class="map-header">
        <h2 class="map-title">Davao City - All Crime Locations</h2>
        <div>
            <div class="layer-control">
                <button class="layer-btn active" id="map-view-btn" onclick="switchToMapView()">
                    <svg style="width: 14px; height: 14px; fill: currentColor; display: inline; margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Map View
                </button>
                <button class="layer-btn" id="satellite-view-btn" onclick="switchToSatelliteView()">
                    <svg style="width: 14px; height: 14px; fill: currentColor; display: inline; margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Satellite
                </button>
            </div>
        </div>
    </div>
    
    <div id="map">
        <div class="hotspot-toggle">
            <label style="margin-right: 15px;">
                <input type="checkbox" id="mapping-overlay-toggle" checked onchange="toggleMappingOverlay()">
                <span>Crime Mapping Overlay</span>
            </label>
            <label>
                <input type="checkbox" id="hotspot-overlay-toggle" onchange="toggleHotspotOverlay()">
                <span>Crime Hotspot Overlay</span>
            </label>
        </div>
        <div class="hotspot-intensity-legend" id="hotspot-legend">
            <div class="intensity-title">Crime Intensity</div>
            <div class="intensity-item">
                <div class="intensity-color" style="background-color: rgba(16, 185, 129, 0.8);"></div>
                <div class="intensity-label">Low (&lt; 4 per 1K)</div>
            </div>
            <div class="intensity-item">
                <div class="intensity-color" style="background-color: rgba(245, 158, 11, 0.8);"></div>
                <div class="intensity-label">Medium (4-7 per 1K)</div>
            </div>
            <div class="intensity-item">
                <div class="intensity-color" style="background-color: rgba(220, 38, 38, 0.8);"></div>
                <div class="intensity-label">High (&gt; 8 per 1K)</div>
            </div>
        </div>
    </div>
    
    <div class="map-legend">
        <div class="legend-title">Crime Type Legends</div>
        <div class="legend-items">
            <!-- Violent Crimes -->
            <div class="legend-item">
                <img src="/legends/squareMURDER.png" style="width: 24px; height: 24px;" alt="Murder">
                <span>Murder</span>
            </div>
            <div class="legend-item">
                <img src="/legends/diamondHOMICIDE.png" style="width: 24px; height: 24px;" alt="Homicide">
                <span>Homicide</span>
            </div>
            <div class="legend-item">
                <img src="/legends/moonRAPE.png" style="width: 24px; height: 24px;" alt="Rape">
                <span>Rape</span>
            </div>
            <div class="legend-item">
                <img src="/legends/tearSEXUALASSAULT.png" style="width: 24px; height: 24px;" alt="Sexual Assault">
                <span>Sexual Assault</span>
            </div>
            <div class="legend-item">
                <img src="/legends/001-pointed-star.png" style="width: 24px; height: 24px;" alt="Physical Injury">
                <span>Physical Injury</span>
            </div>
            
            <!-- Property Crimes -->
            <div class="legend-item">
                <img src="/legends/circleBurglary.png" style="width: 24px; height: 24px;" alt="Burglary">
                <span>Burglary</span>
            </div>
            <div class="legend-item">
                <img src="/legends/hexagonalBreak-in.png" style="width: 24px; height: 24px;" alt="Break-in">
                <span>Break-in</span>
            </div>
            <div class="legend-item">
                <img src="/legends/003-ellipse.png" style="width: 24px; height: 24px;" alt="Theft">
                <span>Theft</span>
            </div>
            <div class="legend-item">
                <img src="/legends/002-rectangle.png" style="width: 24px; height: 24px;" alt="Robbery">
                <span>Robbery</span>
            </div>
            <div class="legend-item">
                <img src="/legends/001-close.png" style="width: 24px; height: 24px;" alt="Carnapping">
                <span>Carnapping</span>
            </div>
            <div class="legend-item">
                <img src="/legends/002-plus.png" style="width: 24px; height: 24px;" alt="Motornapping">
                <span>Motornapping</span>
            </div>
            
            <!-- Domestic & Threats -->
            <div class="legend-item">
                <img src="/legends/flagDomesticViolence.png" style="width: 24px; height: 24px;" alt="Domestic Violence">
                <span>Domestic Violence</span>
            </div>
            <div class="legend-item">
                <img src="/legends/quoteHARASSMENT.png" style="width: 24px; height: 24px;" alt="Harassment">
                <span>Harassment</span>
            </div>
            <div class="legend-item">
                <img src="/legends/playTHREATS.png" style="width: 24px; height: 24px;" alt="Threats">
                <span>Threats</span>
            </div>
            
            <!-- Financial & Cyber -->
            <div class="legend-item">
                <img src="/legends/bookmarkFRAUD.png" style="width: 24px; height: 24px;" alt="Fraud">
                <span>Fraud</span>
            </div>
            <div class="legend-item">
                <img src="/legends/webCyberCRIME.png" style="width: 24px; height: 24px;" alt="Cyber Crime">
                <span>Cyber Crime</span>
            </div>
            
            <!-- Others -->
            <div class="legend-item">
                <img src="/legends/missingPerson.png" style="width: 24px; height: 24px;" alt="Missing Person">
                <span>Missing Person</span>
            </div>
            <div class="legend-item">
                <img src="/legends/moreOTHERS.png" style="width: 24px; height: 24px;" alt="Others">
                <span>Others</span>
            </div>
        </div>
    </div>

    <!-- Crime Hotspots Ranking -->
    <div class="hotspots-ranking-section">
        <div class="ranking-header" onclick="toggleRankingSection()">
            <h3 class="ranking-title">
                <svg style="width: 20px; height: 20px; fill: currentColor; display: inline-block; margin-right: 8px; vertical-align: middle;" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.58 4.58L10 10.58 3.29 17.29 4.7 18.7l6.71-6.71 3.71 3.71 6.59-6.59L22 12v-6z"/>
                </svg>
                Crime Hotspots Ranking
            </h3>
            <svg class="ranking-chevron" id="ranking-chevron" viewBox="0 0 24 24">
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
        </div>
        <div class="ranking-content" id="ranking-content">
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
</div>
@endsection

@section('scripts')
<!-- Leaflet JavaScript -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<!-- Leaflet MarkerCluster JavaScript -->
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

<script>
    // Global variables
    let map;
    let markers = [];
    let markerClusterGroup; // Cluster group for performance
    let allReports = [];
    let streetLayer, satelliteLayer;
    let hotspotLayer;
    let hotspotCircles = [];
    let hotspotOverlayVisible = false;
    let mappingOverlayVisible = true; // Default to true

    function toggleMappingOverlay() {
        if (document.getElementById('mapping-overlay-toggle').checked) {
            map.addLayer(csvLayer);
            mappingOverlayVisible = true;
        } else {
            map.removeLayer(csvLayer);
            mappingOverlayVisible = false;
        }
    }
    
    // Crime type to icon mapping (complete mapping for all legend files)
    const crimeIcons = {
        // Violent Crimes
        'murder': '/legends/squareMURDER.png',
        'homicide': '/legends/diamondHOMICIDE.png',
        'rape': '/legends/moonRAPE.png',
        'sexual assault': '/legends/tearSEXUALASSAULT.png',
        'physical injury': '/legends/001-pointed-star.png',
        'assault': '/legends/001-pointed-star.png',
        
        // Domestic & Personal
        'domestic violence': '/legends/flagDomesticViolence.png',
        'harassment': '/legends/quoteHARASSMENT.png',
        'threats': '/legends/playTHREATS.png',
        'threatening': '/legends/playTHREATS.png',
        
        // Property Crimes
        'robbery': '/legends/002-rectangle.png',
        'burglary': '/legends/circleBurglary.png',
        'break-in': '/legends/hexagonalBreak-in.png',
        'breaking and entering': '/legends/hexagonalBreak-in.png',
        'theft': '/legends/003-ellipse.png',
        'carnapping': '/legends/001-close.png',
        'motornapping': '/legends/002-plus.png',
        'vehicle theft': '/legends/001-close.png',
        'motorcycle theft': '/legends/002-plus.png',
        'vandalism': '/legends/moreOTHERS.png',
        
        // Financial & Cyber
        'fraud': '/legends/bookmarkFRAUD.png',
        'cyber fraud': '/legends/bookmarkFRAUD.png',
        'cyber crime': '/legends/webCyberCRIME.png',
        'cybercrime': '/legends/webCyberCRIME.png',
        'hacking': '/legends/webCyberCRIME.png',
        'phishing': '/legends/webCyberCRIME.png',
        'online scam': '/legends/bookmarkFRAUD.png',
        'cyberbullying': '/legends/quoteHARASSMENT.png',
        'identity theft': '/legends/003-ellipse.png',
        
        // Drug-related
        'illegal drugs': '/legends/moreOTHERS.png',
        'dangerous drugs': '/legends/moreOTHERS.png',
        
        // Missing Person
        'missing person': '/legends/missingPerson.png',
        'missing': '/legends/missingPerson.png',
        
        // Others
        'others': '/legends/moreOTHERS.png',
        'other': '/legends/moreOTHERS.png'
    };
    
    // Davao City bounds (approximate)
    const davaoCityBounds = [
        [6.9, 125.2],  // Southwest corner
        [7.5, 125.7]   // Northeast corner
    ];
    
    // Layer switching functions (defined globally, outside DOMContentLoaded)
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
    
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Add small delay to ensure map container is ready
        setTimeout(function() {
            showLoading('Loading map...');
            // Initialize the map centered on Davao City with bounds restriction
            map = L.map('map', {
                maxBounds: davaoCityBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 11,
                maxZoom: 18
            }).setView([7.1907, 125.4553], 13);
    
            // Add Street Map layer (OpenStreetMap)
            streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
            }).addTo(map);
            
            // Initialize CSV Layer (Global)
            window.csvLayer = L.layerGroup().addTo(map);
            
            // Hide loading once tiles start loading or after a short delay
            map.on('load', function() {
                hideLoading();
            });
            
            // Fallback in case map load doesn't fire
            setTimeout(hideLoading, 1000);

            // Add Satellite layer (Esri World Imagery)
            satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 18,
            });
            
            // Initialize regular layer group for markers (NO CLUSTERING)
            markerClusterGroup = L.layerGroup();
            
            // Add layer group to map
            map.addLayer(markerClusterGroup);
            
            // Load initial data
            loadReports();
            loadCsvCrimes();
            loadHotspotRankingData();
        }, 100); // End setTimeout
    }); // End DOMContentLoaded
    
    // Function to clean crime type text
    function cleanCrimeType(crimeType) {
        if (!crimeType) return '';
        
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = crimeType;
        let cleaned = textarea.value;
        
        // Remove brackets and quotes
        cleaned = cleaned.replace(/[\[\]"']/g, '');
        
        // Remove extra whitespace
        cleaned = cleaned.trim().replace(/\s+/g, ' ');
        
        return cleaned;
    }
    
    // Function to get icon for crime type
    function getCrimeIcon(crimeType) {
        if (!crimeType) return null;
        
        // Clean the crime type name first
        const cleanedType = cleanCrimeType(crimeType);
        const normalizedType = cleanedType.toLowerCase().trim();
        return crimeIcons[normalizedType] || null;
    }
    
    // Function to create cluster icon with legend icons
    function createClusterIcon(uniqueCrimeTypes) {
        // Get up to 3 crime type icons to display
        const iconUrls = uniqueCrimeTypes.slice(0, 3).map(crimeType => getCrimeIcon(crimeType)).filter(url => url);
        
        if (iconUrls.length === 0) {
            // No icons found, show count badge
            return L.divIcon({
                className: 'custom-cluster-marker',
                html: `<div style="background-color: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">?</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            });
        } else if (iconUrls.length === 1) {
            // Single crime type, show its icon
            return L.icon({
                iconUrl: iconUrls[0],
                iconSize: [32, 32],
                iconAnchor: [16, 16],
                popupAnchor: [0, -16]
            });
        } else {
            // Multiple crime types, show icons in a grid
            const iconHtmlItems = iconUrls.map(url => 
                `<img src="${url}" style="width: 14px; height: 14px; object-fit: contain;">`
            ).join('');
            
            return L.divIcon({
                className: 'custom-cluster-marker',
                html: `<div style="background-color: white; width: 40px; height: 40px; border-radius: 6px; border: 2px solid #3b82f6; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 2px; padding: 3px;">${iconHtmlItems}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            });
        }
    }
    
    // Function to create custom marker icon
    function createCrimeMarker(crimeType, count = 1) {
        const iconUrl = getCrimeIcon(crimeType);
        
        if (iconUrl && count === 1) {
            // Single crime with custom icon
            return L.icon({
                iconUrl: iconUrl,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14]
            });
        } else if (count > 1) {
            // Multiple crimes - show count badge
            return L.divIcon({
                className: 'custom-cluster-marker',
                html: `<div style="background-color: #3b82f6; color: white; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">${count}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
            });
        } else {
            // Default marker for unknown crime type
            return L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #6b7280; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12]
            });
        }
    }
    
    // === CACHING UTILITIES ===
    const CACHE_PREFIX = 'crime_map_';
    const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    function getCacheKey(filters = {}) {
        const filterString = JSON.stringify(filters);
        return CACHE_PREFIX + btoa(filterString);
    }
    
    function getCachedData(cacheKey) {
        try {
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            
            // Check if cache is still valid
            if (now - timestamp < CACHE_EXPIRY) {
                console.log('✅ Using cached data (age: ' + Math.round((now - timestamp) / 1000) + 's)');
                return data;
            } else {
                console.log('⏰ Cache expired, fetching fresh data');
                localStorage.removeItem(cacheKey);
                return null;
            }
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    }
    
    function setCachedData(cacheKey, data) {
        try {
            const cacheObject = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
            console.log('💾 Data cached successfully');
        } catch (e) {
            // Handle quota exceeded or other errors
            console.warn('Cache write error:', e);
            // Clear old cache entries if quota exceeded
            if (e.name === 'QuotaExceededError') {
                clearOldCache();
            }
        }
    }
    
    function clearOldCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('🗑️ Old cache cleared');
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }
    
    // Function to load reports from API
    function loadReports(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const url = '{{ route("api.reports") }}' + (params ? '?' + params : '');
        const cacheKey = getCacheKey(filters);
        
        console.log('Loading reports from:', url);
        console.log('Filters applied:', filters);
        
        // Try to get cached data first
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            allReports = cachedData.reports;
            updateMapMarkers(cachedData.reports);
            return;
        }
        
        // Fetch fresh data
        fetch(url)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received data:', data);
                console.log('Reports count:', data.reports ? data.reports.length : 0);
                console.log('Total count:', data.total_count);
                
                if (data.is_limited) {
                    console.warn(`Data is limited to ${data.limit_applied} out of ${data.database_total} total reports`);
                }
                
                allReports = data.reports;
                
                if (!data.reports || data.reports.length === 0) {
                    console.warn('No reports received from API');
                    alert('No crime data found for the selected filters.');
                    return;
                }
                
                // Cache the data
                setCachedData(cacheKey, data);
                
                updateMapMarkers(data.reports);
            })
            .catch(error => {
                console.error('Error loading reports:', error);
                alert('Error loading map data: ' + error.message + '. Check console for details.');
            });
    }
    
    // Function to load CSV crime data
    function loadCsvCrimes() {
        const csvCacheKey = CACHE_PREFIX + 'csv_crimes';
        
        console.log('Loading CSV crime data...');
        
        // Try cache first
        const cachedCsvData = getCachedData(csvCacheKey);
        if (cachedCsvData) {
            addCsvCrimesToMap(cachedCsvData);
            return;
        }
        
        fetch('{{ route("api.csv-crimes") }}')
            .then(response => response.json())
            .then(data => {
                console.log('CSV crimes loaded:', data.total);
                
                // Check for either status string or boolean success
                if ((data.status === 'success' || data.success) && data.data) {
                    // Cache CSV data
                    setCachedData(csvCacheKey, data.data);
                    addCsvCrimesToMap(data.data);
                } else {
                    console.warn('CSV API returned metadata but no valid data payload', data);
                }
            })
            .catch(error => {
                console.error('Error loading CSV crimes:', error);
            });
    }
    
    // Function to add CSV crimes to map
    function addCsvCrimesToMap(crimes) {
        console.log(`Adding ${crimes.length} CSV markers to map (no clustering)`);
        
        crimes.forEach((crime, index) => {
            // Validate coordinates
            if (!crime.lat || !crime.lng || isNaN(crime.lat) || isNaN(crime.lng)) {
                return;
            }
            
            const marker = L.marker([crime.lat, crime.lng], { 
                icon: createCrimeMarker(crime.crime_type, 1) 
            });
            
            const dateStr = crime.date ? new Date(crime.date).toLocaleDateString() : 'N/A';
            const popupContent = `
                <div style="font-family: Arial, sans-serif; min-width: 200px;">
                    <div style="background-color: #f3f4f6; padding: 8px; border-radius: 4px 4px 0 0; border-bottom: 2px solid #e5e7eb; margin-bottom: 8px;">
                        <strong style="color: #111827; font-size: 1.1em;">${crime.crime_type || 'Unknown Crime'}</strong>
                    </div>
                    <div style="padding: 0 8px 8px;">
                        <div style="margin-bottom: 4px; color: #4b5563;">
                            <span style="font-weight: 600;">Location:</span> ${crime.barangay || 'Unknown'}
                        </div>
                        <div style="margin-bottom: 4px; color: #4b5563;">
                            <span style="font-weight: 600;">Date:</span> ${dateStr}
                        </div>
                        <div style="color: #6b7280; font-size: 0.9em; margin-top: 8px;">
                            <i>Historical Data</i>
                        </div>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            csvLayer.addLayer(marker);
        });
        
        // Add layer to map
        if (map) {
            csvLayer.addTo(map);
            
            // Log for debugging
            console.log(`Added ${crimes.length} individual markers from CSV data`);
            
            // Add notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #10b981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 9999;
                font-family: 'Inter', sans-serif;
                animation: slideIn 0.3s ease-out;
            `;
            notification.textContent = `Added ${crimes.length} historical markers`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(20px)';
                notification.style.transition = 'all 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    // Create icon for multiple crime types at one location
    function createMultiCrimeIcon(offenseTypes) {
        const colors = offenseTypes.slice(0, 4).map(offense => getCrimeColor(offense));
        
        const iconHtml = `
            <div style="
                background: white;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 3px solid #3b82f6;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            ">
                <div style="
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2px;
                    width: 24px;
                    height: 24px;
                ">
                    ${colors.map(color => `<div style="width: 10px; height: 10px; background: ${color}; border-radius: 2px;"></div>`).join('')}
                </div>
                <div style="
                    position: absolute;
                    bottom: -8px;
                    right: -8px;
                    background: #dc2626;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    border: 2px solid white;
                ">${offenseTypes.length}</div>
            </div>
        `;
        
        return L.divIcon({
            className: 'custom-multi-crime-marker',
            html: iconHtml,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22]
        });
    }
    
    // Get color for crime type
    function getCrimeColor(offense) {
        // Null-safe check
        if (!offense || typeof offense !== 'string') {
            return '#6b7280'; // Default gray for unknown/missing type
        }
        
        const offenseLower = offense.toLowerCase();
        
        if (offenseLower.includes('physical injury') || offenseLower.includes('assault')) return '#dc2626';
        if (offenseLower.includes('theft') || offenseLower.includes('robbery')) return '#ea580c';
        if (offenseLower.includes('drug') || offenseLower.includes('dangerous')) return '#7c2d12';
        if (offenseLower.includes('reckless') || offenseLower.includes('driving')) return '#f59e0b';
        if (offenseLower.includes('vandalism') || offenseLower.includes('damage')) return '#84cc16';
        if (offenseLower.includes('hacking') || offenseLower.includes('cyber')) return '#6366f1';
        
        return '#6b7280'; // Default gray
    }
    
    // Function to update map markers
    function updateMapMarkers(reports) {
        console.log('Updating map markers with', reports.length, 'reports');
        
        // Clear existing markers from cluster group
        if (markerClusterGroup) {
            markerClusterGroup.clearLayers();
        }
        markers = [];
        
        // Add new markers to cluster group
        reports.forEach((report, index) => {
            console.log('Processing report', index, ':', report);
            
            if (report.is_cluster || report.is_dcpo_cluster) {
                let uniqueTypes = [];
                
                // Handle DCPO cluster format (has crime_types array)
                if (report.is_dcpo_cluster && report.crime_types) {
                    uniqueTypes = report.crime_types.map(ct => ct.type);
                } 
                // Handle regular cluster format (has crimes array)
                else if (report.crimes) {
                    const crimeTypes = report.crimes.map(c => c.crime_type);
                    uniqueTypes = [...new Set(crimeTypes)];
                }
                
                // Create cluster icon showing legend icons instead of count
                const icon = createClusterIcon(uniqueTypes);
                
                // Build popup content
                let popupContent = `<div style="max-height: 350px; overflow-y: auto; min-width: 250px;">
                    <div class="popup-title">${report.count} Crimes at ${report.location_name}</div>
                    <div class="popup-details"><hr style="margin: 0.5rem 0;">`;
                
                if (report.is_dcpo_cluster && report.crime_types) {
                    // DCPO cluster - show crime types with counts
                    report.crime_types.forEach((crimeType, index) => {
                        const cleanedType = cleanCrimeType(crimeType.type);
                        const iconUrl = getCrimeIcon(crimeType.type);
                        const iconHtml = iconUrl ? `<img src="${iconUrl}" style="width: 18px; height: 18px; vertical-align: middle; margin-right: 6px;" alt="${cleanedType}">` : '';
                        
                        popupContent += `
                            <div style="margin-bottom: 0.65rem; padding: 0.5rem; ${index < report.crime_types.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''} background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    ${iconHtml}<strong style="font-size: 0.9rem;">${cleanedType}</strong>
                                </div>
                                <span style="background: #3b82f6; color: white; padding: 0.2rem 0.6rem; border-radius: 14px; font-size: 0.75rem; font-weight: 700;">${crimeType.count}</span>
                            </div>`;
                    });
                    popupContent += `<div style="margin-top: 0.75rem; padding: 0.5rem; font-size: 0.75rem; color: #6b7280; text-align: center; background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">📊 Historical Data (2020-2025)</div>`;
                } else if (report.crimes) {
                    // Regular cluster - show individual crimes
                    report.crimes.forEach((crime, index) => {
                        const cleanedCrimeType = cleanCrimeType(crime.crime_type || crime.title);
                        const iconUrl = getCrimeIcon(crime.crime_type);
                        const iconHtml = iconUrl ? `<img src="${iconUrl}" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;" alt="${cleanedCrimeType}">` : '';
                        
                        popupContent += `
                            <div style="margin-bottom: 0.75rem; padding-bottom: 0.75rem; ${index < report.crimes.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                                ${iconHtml}<strong>${cleanedCrimeType}</strong><br>
                                <span style="font-size: 0.875rem; color: #6b7280;">
                                    Status: ${crime.status}<br>
                                    Date: ${new Date(crime.date_reported).toLocaleDateString()}
                                </span>
                            </div>`;
                    });
                }
                
                popupContent += '</div></div>';
                
                // Create marker with crimeType property for cluster grouping
                const marker = L.marker([report.latitude, report.longitude], { icon: icon });
                marker.crimeType = uniqueTypes[0]; // Store primary crime type
                marker.bindPopup(popupContent);
                
                // Add tooltip on hover
                if (uniqueTypes.length === 1) {
                    const cleanedType = cleanCrimeType(uniqueTypes[0]);
                    marker.bindTooltip(`${report.count}x ${cleanedType}`, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -16]
                    });
                } else {
                    marker.bindTooltip(`${report.count} crimes (${uniqueTypes.length} types)`, {
                        permanent: false,
                        direction: 'top',
                        offset: [0, -18]
                    });
                }
                
                markerClusterGroup.addLayer(marker);
                markers.push(marker);
            } else {
                // Individual crime marker
                const lat = parseFloat(report.latitude);
                const lng = parseFloat(report.longitude);
                
                // Add random scatter (±0.002 degrees ≈ ±200 meters) to prevent exact overlaps
                const scatterLat = lat + (Math.random() - 0.5) * 0.004;
                const scatterLng = lng + (Math.random() - 0.5) * 0.004;
                
                const cleanedCrimeType = cleanCrimeType(report.crime_type || report.title);
                const icon = createCrimeMarker(report.crime_type, 1);
                
                const marker = L.marker([scatterLat, scatterLng], { icon: icon });
                marker.crimeType = cleanedCrimeType; // Store crime type for cluster grouping
                marker.bindPopup(`
                    <div class="popup-title">${cleanedCrimeType}</div>
                    <div class="popup-details">
                        <strong>Location:</strong> ${report.location_name}<br>
                        <strong>Status:</strong> ${report.status}<br>
                        <strong>Date:</strong> ${new Date(report.date_reported).toLocaleDateString()}<br>
                        <strong>Reporter:</strong> ${report.reporter}<br>
                        <strong>Description:</strong> ${report.description}
                    </div>
                `);
                
                // Add tooltip on hover showing crime type
                marker.bindTooltip(cleanedCrimeType, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -14]
                });
                
                markerClusterGroup.addLayer(marker);
                markers.push(marker);
            }
        });
        
        console.log(`Added ${markers.length} individual markers to map`);
        
        // Fit bounds if there are markers
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds.pad(0.1), {
                    maxZoom: 15
                });
            }
        }
    }
    
    // Date filter functions
    function applyFilters() {
        const filters = {
            year: document.getElementById('filter-year').value,
            month: document.getElementById('filter-month').value,
            date_from: document.getElementById('filter-date-from').value,
            date_to: document.getElementById('filter-date-to').value,
            status: document.getElementById('filter-status').value
        };
        
        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (filters[key] === '') {
                delete filters[key];
            }
        });
        
        loadReports(filters);
    }
    
    function resetFilters() {
        document.getElementById('filter-year').value = '';
        document.getElementById('filter-month').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        document.getElementById('filter-status').value = '';
        
        loadReports();
        loadHotspotRankingData();
    }
    
    // Toggle ranking section
    function toggleRankingSection() {
        const content = document.getElementById('ranking-content');
        const chevron = document.getElementById('ranking-chevron');
        
        content.classList.toggle('open');
        chevron.classList.toggle('open');
    }
    
    // Load hotspot ranking data
    function loadHotspotRankingData() {
        const url = '{{ route("api.hotspot-data") }}';
        console.log('Starting to load hotspot data from:', url);
        
        fetch(url)
            .then(response => {
                console.log('Hotspot API response status:', response.status);
                if (!response.ok) {
                    console.error('Response not ok. Status:', response.status);
                    throw new Error('Network response was not ok: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Hotspot ranking data loaded successfully:', data);
                const hotspots = data.barangays || [];
                console.log('Number of barangays:', hotspots.length);
                updateHotspotsList(hotspots);
            })
            .catch(error => {
                console.error('Error loading hotspot ranking data:', error);
                const container = document.getElementById('hotspot-list');
                if (container) {
                    container.innerHTML = '<div style="color: #dc2626; padding: 1rem;">Error loading data: ' + error.message + '</div>';
                }
            });
    }
    
    // Get crime level based on rate
    function getCrimeLevel(rate) {
        if (rate > 8) return 'high';
        if (rate >= 4) return 'medium';
        return 'low';
    }
    
    // Update hotspots ranking list
    function updateHotspotsList(hotspots) {
        const listContainer = document.getElementById('hotspot-list');
        
        if (!hotspots || hotspots.length === 0) {
            listContainer.innerHTML = '<div style="color: #6b7280; padding: 1rem;">No data available</div>';
            return;
        }
        
        // Already sorted by crime rate in backend, but ensure it's sorted here too
        const sorted = [...hotspots].sort((a, b) => b.crime_rate - a.crime_rate);
        
        const html = sorted.map((barangay, index) => {
            // Use risk_level from API if available, otherwise calculate it
            const level = barangay.risk_level || getCrimeLevel(barangay.crime_rate);
            const levelLabel = level === 'high' ? 'HIGH RISK' : level === 'medium' ? 'MEDIUM RISK' : 'LOW RISK';
            
            return `
                <div class="hotspot-item ${level}">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div class="hotspot-rank">#${index + 1}</div>
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
         
         // Load hotspot data for overlay
         function loadHotspotOverlayData() {
         const url = '{{ route("api.hotspot-data") }}';
         console.log('Loading hotspot overlay data from:', url);
         
         fetch(url)
         .then(response => {
         console.log('Hotspot API response status:', response.status);
         if (!response.ok) {
         throw new Error('Network response was not ok: ' + response.status);
         }
         return response.json();
         })
         .then(data => {
         console.log('Hotspot overlay data loaded:', data);
         if (data.barangays && data.barangays.length > 0) {
         console.log('Rendering', data.barangays.length, 'barangays');
         renderHotspotOverlay(data.barangays);
         } else {
         console.warn('No barangays in response');
         }
         })
         .catch(error => {
         console.error('Error loading hotspot data:', error);
         alert('Failed to load hotspot data: ' + error.message);
         });
         }
         
         // Get color based on crime rate (weather-forecast style)
         function getHotspotColor(crimeRate) {
         if (crimeRate > 8) {
         return { color: '#dc2626', opacity: 0.85 }; // High - Red (more visible)
         } else if (crimeRate >= 4) {
         return { color: '#f59e0b', opacity: 0.75 }; // Medium - Orange (more visible)
         } else {
         return { color: '#10b981', opacity: 0.65 }; // Low - Green (more visible)
         }
         }
         
         // Render hotspot circles overlay (weather-forecast style)
         function renderHotspotOverlay(hotspots) {
             console.log('🎯 renderHotspotOverlay called with', hotspots.length, 'hotspots');
             
             // Create layer if it doesn't exist
             if (!hotspotLayer) {
                 hotspotLayer = L.layerGroup();
                 console.log('✅ Created new hotspotLayer');
             }
             
             // Clear existing circles from layer
             hotspotCircles.forEach(circle => {
                 hotspotLayer.removeLayer(circle);
             });
             hotspotCircles = [];
             console.log('🗑️ Cleared existing circles');
             
             // Ensure hotspot layer is added to map FIRST before adding circles
             if (!map.hasLayer(hotspotLayer)) {
                 map.addLayer(hotspotLayer);
                 console.log('✅ Added hotspotLayer to map');
             }
             
             // Set higher pane for visibility
             if (hotspotLayer.options) {
                 hotspotLayer.options.pane = 'overlayPane';
             }
             
             // Render each hotspot
             hotspots.forEach((barangay, index) => {
            try {
                const colorData = getHotspotColor(barangay.crime_rate);
                const riskLevel = barangay.crime_rate > 8 ? 'HIGH' : barangay.crime_rate >= 4 ? 'MEDIUM' : 'LOW';
                const riskEmoji = riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟠' : '🟢';
                
                // Validate coordinates
                if (!barangay.latitude || !barangay.longitude) {
                    console.warn('Missing coordinates for', barangay.name);
                    return;
                }
                
                // Calculate radius based on crime rate (scale for visibility)
                const baseRadius = 2000; // Increased from 1500 to 2km base for better visibility
                const radiusScale = Math.min(barangay.crime_rate / 8, 3); // Scale up to 3x for high crime
                const radius = baseRadius * (1 + radiusScale); // More dramatic scaling
                
                // Enhanced styling with more dramatic effects
                const circle = L.circle([barangay.latitude, barangay.longitude], {
                    color: colorData.color,
                    weight: 5,
                    opacity: 1,
                    fillColor: colorData.color,
                    fillOpacity: 0.6, // More visible fill
                    radius: radius,
                    className: `hotspot-circle hotspot-circle-${riskLevel.toLowerCase()}`,
                    interactive: true,
                    bubblingMouseEvents: true
                });
                
                console.log(`Created circle for ${barangay.name}: lat=${barangay.latitude}, lng=${barangay.longitude}, radius=${radius}, color=${colorData.color}`);
                
                // Add popup on click with enhanced styling
                circle.bindPopup(`
                    <div style="padding: 1rem; background: white; border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                            <strong style="font-size: 1.05rem;">${barangay.name}</strong>
                            <span style="font-size: 1.2rem;">${riskEmoji}</span>
                        </div>
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span style="color: #6b7280;">Crime Rate:</span>
                                <strong style="color: ${colorData.color}; font-size: 1.1rem;">${barangay.crime_rate.toFixed(2)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <span style="color: #6b7280;">Incidents:</span>
                                <strong>${barangay.incidents}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                                <span style="color: #6b7280;">Population:</span>
                                <strong>${(barangay.population / 1000).toFixed(0)}K</strong>
                            </div>
                            <div style="margin-top: 0.75rem; padding: 0.75rem; background-color: ${colorData.color}15; border-left: 3px solid ${colorData.color}; border-radius: 4px;">
                                <div style="font-size: 0.75rem; color: #6b7280; text-transform: uppercase; font-weight: 600;">Risk Level</div>
                                <div style="font-size: 0.95rem; color: ${colorData.color}; font-weight: 700;">${riskLevel}</div>
                            </div>
                        </div>
                    </div>
                `, { maxWidth: 300 });
                
                // Add tooltip with status indicator
                circle.bindTooltip(`
                    <div style="text-align: center; white-space: nowrap;">
                        <span style="font-size: 1.1rem;">${riskEmoji}</span><br>
                        <strong>${barangay.name}</strong><br>
                        <span style="color: ${colorData.color}; font-weight: 600;">${barangay.crime_rate.toFixed(2)}/1K</span>
                    </div>
                `, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -10],
                    className: `leaflet-tooltip-${riskLevel.toLowerCase()}`
                });
                
                // Add circle to layer and track it
                hotspotLayer.addLayer(circle);
                circle.bringToFront(); // Ensure circles are above markers
                hotspotCircles.push(circle);
                
                console.log(`✅ Added circle #${hotspotCircles.length} to layer`);
            } catch (error) {
                console.error('❌ Error rendering hotspot', index, barangay.name, ':', error);
            }
        });
        
        console.log('✅ Rendered', hotspotCircles.length, 'hotspot circles with pulsing animations');
        
        // Show success notification
        if (hotspotCircles.length > 0) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                font-weight: 600;
                animation: slideInRight 0.3s ease-out;
            `;
            notification.innerHTML = `🎯 ${hotspotCircles.length} crime hotspots displayed`;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }, 2500);
        }
    }
    
    // Toggle hotspot overlay visibility
    function toggleHotspotOverlay() {
        const checkbox = document.getElementById('hotspot-overlay-toggle');
        const legend = document.getElementById('hotspot-legend');
        
        hotspotOverlayVisible = checkbox.checked;
        
        if (hotspotOverlayVisible) {
            console.log('🔴 Hotspot overlay ENABLED - showing crime intensity circles');
            // Show overlay
            legend.classList.add('active');
            if (hotspotLayer && hotspotCircles.length > 0) {
                console.log('Adding existing hotspot layer with', hotspotCircles.length, 'circles to map');
                map.addLayer(hotspotLayer);
            } else {
                console.log('Loading fresh hotspot data from API');
                loadHotspotOverlayData();
            }
            
            // Visual feedback - briefly flash the legend
            setTimeout(() => {
                legend.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    legend.style.transform = 'scale(1)';
                }, 200);
            }, 100);
            
        } else {
            console.log('⚪ Hotspot overlay DISABLED - hiding crime intensity circles');
            // Hide overlay
            legend.classList.remove('active');
            if (hotspotLayer) {
                console.log('Removing hotspot layer from map');
                map.removeLayer(hotspotLayer);
            }
        }
    }
</script>
@endsection
