@extends('layouts.app')

@section('title', 'Dashboard')

@section('styles')
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<!-- Leaflet MarkerCluster CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
        <style>
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f8fafc;
                color: #1f2937;
                line-height: 1.6;
            }
            
            .dashboard {
                display: flex;
                min-height: 100vh;
            }
            
            /* Sidebar Styles */
            .sidebar {
                width: 250px;
                background: white;
                padding: 2rem 0;
                position: fixed;
                height: 100vh;
                left: 0;
                top: 0;
                z-index: 1000;
                border-right: 1px solid #e5e7eb;
                box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
            }
            
            .sidebar-header {
                padding: 0 1.5rem;
                margin-bottom: 2rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .sidebar-title {
                color: #1D3557;
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }
            
            .sidebar-close {
                background: none;
                border: none;
                color: #6b7280;
                font-size: 1.25rem;
                margin-left: auto;
                cursor: pointer;
            }
            
            .nav-menu {
                list-style: none;
                padding: 0;
            }
            
            .nav-item {
                margin: 0.25rem 0;
            }
            
            .nav-link {
                display: flex;
                align-items: center;
                padding: 0.875rem 1.5rem;
                color: #6b7280;
                text-decoration: none;
                transition: all 0.3s ease;
                gap: 0.75rem;
                border-radius: 0.375rem;
                margin: 0.125rem 0.75rem;
            }
            
            .nav-link:hover,
            .nav-link.active {
                background: #f3f4f6;
                color: #1D3557;
                border-left: 3px solid #3b82f6;
                font-weight: 500;
            }
            
            .nav-icon {
                width: 20px;
                height: 20px;
                fill: currentColor;
            }
            
            /* Main Content */
            .main-content {
                margin-left: 250px;
                padding: 2rem;
                width: calc(100% - 250px);
            }
            
            .content-header {
                margin-bottom: 2rem;
            }
            
            .content-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            /* Stats Cards */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border-top: 1px solid #9ca3af;
                border-right: 1px solid #9ca3af;
                border-bottom: 1px solid #9ca3af;
                border-left: 4px solid #3b82f6;
                transition: all 0.3s ease;
                text-decoration: none;
                display: block;
                color: inherit;
                cursor: pointer;
            }
            
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            }
            
            .stat-card.total {
                border-left-color: #3b82f6;
            }
            
            .stat-card.verified {
                border-left-color: #10b981;
            }
            
            .stat-card.pending {
                border-left-color: #f59e0b;
            }
            
            .stat-title {
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                font-weight: 500;
            }
            
            .stat-value {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            
            /* Dashboard Grid */
            .dashboard-grid {
                display: block;
                margin-bottom: 2rem;
            }
            
            .priority-section {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border: 3px solid #3b82f6;
                width: 100%;
            }
            
            .section-title {
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: #1f2937;
            }
            
            .priority-content {
                display: grid;
                grid-template-columns: 350px 1fr;
                gap: 2rem;
                align-items: start;
            }
            
            .priority-cases {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .priority-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
            
            .priority-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .priority-dot.high {
                background-color: #dc2626;
            }
            
            .priority-dot.medium {
                background-color: #f59e0b;
            }
            
            .priority-dot.low {
                background-color: #10b981;
            }
            
            .priority-text {
                font-weight: 500;
            }
            
            .priority-count {
                font-weight: 700;
                margin-left: auto;
            }
            
            .map-placeholder {
                background: #f3f4f6;
                border-radius: 8px;
                height: 500px;
                min-height: 500px;
                width: 100%;
                position: relative;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            #dashboard-mini-map {
                height: 100%;
                width: 100%;
                border-radius: 8px;
                z-index: 1;
            }
            
            .crime-icon-with-count {
                position: relative;
            }
            
            .crime-icon-with-count::after {
                content: attr(data-count);
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .mini-map-controls {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 1000;
                display: flex;
                gap: 5px;
            }
            
            .mini-map-btn {
                background: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 0.75rem;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                font-weight: 500;
                color: #374151;
                transition: all 0.2s;
            }
            
            .mini-map-btn:hover {
                background: #f3f4f6;
                color: #3b82f6;
            }
            
            .mini-map-btn.active {
                background: #3b82f6;
                color: white;
            }
            
            .gender-chart {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .pie-chart {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                margin: 1rem auto;
                background: conic-gradient(
                    #3b82f6 0deg 180deg,
                    #10b981 180deg 300deg,
                    #6b7280 300deg 360deg
                );
                position: relative;
            }
            
            .pie-chart::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                background: white;
                border-radius: 50%;
            }
            
            .chart-legend {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                align-items: center;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
            
            .legend-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
            }
            
            .legend-dot.male {
                background-color: #3b82f6;
            }
            
            .legend-dot.female {
                background-color: #10b981;
            }
            
            .legend-dot.others {
                background-color: #6b7280;
            }
            
            /* Bottom Chart */
            .bottom-chart {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .line-chart {
                height: 200px;
                background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><rect width="400" height="200" fill="white"/><polyline points="50,150 100,130 150,120 200,110 250,100 350,80" stroke="%233b82f6" stroke-width="3" fill="none"/><circle cx="50" cy="150" r="4" fill="%233b82f6"/><circle cx="100" cy="130" r="4" fill="%233b82f6"/><circle cx="150" cy="120" r="4" fill="%233b82f6"/><circle cx="200" cy="110" r="4" fill="%233b82f6"/><circle cx="250" cy="100" r="4" fill="%233b82f6"/><circle cx="350" cy="80" r="4" fill="%233b82f6"/></svg>');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #6b7280;
            }
            
            @media (max-width: 768px) {
                .sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                }
                
                .main-content {
                    margin-left: 0;
                    width: 100%;
                }
                
                .dashboard-grid {
                    grid-template-columns: 1fr;
                }
                
                .priority-content {
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
            }
            
            /* MAP CLUSTER STYLES COPIED FROM VIEW-MAP */
            /* Professional Cluster Container */
            .professional-cluster-container {
                background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
                border: 3px solid #3b82f6;
                border-radius: 12px;
                padding: 8px;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                min-width: 80px;
                max-width: 120px;
                position: relative;
                transition: all 0.2s ease;
            }
            
            .professional-cluster-container:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
                border-color: #2563eb;
            }
            
            .cluster-icons-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 4px;
                margin-bottom: 6px;
            }
            
            .cluster-icon-item {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                border-radius: 6px;
                padding: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .cluster-icon-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 6px rgba(0,0,0,0.15);
                background: #f0f9ff;
            }
            
            .cluster-icon-item img {
                display: block;
                filter: drop-shadow(0 0 1px rgba(0,0,0,0.8)) 
                        drop-shadow(0 0 1px rgba(0,0,0,0.8));
            }
            
            .icon-count {
                position: absolute;
                top: -4px;
                right: -4px;
                background: #dc2626;
                color: white;
                font-size: 9px;
                font-weight: 700;
                padding: 1px 4px;
                border-radius: 8px;
                border: 1px solid white;
                min-width: 14px;
                text-align: center;
                line-height: 1.2;
            }
            
            .cluster-total-badge {
                background: #3b82f6;
                color: white;
                font-size: 13px;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 10px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            /* Custom cluster icon styles */
            .custom-cluster-icon {
                background: transparent !important;
                border: none !important;
            }
            
            .custom-cluster-icon div {
                text-align: center;
            }
            
            /* Marker cluster group overrides */
            .marker-cluster-small,
            .marker-cluster-medium,
            .marker-cluster-large {
                background: transparent !important;
            }
            
            .marker-cluster-small div,
            .marker-cluster-medium div,
            .marker-cluster-large div {
                background: transparent !important;
                box-shadow: none !important;
            }
            
            .custom-cluster-marker {
                background: transparent;
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
        </style>
@endsection

@section('content')
    <div class="content-header">
        @if($userRole === 'police')
            <h1 class="content-title">Police Station Dashboard</h1>
            <p class="content-subtitle">Manage reports for your assigned station</p>
        @else
            <h1 class="content-title">Dashboard Overview</h1>
            <p class="content-subtitle">System-wide statistics and overview</p>
        @endif
    </div>
                
                <!-- Statistics Cards -->
                <div class="stats-grid" @if($userRole !== 'police') style="grid-template-columns: repeat(4, 1fr);" @endif>
                    @if($userRole === 'police')
                        <!-- Police Officer Stats: Custom View -->
                        <a href="{{ route('reports') }}" class="stat-card total">
                            <div class="stat-title">Total Reports</div>
                            <div class="stat-value">{{ $totalReports }}</div>
                        </a>
                        <a href="{{ route('reports') }}" class="stat-card" style="border-left-color: #3b82f6;">
                            <div class="stat-title">Reports Today</div>
                            <div class="stat-value">{{ $reportsToday }}</div>
                        </a>
                        <a href="{{ route('messages') }}" class="stat-card pending" style="border-left-color: #f59e0b;">
                            <div class="stat-title">Unread Messages</div>
                            <div class="stat-value">{{ $unreadMessages }}</div>
                        </a>
                    @else
                        <!-- ADMIN DASHBOARD: Summary Grid -->
                        
                        <!-- 1. Reports -->
                        <a href="{{ route('reports') }}" class="stat-card total">
                            <div class="stat-title">Reports</div>
                            <div class="stat-value">{{ $totalReports }}</div>
                        </a>
                        
                        <!-- 2. Messages -->
                        <a href="{{ route('messages') }}" class="stat-card pending">
                            <div class="stat-title">Messages</div>
                            <div class="stat-value">{{ $unreadMessages }}</div>
                        </a>
                        
                        <!-- 3. Users -->
                        <a href="{{ route('users') }}" class="stat-card verified">
                            <div class="stat-title">Users</div>
                            <div class="stat-value">{{ $totalUsers }}</div>
                        </a>
                        
                        <!-- 4. Flagged Users -->
                        <a href="{{ route('flagged-users') }}" class="stat-card pending" style="border-left-color: #ef4444;">
                            <div class="stat-title">Flagged Users</div>
                            <div class="stat-value">{{ $flaggedUsersCount }}</div>
                        </a>
                        
                        <!-- 5. Personnel -->
                        <a href="{{ route('personnel') }}" class="stat-card pending" style="border-left-color: #6366f1;">
                            <div class="stat-title">Personnel</div>
                            <div class="stat-value">{{ $totalPoliceOfficers }}</div>
                        </a>
                        
                        <!-- 6. Verification -->
                        <a href="{{ route('verification') }}" class="stat-card total" style="border-left-color: #8b5cf6;">
                            <div class="stat-title">Verification</div>
                            <div class="stat-value">{{ $pendingVerificationsCount }}</div>
                        </a>
                        
                        <!-- 7. Statistics -->
                        <a href="{{ route('statistics') }}" class="stat-card verified" style="border-left-color: #10b981;">
                            <div class="stat-title">Statistics</div>
                            <div class="stat-value" style="font-size: 1.25rem;">View Analytics</div>
                        </a>
                        
                        <!-- 8. View Map -->
                        <a href="{{ route('view-map') }}" class="stat-card total" style="border-left-color: #3b82f6;">
                            <div class="stat-title">Crime Map</div>
                            <div class="stat-value" style="font-size: 1.25rem;">Open Live Map</div>
                        </a>
                    @endif
                </div>
                
                @if($userRole === 'police')
                <!-- Priority Cases and Map (POLICE ONLY) -->
                <div class="dashboard-grid">
                    <div class="priority-section">
                        <h2 class="section-title">Crime Map by Barangay</h2>
                        <div class="priority-content">
                            <div class="priority-cases">
                                <!-- Police View Content -->
                                <div style="margin-bottom: 1rem;">
                                    <label style="display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">FILTER BY BARANGAY</label>
                                    <select id="barangay-filter" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                                        <option value="">All Barangays</option>
                                    </select>
                                </div>
                                <div style="margin-bottom: 1rem;">
                                    <label style="display: block; font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">FILTER BY CRIME TYPE</label>
                                    <select id="crime-type-filter" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem;">
                                        <option value="">All Crime Types</option>
                                    </select>
                                </div>
                                <button onclick="applyDashboardFilters()" style="width: 100%; padding: 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer; margin-bottom: 0.5rem;">Apply Filters</button>
                                <button onclick="resetDashboardFilters()" style="width: 100%; padding: 0.5rem; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 0.875rem; cursor: pointer;">Reset</button>
                            </div>
                            
                            <div class="map-placeholder">
                                <div id="dashboard-mini-map"></div>
                            </div>
                        </div>
                    </div>
                </div>
                @endif
@endsection

@section('scripts')
<!-- Leaflet JavaScript -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<!-- Leaflet MarkerCluster JavaScript -->
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>

<script>
    // Global variables for mini map
    let miniMap;
    let miniMarkers = [];
    let miniMarkerClusterGroup; // Cluster group for performance
    let miniReports = [];
    let miniBarangays = [];
    let miniCrimeTypes = [];
    
    // Crime type to icon mapping (complete mapping from view-map)
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
        
        // Financial & Cyber
        'fraud': '/legends/bookmarkFRAUD.png',
        'cyber crime': '/legends/webCyberCRIME.png',
        'cybercrime': '/legends/webCyberCRIME.png',
        'hacking': '/legends/webCyberCRIME.png',
        
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
    
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            // Initialize the mini map centered on Davao City with bounds restriction
            miniMap = L.map('dashboard-mini-map', {
                zoomControl: true, // Enabled zoom control for better UX
                attributionControl: false,
                maxBounds: davaoCityBounds,
                maxBoundsViscosity: 1.0,
                minZoom: 11,
                maxZoom: 18
            }).setView([7.1907, 125.4553], 12);
    
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '',
                maxZoom: 18,
            }).addTo(miniMap);
            
            // Initialize marker cluster group with custom icons (NO ANIMATIONS)
            miniMarkerClusterGroup = L.markerClusterGroup({
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                spiderfyOnMaxZoom: false, // Disable spider animation
                animate: false,           // Disable all animations
                animateAddingMarkers: false,
                disableClusteringAtZoom: 16,
                removeOutsideVisibleBounds: true,
                chunkedLoading: true,
                chunkInterval: 200,
                chunkDelay: 50,
                iconCreateFunction: function(cluster) {
                    const childMarkers = cluster.getAllChildMarkers();
                    const crimeTypes = new Map(); // Use Map to track counts
                    
                    // Collect crime types with counts from all markers in cluster
                    childMarkers.forEach(marker => {
                        // We store crimeType in the marker options for easy access
                        if (marker.options.crimeType) {
                            const type = marker.options.crimeType.toLowerCase();
                            crimeTypes.set(type, (crimeTypes.get(type) || 0) + 1);
                        }
                    });
                    
                    // Get top 6 crime types by count
                    const sortedTypes = Array.from(crimeTypes.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 6);
                    
                    const count = childMarkers.length;
                    
                    // Build crime type icons HTML with tooltips
                    let iconsHtml = '';
                    sortedTypes.forEach(([type, typeCount]) => {
                        const icon = getCrimeIcon(type);
                        if (icon) {
                            iconsHtml += `<div class="cluster-icon-item" title="${type}: ${typeCount}">
                                <img src="${icon}" style="width: 20px; height: 20px;" alt="${type}"/>
                                <span class="icon-count">${typeCount}</span>
                            </div>`;
                        }
                    });
                    
                    // Professional cluster container with crime icons
                    const clusterHtml = `
                        <div class="professional-cluster-container" title="${count} total crimes">
                            <div class="cluster-icons-grid">
                                ${iconsHtml}
                            </div>
                            <div class="cluster-total-badge">${count}</div>
                        </div>
                    `;
                    
                    // Use larger icon size to prevent clipping since content is ~80-120px wide
                    return L.divIcon({
                        html: clusterHtml,
                        className: 'custom-cluster-icon',
                        iconSize: L.point(100, 100),
                        iconAnchor: L.point(50, 50)
                    });
                }
            });
            
            // Add cluster group to map
            miniMap.addLayer(miniMarkerClusterGroup);
            
            // Load initial data
            loadMiniMapReports();
        }, 100);
    });
    
    // Function to load reports from API
    function loadMiniMapReports(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const url = '{{ route("api.reports") }}' + (params ? '?' + params : '');
        
        console.log('Loading mini map reports from:', url);
        
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                // Check content type
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    return response.json();
                } else {
                    console.error('Expected JSON response but got:', contentType);
                    return response.text().then(text => {
                        throw new Error('Server returned non-JSON response');
                    });
                }
            })
            .then(data => {
                console.log('Reports count:', data.reports ? data.reports.length : 0);
                
                miniReports = data.reports || [];
                miniBarangays = data.barangays || [];
                miniCrimeTypes = data.crime_types || [];
                
                // Populate filter dropdowns
                populateBarangayFilter();
                populateCrimeTypeFilter();
                
                updateMiniMapMarkers(miniReports);
            })
            .catch(error => {
                console.error('Error loading mini map reports:', error);
                // Silent fail for dashboard is better than alert loop
            });
    }
    
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
    
    // Shared clean text function
    function cleanText(str) {
        return cleanCrimeType(str);
    }
    
    // Function to get icon for crime type
    function getCrimeIcon(crimeType) {
        if (!crimeType) return null;
        
        // Clean the crime type name first
        const cleanedType = cleanCrimeType(crimeType);
        const normalizedType = cleanedType.toLowerCase().trim();
        return crimeIcons[normalizedType] || null;
    }
    
    // Function to get color for crime type (for popups)
    function getCrimeColor(offense) {
        if (!offense) return '#6b7280';
        const offenseLower = offense.toLowerCase();
        
        if (offenseLower.includes('physical injury') || offenseLower.includes('assault') || offenseLower.includes('murder') || offenseLower.includes('homicide')) return '#dc2626';
        if (offenseLower.includes('theft') || offenseLower.includes('robbery') || offenseLower.includes('burglary')) return '#ea580c';
        if (offenseLower.includes('drug')) return '#7c2d12';
        return '#3b82f6';
    }

    // Function to create custom marker icon
    function createCrimeMarker(crimeType) {
        const iconUrl = getCrimeIcon(crimeType);
        
        if (iconUrl) {
            // Single crime with custom icon
            return L.icon({
                iconUrl: iconUrl,
                iconSize: [28, 28],
                iconAnchor: [14, 14],
                popupAnchor: [0, -14]
            });
        } else {
            // Default marker for unknown crime type
            return L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #6b7280; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
        }
    }
    
     function populateBarangayFilter() {
         const select = document.getElementById('barangay-filter');
         const currentValue = select.value;
         
         // Keep "All Barangays" option
         select.innerHTML = '<option value="">All Barangays</option>';
         
         miniBarangays.forEach(barangay => {
             const option = document.createElement('option');
             const cleanedBarangay = cleanText(barangay);
             option.value = cleanedBarangay;
             option.textContent = cleanedBarangay;
             select.appendChild(option);
         });
         
         select.value = currentValue;
     }
     
     function populateCrimeTypeFilter() {
         const select = document.getElementById('crime-type-filter');
         const currentValue = select.value;
         
         // Keep "All Crime Types" option
         select.innerHTML = '<option value="">All Crime Types</option>';
         
         miniCrimeTypes.forEach(crimeType => {
             const option = document.createElement('option');
             const cleanedCrimeType = cleanText(crimeType);
             option.value = cleanedCrimeType;
             option.textContent = cleanedCrimeType.charAt(0).toUpperCase() + cleanedCrimeType.slice(1);
             select.appendChild(option);
         });
         
         select.value = currentValue;
     }
    
    // Function to update map markers
    function updateMiniMapMarkers(reports) {
        if (!miniMap || !reports) return;
        console.log('Updating mini map markers with', reports.length, 'reports');
        
        // Clear existing markers from cluster group
        if (miniMarkerClusterGroup) {
            miniMarkerClusterGroup.clearLayers();
        }
        miniMarkers = [];
        
        // Prepare markers
        const markersToAdd = [];
        
        reports.forEach(report => {
            // Support both naming conventions (lat/lng vs latitude/longitude)
            const lat = parseFloat(report.lat || report.latitude);
            const lng = parseFloat(report.lng || report.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return;
            
            // Determine crime type
            let crimeType = 'other';
            let dateCommitted = 'N/A';
            let timeCommitted = '';
            
            if (report.crimes && report.crimes.length > 0) {
                // If it's a cluster/group of crimes
                crimeType = report.crimes[0].crime_type;
                dateCommitted = report.crimes[0].date_committed || 'N/A';
            } else if (report.crime_type) {
                // Single report
                crimeType = report.crime_type;
                dateCommitted = report.date_committed || 'N/A';
                timeCommitted = report.time_committed || '';
            } else if (report.offense) {
                // CSV data format
                crimeType = report.offense;
                dateCommitted = report.date_committed || 'N/A';
                timeCommitted = report.time_committed || '';
            }
            
            const markerIcon = createCrimeMarker(crimeType);
            const marker = L.marker([lat, lng], { 
                icon: markerIcon,
                crimeType: crimeType // Store for cluster function
            });
            
            // Create popup content
            let popupContent = `
                <div style="min-width: 200px;">
                    <div style="font-weight: 700; font-size: 1rem; color: #1f2937; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb;">
                        ${cleanText(crimeType)}
                    </div>
                    <div style="font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem;">
                        <strong>Location:</strong> ${report.barangay || 'Unknown'}
                    </div>
                    <div style="font-size: 0.85rem; color: #6b7280;">
                        <strong>Date:</strong> ${dateCommitted} ${timeCommitted}
                    </div>
                    ${report.status ? `<div style="margin-top: 0.5rem; display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${report.status === 'resolved' ? '#dcfce7' : '#fef9c3'}; color: ${report.status === 'resolved' ? '#166534' : '#854d0e'}; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">${report.status}</div>` : ''}
                </div>
            `;
            
            marker.bindPopup(popupContent, {
                className: 'custom-popup'
            });
            
            markersToAdd.push(marker);
        });
        
        // Add all markers to cluster group at once
        if (markersToAdd.length > 0) {
            miniMarkerClusterGroup.addLayers(markersToAdd);
            
            // Fit bounds to show markers if not filtering by default
            if (markersToAdd.length < 500) { 
                miniMap.fitBounds(miniMarkerClusterGroup.getBounds().pad(0.1));
            }
        }
    }
    
    // Filter functions
    window.applyDashboardFilters = function() {
        const barangay = document.getElementById('barangay-filter').value;
        const crimeType = document.getElementById('crime-type-filter').value;
        
        const filters = {};
        if (barangay) filters.barangay = barangay;
        if (crimeType) filters.crime_type = crimeType;
        
        loadMiniMapReports(filters);
    };
    
    window.resetDashboardFilters = function() {
        document.getElementById('barangay-filter').value = '';
        document.getElementById('crime-type-filter').value = '';
        loadMiniMapReports({});
    };
    // Auto-refresh dashboard stats every 3 seconds
    function checkForNewStats() {
        fetch('{{ route("dashboard") }}', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Update stat values
            const statCards = document.querySelectorAll('.stat-value');
            const newStatCards = doc.querySelectorAll('.stat-value');
            let hasUpdates = false;
            
            statCards.forEach((card, index) => {
                if (newStatCards[index] && card.textContent !== newStatCards[index].textContent) {
                    console.log('📊 Dashboard stat updated:', card.parentElement.querySelector('.stat-title').textContent, card.textContent, '→', newStatCards[index].textContent);
                    card.textContent = newStatCards[index].textContent;
                    hasUpdates = true;
                    // Add flash animation
                    card.style.animation = 'flash 0.5s';
                    setTimeout(() => {
                        card.style.animation = '';
                    }, 500);
                }
            });
            
            if (hasUpdates) {
                console.log('✅ Dashboard statistics updated successfully');
            }
        })
        .catch(error => {
            console.error('❌ Error checking for new stats:', error);
        });
    }
    
    // Start auto-refresh when page loads
    console.log('🔄 Dashboard auto-refresh enabled - Checking every 3 seconds for all users');
    setInterval(checkForNewStats, 3000);
</script>

<style>
@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; background-color: #fef3c7; }
}
</style>
@endsection
