<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Get the authenticated user's role
        $userRole = auth()->check() ? auth()->user()->role : 'guest';
        
        // Fetch dashboard statistics
        if ($userRole === 'police' && auth()->check()) {
            // Police users only see reports from their assigned station
            $stationId = auth()->user()->station_id;
            
            if ($stationId) {
                $totalReports = DB::table('reports')->where('assigned_station_id', $stationId)->count();
                $pendingReports = DB::table('reports')
                    ->where('assigned_station_id', $stationId)
                    ->where('status', 'pending')
                    ->count();
                $investigatingReports = DB::table('reports')
                    ->where('assigned_station_id', $stationId)
                    ->where('status', 'investigating')
                    ->count();
                $resolvedReports = DB::table('reports')
                    ->where('assigned_station_id', $stationId)
                    ->where('status', 'resolved')
                    ->count();
                    
                \Log::info('Dashboard stats for police station', [
                    'user_id' => auth()->user()->id,
                    'station_id' => $stationId,
                    'total' => $totalReports,
                    'pending' => $pendingReports,
                    'investigating' => $investigatingReports,
                    'resolved' => $resolvedReports
                ]);
            } else {
                // Police user without station - show zero stats
                $totalReports = 0;
                $pendingReports = 0;
                $investigatingReports = 0;
                $resolvedReports = 0;
                
                \Log::warning('Police user has no station assignment', [
                    'user_id' => auth()->user()->id
                ]);
            }
        } else {
            // Admin and barangay users see all reports
            $totalReports = DB::table('reports')->count();
            $pendingReports = DB::table('reports')->where('status', 'pending')->count();
            $investigatingReports = DB::table('reports')->where('status', 'investigating')->count();
            $resolvedReports = DB::table('reports')->where('status', 'resolved')->count();
        }
        
        $totalUsers = DB::table('users')->where('role', 'user')->count();
        $totalPoliceOfficers = DB::table('users')->where('role', 'police')->count();
        
        return view('welcome', compact(
            'userRole',
            'totalReports',
            'pendingReports',
            'investigatingReports',
            'resolvedReports',
            'totalUsers',
            'totalPoliceOfficers'
        ));
    }
}
