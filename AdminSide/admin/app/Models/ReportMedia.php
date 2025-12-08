<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportMedia extends Model
{
    use HasFactory;
    
    protected $table = 'report_media';
    protected $primaryKey = 'media_id';
    
    protected $fillable = [
        'report_id',
        'media_url',
        'media_type'
    ];
    
    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id', 'report_id');
    }
}