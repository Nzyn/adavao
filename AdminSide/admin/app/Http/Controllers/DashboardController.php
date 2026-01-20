<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Get the authenticated user
        $user = auth()->user();
        
        // Item #15: Date Range Filtering
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        
        // Determine role using RBAC methods
        $userRole = 'guest';
        if ($user) {
            if ($user->email === 'alertdavao.ph@gmail.com') {
                $userRole = 'super_admin';
            } elseif (method_exists($user, 'hasRole')) {
                if ($user->hasRole('police')) {
                    $userRole = 'police';
                } elseif ($user->hasRole('admin') || $user->hasRole('super_admin')) {
                    $userRole = 'admin';
                }
            } elseif (isset($user->role)) {
                $userRole = $user->role;
            }
        }
        
        $isSuperAdmin = ($userRole === 'super_admin');
        $stationId = $user->station_id ?? 'all';
        
        // Item #15: Include dates in cache key if filtering is active
        $cacheKey = 'dashboard_stats_' . $userRole . '_' . $stationId;
        if ($dateFrom || $dateTo) {
            $cacheKey .= '_' . ($dateFrom ?? 'x') . '_' . ($dateTo ?? 'x');
        }
        
        $stats = Cache::remember($cacheKey, 300, function() use ($isSuperAdmin, $userRole, $user, $dateFrom, $dateTo) {
            $reportsQuery = DB::table('reports');
            
            // Apply Date Filter if present
            if ($dateFrom) {
                $reportsQuery->whereDate('created_at', '>=', $dateFrom);
            }
            if ($dateTo) {
                $reportsQuery->whereDate('created_at', '<=', $dateTo);
            }
            
            // Helper to get count based on base query constraints
            $getCount = function($status = null) use ($reportsQuery, $isSuperAdmin, $userRole, $user) {
                $q = clone $reportsQuery;
                
                if ($status) {
                    $q->where('status', $status);
                }
                
                if (!$isSuperAdmin) {
                    if ($userRole === 'police') {
                        $stationId = $user->station_id;
                        if ($stationId) {
                            $q->where('assigned_station_id', $stationId);
                        } else {
                            return 0; 
                        }
                    } else {
                        // Admin: Only assigned reports
                        $q->whereNotNull('assigned_station_id');
                    }
                }
                
                return $q->count();
            };

            return [
                'totalReports' => $getCount(),
                'pendingReports' => $getCount('pending'),
                'investigatingReports' => $getCount('investigating'),
                'resolvedReports' => $getCount('resolved'),
                'reportsToday' => DB::table('reports')
                    ->when($userRole === 'police' && $user->station_id, function($q) use ($user) {
                        return $q->where('assigned_station_id', $user->station_id);
                    })
                    ->whereDate('created_at', \Carbon\Carbon::today())
                    ->count(),
                'unreadMessages' => 0 // Temporarily disabled until is_read column is added
                    // DB::table('messages')
                    //     ->where('receiver_id', $user->id)
                    //     ->where('is_read', 0)
                    //     ->count()
            ];
        });
        
        // Extract stats
        $totalReports = $stats['totalReports'];
        $pendingReports = $stats['pendingReports'];
        $investigatingReports = $stats['investigatingReports'];
        $resolvedReports = $stats['resolvedReports'];
        $reportsToday = $stats['reportsToday'];
        $unreadMessages = $stats['unreadMessages'];
        
        $totalUsers = DB::table('users_public')->count();
        
        // Count police officers
        $totalPoliceOfficers = DB::table('user_admin')
            ->join('user_admin_roles', 'user_admin.id', '=', 'user_admin_roles.user_admin_id')
            ->join('roles', 'user_admin_roles.role_id', '=', 'roles.role_id')
            ->where('roles.role_name', 'police')
            ->count();
        
        // Count flagged users
        $flaggedUsersCount = DB::table('users_public')
            ->where('total_flags', '>', 0)
            ->orWhere('restriction_level', '!=', 'none')
            ->count();
            
        // Count pending verifications
        $pendingVerificationsCount = DB::table('verifications')
            ->where('status', 'pending')
            ->count();
        
        return view('welcome', compact(
            'userRole',
            'totalReports',
            'pendingReports', // Passed to view for Items 16 & 17
            'investigatingReports',
            'resolvedReports', // Passed to view for Items 16 & 17
            'reportsToday',
            'unreadMessages',
            'totalUsers',
            'totalPoliceOfficers',
            'flaggedUsersCount',
            'pendingVerificationsCount',
            'dateFrom', // Passed for Item 15
            'dateTo'    // Passed for Item 15
        ));
    }
}
