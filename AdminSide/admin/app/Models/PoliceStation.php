<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoliceStation extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'police_stations';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'station_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'station_name',
        'address',
        'latitude',
        'longitude',
        'contact_number',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'latitude' => 'double',
        'longitude' => 'double',
    ];

    /**
     * Get the users for the police station.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'station_id', 'station_id');
    }

    /**
     * Get the police officers for the police station.
     */
    public function officers()
    {
        return $this->hasMany(PoliceOfficer::class, 'station_id', 'station_id');
    }

    /**
     * Get the reports assigned to this police station.
     */
    public function reports()
    {
        return $this->hasMany(Report::class, 'station_id', 'station_id');
    }
}