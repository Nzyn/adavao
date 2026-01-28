<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportTimeline extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'event_type',
        'from_value',
        'to_value',
        'notes',
        'changed_by',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id', 'report_id');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'changed_by', 'id');
    }
}
