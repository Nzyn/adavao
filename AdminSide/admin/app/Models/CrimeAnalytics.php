<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrimeAnalytics extends Model
{
    use HasFactory;

    protected $table = 'crime_analytics';
    protected $primaryKey = 'analytics_id';

    protected $fillable = [
        'location_id',
        'year',
        'month',
        'total_reports',
        'crime_rate',
        'last_updated'
    ];

    protected $casts = [
        'total_reports' => 'integer',
        'crime_rate' => 'float',
        'last_updated' => 'datetime',
        'year' => 'integer',
        'month' => 'integer'
    ];

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id', 'location_id');
    }
}
