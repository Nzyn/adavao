<?php

namespace App\Helpers;

use App\Models\PoliceStation;
use Illuminate\Support\Facades\Log;

class GeofenceHelper
{
    /**
     * Check if a point is inside a polygon using ray-casting algorithm
     * 
     * @param array $point ['lat' => float, 'lng' => float]
     * @param array $polygon [['lat' => float, 'lng' => float], ...]
     * @return bool
     */
    public static function pointInPolygon($point, $polygon)
    {
        if (empty($polygon) || count($polygon) < 3) {
            return false;
        }
        
        $x = $point['lat'];
        $y = $point['lng'];
        $inside = false;
        
        $count = count($polygon);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $polygon[$i]['lat'];
            $yi = $polygon[$i]['lng'];
            $xj = $polygon[$j]['lat'];
            $yj = $polygon[$j]['lng'];
            
            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
            
            if ($intersect) {
                $inside = !$inside;
            }
        }
        
        return $inside;
    }
    
    /**
     * Find which station's jurisdiction contains the given coordinates
     * Uses barangay polygons and their station assignments
     * 
     * @param float $lat
     * @param float $lng
     * @return int|null Station ID or null if no match
     */
    public static function findStationByCoordinates($lat, $lng)
    {
        // Get all barangays with boundary polygons
        $barangays = \DB::table('barangays')
            ->whereNotNull('boundary_polygon')
            ->whereNotNull('station_id')
            ->get();
        
        foreach ($barangays as $barangay) {
            try {
                $polygon = json_decode($barangay->boundary_polygon, true);
                
                if (!is_array($polygon) || empty($polygon)) {
                    continue;
                }
                
                if (self::pointInPolygon(['lat' => $lat, 'lng' => $lng], $polygon)) {
                    Log::info('Report coordinates matched barangay geofence', [
                        'lat' => $lat,
                        'lng' => $lng,
                        'barangay_id' => $barangay->barangay_id,
                        'barangay_name' => $barangay->barangay_name,
                        'station_id' => $barangay->station_id
                    ]);
                    
                    return $barangay->station_id;
                }
            } catch (\Exception $e) {
                Log::error('Error checking geofence for barangay', [
                    'barangay_id' => $barangay->barangay_id,
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }
        
        Log::info('Report coordinates did not match any barangay geofence', [
            'lat' => $lat,
            'lng' => $lng
        ]);
        
        return null; // No matching station
    }
}
