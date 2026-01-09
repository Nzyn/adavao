@extends('layouts.app')

@section('title', 'Flagged Users')

@section('styles')
<style>
    .flagged-users-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .flagged-users-title-section h1 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
    }
    
    .flagged-users-title-section p {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .search-box {
        position: relative;
        width: 300px;
    }
    
    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.875rem;
        transition: all 0.2s ease;
    }
    
    .search-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 18px;
        height: 18px;
        fill: #9ca3af;
    }
    
    .flagged-users-table-container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
    
    .flagged-users-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .flagged-users-table thead {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
    }
    
    .flagged-users-table th {
        padding: 1rem 1.5rem;
        text-align: left;
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .flagged-users-table td {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.875rem;
    }
    
    .flagged-users-table tbody tr:hover {
        background: #f9fafb;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 1rem;
    }
    
    .user-details-name {
        font-weight: 600;
        color: #1f2937;
    }
    
    .user-details-email {
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    .badge {
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }
    
    .badge-warning {
        color: #92400e;
        font-weight: 600;
    }
    
    .badge-suspended {
        color: #991b1b;
        font-weight: 600;
    }
    
    .badge-banned {
        color: #1f2937;
        font-weight: 600;
    }
    
    .badge-flagged {
        color: #991b1b;
        font-weight: 600;
    }
    
    .flag-badge {
        color: #dc2626;
        font-size: 0.75rem;
        font-weight: 600;
    }
    
    .actions-cell {
        display: flex;
        gap: 0.5rem;
    }
    
    .action-btn {
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
    }
    
    .action-btn.success {
        background: #10b981;
        color: white;
    }
    
    .action-btn.success:hover {
        background: #059669;
    }
    
    .action-btn.info {
        background: #3b82f6;
        color: white;
    }
    
    .action-btn.info:hover {
        background: #2563eb;
    }
    
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        color: #6b7280;
    }
    
    .empty-state svg {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        fill: #d1d5db;
    }
    
    .empty-state h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
    }
    .modal-overlay {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }
    
    .modal-overlay.active {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .modal-content {
        background-color: #fefefe;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .modal-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }
    
    .modal-close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
@endsection

@section('content')
<div class="flagged-users-header">
    <div class="flagged-users-title-section">
        <h1>Flagged Users</h1>
        <p>Manage users with active flags and restrictions</p>
    </div>
    
    <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        <input type="text" id="searchInput" class="search-input" placeholder="Search flagged users...">
    </div>
</div>

<div class="flagged-users-table-container">
    @if($users->count() > 0)
    <table class="flagged-users-table" id="flaggedUsersTable">
        <thead>
            <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Flags</th>
                <th>Restriction</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr data-search="{{ strtolower($user->name . ' ' . $user->email . ' ' . ($user->phone ?? '')) }}">
                <td>
                    <div class="user-info">
                        <div class="user-avatar">{{ strtoupper(substr($user->name, 0, 1)) }}</div>
                        <div class="user-details-name">{{ $user->name }}</div>
                    </div>
                </td>
                <td class="user-details-email">{{ $user->email }}</td>
                <td>{{ $user->phone ?? 'N/A' }}</td>
                <td>
                    <span class="flag-badge">{{ $user->total_flags ?? 0 }} flags</span>
                </td>
                <td>
                    @php
                        $restrictionLevel = $user->restriction_level ?? 'none';
                    @endphp
                    @if($restrictionLevel === 'warning')
                        <span class="badge badge-warning">Warning</span>
                    @elseif($restrictionLevel === 'suspended')
                        <span class="badge badge-suspended">Suspended</span>
                    @elseif($restrictionLevel === 'banned')
                        <span class="badge badge-banned">Banned</span>
                    @else
                        <span class="badge badge-warning">Flagged</span>
                    @endif
                </td>
                <td>
                    @php
                        $totalFlags = $user->total_flags ?? 0;
                        $restrictionLevel = $user->restriction_level ?? 'none';
                        $isFlagged = $totalFlags > 0 || $restrictionLevel !== 'none';
                    @endphp
                    @if($isFlagged)
                        <span class="badge badge-flagged">Flagged</span>
                    @endif
                </td>
                <td>
                    <div class="actions-cell">
                        <button 
                            class="action-btn success"
                            onclick="unflagUser({{ $user->id }})"
                            title="Remove all flags and lift restrictions">
                            Remove Flags
                        </button>
                        <button 
                            class="action-btn info"
                            onclick="viewFlagHistory({{ $user->id }})"
                            title="View flag history">
                            View History
                        </button>
                    </div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <div class="empty-state">
        <svg viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <h3>No Flagged Users</h3>
        <p>All users are in good standing</p>
    </div>
    @endif
</div>

<div class="modal-overlay" id="flagHistoryModal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Flag History</h2>
            <button class="modal-close-btn" onclick="closeFlagHistoryModal()">&times;</button>
        </div>
        <div id="flagHistoryContent" style="overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 100px;">
            <div style="text-align: center; color: #6b7280; padding: 2rem;">Loading...</div>
        </div>
        <div style="margin-top: 1rem; text-align: right; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
            <button onclick="closeFlagHistoryModal()" class="action-btn" style="background: #e5e7eb; color: #374151;">Close</button>
        </div>
    </div>
</div>

<script>
function closeFlagHistoryModal() {
    document.getElementById('flagHistoryModal').classList.remove('active');
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
// Search functionality
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#flaggedUsersTable tbody tr');
    
    rows.forEach(row => {
        const searchData = row.getAttribute('data-search');
        if (searchData.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Unflag user function
async function unflagUser(userId) {
    console.log('Attempting to unflag user:', userId);
    
    if (typeof customConfirm === 'function') {
        const confirmed = await customConfirm(
            'Are you sure you want to remove all flags and lift restrictions for this user?',
            'Confirm Unflag'
        );
        if (!confirmed) return;
    } else {
        if (!confirm('Are you sure you want to remove all flags and lift restrictions for this user?')) {
            return;
        }
    }

    try {
        const response = await fetch(`/users/${userId}/unflag`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });

        console.log('Unflag response status:', response.status);
        const data = await response.json();
        console.log('Unflag response data:', data);

        if (data.success) {
            if (typeof customAlert === 'function') {
                await customAlert('User has been unflagged successfully', 'Success');
            } else {
                alert('User has been unflagged successfully');
            }
            setTimeout(() => location.reload(), 500);
        } else {
            if (typeof customAlert === 'function') {
                await customAlert(data.message || 'Failed to unflag user', 'Error');
            } else {
                alert(data.message || 'Failed to unflag user');
            }
        }
    } catch (error) {
        console.error('Error unflagging user:', error);
        if (typeof customAlert === 'function') {
            await customAlert('An error occurred while unflagging the user: ' + error.message, 'Error');
        } else {
            alert('An error occurred while unflagging the user: ' + error.message);
        }
    }
}

// View flag history function
async function viewFlagHistory(userId) {
    // Open modal with loading state
    const modal = document.getElementById('flagHistoryModal');
    const contentDiv = document.getElementById('flagHistoryContent');
    contentDiv.innerHTML = '<div style="text-align: center; color: #6b7280; padding: 2rem;">Loading...</div>';
    modal.classList.add('active');

    try {
        const response = await fetch(`/api/users/${userId}/flags`);
        const data = await response.json();
        
        if (data.success && data.flags) {
            let historyHtml = '';
            
            if (data.flags.length === 0) {
                historyHtml = '<p style="text-align: center; color: #6b7280; padding: 1rem;">No flag history found.</p>';
            } else {
                data.flags.forEach(flag => {
                    historyHtml += `
                        <div style="border-bottom: 1px solid #e5e7eb; padding: 1rem 0;">
                            <div style="margin-bottom: 0.25rem;"><strong>Type:</strong> ${escapeHtml(flag.violation_type)}</div>
                            <div style="margin-bottom: 0.25rem;"><strong>Reason:</strong> ${escapeHtml(flag.reason || 'N/A')}</div>
                            <div style="margin-bottom: 0.25rem;">
                                <strong>Status:</strong> 
                                <span class="badge ${flag.status === 'active' ? 'badge-flagged' : 'badge-warning'}" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">
                                    ${escapeHtml(flag.status)}
                                </span>
                            </div>
                            <div style="margin-bottom: 0.25rem;"><strong>Date:</strong> ${new Date(flag.created_at).toLocaleString()}</div>
                            <div><strong>Flagged By:</strong> ${escapeHtml(flag.flagged_by_name || 'Unknown')}</div>
                        </div>
                    `;
                });
            }
            
            contentDiv.innerHTML = historyHtml;
        } else {
            contentDiv.innerHTML = '<p style="color: #dc2626; text-align: center;">Failed to load data.</p>';
        }
    } catch (error) {
        console.error('Error fetching flag history:', error);
        contentDiv.innerHTML = '<p style="color: #dc2626; text-align: center;">Error loading history: ' + escapeHtml(error.message) + '</p>';
    }
}
</script>
@endsection
