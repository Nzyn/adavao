<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoliceStationController extends Controller
{
    /**
     * Get all police stations with their assigned barangays
     * This endpoint is designed for offline caching in the mobile app
     */
    public function getAllWithBarangays()
    {
        try {
            $stations = DB::table('police_stations')
                ->select(
                    'station_id',
                    'station_name',
                    'address',
                    'latitude',
                    'longitude',
                    'contact_number'
                )
                ->where('station_name', '!=', 'Cybercrime Division')
                ->orderBy('station_name')
                ->get();

            $stationsWithBarangays = [];

            foreach ($stations as $station) {
                $barangays = DB::table('barangays')
                    ->select('barangay_id', 'barangay_name')
                    ->where('station_id', $station->station_id)
                    ->orderBy('barangay_name')
                    ->get();

                $stationsWithBarangays[] = [
                    'station_id' => $station->station_id,
                    'station_name' => $station->station_name,
                    'address' => $station->address,
                    'latitude' => $station->latitude,
                    'longitude' => $station->longitude,
                    'contact_number' => $station->contact_number,
                    'barangays' => $barangays->pluck('barangay_name')->toArray(),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $stationsWithBarangays,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch police stations',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all barangays with their police station information
     * Returns a flat list for easy searching
     */
    public function getBarangaysWithStations()
    {
        try {
            $barangays = DB::table('barangays')
                ->join('police_stations', 'barangays.station_id', '=', 'police_stations.station_id')
                ->select(
                    'barangays.barangay_id',
                    'barangays.barangay_name',
                    'police_stations.station_id',
                    'police_stations.station_name',
                    'police_stations.address',
                    'police_stations.latitude',
                    'police_stations.longitude',
                    'police_stations.contact_number'
                )
                ->where('police_stations.station_name', '!=', 'Cybercrime Division')
                ->orderBy('barangays.barangay_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $barangays,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch barangays',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search for police station by barangay name
     */
    public function searchByBarangay(Request $request)
    {
        try {
            $barangayName = $request->input('barangay_name');

            if (!$barangayName) {
                return response()->json([
                    'success' => false,
                    'message' => 'Barangay name is required',
                ], 400);
            }

            $result = DB::table('barangays')
                ->join('police_stations', 'barangays.station_id', '=', 'police_stations.station_id')
                ->select(
                    'barangays.barangay_id',
                    'barangays.barangay_name',
                    'police_stations.station_id',
                    'police_stations.station_name',
                    'police_stations.address',
                    'police_stations.latitude',
                    'police_stations.longitude',
                    'police_stations.contact_number'
                )
                ->where('barangays.barangay_name', 'LIKE', '%' . $barangayName . '%')
                ->first();

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'message' => 'Barangay not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search barangay',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
