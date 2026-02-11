<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\PoliceOfficer;
use App\Models\PoliceStation;
use App\Services\EncryptionService;

class PersonnelController extends Controller
{
    public function index()
    {
        // 1. Fetch UserAdmin users (All Personnel)
        $adminPolice = \App\Models\UserAdmin::with(['policeStation', 'adminRoles'])->get();

        // 2. Map UserAdmin to View-Compatible Structure
        $mappedAdmins = $adminPolice->map(function($user) {
            $officer = new \stdClass();
            $officer->officer_id = $user->id; // Using UserAdmin ID
            $officer->user_id = $user->id;
            $officer->rank = 'Officer'; // Default rank
            $officer->status = $user->is_verified ? 'Active' : 'Inactive';
            $officer->assigned_since = $user->created_at; 
            
            // Contact and address are auto-decrypted by UserAdmin model accessors
            
            // Attach 'role' attribute for view compatibility
            $roles = $user->adminRoles->pluck('role_name')->toArray();
            if (in_array('super_admin', $roles) || in_array('admin', $roles)) {
                $user->role = 'admin';
            } elseif (in_array('police', $roles)) {
                $user->role = 'police';
            } else {
                $user->role = 'staff';
            } 
            $officer->user = $user;
            
            $officer->policeStation = $user->policeStation;
            

            
            return $officer;
        });

        // 3. Use only UserAdmin personnel (no caching to ensure real-time updates)
        $officers = $mappedAdmins;
        
        return view('personnel', compact('officers'));
    }
    
    /**
     * Get all police stations for assignment
     */
    public function getPoliceStations()
    {
        try {
            $stations = PoliceStation::select('station_id', 'station_name', 'address', 'latitude', 'longitude', 'contact_number')
                ->orderBy('station_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $stations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching police stations',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
