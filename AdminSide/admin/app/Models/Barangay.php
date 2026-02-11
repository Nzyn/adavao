<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barangay extends Model
{
    use HasFactory;

    protected $primaryKey = 'barangay_id';

    protected $fillable = [
        'barangay_name',
        'latitude',
        'longitude',
        'station_id',
        'boundary_polygon',
        'osm_id',
        'ref',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * Get the police station assigned to this barangay
     */
    public function policeStation()
    {
        return $this->belongsTo(PoliceStation::class, 'station_id', 'station_id');
    }

    /**
     * Get locations within this barangay
     */
    public function locations()
    {
        return $this->hasMany(Location::class, 'barangay_id');
    }

    /**
     * Check if a coordinate point falls within this barangay's boundary
     * 
     * @param float $latitude
     * @param float $longitude
     * @return bool
     */
    public function containsPoint(float $latitude, float $longitude): bool
    {
        if (!$this->boundary_polygon) {
            return false;
        }

        $polygon = json_decode($this->boundary_polygon, true);
        
        if (!$polygon || !isset($polygon['coordinates'])) {
            return false;
        }

        return \App\Helpers\GeoHelper::pointInPolygon($latitude, $longitude, $polygon['coordinates']);
    }

    /**
     * Get the boundary polygon as a GeoJSON feature
     * 
     * @return array|null
     */
    public function getBoundaryFeature(): ?array
    {
        if (!$this->boundary_polygon) {
            return null;
        }

        $polygon = json_decode($this->boundary_polygon, true);
        
        if (!$polygon) {
            return null;
        }

        return [
            'type' => 'Feature',
            'properties' => [
                'barangay_id' => $this->barangay_id,
                'barangay_name' => $this->barangay_name,
                'station_id' => $this->station_id,
            ],
            'geometry' => $polygon,
        ];
    }
}
