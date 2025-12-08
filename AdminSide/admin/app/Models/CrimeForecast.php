<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrimeForecast extends Model
{
    use HasFactory;

    protected $table = 'crime_forecasts';
    protected $primaryKey = 'forecast_id';

    protected $fillable = [
        'location_id',
        'forecast_date',
        'predicted_count',
        'model_used',
        'confidence_score',
        'lower_ci',
        'upper_ci'
    ];

    protected $casts = [
        'forecast_date' => 'date',
        'predicted_count' => 'integer',
        'confidence_score' => 'float',
        'lower_ci' => 'float',
        'upper_ci' => 'float',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id', 'location_id');
    }
}
