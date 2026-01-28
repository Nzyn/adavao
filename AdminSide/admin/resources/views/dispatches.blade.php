@extends('layouts.app')

@section('title', 'Patrol Dispatches')

@section('styles')
<style>
    .dispatches-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .dispatches-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .dispatch-card {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .dispatch-card .label {
        font-size: 0.8rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .dispatch-card .value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #111827;
    }

    .filter-bar {
        background: white;
        border-radius: 12px;
        padding: 1.25rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        margin-bottom: 1.5rem;
    }

    .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        align-items: end;
    }

    .filter-grid label {
        display: block;
        font-size: 0.85rem;
        color: #374151;
        font-weight: 600;
        margin-bottom: 0.4rem;
    }

    .filter-grid select,
    .filter-grid input {
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 0.9rem;
    }

    .filter-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        flex-wrap: wrap;
        margin-top: 0.75rem;
    }

    .btn {
        padding: 0.6rem 0.9rem;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        background: white;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .btn.primary {
        background: #1D3557;
        border-color: #1D3557;
        color: white;
    }

    .table-wrap {
        background: white;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    thead {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    th, td {
        padding: 0.9rem 1rem;
        text-align: left;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.9rem;
        vertical-align: top;
    }

    th {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
    }

    .badge {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .badge.gray { background: #f3f4f6; color: #374151; }
    .badge.blue { background: #dbeafe; color: #1e40af; }
    .badge.yellow { background: #fef3c7; color: #92400e; }
    .badge.purple { background: #ede9fe; color: #5b21b6; }
    .badge.green { background: #d1fae5; color: #065f46; }
    .badge.red { background: #fee2e2; color: #991b1b; }

    .muted {
        color: #6b7280;
        font-size: 0.85rem;
    }

    .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.85rem;
        color: #374151;
    }
</style>
@endsection

@section('content')
<div class="dispatches-container">
    <div class="content-header">
        <h1 class="content-title">🚓 Patrol Dispatches</h1>
        <p class="content-subtitle">Track dispatch lifecycle and 3-minute response compliance.</p>
    </div>

    <div class="dispatches-grid">
        <div class="dispatch-card">
            <div class="label">Total Dispatches</div>
            <div class="value">{{ number_format($stats['total'] ?? 0) }}</div>
        </div>
        <div class="dispatch-card">
            <div class="label">Active</div>
            <div class="value">{{ number_format($stats['active'] ?? 0) }}</div>
        </div>
        <div class="dispatch-card">
            <div class="label">Completed</div>
            <div class="value">{{ number_format($stats['completed'] ?? 0) }}</div>
        </div>
        <div class="dispatch-card">
            <div class="label">3-Min Compliance</div>
            <div class="value">{{ ($stats['three_minute_compliance'] ?? 0) }}%</div>
            <div class="muted">Based on dispatches with arrival time</div>
        </div>
        <div class="dispatch-card">
            <div class="label">Avg Response Time</div>
            <div class="value">{{ number_format($stats['avg_response_time'] ?? 0) }}s</div>
            <div class="muted">Arrival minus dispatched time</div>
        </div>
    </div>

    <div class="filter-bar">
        <form method="GET" action="{{ route('dispatches') }}">
            <div class="filter-grid">
                <div>
                    <label for="status">Status</label>
                    <select id="status" name="status">
                        @php($statusVal = request('status', 'all'))
                        <option value="all" {{ $statusVal === 'all' ? 'selected' : '' }}>All</option>
                        <option value="pending" {{ $statusVal === 'pending' ? 'selected' : '' }}>Pending</option>
                        <option value="accepted" {{ $statusVal === 'accepted' ? 'selected' : '' }}>Accepted</option>
                        <option value="declined" {{ $statusVal === 'declined' ? 'selected' : '' }}>Declined</option>
                        <option value="en_route" {{ $statusVal === 'en_route' ? 'selected' : '' }}>En Route</option>
                        <option value="arrived" {{ $statusVal === 'arrived' ? 'selected' : '' }}>Arrived</option>
                        <option value="completed" {{ $statusVal === 'completed' ? 'selected' : '' }}>Completed</option>
                        <option value="cancelled" {{ $statusVal === 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                    </select>
                </div>

                <div>
                    <label for="station_id">Station</label>
                    <select id="station_id" name="station_id">
                        <option value="">All</option>
                        @foreach($stations as $station)
                            <option value="{{ $station->station_id }}" {{ (string)request('station_id') === (string)$station->station_id ? 'selected' : '' }}>
                                {{ $station->station_name }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label for="officer_id">Patrol Officer</label>
                    <select id="officer_id" name="officer_id">
                        <option value="">All</option>
                        @foreach($officers as $officer)
                            <option value="{{ $officer->id }}" {{ (string)request('officer_id') === (string)$officer->id ? 'selected' : '' }}>
                                {{ $officer->name ?? ($officer->firstname . ' ' . $officer->lastname) }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label for="date_from">From</label>
                    <input id="date_from" type="date" name="date_from" value="{{ request('date_from') }}" />
                </div>

                <div>
                    <label for="date_to">To</label>
                    <input id="date_to" type="date" name="date_to" value="{{ request('date_to') }}" />
                </div>
            </div>

            <div class="filter-actions">
                <button type="submit" class="btn primary">Apply</button>
                <a class="btn" href="{{ route('dispatches') }}">Clear</a>
            </div>
        </form>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Dispatch</th>
                    <th>Report</th>
                    <th>Crime</th>
                    <th>Station</th>
                    <th>Officer</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                    <th>3-Min Rule</th>
                    <th>Time Remaining</th>
                    <th>Response</th>
                </tr>
            </thead>
            <tbody>
                @forelse($dispatches as $dispatch)
                    @php
                        $statusColor = $dispatch->status_color ?? 'gray';
                        $ruleBadge = $dispatch->three_minute_rule_badge ?? 'gray';

                        $timeRemaining = $dispatch->time_remaining ?? 0;
                        $isOverdue = $dispatch->is_overdue ?? false;
                        $hasRuleResult = !is_null($dispatch->three_minute_rule_met);

                        $formatSeconds = function ($seconds) {
                            $seconds = (int)abs($seconds);
                            $m = intdiv($seconds, 60);
                            $s = $seconds % 60;
                            return sprintf('%02d:%02d', $m, $s);
                        };
                    @endphp
                    <tr>
                        <td class="mono">#{{ $dispatch->dispatch_id }}</td>
                        <td class="mono">#{{ $dispatch->report_id }}</td>
                        <td>
                            {{ is_string($dispatch->report?->report_type) ? $dispatch->report->report_type : (is_array($dispatch->report?->report_type) ? implode(', ', $dispatch->report->report_type) : 'N/A') }}
                        </td>
                        <td>{{ $dispatch->station?->station_name ?? 'N/A' }}</td>
                        <td>{{ $dispatch->patrolOfficer?->name ?? 'Unassigned' }}</td>
                        <td><span class="badge {{ $statusColor }}">{{ ucfirst(str_replace('_', ' ', $dispatch->status)) }}</span></td>
                        <td class="muted">{{ optional($dispatch->dispatched_at)->timezone('Asia/Manila')->format('Y-m-d H:i') ?? 'N/A' }}</td>
                        <td>
                            @if($hasRuleResult)
                                <span class="badge {{ $ruleBadge }}">{{ $dispatch->three_minute_rule_met ? 'Met' : 'Missed' }}</span>
                                <div class="muted">{{ number_format($dispatch->three_minute_rule_time ?? $dispatch->response_time ?? 0) }}s</div>
                            @elseif($isOverdue)
                                <span class="badge red">Overdue</span>
                            @else
                                <span class="badge gray">Pending</span>
                            @endif
                        </td>
                        <td>
                            @if(in_array($dispatch->status, ['arrived', 'completed', 'cancelled', 'declined']))
                                <span class="muted">-</span>
                            @else
                                @if($timeRemaining >= 0)
                                    <span class="badge blue">{{ $formatSeconds($timeRemaining) }}</span>
                                @else
                                    <span class="badge red">+{{ $formatSeconds($timeRemaining) }}</span>
                                @endif
                            @endif
                        </td>
                        <td>
                            @if(!is_null($dispatch->response_time))
                                <span class="badge purple">{{ number_format($dispatch->response_time) }}s</span>
                            @else
                                <span class="muted">N/A</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="10" class="muted" style="text-align:center; padding: 1.5rem;">No dispatches found for the selected filters.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top: 1rem;">
        {{ $dispatches->links() }}
    </div>
</div>
@endsection
