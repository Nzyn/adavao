@extends('layouts.app')

@section('title', 'Patrol Dispatches')

@section('styles')
<style>
    /* Copied/Adapted from reports.blade.php */
    .reports-container {
        padding: 1.5rem;
    }

    .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .reports-table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow-x: auto;
        overflow-y: visible;
    }

    .reports-table {
        width: 100%;
        min-width: 1200px;
        border-collapse: collapse;
    }

    .reports-table th {
        padding: 0.5rem 0.35rem;
        text-align: left;
        font-size: 0.7rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        user-select: none;
        position: relative;
        background-color: #f9fafb;
    }

    .reports-table td {
        padding: 0.5rem 0.35rem;
        font-size: 0.8rem;
        color: #374151;
        border-bottom: 1px solid #f3f4f6;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .reports-table tr:hover {
        background-color: #f9fafb;
    }

    /* Badges */
    .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-align: center;
    }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.red { background: #fee2e2; color: #991b1b; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.gray { background: #f3f4f6; color: #374151; }

    .urgency-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-align: center;
    }
    .urgency-critical { background-color: #fee2e2; color: #991b1b; }
    .urgency-high { background-color: #fed7aa; color: #9a3412; }
    .urgency-medium { background-color: #fef3c7; color: #92400e; }
    .urgency-low { background-color: #f3f4f6; color: #6b7280; }

    .sla-timer {
        font-family: monospace;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        min-width: 60px;
        text-align: center;
    }
    .sla-timer.countdown { background-color: #dbeafe; color: #1e40af; }
    .sla-timer.exceeded { background-color: #fee2e2; color: #991b1b; }

    .validity-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: capitalize;
    }
    .validity-badge.valid { color: #065f46; background-color: #d1fae5; }
    .validity-badge.invalid { color: #991b1b; background-color: #fee2e2; }
    .validity-badge.checking_for_report_validity { color: #3730a3; background-color: #e0e7ff; }

    /* Action Buttons */
    .action-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
    }
    .action-btn:hover {
        background-color: #f3f4f6;
    }

    /* Modal Styles */
    .modal {
        display: none; 
        position: fixed; 
        z-index: 1000; 
        left: 0;
        top: 0;
        width: 100%; 
        height: 100%; 
        overflow: auto; 
        background-color: rgba(0,0,0,0.5); 
    }
    .modal-content {
        background-color: #fefefe;
        margin: 5% auto; 
        padding: 20px;
        border: 1px solid #888;
        width: 80%; 
        max-width: 800px;
        border-radius: 12px;
    }
    .close {
        color: #aaa;
        float: right;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
    }
    .close:hover, .close:focus {
        color: black;
        text-decoration: none;
        cursor: pointer;
    }
    
    /* Report Detail Styles inside Modal */
    .report-info-section {
        padding: 1rem;
    }
    .info-row {
        display: flex;
        gap: 2rem;
        margin-bottom: 1rem;
    }
    .detail-item {
        flex: 1;
    }
    .detail-label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    .detail-value {
        font-size: 0.95rem;
        font-weight: 500;
        color: #111827;
    }
</style>
@endsection

@section('content')
<div class="reports-container">
    <div class="header-section">
        <h1>🚓 Patrol Dispatches</h1>
        <!-- Filter Bar can be added here -->
    </div>

    <div class="reports-table-container">
        <table class="reports-table">
            <thead>
                <tr>
                    <th style="width: 70px;">Report ID</th>
                    <th style="width: 100px;">User</th>
                    <th style="width: 80px;">Urgency</th>
                    <th style="width: 120px;">SLA Status</th>
                    <th style="width: 110px;">Validated At</th>
                    <th style="width: 100px;">Date</th>
                    <th style="width: 120px;">Patrol Dispatched</th>
                    <th style="width: 100px;">Validity</th>
                    <th style="width: 120px;">Personnel Incharge</th>
                    <th style="width: 80px;">Details</th>
                    <th style="width: 60px;">Transfer</th>
                </tr>
            </thead>
            <tbody>
                @forelse($dispatches as $dispatch)
                    <tr>
                        <td>#{{ $dispatch->report_id }}</td>
                        <td>{{ $dispatch->report->user->name ?? 'Anonymous' }}</td>
                        <td>
                            @php $urgency = $dispatch->report->urgency_score ?? 0; @endphp
                            <span class="urgency-badge urgency-{{ $urgency >= 80 ? 'critical' : ($urgency >= 50 ? 'high' : ($urgency >= 20 ? 'medium' : 'low')) }}">
                                {{ $urgency }}
                            </span>
                        </td>
                        <td>
                            @if($dispatch->report->validated_at)
                                @php
                                    $diffInSeconds = Carbon\Carbon::parse($dispatch->report->created_at)->diffInSeconds($dispatch->report->validated_at);
                                    $isWithinSLA = $diffInSeconds <= 180;
                                    $minutes = floor($diffInSeconds / 60);
                                    $seconds = $diffInSeconds % 60;
                                    $timeString = sprintf('%02d:%02d', $minutes, $seconds);
                                @endphp
                                @if($isWithinSLA)
                                    <span class="badge green">Within SLA</span>
                                @else
                                    <span class="badge red">Exceeded (+{{ $timeString }})</span>
                                @endif
                            @else
                                <div class="sla-timer" data-created-at="{{ $dispatch->report->created_at->timestamp }}">Pending</div>
                            @endif
                        </td>
                        <td>{{ optional($dispatch->report->validated_at)->format('Y-m-d H:i') ?? '-' }}</td>
                        <td>{{ $dispatch->report->created_at->format('Y-m-d') }}</td>
                        <td>{{ optional($dispatch->dispatched_at)->format('Y-m-d H:i') }}</td>
                        <td>
                            <span class="validity-badge {{ $dispatch->report->is_valid }}">
                                {{ ucfirst(str_replace('_', ' ', $dispatch->report->is_valid)) }}
                            </span>
                        </td>
                        <td>{{ $dispatch->patrolOfficer->name ?? 'Unassigned' }}</td>
                        <td>
                            <button class="action-btn" onclick="showReportDetails({{ $dispatch->report_id }})" title="View Details">👁️</button>
                        </td>
                        <td>
                             <button class="action-btn" title="Transfer Patrol" onclick="openTransferModal({{ $dispatch->report_id }})">🔁</button>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="11" style="text-align: center; padding: 2rem;">No dispatches found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
    
    <div style="margin-top: 1rem;">
        {{ $dispatches->links() }}
    </div>
</div>

<!-- Details Modal -->
<div id="detailsModal" class="modal">
    <div class="modal-content">
        <span class="close" onclick="closeModal()">&times;</span>
        <div id="modalBody">Loading...</div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    // SLA Timer Logic
    function updateSLATimers() {
        const timers = document.querySelectorAll('.sla-timer');
        const now = Math.floor(Date.now() / 1000);
        
        timers.forEach(timer => {
            const createdAt = parseInt(timer.getAttribute('data-created-at'));
            if (!createdAt) return;
            
            const elapsedSeconds = now - createdAt;
            const threeMinutes = 180;
            
            if (elapsedSeconds < threeMinutes) {
                const remainingSeconds = threeMinutes - elapsedSeconds;
                const minutes = Math.floor(remainingSeconds / 60);
                const seconds = remainingSeconds % 60;
                timer.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                timer.className = 'sla-timer countdown';
            } else {
                const exceededSeconds = elapsedSeconds - threeMinutes;
                const minutes = Math.floor(exceededSeconds / 60);
                const seconds = exceededSeconds % 60;
                timer.textContent = '+' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
                timer.className = 'sla-timer exceeded';
            }
        });
    }
    
    // Start timers
    updateSLATimers();
    setInterval(updateSLATimers, 1000);

    // Modal Functions
    function closeModal() {
        document.getElementById('detailsModal').style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == document.getElementById('detailsModal')) {
            closeModal();
        }
    }

    function showReportDetails(reportId) {
        const modal = document.getElementById('detailsModal');
        const modalBody = document.getElementById('modalBody');
        modal.style.display = 'block';
        modalBody.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading details...</div>';

        const userId = '{{ auth()->id() }}';

        fetch(`/reports/${reportId}/details`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const report = data.data;
                    
                    // Helper checks
                    const getType = (t) => Array.isArray(t) ? t.join(', ') : (t || 'N/A');
                    const formatDate = (d) => d ? new Date(d).toLocaleString() : 'N/A';
                    
                    const html = `
                        <div class="report-info-section">
                            <h3>🚨 Report #${report.report_id}</h3>
                             <div class="info-row">
                                <div class="detail-item">
                                    <div class="detail-label">Title</div>
                                    <div class="detail-value">${report.title || 'No Title'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Type</div>
                                    <div class="detail-value">${getType(report.report_type)}</div>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="detail-item">
                                    <div class="detail-label">Description</div>
                                    <div class="detail-value">${report.description || 'No description'}</div>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="detail-item">
                                    <div class="detail-label">Location</div>
                                    <div class="detail-value">${report.location ? (report.location.address || report.location.barangay || 'Unknown') : 'Unknown'}</div>
                                </div>
                            </div>
                            <div class="info-row">
                                <div class="detail-item">
                                    <div class="detail-label">Reported By</div>
                                    <div class="detail-value">${report.user ? (report.user.firstname + ' ' + report.user.lastname) : 'Anonymous'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Date Reported</div>
                                    <div class="detail-value">${formatDate(report.date_reported || report.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    modalBody.innerHTML = html;
                } else {
                    modalBody.innerHTML = '<p class="text-danger">Failed to load details.</p>';
                }
            })
            .catch(err => {
                console.error(err);
                modalBody.innerHTML = '<p class="text-danger">Error loading details.</p>';
            });
    }

    function openTransferModal(reportId) {
        // Placeholder for transfer functionality as implementation is complex
        alert('Transfer/Reassign functionality will be available via the main Reports page or can be implemented here.');
    }
</script>
@endsection
