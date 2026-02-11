<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoliceOfficer extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'police_officers';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'officer_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'station_id',
        'assigned_since',
        'rank',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'assigned_since' => 'date',
    ];

    /**
     * Get the user that owns the police officer record.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the police station that the officer is assigned to.
     */
    public function policeStation()
    {
        return $this->belongsTo(PoliceStation::class, 'station_id', 'station_id');
    }
}