<?php

namespace App\Helpers;

class GeoHelper
{
    /**
     * Check if a point is inside a polygon using Ray Casting algorithm
     * 
     * @param float $latitude The latitude of the point to check
     * @param float $longitude The longitude of the point to check
     * @param array $polygon GeoJSON polygon coordinates array
     * @return bool True if point is inside polygon, false otherwise
     */
    public static function isPointInPolygon(float $latitude, float $longitude, array $polygon): bool
    {
        // GeoJSON polygon format: [[[lng, lat], [lng, lat], ...]]
        // We only check the outer ring (first array)
        $coordinates = $polygon[0] ?? [];
        
        if (count($coordinates) < 3) {
            return false;
        }

        $intersections = 0;
        $vertexCount = count($coordinates);

        for ($i = 0; $i < $vertexCount - 1; $i++) {
            $vertex1 = $coordinates[$i];
            $vertex2 = $coordinates[$i + 1];

            // Check if point is on the same latitude range as the edge
            if (self::isPointInLatitudeRange($latitude, $vertex1[1], $vertex2[1])) {
                // Calculate intersection point's longitude
                if ($vertex1[1] == $vertex2[1]) {
                    // Horizontal edge
                    continue;
                }

                $intersectionLng = ($longitude - $vertex1[0]) * ($vertex2[1] - $vertex1[1]) / 
                                   ($vertex2[0] - $vertex1[0]) + $vertex1[1];

                if ($latitude < $intersectionLng) {
                    $intersections++;
                }
            }
        }

        // If odd number of intersections, point is inside
        return ($intersections % 2) == 1;
    }

    /**
     * Alternative implementation using the more accurate ray casting algorithm
     * 
     * @param float $latitude The latitude of the point to check
     * @param float $longitude The longitude of the point to check
     * @param array $polygon GeoJSON polygon coordinates array
     * @return bool True if point is inside polygon, false otherwise
     */
    public static function pointInPolygon(float $latitude, float $longitude, array $polygon): bool
    {
        // Get outer ring coordinates
        $coordinates = $polygon[0] ?? [];
        
        if (count($coordinates) < 3) {
            return false;
        }

        $inside = false;
        $count = count($coordinates);

        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $coordinates[$i][0]; // longitude
            $yi = $coordinates[$i][1]; // latitude
            $xj = $coordinates[$j][0]; // longitude
            $yj = $coordinates[$j][1]; // latitude

            $intersect = (($yi > $latitude) != ($yj > $latitude))
                && ($longitude < ($xj - $xi) * ($latitude - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = !$inside;
            }
        }

        return $inside;
    }

    /**
     * Check if latitude is in range between two vertices
     */
    private static function isPointInLatitudeRange(float $latitude, float $lat1, float $lat2): bool
    {
        return ($latitude >= min($lat1, $lat2) && $latitude < max($lat1, $lat2));
    }

    /**
     * Find which barangay a given coordinate falls into
     * 
     * @param float $latitude The latitude to check
     * @param float $longitude The longitude to check
     * @return \App\Models\Barangay|null The barangay model if found, null otherwise
     */
    public static function findBarangayByCoordinates(float $latitude, float $longitude): ?\App\Models\Barangay
    {
        // Get all barangays with boundary polygons
        $barangays = \App\Models\Barangay::whereNotNull('boundary_polygon')->get();

        foreach ($barangays as $barangay) {
            $polygon = json_decode($barangay->boundary_polygon, true);
            
            if (!$polygon || !isset($polygon['coordinates'])) {
                continue;
            }

            if (self::pointInPolygon($latitude, $longitude, $polygon['coordinates'])) {
                return $barangay;
            }
        }

        return null;
    }

    /**
     * Calculate distance between two coordinates in kilometers using Haversine formula
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lng1 Longitude of first point
     * @param float $lat2 Latitude of second point
     * @param float $lng2 Longitude of second point
     * @return float Distance in kilometers
     */
    public static function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Find the nearest barangay to given coordinates (fallback when point-in-polygon fails)
     * 
     * @param float $latitude The latitude to check
     * @param float $longitude The longitude to check
     * @return \App\Models\Barangay|null The nearest barangay
     */
    public static function findNearestBarangay(float $latitude, float $longitude): ?\App\Models\Barangay
    {
        $barangays = \App\Models\Barangay::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get();

        $nearest = null;
        $minDistance = PHP_FLOAT_MAX;

        foreach ($barangays as $barangay) {
            $distance = self::calculateDistance(
                $latitude,
                $longitude,
                $barangay->latitude,
                $barangay->longitude
            );

            if ($distance < $minDistance) {
                $minDistance = $distance;
                $nearest = $barangay;
            }
        }

        return $nearest;
    }
}
