<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function index()
    {
        // Get the authenticated user
        $user = auth()->user();
        
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
                // Fallback to role property
                $userRole = $user->role;
            }
        }
        
        // Check if user is super admin (alertdavao.ph) directly
        $isSuperAdmin = ($userRole === 'super_admin');
        
        // Fetch dashboard statistics with caching (5 minutes)
        // Cache key includes role and station to differentiate filtered views
        $stationId = $user->station_id ?? 'all';
        $cacheKey = 'dashboard_stats_' . $userRole . '_' . $stationId;
        
        $stats = Cache::remember($cacheKey, 300, function() use ($isSuperAdmin, $userRole, $user) {
            if ($isSuperAdmin) {
                // Super Admin Visibility: ALL Reports (Assigned + Unassigned)
                return [
                    'totalReports' => DB::table('reports')->count(),
                    'pendingReports' => DB::table('reports')
                        ->where('status', 'pending')
                        ->count(),
                    'investigatingReports' => DB::table('reports')
                        ->where('status', 'investigating')
                        ->count(),
                    'resolvedReports' => DB::table('reports')
                        ->where('status', 'resolved')
                        ->count(),
                    'reportsToday' => DB::table('reports')
                        ->whereDate('date_reported', \Carbon\Carbon::today())
                        ->count(),
                    'unreadMessages' => 0 // Message count logic can be added if needed
                ];
            } elseif ($userRole === 'police') {
                // Police Visibility: ONLY Assigned to their Station
                $stationId = $user->station_id;
            
                if ($stationId) {
                    $totalReports = DB::table('reports')->where('assigned_station_id', $stationId)->count();
                    
                    // Reports Today (Station Assigned)
                    $reportsToday = DB::table('reports')
                        ->where('assigned_station_id', $stationId)
                        ->whereDate('date_reported', \Carbon\Carbon::today())
                        ->count();
                        
                    // Unread Messages for this user (assuming message system uses user_id)
                    // Messages table structure check needed, assuming 'receiver_id' and 'is_read'
                    // If message system is complex, simplistic count might need adjustment
                    $unreadMessages = DB::table('messages')
                        ->where('receiver_id', $user->id)
                        ->where('is_read', 0)
                        ->count();

                    return [
                        'totalReports' => $totalReports,
                        'pendingReports' => DB::table('reports')
                            ->where('assigned_station_id', $stationId)
                            ->where('status', 'pending')
                            ->count(),
                        'investigatingReports' => DB::table('reports')
                            ->where('assigned_station_id', $stationId)
                            ->where('status', 'investigating')
                            ->count(),
                        'resolvedReports' => DB::table('reports')
                            ->where('assigned_station_id', $stationId)
                            ->where('status', 'resolved')
                            ->count(),
                        'reportsToday' => $reportsToday,
                        'unreadMessages' => $unreadMessages
                    ];
                } else {
                    return [
                        'totalReports' => 0, 'pendingReports' => 0, 'investigatingReports' => 0, 'resolvedReports' => 0,
                        'reportsToday' => 0, 'unreadMessages' => 0
                    ];
                }
            } else {
                // Other Admin Visibility: ONLY Assigned Reports (Any Station)
                return [
                    'totalReports' => DB::table('reports')->whereNotNull('assigned_station_id')->count(),
                    'pendingReports' => DB::table('reports')
                        ->whereNotNull('assigned_station_id')
                        ->where('status', 'pending')
                        ->count(),
                    'investigatingReports' => DB::table('reports')
                        ->whereNotNull('assigned_station_id')
                        ->where('status', 'investigating')
                        ->count(),
                    'resolvedReports' => DB::table('reports')
                        ->whereNotNull('assigned_station_id')
                        ->where('status', 'resolved')
                        ->count(),
                    'reportsToday' => 0,
                    'unreadMessages' => 0
                ];
            }
        });
        
        // Extract stats from cache
        $totalReports = $stats['totalReports'];
        $pendingReports = $stats['pendingReports'];
        $investigatingReports = $stats['investigatingReports'];
        $resolvedReports = $stats['resolvedReports'];
        // New stats for police (default to 0 if not present)
        $reportsToday = $stats['reportsToday'] ?? 0;
        $unreadMessages = $stats['unreadMessages'] ?? 0;
        
        $totalUsers = DB::table('users_public')->count();
        
        // Count police officers via RBAC (user_admin -> user_admin_roles -> roles)
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
            'pendingReports',
            'investigatingReports',
            'resolvedReports',
            'reportsToday',
            'unreadMessages',
            'totalUsers',
            'totalPoliceOfficers',
            'flaggedUsersCount',
            'pendingVerificationsCount'
        ));
    }
}
