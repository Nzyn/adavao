<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportReassignmentRequest extends Model
{
    use HasFactory;

    protected $primaryKey = 'request_id';

    protected $fillable = [
        'report_id',
        'requested_by_user_id',
        'current_station_id',
        'requested_station_id',
        'reason',
        'status',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    /**
     * Get the report associated with this request
     */
    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id', 'report_id');
    }

    /**
     * Get the user who requested the reassignment
     */
    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by_user_id', 'id');
    }

    /**
     * Get the current police station
     */
    public function currentStation()
    {
        return $this->belongsTo(PoliceStation::class, 'current_station_id', 'station_id');
    }

    /**
     * Get the requested police station
     */
    public function requestedStation()
    {
        return $this->belongsTo(PoliceStation::class, 'requested_station_id', 'station_id');
    }

    /**
     * Get the admin who reviewed the request
     */
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id', 'id');
    }
}
