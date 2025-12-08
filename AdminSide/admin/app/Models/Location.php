<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'location_id';
    
    protected $fillable = [
        'barangay',
        'reporters_address',
        'latitude',
        'longitude'
    ];
    
    public function reports()
    {
        return $this->hasMany(Report::class, 'location_id', 'location_id');
    }
}
